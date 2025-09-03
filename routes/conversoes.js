// routes/conversoes.js
import express from 'express';
import FatorConversaoController from '../controllers/fatorConversaoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  validateFatorConversao, 
  validateMultipleFatores,
  validateConversaoQuantidade,
  validateUUID, 
  validateUUIDVariacao,
  handleValidationErrors 
} from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/conversoes - Criar novo fator de conversão
router.post('/', validateFatorConversao, handleValidationErrors, FatorConversaoController.create);

// POST /api/conversoes/multiplos - Criar múltiplos fatores de conversão
router.post('/multiplos', validateMultipleFatores, handleValidationErrors, FatorConversaoController.createMultiple);

// GET /api/conversoes/por-variacao/:id - Buscar fatores por variação
router.get('/por-variacao/:id', validateUUID, handleValidationErrors, FatorConversaoController.getByVariacao);

// POST /api/conversoes/converter/:id_variacao_produto - Converter quantidade entre unidades
router.post('/converter/:id_variacao_produto', validateUUIDVariacao, validateConversaoQuantidade, handleValidationErrors, FatorConversaoController.convertQuantity);

// GET /api/conversoes/:id - Buscar fator por ID
router.get('/:id', validateUUID, handleValidationErrors, FatorConversaoController.getById);

// PUT /api/conversoes/:id - Atualizar fator de conversão
router.put('/:id', validateUUID, validateFatorConversao, handleValidationErrors, FatorConversaoController.update);

// DELETE /api/conversoes/:id - Deletar fator de conversão
router.delete('/:id', validateUUID, handleValidationErrors, FatorConversaoController.delete);

export default router;

