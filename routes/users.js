// routes/users.js
import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deactivateUser,
  reactivateUser,
  getUserProfile,
  updateUserProfile,
  inviteUser
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateCreateUser, validateUpdateUser } from '../middleware/validators.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rota para perfil do usuário logado
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Rotas que requerem admin
router.get('/', requireAdmin, getAllUsers);
router.post('/', requireAdmin, validateCreateUser, createUser);
router.post('/invite', requireAdmin, inviteUser);
router.get('/:id', getUserById);
router.put('/:id', requireAdmin, validateUpdateUser, updateUser);
router.delete('/:id', requireAdmin, deactivateUser);
router.put('/:id/reactivate', requireAdmin, reactivateUser);

export default router;

