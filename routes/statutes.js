import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listPending, acknowledge } from '../controllers/statutesController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/pending', listPending);
router.post('/ack', acknowledge);

export default router;
