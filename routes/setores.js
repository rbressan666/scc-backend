// routes/setores.js
import express from 'express';
import SetorController from '../controllers/setorController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/setores - Criar novo setor
router.post('/', handleValidationErrors, SetorController.create);

// GET /api/setores - Listar todos os setores
router.get('/', SetorController.getAll);

// GET /api/setores/:id - Buscar setor por ID
router.get('/:id', handleValidationErrors, SetorController.getById);

// PUT /api/setores/:id - Atualizar setor
router.put('/:id', handleValidationErrors, SetorController.update);

// DELETE /api/setores/:id - Desativar setor
router.delete('/:id', handleValidationErrors, SetorController.deactivate);

// PUT /api/setores/:id/reactivate - Reativar setor
router.put('/:id/reactivate', handleValidationErrors, SetorController.reactivate);

export default router;

