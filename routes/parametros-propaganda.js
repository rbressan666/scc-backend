const express = require('express');
const router = express.Router();
const parametrosController = require('../controllers/parametrosController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/parametros-propaganda - Buscar parâmetros atuais
router.get('/', parametrosController.get);

// PUT /api/parametros-propaganda - Atualizar parâmetros
router.put('/', parametrosController.update);

// GET /api/parametros-propaganda/historico - Histórico de alterações
router.get('/historico', parametrosController.getHistoricoAlteracoes);

module.exports = router;
