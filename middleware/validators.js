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

// Validação para busca por foto
export const validatePhotoSearch = [
  body('image')
    .notEmpty()
    .withMessage('Imagem é obrigatória')
    .custom((value) => {
      // Verificar se é base64 válido
      const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
      if (!base64Regex.test(value)) {
        throw new Error('Imagem deve estar em formato base64 válido (JPEG, PNG ou WebP)');
      }
      
      // Verificar tamanho aproximado (5MB em base64 ≈ 6.7MB)
      const sizeInBytes = (value.length * 3) / 4;
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error('Imagem muito grande (máximo 5MB)');
      }
      
      return true;
    }),
  body('search_terms')
    .optional()
    .isArray()
    .withMessage('Termos de busca devem ser um array')
    .custom((terms) => {
      if (terms && terms.length > 10) {
        throw new Error('Máximo de 10 termos de busca permitidos');
      }
      return true;
    })
];

// Validação para upload de imagem
export const validateImageUpload = [
  param('id')
    .isUUID()
    .withMessage('ID do produto deve ser um UUID válido'),
  body('image')
    .notEmpty()
    .withMessage('Imagem é obrigatória')
    .custom((value) => {
      const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
      if (!base64Regex.test(value)) {
        throw new Error('Imagem deve estar em formato base64 válido (JPEG, PNG ou WebP)');
      }
      
      const sizeInBytes = (value.length * 3) / 4;
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error('Imagem muito grande (máximo 5MB)');
      }
      
      return true;
    }),
  body('tipo_imagem')
    .optional()
    .isIn(['principal', 'referencia', 'internet', 'contagem'])
    .withMessage('Tipo de imagem deve ser: principal, referencia, internet ou contagem'),
  body('origem')
    .optional()
    .isIn(['upload', 'internet_search', 'open_food_facts', 'user_capture'])
    .withMessage('Origem deve ser: upload, internet_search, open_food_facts ou user_capture'),
  body('descricao')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres')
    .trim()
];

// Validação para salvar imagem da internet
export const validateSaveFromInternet = [
  param('id')
    .isUUID()
    .withMessage('ID do produto deve ser um UUID válido'),
  body('image_url')
    .notEmpty()
    .withMessage('URL da imagem é obrigatória')
    .isURL()
    .withMessage('URL da imagem deve ser válida')
    .custom((url) => {
      // Verificar se é uma URL de imagem
      const imageExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
      const hasImageExtension = imageExtensions.test(url);
      const hasImageDomain = url.includes('image') || url.includes('photo') || url.includes('img');
      
      if (!hasImageExtension && !hasImageDomain) {
        throw new Error('URL deve apontar para uma imagem válida');
      }
      
      return true;
    }),
  body('tipo_imagem')
    .optional()
    .isIn(['principal', 'referencia', 'internet'])
    .withMessage('Tipo de imagem deve ser: principal, referencia ou internet'),
  body('descricao')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres')
    .trim()
];

// Validação para atualização de imagem
export const validateImageUpdate = [
  param('imageId')
    .isUUID()
    .withMessage('ID da imagem deve ser um UUID válido'),
  body('tipo_imagem')
    .optional()
    .isIn(['principal', 'referencia', 'internet', 'contagem'])
    .withMessage('Tipo de imagem deve ser: principal, referencia, internet ou contagem'),
  body('descricao')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  body('confianca_score')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Score de confiança deve ser entre 0 e 1')
];

