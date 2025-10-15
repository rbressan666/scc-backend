import webpush from 'web-push';
import pool from '../config/database.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

let initialized = false;
function ensureInit() {
  if (initialized) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[pushService] VAPID keys ausentes. Push ficará inativo.');
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  initialized = true;
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY || null;
}

export async function saveSubscription({ userId, subscription }) {
  // subscription é um objeto Web Push: { endpoint, keys: { p256dh, auth } }
  if (!subscription?.endpoint) throw new Error('Subscription inválida');
  const { endpoint } = subscription;
  const text = JSON.stringify(subscription);
  await pool.query(
    `INSERT INTO push_subscriptions(user_id, endpoint, subscription, active)
     VALUES ($1, $2, $3::jsonb, true)
     ON CONFLICT (endpoint) DO UPDATE SET subscription = EXCLUDED.subscription, active = true, updated_at = NOW()`,
    [userId, endpoint, text]
  );
}

export async function removeSubscription({ userId, endpoint }) {
  await pool.query(
    `UPDATE push_subscriptions SET active = false, updated_at = NOW() WHERE user_id = $1 AND endpoint = $2`,
    [userId, endpoint]
  );
}

export async function getActiveSubscriptions(userId) {
  const r = await pool.query(
    `SELECT subscription FROM push_subscriptions WHERE user_id = $1 AND active = true`,
    [userId]
  );
  return r.rows.map(x => x.subscription);
}

export async function sendPushToUser(userId, payload) {
  ensureInit();
  if (!initialized) return { skipped: true, reason: 'no-vapid' };
  const subs = await getActiveSubscriptions(userId);
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      sent++;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        // endpoint inválido; desativar
        await pool.query(`UPDATE push_subscriptions SET active = false WHERE subscription->>'endpoint' = $1`, [sub.endpoint]);
      } else {
        console.error('[pushService] Falha ao enviar push:', err?.statusCode, err?.message || err);
      }
    }
  }
  return { success: true, sent };
}
