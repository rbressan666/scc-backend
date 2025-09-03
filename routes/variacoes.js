// routes/variacoes.js
import express from 'express';
import VariacaoProdutoController from '../controllers/variacaoProdutoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  validateVariacaoProduto, 
  validateUUID, 
  validateUUIDProduto,
  validateEstoque,
  handleValidationErrors 
} from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/variacoes - Criar nova variação de produto
router.post('/', validateVariacaoProduto, handleValidationErrors, VariacaoProdutoController.create);

// GET /api/variacoes - Listar todas as variações
router.get('/', VariacaoProdutoController.getAll);

// GET /api/variacoes/estoque-baixo - Buscar variações com estoque baixo
router.get('/estoque-baixo', VariacaoProdutoController.getLowStock);

// GET /api/variacoes/produto/:id_produto - Buscar variações por produto
router.get('/produto/:id_produto', validateUUIDProduto, handleValidationErrors, VariacaoProdutoController.getByProduct);

// GET /api/variacoes/:id - Buscar variação por ID
router.get('/:id', validateUUID, handleValidationErrors, VariacaoProdutoController.getById);

// PUT /api/variacoes/:id - Atualizar variação
router.put('/:id', validateUUID, validateVariacaoProduto, handleValidationErrors, VariacaoProdutoController.update);

// PUT /api/variacoes/:id/estoque - Atualizar estoque da variação
router.put('/:id/estoque', validateUUID, validateEstoque, handleValidationErrors, VariacaoProdutoController.updateStock);

// DELETE /api/variacoes/:id - Desativar variação
router.delete('/:id', validateUUID, handleValidationErrors, VariacaoProdutoController.deactivate);

// PUT /api/variacoes/:id/reactivate - Reativar variação
router.put('/:id/reactivate', validateUUID, handleValidationErrors, VariacaoProdutoController.reactivate);

export default router;

