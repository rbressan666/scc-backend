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
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createContagem);

router.route('/turno/:turnoId').get(protect, getContagensByTurno);

router.route('/:id/itens')
    .post(protect, addItemContagem)
    .get(protect, getItensContagem);

router.route('/:id/itens/:itemId')
    .put(protect, updateItemContagem)
    .delete(protect, removeItemContagem);

router.route('/:id/pre-close').put(protect, preCloseContagem);
router.route('/:id/close').put(protect, admin, closeContagem);
router.route('/:id/reopen').put(protect, admin, reopenContagem);

export default router;
