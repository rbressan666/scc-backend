import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getDbUsage } from '../controllers/adminController.js';

const router = express.Router();

router.get('/db-usage', authenticateToken, requireAdmin, getDbUsage);

export default router;
