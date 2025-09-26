import express from 'express';
import {
    createContagem,
    addItemContagem,
    updateItemContagem,
    removeItemContagem,
    getContagensByTurno,
    getItensContagem,
    preCloseContagem,
    closeContagem,
    reopenContagem
} from '../controllers/contagemController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(authenticateToken, createContagem);

router.route('/turno/:turnoId').get(authenticateToken, getContagensByTurno);

router.route('/:id/itens')
    .post(authenticateToken, addItemContagem)
    .get(authenticateToken, getItensContagem);

router.route('/:id/itens/:itemId')
    .put(authenticateToken, updateItemContagem)
    .delete(authenticateToken, removeItemContagem);

router.route('/:id/pre-close').put(authenticateToken, preCloseContagem);
router.route('/:id/close').put(authenticateToken, requireAdmin, closeContagem);
router.route('/:id/reopen').put(authenticateToken, requireAdmin, reopenContagem);

export default router;
