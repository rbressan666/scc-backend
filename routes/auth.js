// routes/auth.js
import express from 'express';
import { login, logout, verify, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin, validateChangePassword } from '../middleware/validators.js';

const router = express.Router();

// Rotas públicas
router.post('/login', validateLogin, login);

// Rotas protegidas
router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verify);
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);

export default router;

