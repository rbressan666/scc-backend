const { body, param } = require('express-validator');

// Validadores para autenticação
const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email é obrigatório'),
  
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

const changePasswordValidators = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('novaSenha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial')
    .notEmpty()
    .withMessage('Nova senha é obrigatória'),
  
  body('confirmarSenha')
    .custom((value, { req }) => {
      if (value !== req.body.novaSenha) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
];

// Validadores para usuários
const createUserValidators = [
  body('nome_completo')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome completo deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome completo deve conter apenas letras e espaços')
    .notEmpty()
    .withMessage('Nome completo é obrigatório'),
  
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email deve ter no máximo 255 caracteres')
    .notEmpty()
    .withMessage('Email é obrigatório'),
  
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  body('perfil')
    .optional()
    .isIn(['admin', 'operador'])
    .withMessage('Perfil deve ser "admin" ou "operador"')
];

const updateUserValidators = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  
  body('nome_completo')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome completo deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome completo deve conter apenas letras e espaços'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email deve ter no máximo 255 caracteres'),
  
  body('perfil')
    .optional()
    .isIn(['admin', 'operador'])
    .withMessage('Perfil deve ser "admin" ou "operador"'),
  
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano')
];

const userIdValidators = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido')
];

// Validadores para QR Code (para implementação futura)
const qrCodeValidators = [
  body('deviceId')
    .optional()
    .isLength({ min: 10, max: 100 })
    .withMessage('Device ID deve ter entre 10 e 100 caracteres'),
  
  body('sessionId')
    .optional()
    .isUUID()
    .withMessage('Session ID deve ser um UUID válido')
];

// Middleware para sanitização geral
const sanitizeInput = [
  body('*').trim().escape()
];

module.exports = {
  loginValidators,
  changePasswordValidators,
  createUserValidators,
  updateUserValidators,
  userIdValidators,
  qrCodeValidators,
  sanitizeInput
};

