// middleware/validators.js
import { body, param, validationResult } from 'express-validator';

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

// Validação para código EAN/código de barras
export const validateEanCode = [
  body('ean_code')
    .notEmpty()
    .withMessage('Código EAN é obrigatório')
    .isLength({ min: 8, max: 14 })
    .withMessage('Código EAN deve ter entre 8 e 14 dígitos')
    .matches(/^\d+$/)
    .withMessage('Código EAN deve conter apenas números')
    .trim()
];

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
  body('nome_completo')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome completo deve ter entre 2 e 100 caracteres')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('senha')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('perfil')
    .optional()
    .isIn(['admin', 'operador', 'usuario'])
    .withMessage('Perfil deve ser admin, operador ou usuario'),
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


// Validadores para Setores
export const validateSetor = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano')
];

// Validadores para Categorias
export const validateCategoria = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('id_categoria_pai')
    .optional()
    .isUUID()
    .withMessage('ID da categoria pai deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano')
];

// Validadores para Unidades de Medida
export const validateUnidadeMedida = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('sigla')
    .notEmpty()
    .withMessage('Sigla é obrigatória')
    .isLength({ min: 1, max: 10 })
    .withMessage('Sigla deve ter entre 1 e 10 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano')
];

// Validadores para Produtos
export const validateProduto = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .trim(),
  body('id_categoria')
    .notEmpty()
    .withMessage('Categoria é obrigatória')
    .isUUID()
    .withMessage('ID da categoria deve ser um UUID válido'),
  body('id_setor')
    .notEmpty()
    .withMessage('Setor é obrigatório')
    .isUUID()
    .withMessage('ID do setor deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano')
];

// Validadores para Variações de Produto
export const validateVariacaoProduto = [
  body('id_produto')
    .notEmpty()
    .withMessage('Produto é obrigatório')
    .isUUID()
    .withMessage('ID do produto deve ser um UUID válido'),
  body('nome')
    .notEmpty()
    .withMessage('Nome da variação é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .trim(),
  body('estoque_atual')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estoque atual deve ser um número não negativo'),
  body('estoque_minimo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estoque mínimo deve ser um número não negativo'),
  body('preco_custo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço de custo deve ser um número não negativo'),
  body('fator_prioridade')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Fator de prioridade deve ser um número entre 1 e 5'),
  body('id_unidade_controle')
    .notEmpty()
    .withMessage('Unidade de controle é obrigatória')
    .isUUID()
    .withMessage('ID da unidade de controle deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano'),
  body('fatores_conversao')
    .optional()
    .isArray()
    .withMessage('Fatores de conversão devem ser um array'),
  body('fatores_conversao.*.id_unidade_medida')
    .if(body('fatores_conversao').exists())
    .notEmpty()
    .withMessage('ID da unidade de medida é obrigatório')
    .isUUID()
    .withMessage('ID da unidade de medida deve ser um UUID válido'),
  body('fatores_conversao.*.fator')
    .if(body('fatores_conversao').exists())
    .notEmpty()
    .withMessage('Fator é obrigatório')
    .isFloat({ min: 0.001 })
    .withMessage('Fator deve ser um número positivo')
];

// Validadores para Fatores de Conversão
export const validateFatorConversao = [
  body('id_variacao_produto')
    .notEmpty()
    .withMessage('Variação de produto é obrigatória')
    .isUUID()
    .withMessage('ID da variação deve ser um UUID válido'),
  body('id_unidade_medida')
    .notEmpty()
    .withMessage('Unidade de medida é obrigatória')
    .isUUID()
    .withMessage('ID da unidade de medida deve ser um UUID válido'),
  body('fator')
    .notEmpty()
    .withMessage('Fator é obrigatório')
    .isFloat({ min: 0.001 })
    .withMessage('Fator deve ser um número positivo')
];

// Validadores para múltiplos fatores de conversão
export const validateMultipleFatores = [
  body('fatores')
    .isArray({ min: 1 })
    .withMessage('Lista de fatores é obrigatória e deve conter pelo menos um item'),
  body('fatores.*.id_variacao_produto')
    .notEmpty()
    .withMessage('Variação de produto é obrigatória')
    .isUUID()
    .withMessage('ID da variação deve ser um UUID válido'),
  body('fatores.*.id_unidade_medida')
    .notEmpty()
    .withMessage('Unidade de medida é obrigatória')
    .isUUID()
    .withMessage('ID da unidade de medida deve ser um UUID válido'),
  body('fatores.*.fator')
    .notEmpty()
    .withMessage('Fator é obrigatório')
    .isFloat({ min: 0.001 })
    .withMessage('Fator deve ser um número positivo')
];

// Validador para conversão de quantidade
export const validateConversaoQuantidade = [
  body('quantidade')
    .notEmpty()
    .withMessage('Quantidade é obrigatória')
    .isFloat({ min: 0 })
    .withMessage('Quantidade deve ser um número não negativo'),
  body('id_unidade_origem')
    .notEmpty()
    .withMessage('Unidade de origem é obrigatória')
    .isUUID()
    .withMessage('ID da unidade de origem deve ser um UUID válido'),
  body('id_unidade_destino')
    .notEmpty()
    .withMessage('Unidade de destino é obrigatória')
    .isUUID()
    .withMessage('ID da unidade de destino deve ser um UUID válido')
];

// Validador para atualização de estoque
export const validateEstoque = [
  body('estoque_atual')
    .notEmpty()
    .withMessage('Estoque atual é obrigatório')
    .isFloat({ min: 0 })
    .withMessage('Estoque atual deve ser um número não negativo')
];

// Validador para UUID em parâmetros
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido')
];

export const validateUUIDVariacao = [
  param('id_variacao_produto')
    .isUUID()
    .withMessage('ID da variação deve ser um UUID válido')
];

export const validateUUIDProduto = [
  param('id_produto')
    .isUUID()
    .withMessage('ID do produto deve ser um UUID válido')
];

