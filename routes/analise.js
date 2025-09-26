import express from 'express';
import {
    generateAnalysis,
    getVariationReport
} from '../controllers/analiseController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/generate').post(protect, admin, generateAnalysis);
router.route('/report/turno/:turnoId').get(protect, getVariationReport);

export default router;
