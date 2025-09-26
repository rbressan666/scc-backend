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
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createTurno)
    .get(protect, getAllTurnos);

router.route('/current').get(protect, getCurrentTurno);
router.route('/stats').get(protect, admin, getTurnoStatistics);

router.route('/:id')
    .get(protect, getTurnoById)
    .put(protect, closeTurno);

router.route('/:id/reopen').put(protect, admin, reopenTurno);

export default router;
