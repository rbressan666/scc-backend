// middleware/validators.js
import { body, validationResult } from 'express-validator';

// Middleware para processar erros de validação
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validação para login
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

// Validação para criação de usuário
export const validateCreateUser = [
  body('nome_completo')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome completo deve ter entre 2 e 100 caracteres')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('perfil')
    .isIn(['admin', 'operador', 'usuario'])
    .withMessage('Perfil deve ser admin, operador ou usuario'),
  handleValidationErrors
];

// Validação para atualização de usuário
export const validateUpdateUser = [
  body(\'nome_completo\')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage(\'Nome completo deve ter entre 2 e 100 caracteres\')
    .trim(),
  body(\'email\')
    .optional()
    .isEmail()
    .withMessage(\'Email deve ser válido\')
    .normalizeEmail({ gmail_remove_dots: false }),
  body(\'senha\')
    .optional()
    .isLength({ min: 6 })
    .withMessage(\'Senha deve ter pelo menos 6 caracteres\'),
  body(\'perfil\')
    .optional()
    .isIn([\'admin\', \'operador\', \'usuario\'])
    .withMessage(\'Perfil deve ser admin, operador ou usuario\'),
  handleValidationErrors
];

// Validação para alteração de senha
export const validateChangePassword = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('novaSenha')
    .isLength({ min: 8 })
    .withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  handleValidationErrors
];

