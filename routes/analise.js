import express from 'express';
import {
    generateAnalysis,
    getVariationReport
} from '../controllers/analiseController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/generate').post(authenticateToken, requireAdmin, generateAnalysis);
router.route('/report/turno/:turnoId').get(authenticateToken, getVariationReport);

export default router;
