const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginValidators, changePasswordValidators } = require('../middleware/validators');
const rateLimit = require('express-rate-limit');

// Rate limiting para login (máximo 5 tentativas por 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting geral para rotas de auth (máximo 20 requests por 15 minutos)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 requests
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting a todas as rotas de auth
router.use(authLimiter);

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuário e retornar token JWT
 * @access  Public
 */
router.post('/login', loginLimiter, loginValidators, AuthController.login);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar se o token JWT é válido
 * @access  Private
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Fazer logout do usuário
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Alterar senha do usuário logado
 * @access  Private
 */
router.put('/change-password', authenticateToken, changePasswordValidators, AuthController.changePassword);

module.exports = router;

