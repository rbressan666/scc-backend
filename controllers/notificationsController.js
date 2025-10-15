import pool from '../config/database.js';
import { dispatchNotificationRow, enqueueNotification } from '../services/notificationsService.js';

const MAX_BATCH = parseInt(process.env.NOTIFY_BATCH_SIZE || '20', 10);
const MAX_RUN_MS = parseInt(process.env.NOTIFY_MAX_RUN_MS || '20000', 10);
const SKEW_SECONDS = parseInt(process.env.NOTIFY_TIME_SKEW_SEC || '5', 10); // tolerância para diferenças de relógio

export async function dispatchNow(req, res) {
  try {
    const key = process.env.CRON_DISPATCH_KEY;
    if (!key) return res.status(503).json({ error: 'dispatch-key-not-configured' });
    const provided = req.headers['x-cron-key'] || req.query.key;
    if (provided !== key) return res.status(401).json({ error: 'unauthorized' });

    const started = Date.now();
    let processed = 0;
    let sent = 0;
    let failed = 0;

    while (Date.now() - started < MAX_RUN_MS) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `SELECT * FROM notifications_queue
           WHERE status = 'queued' AND scheduled_at_utc <= NOW() + ($2 * INTERVAL '1 second')
           ORDER BY scheduled_at_utc ASC
           FOR UPDATE SKIP LOCKED
           LIMIT $1`,
          [MAX_BATCH, SKEW_SECONDS]
        );
        if (rows.length === 0) {
          await client.query('ROLLBACK');
          break;
        }

        for (const row of rows) {
          try {
            const results = await dispatchNotificationRow(row);
            const success = (results?.email?.success || results?.push?.success);
            await client.query(
              `UPDATE notifications_queue
               SET status = $2, sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END,
                   last_result = $3::jsonb, updated_at = NOW()
               WHERE id = $1`,
              [row.id, success ? 'sent' : 'failed', JSON.stringify(results)]
            );
            processed++;
            if (success) sent++; else failed++;
          } catch (err) {
            await client.query(
              `UPDATE notifications_queue SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`,
              [row.id, err?.message || String(err)]
            );
            processed++; failed++;
          }
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'transaction-failed', details: err?.message || String(err) });
      } finally {
        // release connection
        try { client.release(); } catch (_) {}
      }

      if (processed >= MAX_BATCH) break;
    }

    return res.json({ ok: true, processed, sent, failed, durationMs: Date.now() - started });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'internal-error' });
  }
}

export async function enqueueTest(req, res) {
  try {
    if (process.env.ENABLE_TEST_ROUTES !== 'true') {
      return res.status(404).json({ error: 'not-found' });
    }
    const { userId, subject, message, scheduleInSeconds = 0 } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId-required' });
    const when = new Date(Date.now() + (Number(scheduleInSeconds) || 0) * 1000);

    const html = `<p>${message || 'Notificação de teste'}</p>`;
    const text = message || 'Notificação de teste';
    const pushPayload = { title: subject || 'SCC - Teste', body: message || 'Notificação de teste' };

    const r = await enqueueNotification({
      userId,
      type: 'test',
      scheduledAtUtc: when.toISOString(),
      subject: subject || 'SCC - Teste',
      html,
      text,
      pushPayload,
      uniqueKey: `test:${userId}:${when.getTime()}`
    });
    return res.json({ ok: true, enqueued: r.enqueued, id: r.id, scheduledAtUtc: when.toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'internal-error' });
  }
}

export async function listPending(req, res) {
  try {
    if (process.env.ENABLE_TEST_ROUTES !== 'true') {
      return res.status(404).json({ error: 'not-found' });
    }
    const { onlyDue = 'true', limit = '10' } = req.query;
    const onlyDueBool = String(onlyDue).toLowerCase() !== 'false';
    const lim = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));

    const whereDue = onlyDueBool ? `AND scheduled_at_utc <= NOW() + ($2 * INTERVAL '1 second')` : '';
    const { rows } = await pool.query(
      `SELECT id, user_id, type, scheduled_at_utc, status, unique_key, last_error
       FROM notifications_queue
       WHERE status = 'queued' ${whereDue}
       ORDER BY scheduled_at_utc ASC
       LIMIT $1`,
      onlyDueBool ? [lim, SKEW_SECONDS] : [lim]
    );
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total,
              SUM(CASE WHEN scheduled_at_utc <= NOW() + ($1 * INTERVAL '1 second') THEN 1 ELSE 0 END)::int AS due
       FROM notifications_queue WHERE status = 'queued'`,
      [SKEW_SECONDS]
    );
    return res.json({ ok: true, totalQueued: countRes.rows[0]?.total || 0, dueNow: countRes.rows[0]?.due || 0, sample: rows });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'internal-error' });
  }
}
