// routes/auth.js
import express from 'express';
import { login, logout, verify, changePassword, confirmSignup, setPasswordWithToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin, validateChangePassword } from '../middleware/validators.js';

const router = express.Router();

// Rotas públicas
router.post('/login', validateLogin, login);
router.get('/confirm', confirmSignup);
router.post('/set-password-token', setPasswordWithToken);

// Rotas protegidas
router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verify);
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);

export default router;

