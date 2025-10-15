import pool from '../config/database.js';

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
    res.status(201).json({ ok: true, shift: rows[0] });
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
    const { userId } = req.query;
    const params = [];
    let where = '';
    if (userId && userId !== 'all') { where = 'WHERE r.user_id = $1'; params.push(userId); }
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
