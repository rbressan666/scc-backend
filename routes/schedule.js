import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { listRules, createRule, updateRule, deleteRule, generatePlannedNotifications } from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/rules', authenticateToken, requireAdmin, listRules);
router.post('/rules', authenticateToken, requireAdmin, createRule);
router.put('/rules/:id', authenticateToken, requireAdmin, updateRule);
router.delete('/rules/:id', authenticateToken, requireAdmin, deleteRule);
router.post('/generate', authenticateToken, requireAdmin, generatePlannedNotifications);

export default router;
