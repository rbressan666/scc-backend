import express from 'express';
import { getPublicKey, subscribe, unsubscribe } from '../controllers/pushController.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/public-key', getPublicKey);
router.post('/subscribe', auth, subscribe);
router.post('/unsubscribe', auth, unsubscribe);

export default router;
