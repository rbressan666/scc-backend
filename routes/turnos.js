import express from 'express';
import {
    createTurno,
    getAllTurnos,
    getTurnoById,
    closeTurno,
    reopenTurno,
    getCurrentTurno,
    getTurnoStatistics
} from '../controllers/turnoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(authenticateToken, createTurno)
    .get(authenticateToken, getAllTurnos);

router.route('/current').get(authenticateToken, getCurrentTurno);
router.route('/stats').get(authenticateToken, requireAdmin, getTurnoStatistics);

router.route('/:id')
    .get(authenticateToken, getTurnoById)
    .put(authenticateToken, closeTurno);

router.route('/:id/reopen').put(authenticateToken, requireAdmin, reopenTurno);

export default router;
