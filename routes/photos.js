// routes/photos.js
import express from 'express';
import PhotoController from '../controllers/photoController.js';
import { validatePhotoSearch, validateImageUpload, validateImageUpdate } from '../middleware/validators.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @route POST /api/photos/search-by-photo
 * @desc Buscar produtos por foto na internet
 * @access Admin
 */
router.post('/search-by-photo', 
  requireAdmin,
  validatePhotoSearch,
  PhotoController.searchByPhoto
);

/**
 * @route POST /api/photos/recognize-product
 * @desc Reconhecer produto existente por foto
 * @access Private (todos os usuários autenticados)
 */
router.post('/recognize-product',
  validatePhotoSearch,
  PhotoController.recognizeProduct
);

/**
 * @route POST /api/photos/recognition-feedback
 * @desc Enviar feedback sobre reconhecimento
 * @access Private
 */
router.post('/recognition-feedback',
  PhotoController.recognitionFeedback
);

/**
 * @route POST /api/photos/products/:id/upload
 * @desc Upload de imagem para produto
 * @access Admin
 */
router.post('/products/:id/upload',
  requireAdmin,
  validateImageUpload,
  PhotoController.uploadImage
);

/**
 * @route POST /api/photos/products/:id/save-from-internet
 * @desc Salvar imagem da internet para produto
 * @access Admin
 */
router.post('/products/:id/save-from-internet',
  requireAdmin,
  PhotoController.saveFromInternet
);

/**
 * @route GET /api/photos/products/:id/images
 * @desc Listar imagens de um produto
 * @access Private
 */
router.get('/products/:id/images',
  PhotoController.getProductImages
);

/**
 * @route PUT /api/photos/products/:id/images/:imageId/set-principal
 * @desc Definir imagem principal do produto
 * @access Admin
 */
router.put('/products/:id/images/:imageId/set-principal',
  requireAdmin,
  PhotoController.setPrincipalImage
);

/**
 * @route PUT /api/photos/images/:imageId
 * @desc Atualizar dados da imagem
 * @access Admin
 */
router.put('/images/:imageId',
  requireAdmin,
  validateImageUpdate,
  PhotoController.updateImage
);

/**
 * @route DELETE /api/photos/images/:imageId
 * @desc Deletar imagem
 * @access Admin
 */
router.delete('/images/:imageId',
  requireAdmin,
  PhotoController.deleteImage
);

/**
 * @route GET /api/photos/stats
 * @desc Obter estatísticas de imagens
 * @access Admin
 */
router.get('/stats',
  requireAdmin,
  PhotoController.getStats
);

export default router;

