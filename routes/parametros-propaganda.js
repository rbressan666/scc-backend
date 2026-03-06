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

// POST /api/parametros-propaganda/midia/upload-imagem - Upload de imagem propaganda
router.post('/midia/upload-imagem', parametrosController.uploadImagemPropaganda);

// GET /api/parametros-propaganda/midia - Listar mídias propaganda
router.get('/midia', parametrosController.listMidias);

// GET /api/parametros-propaganda/midia/diagnostico - Diagnóstico de mídias (DB + arquivo)
router.get('/midia/diagnostico', parametrosController.diagnosticoMidias);

// PUT /api/parametros-propaganda/midia/reorder - Reordenar mídias propaganda
router.put('/midia/reorder', parametrosController.reorderMidias);

export default router;
