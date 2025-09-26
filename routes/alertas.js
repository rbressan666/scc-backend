import express from 'express';
import {
    getAllAlertas,
    getAlertaById,
    markAlertaAsRead,
    resolveAlerta,
    ignoreAlerta
} from '../controllers/alertaController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(authenticateToken, getAllAlertas);

router.route('/:id')
    .get(authenticateToken, getAlertaById);

router.route('/:id/read').put(authenticateToken, markAlertaAsRead);
router.route('/:id/resolve').put(authenticateToken, requireAdmin, resolveAlerta);
router.route('/:id/ignore').put(authenticateToken, requireAdmin, ignoreAlerta);

export default router;
