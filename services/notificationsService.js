import pool from '../config/database.js';
import { sendMail } from './emailService.js';
import { sendPushToUser } from './pushService.js';

// Tipos: schedule_confirm, schedule_reminder_8h, schedule_reminder_15m, schedule_cancel, admin_notice

export async function enqueueNotification({ userId, occurrenceId = null, type, scheduledAtUtc, subject, html, text, pushPayload, uniqueKey }) {
  if (!userId || !type || !scheduledAtUtc) throw new Error('Campos obrigatórios ausentes');
  const key = uniqueKey || `${type}:${userId}:${occurrenceId || 'none'}:${new Date(scheduledAtUtc).getTime()}`;
  const payload = { subject, html, text, pushPayload };
  const r = await pool.query(
    `INSERT INTO notifications_queue(user_id, occurrence_id, type, scheduled_at_utc, payload, unique_key, status)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'queued')
     ON CONFLICT (unique_key) DO NOTHING
     RETURNING id`,
    [userId, occurrenceId, type, scheduledAtUtc, JSON.stringify(payload), key]
  );
  return { enqueued: r.rowCount > 0, id: r.rows[0]?.id };
}

export async function cancelNotificationsForOccurrence(occurrenceId) {
  await pool.query(
    `UPDATE notifications_queue SET status = 'canceled', updated_at = NOW()
     WHERE occurrence_id = $1 AND status = 'queued'`,
    [occurrenceId]
  );
}

export async function dispatchNotificationRow(row) {
  const { user_id, payload } = row;
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  // Enviar SEMPRE pelos dois canais: email e push
  const results = {};
  try {
    if (data?.subject && (data?.html || data?.text)) {
      const to = await getUserEmail(user_id);
      if (to) {
        results.email = await sendMail({ to, subject: data.subject, html: data.html, text: data.text });
      } else {
        results.email = { skipped: true, reason: 'no-email' };
      }
    } else {
      results.email = { skipped: true, reason: 'missing-content' };
    }
  } catch (err) {
    results.email = { success: false, error: err?.message || String(err) };
  }

  try {
    if (data?.pushPayload) {
      results.push = await sendPushToUser(user_id, data.pushPayload);
    } else {
      results.push = { skipped: true, reason: 'no-push-payload' };
    }
  } catch (err) {
    results.push = { success: false, error: err?.message || String(err) };
  }

  return results;
}

async function getUserEmail(userId) {
  const r = await pool.query(`SELECT email FROM usuarios WHERE id = $1`, [userId]);
  return r.rows[0]?.email || null;
}
