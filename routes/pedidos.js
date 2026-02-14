const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/pedidos - Listar todos os pedidos
router.get('/', pedidosController.getAll);

// GET /api/pedidos/:id - Buscar pedido por ID
router.get('/:id', pedidosController.getById);

// POST /api/pedidos - Criar novo pedido
router.post('/', pedidosController.create);

// PUT /api/pedidos/:id - Atualizar pedido
router.put('/:id', pedidosController.update);

// DELETE /api/pedidos/:id - Excluir pedido (soft delete)
router.delete('/:id', pedidosController.delete);

module.exports = router;
