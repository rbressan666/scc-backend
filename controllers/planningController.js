import pool from '../config/database.js';
import { enqueueNotification } from '../services/notificationsService.js';

function getWeekWindow(startDateStr) {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  // Compute Wednesday-based week: find previous Wednesday (including today if Wednesday)
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const dow = d.getUTCDay(); // 0..6, 3 = Wed
  const delta = (dow >= 3) ? (dow - 3) : (7 - (3 - dow));
  const wed = new Date(d.getTime() - delta * 86400000);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const di = new Date(wed.getTime() + i * 86400000);
    days.push(di.toISOString().slice(0,10));
  }
  return { startIso: days[0], days };
}

export async function getWeek(req, res) {
  try {
    const { start, userId } = req.query;
    const { startIso, days } = getWeekWindow(start);
    const endIso = new Date(new Date(startIso).getTime() + 6 * 86400000).toISOString().slice(0,10);

    const params = [startIso, endIso];
    let where = `date BETWEEN $1 AND $2`;
    if (userId && userId !== 'all') {
      params.push(userId);
      where += ` AND user_id = $3`;
    }
    const { rows } = await pool.query(
      `SELECT s.id, s.user_id, u.nome_completo AS user_name, s.date, s.start_time, s.end_time, s.spans_next_day
       FROM scheduled_shifts s
       JOIN usuarios u ON u.id = s.user_id
       WHERE ${where}
       ORDER BY s.date, s.start_time`,
      params
    );
    res.json({ ok: true, weekStart: startIso, days, shifts: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

export async function createShift(req, res) {
  try {
    const { userId, date, startTime, endTime } = req.body || {};
    if (!userId || !date || !startTime || !endTime) return res.status(400).json({ ok: false, error: 'missing-fields' });
    const spans = endTime <= startTime;
    const { rows } = await pool.query(
      `INSERT INTO scheduled_shifts(user_id, date, start_time, end_time, spans_next_day)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, date, startTime, endTime, spans]
    );
    const shift = rows[0];

    // Agendar notificações: confirmação imediata, lembrete 8h antes e 15m antes
    try {
      const appTz = process.env.APP_TZ || process.env.TIMEZONE || process.env.TZ || 'America/Sao_Paulo';
      const ensureSeconds = (t) => (t && t.length === 5 ? `${t}:00` : t);
      const startIsoLocal = `${date}T${ensureSeconds(startTime)}`; // interpretado no timezone do processo (defina TZ para precisão)
      const start = new Date(startIsoLocal);
      const minus = (ms) => new Date(start.getTime() - ms);
      const fmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: appTz });
      const humanStart = fmt.format(start);

      const subjectBase = `Escala confirmada - ${humanStart}`;
      const textBase = `Você foi escalado(a) para trabalhar em ${humanStart}.`;
      const htmlBase = `<p>${textBase}</p>`;

      // Confirmação imediata
      await enqueueNotification({
        userId,
        occurrenceId: shift.id,
        type: 'schedule_confirm',
        scheduledAtUtc: new Date().toISOString(),
        subject: subjectBase,
        html: htmlBase,
        text: textBase,
        pushPayload: { title: 'Escala confirmada', body: humanStart },
        uniqueKey: `shift:${shift.id}:confirm`
      });

      const now = new Date();
      // Lembrete 8 horas antes (somente se for futuro)
      const at8h = minus(8 * 60 * 60 * 1000);
      if (at8h.getTime() > now.getTime()) {
        await enqueueNotification({
          userId,
          occurrenceId: shift.id,
          type: 'schedule_reminder_8h',
          scheduledAtUtc: at8h.toISOString(),
          subject: `Lembrete (8h) - ${humanStart}`,
          html: `<p>Faltam ~8 horas para seu turno: ${humanStart}.</p>`,
          text: `Faltam ~8 horas para seu turno: ${humanStart}.`,
          pushPayload: { title: 'Lembrete (8h)', body: humanStart },
          uniqueKey: `shift:${shift.id}:rem8h`
        });
      }

      // Lembrete 15 minutos antes (somente se for futuro)
      const at15m = minus(15 * 60 * 1000);
      if (at15m.getTime() > now.getTime()) {
        await enqueueNotification({
          userId,
          occurrenceId: shift.id,
          type: 'schedule_reminder_15m',
          scheduledAtUtc: at15m.toISOString(),
          subject: `Lembrete (15m) - ${humanStart}`,
          html: `<p>Faltam 15 minutos para seu turno: ${humanStart}.</p>`,
          text: `Faltam 15 minutos para seu turno: ${humanStart}.`,
          pushPayload: { title: 'Lembrete (15m)', body: humanStart },
          uniqueKey: `shift:${shift.id}:rem15m`
        });
      }
    } catch (notifyErr) {
      console.error('[planning] Falha ao enfileirar notificações do turno:', notifyErr?.message || notifyErr);
      // segue sem bloquear a criação do turno
    }

    res.status(201).json({ ok: true, shift });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

export async function deleteShift(req, res) {
  try {
    const { id } = req.params;
    const r = await pool.query(`DELETE FROM scheduled_shifts WHERE id = $1`, [id]);
    res.json({ ok: true, deleted: r.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

export async function updateShift(req, res) {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body || {};
    if (!startTime && !endTime) return res.status(400).json({ ok: false, error: 'nothing-to-update' });
    const cur = await pool.query(`SELECT * FROM scheduled_shifts WHERE id = $1`, [id]);
    if (cur.rowCount === 0) return res.status(404).json({ ok: false, error: 'not-found' });
    const row = cur.rows[0];
    const s = startTime || row.start_time;
    const e = endTime || row.end_time;
    const spans = e <= s;
    const upd = await pool.query(
      `UPDATE scheduled_shifts SET start_time = $2, end_time = $3, spans_next_day = $4, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, s, e, spans]
    );
    res.json({ ok: true, shift: upd.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

export async function upsertRule(req, res) {
  try {
    const { userId, dayOfWeek, startTime, endTime, continuous = true } = req.body || {};
    if (!userId || dayOfWeek === undefined) return res.status(400).json({ ok: false, error: 'missing-fields' });
    const exists = await pool.query(
      `SELECT id FROM schedule_rules WHERE user_id = $1 AND day_of_week = $2`,
      [userId, Number(dayOfWeek)]
    );
    if (exists.rows.length > 0) {
      const { rows } = await pool.query(
        `UPDATE schedule_rules
         SET start_time = $3, end_time = $4, continuous = $5, updated_at = NOW()
         WHERE user_id = $1 AND day_of_week = $2 RETURNING *`,
        [userId, Number(dayOfWeek), startTime || null, endTime || null, !!continuous]
      );
      return res.json({ ok: true, rule: rows[0] });
    } else {
      const { rows } = await pool.query(
        `INSERT INTO schedule_rules(user_id, day_of_week, start_time, end_time, continuous, start_date)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
         RETURNING *`,
        [userId, Number(dayOfWeek), startTime || null, endTime || null, !!continuous]
      );
      return res.status(201).json({ ok: true, rule: rows[0] });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

export async function listRules(req, res) {
  try {
    const { userId, includeInactive } = req.query;
    const params = [];
    const conds = [];
    if (userId && userId !== 'all') { conds.push('r.user_id = $1'); params.push(userId); }
    if (!includeInactive || includeInactive === 'false') { conds.push('r.active = true'); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT r.id, r.user_id, u.nome_completo AS user_name, r.day_of_week, r.start_time, r.end_time, r.continuous
       FROM schedule_rules r JOIN usuarios u ON u.id = r.user_id
       ${where}
       ORDER BY u.nome_completo, r.day_of_week`,
      params
    );
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

export async function deleteRule(req, res) {
  try {
    const { id } = req.params;
    const { hard } = req.query; // hard=true para excluir fisicamente
    if (hard === 'true') {
      const r = await pool.query(`DELETE FROM schedule_rules WHERE id = $1`, [id]);
      return res.json({ ok: true, deleted: r.rowCount });
    }
    const upd = await pool.query(
      `UPDATE schedule_rules SET active = false, end_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (upd.rowCount === 0) return res.status(404).json({ ok: false, error: 'not-found' });
    res.json({ ok: true, rule: upd.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

// Admin: garante que as tabelas necessárias existam em produção
export async function bootstrap(req, res) {
  try {
    const stmts = [
      `CREATE TABLE IF NOT EXISTS schedule_rules (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        shift_type TEXT NOT NULL DEFAULT 'diurno',
        start_date DATE NOT NULL,
        end_date DATE NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_schedule_rules_user_dow ON schedule_rules(user_id, day_of_week);`,
      `ALTER TABLE schedule_rules
        ADD COLUMN IF NOT EXISTS start_time TIME,
        ADD COLUMN IF NOT EXISTS end_time TIME,
        ADD COLUMN IF NOT EXISTS continuous BOOLEAN NOT NULL DEFAULT true;`,
      `CREATE TABLE IF NOT EXISTS scheduled_shifts (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        spans_next_day BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_user_date ON scheduled_shifts(user_id, date);`
    ];
    for (const sql of stmts) {
      await pool.query(sql);
    }
    res.json({ ok: true, message: 'Bootstrap concluído' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}
