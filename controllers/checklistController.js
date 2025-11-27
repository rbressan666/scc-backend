import pool from '../config/database.js';
import { auditService } from '../services/auditService.js';

// Util: limpar locks expirados
async function clearExpiredLocks(turnoId) {
  await pool.query(
    `DELETE FROM checklist_locks WHERE turno_id = $1 AND expires_at < NOW()`,
    [turnoId]
  );
}

// Listar perguntas aplicáveis ao usuário por tipo (entrada/saida) + status/resposta atual
export async function getChecklist(req, res) {
  const startTime = Date.now();
  const { id: turnoId } = req.params;
  const { tipo } = req.query; // 'entrada' | 'saida'
  const userId = req.user?.id;

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ success: false, message: 'tipo inválido' });
  }
  try {
    // setores do usuário
    const { rows: sectors } = await pool.query(
      `SELECT setor_id FROM user_sectors WHERE user_id = $1`,
      [userId]
    );
    const setorIds = sectors.map(r => r.setor_id);

    // perguntas aplicáveis: gerais (setor_id IS NULL) + setores do usuário
    const { rows: perguntas } = await pool.query(
      `SELECT p.id, p.tipo, p.setor_id, p.pergunta, p.instrucao, p.ativa, p.ordem
       FROM checklist_perguntas p
       WHERE p.ativa = TRUE
         AND p.tipo = $1
         AND (p.setor_id IS NULL OR p.setor_id = ANY(COALESCE($2::uuid[], ARRAY[]::uuid[])))
       ORDER BY (p.setor_id IS NULL) DESC, COALESCE(p.ordem, 9999), p.created_at ASC`,
      [tipo, setorIds]
    );

    // respostas e locks
    const { rows: respostas } = await pool.query(
      `SELECT r.pergunta_id, r.resposta, r.justificativa, r.usuario_id, r.updated_at
         FROM checklist_respostas r
        WHERE r.turno_id = $1`,
      [turnoId]
    );
    await clearExpiredLocks(turnoId);
    const { rows: locks } = await pool.query(
      `SELECT pergunta_id, usuario_id, locked_at, expires_at
         FROM checklist_locks
        WHERE turno_id = $1`,
      [turnoId]
    );

    const respMap = new Map(respostas.map(r => [r.pergunta_id, r]));
    const lockMap = new Map(locks.map(l => [l.pergunta_id, l]));

    const items = perguntas.map(p => ({
      id: p.id,
      tipo: p.tipo,
      setor_id: p.setor_id,
      pergunta: p.pergunta,
      instrucao: p.instrucao,
      ordem: p.ordem,
      resposta: respMap.get(p.id) || null,
      lock: lockMap.get(p.id) || null,
    }));

    const total = items.length;
    const concluidas = items.filter(i => i.resposta?.resposta === 'SIM').length;
    const percent = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    await auditService.log({ req, resStatus: 200, action: 'checklist.get', entity: 'turno', entityId: turnoId, payload: { tipo, total }, startTime });
    return res.json({ success: true, data: { items, progresso: { total, concluidas, percent } } });
  } catch (err) {
    console.error('Erro getChecklist:', err);
    await auditService.log({ req, resStatus: 500, action: 'checklist.get', entity: 'turno', entityId: turnoId, success: false, message: err.message });
    return res.status(500).json({ success: false, message: 'Erro ao carregar checklist' });
  }
}

// Lock de pergunta
export async function lockPergunta(req, res) {
  const startTime = Date.now();
  const { id: turnoId, perguntaId } = req.params;
  const userId = req.user?.id;
  try {
    await clearExpiredLocks(turnoId);
    await pool.query(
      `INSERT INTO checklist_locks (turno_id, pergunta_id, usuario_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (turno_id, pergunta_id) DO NOTHING`,
      [turnoId, perguntaId, userId]
    );
    const { rows } = await pool.query(
      `SELECT turno_id, pergunta_id, usuario_id, locked_at, expires_at
         FROM checklist_locks WHERE turno_id = $1 AND pergunta_id = $2`,
      [turnoId, perguntaId]
    );
    const lock = rows[0] || null;
    const owned = lock && lock.usuario_id === userId;
    await auditService.log({ req, resStatus: 200, action: 'checklist.lock', entity: 'checklist_pergunta', entityId: perguntaId, payload: { owned }, startTime });
    return res.json({ success: true, data: { lock, owned } });
  } catch (err) {
    console.error('Erro lockPergunta:', err);
    await auditService.log({ req, resStatus: 500, action: 'checklist.lock', entity: 'checklist_pergunta', entityId: perguntaId, success: false, message: err.message });
    return res.status(500).json({ success: false, message: 'Erro ao travar pergunta' });
  }
}

// Unlock (somente se for o dono)
export async function unlockPergunta(req, res) {
  const startTime = Date.now();
  const { id: turnoId, perguntaId } = req.params;
  const userId = req.user?.id;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM checklist_locks WHERE turno_id = $1 AND pergunta_id = $2 AND usuario_id = $3`,
      [turnoId, perguntaId, userId]
    );
    await auditService.log({ req, resStatus: 200, action: 'checklist.unlock', entity: 'checklist_pergunta', entityId: perguntaId, payload: { removed: rowCount > 0 }, startTime });
    return res.json({ success: true, removed: rowCount > 0 });
  } catch (err) {
    console.error('Erro unlockPergunta:', err);
    await auditService.log({ req, resStatus: 500, action: 'checklist.unlock', entity: 'checklist_pergunta', entityId: perguntaId, success: false, message: err.message });
    return res.status(500).json({ success: false, message: 'Erro ao destravar pergunta' });
  }
}

// Responder pergunta (upsert)
export async function responderPergunta(req, res) {
  const startTime = Date.now();
  const { id: turnoId } = req.params;
  const userId = req.user?.id;
  const { pergunta_id, resposta, justificativa } = req.body || {};
  if (!pergunta_id || !['SIM', 'NAO', 'NA'].includes(resposta)) {
    return res.status(400).json({ success: false, message: 'Dados inválidos' });
  }
  try {
    // Se não for SIM, justificativa obrigatória (pode ser breve)
    if (resposta !== 'SIM' && (!justificativa || justificativa.trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Justificativa obrigatória para respostas diferentes de SIM' });
    }

    // Upsert da resposta
    const { rows } = await pool.query(
      `INSERT INTO checklist_respostas (turno_id, pergunta_id, usuario_id, resposta, justificativa)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (turno_id, pergunta_id)
       DO UPDATE SET resposta = EXCLUDED.resposta, justificativa = EXCLUDED.justificativa, usuario_id = EXCLUDED.usuario_id, updated_at = NOW()
       RETURNING id, turno_id, pergunta_id, usuario_id, resposta, justificativa, updated_at`,
      [turnoId, pergunta_id, userId, resposta, justificativa || null]
    );

    // Libera lock caso o usuário detenha
    await pool.query(
      `DELETE FROM checklist_locks WHERE turno_id = $1 AND pergunta_id = $2 AND usuario_id = $3`,
      [turnoId, pergunta_id, userId]
    );

    await auditService.log({ req, resStatus: 200, action: 'checklist.answer', entity: 'checklist_resposta', entityId: rows[0]?.id, payload: { pergunta_id, resposta }, startTime });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Erro responderPergunta:', err);
    await auditService.log({ req, resStatus: 500, action: 'checklist.answer', entity: 'checklist_pergunta', entityId: pergunta_id, success: false, message: err.message });
    return res.status(500).json({ success: false, message: 'Erro ao salvar resposta' });
  }
}
