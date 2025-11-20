import express from 'express';
import {
    createTurno,
    getAllTurnos,
    getTurnoById,
    closeTurno,
    reopenTurno,
    getCurrentTurno,
    getTurnoStatistics,
    joinTurno,
    listTurnoParticipants,
    leaveTurno
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

// Participação em turno
router.route('/:id/join').post(authenticateToken, joinTurno);
router.route('/:id/participants').get(authenticateToken, listTurnoParticipants);
router.route('/:id/leave').post(authenticateToken, leaveTurno);

export default router;
