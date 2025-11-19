import pool from '../config/database.js';

// Helper para gerar code slug a partir de título
const slugify = (str) => str
  .toLowerCase()
  .normalize('NFD')
  .replace(/[^\w\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

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
         AND (setor_id IS NULL OR setor_id = ANY(COALESCE($1::uuid[], ARRAY[]::uuid[])))
       ORDER BY (setor_id IS NULL) DESC, id ASC`,
      [setorIds]
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

// ===== NOVOS ENDPOINTS (CRUD / Listagens) =====

const ensureAdmin = (req, res) => {
  if (req.user?.perfil !== 'admin') {
    res.status(403).json({ success: false, message: 'Acesso restrito a administradores' });
    return false;
  }
  return true;
};

// Listar todos os estatutos com seus itens (opcional filtro por ativo / setor)
export const listAll = async (req, res) => {
  try {
    const { includeInactive = 'false', setor_id = null } = req.query;
    const incInactive = String(includeInactive) === 'true';
    const params = [];
    let where = 'WHERE 1=1';
    if (!incInactive) {
      where += ' AND s.active = true';
    }
    if (setor_id) {
      params.push(setor_id);
      where += ` AND (s.setor_id = $${params.length})`;
    }
    const { rows: statutes } = await pool.query(
      `SELECT s.id, s.code, s.title, s.description, s.setor_id, s.active, s.version
       FROM statutes s
       ${where}
       ORDER BY s.id ASC`,
      params
    );
    if (!statutes.length) {
      return res.json({ success: true, data: [] });
    }
    const statuteIds = statutes.map(s => s.id);
    const { rows: items } = await pool.query(
      `SELECT i.id, i.statute_id, i.code, i.sequence, i.text, i.active
         FROM statute_items i
        WHERE i.statute_id = ANY($1::int[])
        ORDER BY i.statute_id, i.sequence, i.id`,
      [statuteIds]
    );
    const grouped = statutes.map(s => ({
      id: s.id,
      code: s.code,
      title: s.title,
      description: s.description,
      setor_id: s.setor_id,
      active: s.active,
      version: s.version,
      items: items.filter(it => it.statute_id === s.id)
    }));
    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('[statutes] listAll error:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar estatutos' });
  }
};

// Criar novo estatuto
export const createStatute = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { title, description, setor_id } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'title é obrigatório' });
    }
    const codeBase = slugify(title).slice(0, 60) || 'grupo';
    let code = codeBase;
    // Garantir unicidade de code; se conflito, acrescenta sufixo numérico
    let attempt = 1;
    while (true) {
      const { rows: exists } = await pool.query('SELECT 1 FROM statutes WHERE code = $1', [code]);
      if (!exists.length) break;
      attempt += 1;
      code = `${codeBase}-${attempt}`.slice(0, 75);
      if (attempt > 50) {
        return res.status(500).json({ success: false, message: 'Falha ao gerar código único' });
      }
    }
    const { rows } = await pool.query(
      `INSERT INTO statutes(code, title, description, setor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, title, description, setor_id, active, version`,
      [code, title, description || null, setor_id || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[statutes] createStatute error:', err);
    res.status(500).json({ success: false, message: 'Erro ao criar grupo' });
  }
};

// Atualizar estatuto
export const updateStatute = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { title, description, active, setor_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE statutes
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             active = COALESCE($4, active),
             setor_id = COALESCE($5, setor_id),
             version = version + 1,
             updated_at = NOW()
       WHERE id = $1
       RETURNING id, code, title, description, setor_id, active, version`,
      [id, title || null, description || null, typeof active === 'boolean' ? active : null, setor_id || null]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Estatuto não encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[statutes] updateStatute error:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar estatuto' });
  }
};

// Desativar (soft delete) estatuto
export const deleteStatute = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE statutes SET active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Estatuto não encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('[statutes] deleteStatute error:', err);
    res.status(500).json({ success: false, message: 'Erro ao desativar estatuto' });
  }
};

// Criar item de estatuto
export const createItem = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { id } = req.params; // statute id (grupo)
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'text é obrigatório' });
    }
    // Gerar code incremental baseado no count existente
    const { rows: seqRows } = await pool.query(
      'SELECT COALESCE(MAX(sequence),0) + 10 AS next_seq FROM statute_items WHERE statute_id = $1',
      [id]
    );
    const sequence = seqRows[0]?.next_seq || 10;
    const base = slugify(text).slice(0, 90) || 'termo';
    let code = base;
    let attempt = 1;
    while (true) {
      const { rows: exists } = await pool.query('SELECT 1 FROM statute_items WHERE code = $1', [code]);
      if (!exists.length) break;
      attempt += 1;
      code = `${base}-${attempt}`.slice(0, 110);
      if (attempt > 50) {
        return res.status(500).json({ success: false, message: 'Falha ao gerar código único do termo' });
      }
    }
    const { rows } = await pool.query(
      `INSERT INTO statute_items(statute_id, code, sequence, text)
       VALUES ($1, $2, $3, $4)
       RETURNING id, statute_id, code, sequence, text, active`,
      [id, code, sequence, text]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[statutes] createItem error:', err);
    res.status(500).json({ success: false, message: 'Erro ao criar termo' });
  }
};

// Atualizar item
export const updateItem = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { itemId } = req.params;
    const { sequence, text, active } = req.body;
    const { rows } = await pool.query(
      `UPDATE statute_items
         SET sequence = COALESCE($2, sequence),
             text = COALESCE($3, text),
             active = COALESCE($4, active),
             updated_at = NOW()
       WHERE id = $1
       RETURNING id, statute_id, code, sequence, text, active`,
      [itemId, typeof sequence === 'number' ? sequence : null, text || null, typeof active === 'boolean' ? active : null]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Item não encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[statutes] updateItem error:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar item' });
  }
};

// Desativar item
export const deleteItem = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { itemId } = req.params;
    const { rows } = await pool.query(
      `UPDATE statute_items SET active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [itemId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Item não encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('[statutes] deleteItem error:', err);
    res.status(500).json({ success: false, message: 'Erro ao desativar item' });
  }
};

// Listagem agregada de todas as ciências (acks)
export const listAcknowledgements = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { rows } = await pool.query(
      `SELECT a.user_id, u.email as user_email, a.item_id, i.code as item_code, a.acknowledged_at
         FROM user_statute_acks a
         JOIN usuarios u ON u.id = a.user_id
         JOIN statute_items i ON i.id = a.item_id
        ORDER BY a.acknowledged_at DESC
        LIMIT 500`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[statutes] listAcknowledgements error:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar ciência' });
  }
};

// Ciência de um usuário específico
export const userAcknowledgements = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId obrigatório' });
    const { rows } = await pool.query(
      `SELECT a.item_id, i.code as item_code, i.text, a.statute_id, s.code as statute_code, s.title as statute_title, a.acknowledged_at
         FROM user_statute_acks a
         JOIN statute_items i ON i.id = a.item_id
         JOIN statutes s ON s.id = a.statute_id
        WHERE a.user_id = $1
        ORDER BY a.acknowledged_at DESC`,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[statutes] userAcknowledgements error:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar ciência do usuário' });
  }
};
