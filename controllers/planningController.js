import pool from '../config/database.js';
import { enqueueNotification, cancelNotificationsForOccurrence } from '../services/notificationsService.js';
import { zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';

function ensureSeconds(t) {
  return t && t.length === 5 ? `${t}:00` : t;
}

function addDaysISO(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const d2 = new Date(d.getTime() + days * 86400000);
  return d2.toISOString().slice(0, 10);
}

function getAppTz() {
  return process.env.APP_TZ || process.env.TIMEZONE || process.env.TZ || 'America/Sao_Paulo';
}

// Converte data+hora no fuso do app para UTC corretamente
function computeShiftUtc(date, startTime, endTime, spansFlag) {
  const appTz = getAppTz();
  const sLocal = `${date}T${ensureSeconds(startTime)}`;
  const startUtc = zonedTimeToUtc(sLocal, appTz);
  let endDate = date;
  if (spansFlag) endDate = addDaysISO(date, 1);
  const eLocal = `${endDate}T${ensureSeconds(endTime)}`;
  const endUtc = zonedTimeToUtc(eLocal, appTz);
  return { startUtc, endUtc, appTz };
}

function formatShiftRangeHuman(startUtc, endUtc, appTz) {
  const sameDay = formatInTimeZone(startUtc, appTz, 'yyyy-MM-dd') === formatInTimeZone(endUtc, appTz, 'yyyy-MM-dd');
  const dateLabel = formatInTimeZone(startUtc, appTz, 'dd/MM/yyyy');
  const startLabel = formatInTimeZone(startUtc, appTz, 'HH:mm');
  const endLabel = formatInTimeZone(endUtc, appTz, 'HH:mm');
  const suffix = sameDay ? '' : ' (termina no dia seguinte)';
  return { dateLabel, startLabel, endLabel, suffix };
}

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
      const { startUtc, endUtc, appTz } = computeShiftUtc(date, startTime, endTime, spans);
      const { dateLabel, startLabel, endLabel, suffix } = formatShiftRangeHuman(startUtc, endUtc, appTz);
      const rangeCompact = `${dateLabel} ${startLabel}–${endLabel}`;
      const subjectBase = `Escala confirmada - ${rangeCompact}`;
      const textBase = `Você foi escalado(a) para ${dateLabel}, das ${startLabel} às ${endLabel}.${suffix ? ' ' + suffix : ''}`;
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
        pushPayload: { title: 'Escala confirmada', body: `${startLabel}–${endLabel} (${dateLabel})` },
        uniqueKey: `shift:${shift.id}:confirm`
      });

      const now = new Date();
      // Lembrete 8 horas antes (somente se for futuro)
      const at8h = new Date(startUtc.getTime() - 8 * 60 * 60 * 1000);
      if (at8h.getTime() > now.getTime()) {
        await enqueueNotification({
          userId,
          occurrenceId: shift.id,
          type: 'schedule_reminder_8h',
          scheduledAtUtc: at8h.toISOString(),
          subject: `Lembrete (8h) - ${rangeCompact}`,
          html: `<p>Faltam ~8 horas para seu turno: ${dateLabel}, ${startLabel}–${endLabel}.</p>`,
          text: `Faltam ~8 horas para seu turno: ${dateLabel}, ${startLabel}–${endLabel}.`,
          pushPayload: { title: 'Lembrete (8h)', body: `${startLabel}–${endLabel} (${dateLabel})` },
          uniqueKey: `shift:${shift.id}:rem8h`
        });
      }

      // Lembrete 15 minutos antes (somente se for futuro)
      const at15m = new Date(startUtc.getTime() - 15 * 60 * 1000);
      if (at15m.getTime() > now.getTime()) {
        await enqueueNotification({
          userId,
          occurrenceId: shift.id,
          type: 'schedule_reminder_15m',
          scheduledAtUtc: at15m.toISOString(),
          subject: `Lembrete (15m) - ${rangeCompact}`,
          html: `<p>Faltam 15 minutos para seu turno: ${dateLabel}, ${startLabel}–${endLabel}.</p>`,
          text: `Faltam 15 minutos para seu turno: ${dateLabel}, ${startLabel}–${endLabel}.`,
          pushPayload: { title: 'Lembrete (15m)', body: `${startLabel}–${endLabel} (${dateLabel})` },
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
    // Buscar dados antes de apagar para notificar
    const cur = await pool.query(`SELECT * FROM scheduled_shifts WHERE id = $1`, [id]);
    const exists = cur.rows[0];
    const r = await pool.query(`DELETE FROM scheduled_shifts WHERE id = $1`, [id]);

    if (exists && r.rowCount > 0) {
      try {
        await cancelNotificationsForOccurrence(id);
        const { startUtc, endUtc, appTz } = computeShiftUtc(exists.date.toISOString().slice(0,10), exists.start_time, exists.end_time, exists.spans_next_day);
        const { dateLabel, startLabel, endLabel, suffix } = formatShiftRangeHuman(startUtc, endUtc, appTz);
        const rangeCompact = `${dateLabel} ${startLabel}–${endLabel}`;
        const subject = `Escala cancelada - ${rangeCompact}`;
        const text = `Sua escala em ${dateLabel}, das ${startLabel} às ${endLabel} foi cancelada.${suffix ? ' ' + suffix : ''}`;
        const html = `<p>${text}</p>`;
        await enqueueNotification({
          userId: exists.user_id,
          occurrenceId: id,
          type: 'schedule_cancel',
          scheduledAtUtc: new Date().toISOString(),
          subject,
          html,
          text,
          pushPayload: { title: 'Escala cancelada', body: `${startLabel}–${endLabel} (${dateLabel})` },
          uniqueKey: `shift:${id}:cancel`
        });
      } catch (notifyErr) {
        console.error('[planning] Falha ao notificar cancelamento do turno:', notifyErr?.message || notifyErr);
      }
    }

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

    const updated = upd.rows[0];

    // Notificar alteração: cancelar lembretes antigos e agendar novos + email de atualização
    try {
      await cancelNotificationsForOccurrence(id);

      const prev = computeShiftUtc(row.date.toISOString().slice(0,10), row.start_time, row.end_time, row.spans_next_day);
      const prevHuman = formatShiftRangeHuman(prev.startUtc, prev.endUtc, prev.appTz);
      const next = computeShiftUtc(updated.date.toISOString().slice(0,10), updated.start_time, updated.end_time, updated.spans_next_day);
      const nextHuman = formatShiftRangeHuman(next.startUtc, next.endUtc, next.appTz);

      const prevRange = `${prevHuman.dateLabel} ${prevHuman.startLabel}–${prevHuman.endLabel}`;
      const nextRange = `${nextHuman.dateLabel} ${nextHuman.startLabel}–${nextHuman.endLabel}`;

      const subject = `Escala atualizada - ${nextRange}`;
      const text = `Sua escala foi atualizada de ${prevRange} para ${nextRange}.`;
      const html = `<p>${text}</p>`;

      await enqueueNotification({
        userId: updated.user_id,
        occurrenceId: id,
        type: 'schedule_update',
        scheduledAtUtc: new Date().toISOString(),
        subject,
        html,
        text,
        pushPayload: { title: 'Escala atualizada', body: `${nextHuman.startLabel}–${nextHuman.endLabel} (${nextHuman.dateLabel})` },
        uniqueKey: `shift:${id}:update:${Date.now()}`
      });

      const now = new Date();
      const at8h = new Date(next.startUtc.getTime() - 8 * 60 * 60 * 1000);
      if (at8h.getTime() > now.getTime()) {
        await enqueueNotification({
          userId: updated.user_id,
          occurrenceId: id,
          type: 'schedule_reminder_8h',
          scheduledAtUtc: at8h.toISOString(),
          subject: `Lembrete (8h) - ${nextRange}`,
          html: `<p>Faltam ~8 horas para seu turno: ${nextHuman.dateLabel}, ${nextHuman.startLabel}–${nextHuman.endLabel}.</p>`,
          text: `Faltam ~8 horas para seu turno: ${nextHuman.dateLabel}, ${nextHuman.startLabel}–${nextHuman.endLabel}.`,
          pushPayload: { title: 'Lembrete (8h)', body: `${nextHuman.startLabel}–${nextHuman.endLabel} (${nextHuman.dateLabel})` },
          uniqueKey: `shift:${id}:rem8h:${Date.now()}`
        });
      }

      const at15m = new Date(next.startUtc.getTime() - 15 * 60 * 1000);
      if (at15m.getTime() > now.getTime()) {
        await enqueueNotification({
          userId: updated.user_id,
          occurrenceId: id,
          type: 'schedule_reminder_15m',
          scheduledAtUtc: at15m.toISOString(),
          subject: `Lembrete (15m) - ${nextRange}`,
          html: `<p>Faltam 15 minutos para seu turno: ${nextHuman.dateLabel}, ${nextHuman.startLabel}–${nextHuman.endLabel}.</p>`,
          text: `Faltam 15 minutos para seu turno: ${nextHuman.dateLabel}, ${nextHuman.startLabel}–${nextHuman.endLabel}.`,
          pushPayload: { title: 'Lembrete (15m)', body: `${nextHuman.startLabel}–${nextHuman.endLabel} (${nextHuman.dateLabel})` },
          uniqueKey: `shift:${id}:rem15m:${Date.now()}`
        });
      }
    } catch (notifyErr) {
      console.error('[planning] Falha ao notificar alteração do turno:', notifyErr?.message || notifyErr);
    }

    res.json({ ok: true, shift: updated });
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
