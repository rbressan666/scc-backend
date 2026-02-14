import express from 'express';
import parametrosController from '../controllers/parametrosController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/parametros-propaganda - Buscar parâmetros atuais
router.get('/', parametrosController.get);

// PUT /api/parametros-propaganda - Atualizar parâmetros
router.put('/', parametrosController.update);

// GET /api/parametros-propaganda/historico - Histórico de alterações
router.get('/historico', parametrosController.getHistoricoAlteracoes);

export default router;
