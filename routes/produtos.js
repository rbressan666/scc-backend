// routes/produtos.js
import express from 'express';
import ProdutoController from '../controllers/produtoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateProduto, validateUUID, validateEanCode, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/produtos/lookup-by-ean - Buscar produto por código EAN
router.post('/lookup-by-ean', validateEanCode, handleValidationErrors, ProdutoController.lookupByEan);

// POST /api/produtos - Criar novo produto
router.post('/', validateProduto, handleValidationErrors, ProdutoController.create);

// GET /api/produtos - Listar todos os produtos
router.get('/', ProdutoController.getAll);

// GET /api/produtos/:id - Buscar produto por ID
router.get('/:id', validateUUID, handleValidationErrors, ProdutoController.getById);

// PUT /api/produtos/:id - Atualizar produto
router.put('/:id', validateUUID, validateProduto, handleValidationErrors, ProdutoController.update);

// DELETE /api/produtos/:id - Desativar produto
router.delete('/:id', validateUUID, handleValidationErrors, ProdutoController.deactivate);

// PUT /api/produtos/:id/reactivate - Reativar produto
router.put('/:id/reactivate', validateUUID, handleValidationErrors, ProdutoController.reactivate);

export default router;

