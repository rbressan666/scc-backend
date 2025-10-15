import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getWeek, createShift, deleteShift, upsertRule, listRules, bootstrap } from '../controllers/planningController.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);
router.get('/week', getWeek);
router.post('/shifts', createShift);
router.delete('/shifts/:id', deleteShift);
router.post('/rules', upsertRule);
router.get('/rules', listRules);
router.post('/_bootstrap', bootstrap);

export default router;
