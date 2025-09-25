// routes/conversoes.js
import express from 'express';
import FatorConversaoController from '../controllers/fatorConversaoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/conversoes - Criar novo fator de conversão
router.post('/', handleValidationErrors, FatorConversaoController.create);

// POST /api/conversoes/multiplos - Criar múltiplos fatores de conversão
router.post('/multiplos', handleValidationErrors, FatorConversaoController.createMultiple);

// GET /api/conversoes/por-variacao/:id - Buscar fatores por variação
router.get('/por-variacao/:id', handleValidationErrors, FatorConversaoController.getByVariacao);

// PUT /api/conversoes/:id - Atualizar fator de conversão
router.put('/:id', handleValidationErrors, FatorConversaoController.update);

// DELETE /api/conversoes/:id - Deletar fator de conversão
router.delete('/:id', handleValidationErrors, FatorConversaoController.delete);

export default router;

