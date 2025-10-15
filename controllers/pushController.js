import { saveSubscription, removeSubscription, getVapidPublicKey } from '../services/pushService.js';

export async function getPublicKey(req, res) {
  const key = getVapidPublicKey();
  if (!key) return res.status(503).json({ error: 'push-unavailable' });
  res.json({ publicKey: key });
}

export async function subscribe(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const { subscription } = req.body;
    await saveSubscription({ userId, subscription });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err?.message || 'invalid' });
  }
}

export async function unsubscribe(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const { endpoint } = req.body;
    await removeSubscription({ userId, endpoint });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err?.message || 'invalid' });
  }
}
