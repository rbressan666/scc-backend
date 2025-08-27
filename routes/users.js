const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { createUserValidators, updateUserValidators, userIdValidators } = require('../middleware/validators');

// Todas as rotas de usuários requerem autenticação
router.use(authenticateToken);

/**
 * @route   GET /api/usuarios/profile
 * @desc    Obter perfil do usuário logado
 * @access  Private
 */
router.get('/profile', UserController.getProfile);

/**
 * @route   GET /api/usuarios
 * @desc    Listar todos os usuários
 * @access  Private (Admin only)
 */
router.get('/', requireAdmin, UserController.getAll);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Buscar usuário por ID
 * @access  Private (Admin ou próprio usuário)
 */
router.get('/:id', userIdValidators, requireOwnershipOrAdmin, UserController.getById);

/**
 * @route   POST /api/usuarios
 * @desc    Criar novo usuário
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, createUserValidators, UserController.create);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Atualizar dados do usuário
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, updateUserValidators, UserController.update);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Desativar usuário (exclusão lógica)
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, userIdValidators, UserController.deactivate);

/**
 * @route   PUT /api/usuarios/:id/reactivate
 * @desc    Reativar usuário
 * @access  Private (Admin only)
 */
router.put('/:id/reactivate', requireAdmin, userIdValidators, UserController.reactivate);

module.exports = router;

