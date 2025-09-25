// routes/variacoes.js
import express from 'express';
import VariacaoProdutoController from '../controllers/variacaoProdutoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/variacoes - Criar nova variação
router.post('/', handleValidationErrors, VariacaoProdutoController.create);

// GET /api/variacoes - Listar todas as variações
router.get('/', VariacaoProdutoController.getAll);

// GET /api/variacoes/por-produto/:id - Buscar variações por produto
router.get('/por-produto/:id', handleValidationErrors, VariacaoProdutoController.getByProduct);

// GET /api/variacoes/:id - Buscar variação por ID
router.get('/:id', handleValidationErrors, VariacaoProdutoController.getById);

// PUT /api/variacoes/:id - Atualizar variação
router.put('/:id', handleValidationErrors, VariacaoProdutoController.update);

// DELETE /api/variacoes/:id - Desativar variação
router.delete('/:id', handleValidationErrors, VariacaoProdutoController.deactivate);

// PUT /api/variacoes/:id/reactivate - Reativar variação
router.put('/:id/reactivate', handleValidationErrors, VariacaoProdutoController.reactivate);

export default router;

