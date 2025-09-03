// routes/categorias.js
import express from 'express';
import CategoriaController from '../controllers/categoriaController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateCategoria, validateUUID, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/categorias - Criar nova categoria
router.post('/', validateCategoria, handleValidationErrors, CategoriaController.create);

// GET /api/categorias - Listar todas as categorias
router.get('/', CategoriaController.getAll);

// GET /api/categorias/:id - Buscar categoria por ID
router.get('/:id', validateUUID, handleValidationErrors, CategoriaController.getById);

// PUT /api/categorias/:id - Atualizar categoria
router.put('/:id', validateUUID, validateCategoria, handleValidationErrors, CategoriaController.update);

// DELETE /api/categorias/:id - Desativar categoria
router.delete('/:id', validateUUID, handleValidationErrors, CategoriaController.deactivate);

// PUT /api/categorias/:id/reactivate - Reativar categoria
router.put('/:id/reactivate', validateUUID, handleValidationErrors, CategoriaController.reactivate);

export default router;

