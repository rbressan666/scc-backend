import pool from '../config/database.js';
import { enqueueNotification } from '../services/notificationsService.js';
import { enqueueNotification } from '../services/notificationsService.js';

// List schedule rules (optionally by user)
export async function listRules(req, res) {
  try {
    const { userId } = req.query;
    const params = [];
    let where = '';
    if (userId) {
      params.push(userId);
      where = 'WHERE user_id = $1';
    }
    const { rows } = await pool.query(
      `SELECT id, user_id, day_of_week, shift_type, start_date, end_date, active, created_at, updated_at
       FROM schedule_rules ${where}
       ORDER BY user_id, day_of_week`,
      params
    );
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

// Create a schedule rule
export async function createRule(req, res) {
  try {
    const { userId, dayOfWeek, shiftType = 'diurno', startDate, endDate = null, active = true } = req.body || {};
    if (!userId) return res.status(400).json({ ok: false, error: 'userId-required' });
    const dow = Number(dayOfWeek);
    if (!(dow >= 0 && dow <= 6)) return res.status(400).json({ ok: false, error: 'dayOfWeek-must-be-0-6' });
    const sd = startDate ? new Date(startDate) : new Date();
    const ed = endDate ? new Date(endDate) : null;
    const { rows } = await pool.query(
      `INSERT INTO schedule_rules(user_id, day_of_week, shift_type, start_date, end_date, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, day_of_week, shift_type, start_date, end_date, active, created_at, updated_at`,
      [userId, dow, shiftType, sd.toISOString().slice(0,10), ed ? ed.toISOString().slice(0,10) : null, !!active]
    );
    res.status(201).json({ ok: true, rule: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

// Update a schedule rule (partial)
export async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { dayOfWeek, shiftType, startDate, endDate, active } = req.body || {};

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;
    if (dayOfWeek !== undefined) { fields.push(`day_of_week = $${idx++}`); values.push(Number(dayOfWeek)); }
    if (shiftType !== undefined) { fields.push(`shift_type = $${idx++}`); values.push(shiftType); }
    if (startDate !== undefined) { fields.push(`start_date = $${idx++}`); values.push(new Date(startDate).toISOString().slice(0,10)); }
    if (endDate !== undefined) { fields.push(`end_date = $${idx++}`); values.push(endDate ? new Date(endDate).toISOString().slice(0,10) : null); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(!!active); }
    if (fields.length === 0) return res.status(400).json({ ok: false, error: 'no-fields-to-update' });
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE schedule_rules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'not-found' });
    res.json({ ok: true, rule: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

// Delete a schedule rule
export async function deleteRule(req, res) {
  try {
    const { id } = req.params;
    const r = await pool.query(`DELETE FROM schedule_rules WHERE id = $1`, [id]);
    res.json({ ok: true, deleted: r.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

// Generate notifications from rules for a lookahead window
export async function generatePlannedNotifications(req, res) {
  try {
    const lookaheadDays = parseInt(process.env.SCHEDULE_LOOKAHEAD_DAYS || '28', 10);
    const notifyHourUtc = parseInt(process.env.SCHEDULE_NOTIFY_HOUR_UTC || '12', 10); // 12:00Z
    const now = new Date();
    const end = new Date(now.getTime() + lookaheadDays * 24 * 60 * 60 * 1000);

    // Load active rules
    const { rows: rules } = await pool.query(
      `SELECT id, user_id, day_of_week, shift_type, start_date, end_date, active
       FROM schedule_rules WHERE active = true`
    );

    let enqueued = 0;
    for (const r of rules) {
      // Iterate each day in window and match by dow and date range
      for (let d = new Date(now); d <= end; d = new Date(d.getTime() + 24*60*60*1000)) {
        const dow = d.getUTCDay(); // 0..6
        if (dow !== Number(r.day_of_week)) continue;

        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth()+1).padStart(2,'0');
        const dd = String(d.getUTCDate()).padStart(2,'0');
        const dayIso = `${yyyy}-${mm}-${dd}`;

        const inRange = (!r.start_date || dayIso >= r.start_date) && (!r.end_date || dayIso <= r.end_date);
        if (!inRange) continue;

        const scheduledAtUtc = new Date(Date.UTC(yyyy, d.getUTCMonth(), d.getUTCDate(), notifyHourUtc, 0, 0)).toISOString();
        const subject = `Lembrete de escala (${r.shift_type}) - ${dayIso}`;
        const text = `Você está planejado para o turno ${r.shift_type} em ${dayIso}.`;
        const pushPayload = { title: 'Lembrete de escala', body: `Turno ${r.shift_type} em ${dayIso}` };
        const uniqueKey = `schedule_reminder:${r.user_id}:${r.shift_type}:${dayIso}`;

        const out = await enqueueNotification({
          userId: r.user_id,
          type: 'schedule_reminder',
          scheduledAtUtc,
          subject,
          text,
          html: `<p>${text}</p>`,
          pushPayload,
          uniqueKey
        });
        if (out.enqueued) enqueued++;
      }
    }

    res.json({ ok: true, enqueued, lookaheadDays, notifyHourUtc });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}

// Generate planned notifications based on rules for a lookahead window
export async function generatePlannedNotifications(req, res) {
  try {
    const lookaheadDays = Math.max(1, Math.min(parseInt(process.env.SCHEDULE_LOOKAHEAD_DAYS || '28', 10), 120));
    const notifyHourUtc = Math.max(0, Math.min(parseInt(process.env.SCHEDULE_NOTIFY_HOUR_UTC || '12', 10), 23));

    const { rows: rules } = await pool.query(
      `SELECT id, user_id, day_of_week, shift_type, start_date, end_date, active FROM schedule_rules WHERE active = true`
    );
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    let created = 0;

    for (let delta = 0; delta < lookaheadDays; delta++) {
      const d = new Date(today.getTime() + delta * 86400000);
      const dow = d.getUTCDay(); // 0..6
      for (const r of rules) {
        if (r.day_of_week !== dow) continue;
        const dateISO = d.toISOString().slice(0,10); // YYYY-MM-DD
        if (dateISO < r.start_date) continue;
        if (r.end_date && dateISO > r.end_date) continue;

        const scheduledAt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), notifyHourUtc, 0, 0));
        const subject = `Escala programada (${r.shift_type}) - ${dateISO}`;
        const text = `Você está programado para trabalhar (${r.shift_type}) em ${dateISO}.`;
        const html = `<p>${text}</p>`;
        const pushPayload = { title: 'Escala programada', body: `${r.shift_type} - ${dateISO}` };
        const uniqueKey = `sched:${r.user_id}:${dateISO}:${r.shift_type}`;

        try {
          const result = await enqueueNotification({
            userId: r.user_id,
            type: 'schedule_reminder',
            scheduledAtUtc: scheduledAt.toISOString(),
            subject,
            html,
            text,
            pushPayload,
            uniqueKey
          });
          if (result.enqueued) created++;
        } catch (e) {
          // ignore duplicates or errors for individual rows
        }
      }
    }

    res.json({ ok: true, created, rules: rules.length, days: lookaheadDays });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}
