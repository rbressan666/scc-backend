// routes/variacoes.js
import express from 'express';
import VariacaoController from '../controllers/variacaoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/variacoes - Criar nova variação
router.post('/', handleValidationErrors, VariacaoController.create);

// GET /api/variacoes - Listar todas as variações
router.get('/', VariacaoController.getAll);

// GET /api/variacoes/por-produto/:id - Buscar variações por produto
router.get('/por-produto/:id', handleValidationErrors, VariacaoController.getByProduto);

// GET /api/variacoes/:id - Buscar variação por ID
router.get('/:id', handleValidationErrors, VariacaoController.getById);

// PUT /api/variacoes/:id - Atualizar variação
router.put('/:id', handleValidationErrors, VariacaoController.update);

// DELETE /api/variacoes/:id - Desativar variação
router.delete('/:id', handleValidationErrors, VariacaoController.deactivate);

// PUT /api/variacoes/:id/reactivate - Reativar variação
router.put('/:id/reactivate', handleValidationErrors, VariacaoController.reactivate);

export default router;