// Validação para feedback de reconhecimento
export const validateRecognitionFeedback = [
  body('recognitionId')
    .notEmpty()
    .withMessage('ID do reconhecimento é obrigatório')
    .isUUID()
    .withMessage('ID do reconhecimento deve ser um UUID válido'),
  body('selectedProductId')
    .optional()
    .isUUID()
    .withMessage('ID do produto selecionado deve ser um UUID válido'),
  body('feedback')
    .notEmpty()
    .withMessage('Feedback é obrigatório')
    .isIn(['correto', 'incorreto', 'parcial', 'nao_encontrado'])
    .withMessage('Feedback deve ser: correto, incorreto, parcial ou nao_encontrado'),
  body('confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confiança deve ser entre 0 e 1')
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
    .isIn(['admin', 'operador'])
    .withMessage('Perfil deve ser admin ou operador'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de usuário
export const validateUpdateUser = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
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
  body('perfil')
    .optional()
    .isIn(['admin', 'operador'])
    .withMessage('Perfil deve ser admin ou operador'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para mudança de senha
export const validateChangePassword = [
  body('senha_atual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('nova_senha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
  body('confirmar_senha')
    .custom((value, { req }) => {
      if (value !== req.body.nova_senha) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
  handleValidationErrors
];

// Validação para criação de setor
export const validateCreateSetor = [
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de setor
export const validateUpdateSetor = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para criação de categoria
export const validateCreateCategoria = [
  body('nome')
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
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de categoria
export const validateUpdateCategoria = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('nome')
    .optional()
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
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para criação de unidade de medida
export const validateCreateUnidadeMedida = [
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('sigla')
    .isLength({ min: 1, max: 10 })
    .withMessage('Sigla deve ter entre 1 e 10 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de unidade de medida
export const validateUpdateUnidadeMedida = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('sigla')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Sigla deve ter entre 1 e 10 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para criação de produto
export const validateCreateProduto = [
  body('nome')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .trim(),
  body('id_categoria')
    .isUUID()
    .withMessage('ID da categoria deve ser um UUID válido'),
  body('id_setor')
    .isUUID()
    .withMessage('ID do setor deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de produto
export const validateUpdateProduto = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .trim(),
  body('id_categoria')
    .optional()
    .isUUID()
    .withMessage('ID da categoria deve ser um UUID válido'),
  body('id_setor')
    .optional()
    .isUUID()
    .withMessage('ID do setor deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para criação de variação de produto
export const validateCreateVariacao = [
  body('id_produto')
    .isUUID()
    .withMessage('ID do produto deve ser um UUID válido'),
  body('nome')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .trim(),
  body('estoque_atual')
    .isFloat({ min: 0 })
    .withMessage('Estoque atual deve ser um número positivo'),
  body('estoque_minimo')
    .isFloat({ min: 0 })
    .withMessage('Estoque mínimo deve ser um número positivo'),
  body('preco_custo')
    .isFloat({ min: 0 })
    .withMessage('Preço de custo deve ser um número positivo'),
  body('fator_prioridade')
    .isInt({ min: 1, max: 5 })
    .withMessage('Fator de prioridade deve ser entre 1 e 5'),
  body('id_unidade_controle')
    .isUUID()
    .withMessage('ID da unidade de controle deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de variação de produto
export const validateUpdateVariacao = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres')
    .trim(),
  body('estoque_atual')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estoque atual deve ser um número positivo'),
  body('estoque_minimo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estoque mínimo deve ser um número positivo'),
  body('preco_custo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço de custo deve ser um número positivo'),
  body('fator_prioridade')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Fator de prioridade deve ser entre 1 e 5'),
  body('id_unidade_controle')
    .optional()
    .isUUID()
    .withMessage('ID da unidade de controle deve ser um UUID válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Campo ativo deve ser boolean'),
  handleValidationErrors
];

// Validação para atualização de estoque
export const validateUpdateEstoque = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('quantidade')
    .isFloat()
    .withMessage('Quantidade deve ser um número'),
  body('operacao')
    .isIn(['adicionar', 'remover', 'definir'])
    .withMessage('Operação deve ser: adicionar, remover ou definir'),
  body('motivo')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Motivo deve ter no máximo 255 caracteres')
    .trim(),
  handleValidationErrors
];

// Validação para criação de fator de conversão
export const validateCreateFatorConversao = [
  body('id_variacao_produto')
    .isUUID()
    .withMessage('ID da variação do produto deve ser um UUID válido'),
  body('id_unidade_medida')
    .isUUID()
    .withMessage('ID da unidade de medida deve ser um UUID válido'),
  body('fator')
    .isFloat({ min: 0.001 })
    .withMessage('Fator deve ser um número positivo maior que 0'),
  handleValidationErrors
];

// Validação para atualização de fator de conversão
export const validateUpdateFatorConversao = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  body('fator')
    .optional()
    .isFloat({ min: 0.001 })
    .withMessage('Fator deve ser um número positivo maior que 0'),
  handleValidationErrors
];

// Validação para conversão de quantidade
export const validateConvertQuantity = [
  body('id_variacao_produto')
    .isUUID()
    .withMessage('ID da variação do produto deve ser um UUID válido'),
  body('quantidade')
    .isFloat({ min: 0 })
    .withMessage('Quantidade deve ser um número positivo'),
  body('id_unidade_origem')
    .isUUID()
    .withMessage('ID da unidade de origem deve ser um UUID válido'),
  body('id_unidade_destino')
    .isUUID()
    .withMessage('ID da unidade de destino deve ser um UUID válido'),
  handleValidationErrors
];

// Validação para parâmetros UUID
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
  handleValidationErrors
];

