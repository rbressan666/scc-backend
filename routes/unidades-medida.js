// routes/unidades-medida.js
import express from 'express';
import UnidadeMedidaController from '../controllers/unidadeMedidaController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/unidades-medida - Criar nova unidade de medida
router.post('/', handleValidationErrors, UnidadeMedidaController.create);

// GET /api/unidades-medida - Listar todas as unidades de medida
router.get('/', UnidadeMedidaController.getAll);

// GET /api/unidades-medida/:id - Buscar unidade de medida por ID
router.get('/:id', handleValidationErrors, UnidadeMedidaController.getById);

// PUT /api/unidades-medida/:id - Atualizar unidade de medida
router.put('/:id', handleValidationErrors, UnidadeMedidaController.update);

// DELETE /api/unidades-medida/:id - Desativar unidade de medida
router.delete('/:id', handleValidationErrors, UnidadeMedidaController.deactivate);

// PUT /api/unidades-medida/:id/reactivate - Reativar unidade de medida
router.put('/:id/reactivate', handleValidationErrors, UnidadeMedidaController.reactivate);

export default router;

