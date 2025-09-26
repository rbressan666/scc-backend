import express from 'express';
import {
    getAllAlertas,
    getAlertaById,
    markAlertaAsRead,
    resolveAlerta,
    ignoreAlerta
} from '../controllers/alertaController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, getAllAlertas);

router.route('/:id')
    .get(protect, getAlertaById);

router.route('/:id/read').put(protect, markAlertaAsRead);
router.route('/:id/resolve').put(protect, admin, resolveAlerta);
router.route('/:id/ignore').put(protect, admin, ignoreAlerta);

export default router;
