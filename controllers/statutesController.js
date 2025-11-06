import pool from '../config/database.js';
import crypto from 'crypto';

export const listPending = async (req, res) => {
  try {
    const userId = req.user.id;
    const perfil = req.user.perfil;
    if (perfil === 'admin') {
      return res.json({ success: true, data: [] });
    }

    // setores do usuário
    const { rows: sectorRows } = await pool.query(
      'SELECT setor_id FROM user_sectors WHERE user_id = $1',
      [userId]
    );
    const setorIds = sectorRows.map(r => r.setor_id);

    // estatutos aplicáveis: geral (setor_id IS NULL) + setores do usuário
    const { rows: statutes } = await pool.query(
      `SELECT id, code, title, setor_id
       FROM statutes
       WHERE active = true
         AND (setor_id IS NULL OR setor_id = ANY($1::int[]))
       ORDER BY (setor_id IS NULL) DESC, id ASC`,
      [setorIds.length ? setorIds : [0]]
    );

    if (!statutes.length) {
      return res.json({ success: true, data: [] });
    }

    // itens ativos que o usuário ainda NÃO reconheceu
    const statuteIds = statutes.map(s => s.id);
    const { rows: items } = await pool.query(
      `SELECT i.id, i.statute_id, i.code, i.sequence, i.text
         FROM statute_items i
         LEFT JOIN user_statute_acks a
               ON a.item_id = i.id AND a.user_id = $1
        WHERE i.active = true
          AND i.statute_id = ANY($2::int[])
          AND a.id IS NULL
        ORDER BY i.statute_id, i.sequence, i.id`,
      [userId, statuteIds]
    );

    const grouped = statutes.map(s => ({
      statute: { id: s.id, code: s.code, title: s.title, setor_id: s.setor_id },
      items: items.filter(it => it.statute_id === s.id).map(it => ({ id: it.id, code: it.code, sequence: it.sequence, text: it.text }))
    })).filter(g => g.items.length > 0);

    return res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('[statutes] listPending error:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar pendências' });
  }
};

export const acknowledge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { acks } = req.body; // [{ statuteId, itemId }]
    if (!Array.isArray(acks) || !acks.length) {
      return res.status(400).json({ success: false, message: 'Nada para reconhecer' });
    }

    const values = [];
    const params = [];
    let p = 1;
    for (const a of acks) {
      if (!a || !a.statuteId || !a.itemId) continue;
      params.push(`($${p++}, $${p++}, $${p++})`);
      values.push(userId, a.statuteId, a.itemId);
    }
    if (!params.length) return res.status(400).json({ success: false, message: 'Nada válido para reconhecer' });

    await pool.query(
      `INSERT INTO user_statute_acks(user_id, statute_id, item_id)
       VALUES ${params.join(', ')}
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      values
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[statutes] acknowledge error:', err);
    res.status(500).json({ success: false, message: 'Erro ao registrar ciência' });
  }
};
