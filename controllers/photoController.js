// controllers/photoController.js
import { validationResult } from 'express-validator';
import ProdutoImagem from '../models/ProdutoImagem.js';
import imageSearchService from '../services/imageSearchService.js';
import imageRecognitionService from '../services/imageRecognitionService.js';
import imageStorageService from '../services/imageStorageService.js';

class PhotoController {
  /**
   * Buscar produtos por foto na internet
   */
  static async searchByPhoto(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { image, search_terms } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Imagem é obrigatória'
        });
      }

      // Extrair termos de busca da imagem se não fornecidos
      let searchTerms = search_terms;
      if (!searchTerms || searchTerms.length === 0) {
        searchTerms = await imageSearchService.extractSearchTermsFromImage(image);
      }

      // Buscar imagens na internet
      const searchResult = await imageSearchService.searchImages(searchTerms);

      // Salvar histórico da busca
      await imageSearchService.saveSearchHistory(searchResult);

      res.json({
        success: searchResult.success,
        message: searchResult.success ? 'Busca realizada com sucesso' : 'Erro na busca',
        data: {
          searchId: searchResult.searchId,
          results: searchResult.results,
          totalFound: searchResult.totalFound,
          searchTerms: searchResult.searchTerms,
          apiUsed: searchResult.apiUsed,
          responseTime: searchResult.responseTime
        }
      });

    } catch (error) {
      console.error('Erro na busca por foto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Reconhecer produto existente por foto
   */
  static async recognizeProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Imagem é obrigatória'
        });
      }

      // Buscar imagens de referência
      const referenceImages = await ProdutoImagem.findAllForRecognition();

      if (referenceImages.length === 0) {
        return res.json({
          success: true,
          message: 'Nenhuma imagem de referência encontrada',
          data: {
            candidates: [],
            totalCandidates: 0,
            suggestion: 'Cadastre produtos com imagens para habilitar o reconhecimento'
          }
        });
      }

      // Reconhecer produto
      const recognitionResult = await imageRecognitionService.recognizeProduct(
        image, 
        referenceImages
      );

      res.json({
        success: recognitionResult.success,
        message: recognitionResult.success ? 'Reconhecimento realizado com sucesso' : 'Erro no reconhecimento',
        data: {
          recognitionId: recognitionResult.recognitionId,
          candidates: recognitionResult.candidates,
          totalCandidates: recognitionResult.totalCandidates,
          threshold: recognitionResult.threshold,
          responseTime: recognitionResult.responseTime
        }
      });

    } catch (error) {
      console.error('Erro no reconhecimento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Upload de imagem para produto
   */
  static async uploadImage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { id: idProduto } = req.params;
      const { image, tipo_imagem, descricao, origem } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Imagem é obrigatória'
        });
      }

      // Salvar imagem no sistema de arquivos
      const savedImage = await imageStorageService.saveImageFromBase64(image, {
        tipo_imagem: tipo_imagem || 'referencia',
        origem: origem || 'upload',
        descricao
      });

      // Salvar referência no banco de dados
      const imagemData = {
        id_produto: idProduto,
        url_imagem: savedImage.url,
        tipo_imagem: savedImage.tipo_imagem,
        origem: savedImage.origem,
        descricao: savedImage.descricao,
        largura: savedImage.width,
        altura: savedImage.height,
        tamanho_bytes: savedImage.size,
        hash_imagem: savedImage.hash
      };

      const produtoImagem = await ProdutoImagem.create(imagemData);

      res.status(201).json({
        success: true,
        message: 'Imagem salva com sucesso',
        data: {
          ...produtoImagem,
          thumbnails: savedImage.thumbnails
        }
      });

    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      
      if (error.message.includes('não permitido')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Salvar imagem da internet
   */
  static async saveFromInternet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { id: idProduto } = req.params;
      const { image_url, tipo_imagem, descricao } = req.body;

      if (!image_url) {
        return res.status(400).json({
          success: false,
          message: 'URL da imagem é obrigatória'
        });
      }

      // Baixar e salvar imagem
      const savedImage = await imageStorageService.saveImageFromUrl(image_url, {
        tipo_imagem: tipo_imagem || 'referencia',
        origem: 'internet_search',
        descricao
      });

      // Salvar referência no banco
      const imagemData = {
        id_produto: idProduto,
        url_imagem: savedImage.url,
        tipo_imagem: savedImage.tipo_imagem,
        origem: savedImage.origem,
        descricao: savedImage.descricao,
        largura: savedImage.width,
        altura: savedImage.height,
        tamanho_bytes: savedImage.size,
        hash_imagem: savedImage.hash
      };

      const produtoImagem = await ProdutoImagem.create(imagemData);

      res.status(201).json({
        success: true,
        message: 'Imagem da internet salva com sucesso',
        data: {
          ...produtoImagem,
          thumbnails: savedImage.thumbnails
        }
      });

    } catch (error) {
      console.error('Erro ao salvar imagem da internet:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Listar imagens de um produto
   */
  static async getProductImages(req, res) {
    try {
      const { id: idProduto } = req.params;
      const { include_inactive } = req.query;

      const images = await ProdutoImagem.findByProduct(
        idProduto, 
        include_inactive === 'true'
      );

      res.json({
        success: true,
        message: 'Imagens recuperadas com sucesso',
        data: images
      });

    } catch (error) {
      console.error('Erro ao buscar imagens do produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Definir imagem principal
   */
  static async setPrincipalImage(req, res) {
    try {
      const { id: idProduto, imageId } = req.params;

      const updatedImage = await ProdutoImagem.setPrincipal(imageId, idProduto);

      if (!updatedImage) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Imagem principal definida com sucesso',
        data: updatedImage
      });

    } catch (error) {
      console.error('Erro ao definir imagem principal:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar imagem
   */
  static async updateImage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { imageId } = req.params;
      const updateData = req.body;

      const updatedImage = await ProdutoImagem.update(imageId, updateData);

      if (!updatedImage) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Imagem atualizada com sucesso',
        data: updatedImage
      });

    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Deletar imagem
   */
  static async deleteImage(req, res) {
    try {
      const { imageId } = req.params;

      // Buscar imagem para obter informações do arquivo
      const image = await ProdutoImagem.findById(imageId);
      
      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }

      // Deletar do banco de dados
      await ProdutoImagem.delete(imageId);

      // Deletar arquivos do sistema
      if (image.hash_imagem) {
        try {
          await imageStorageService.deleteImage(`${image.hash_imagem}.webp`);
        } catch (error) {
          console.warn('Erro ao deletar arquivo físico:', error);
        }
      }

      res.json({
        success: true,
        message: 'Imagem deletada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter estatísticas de imagens
   */
  static async getStats(req, res) {
    try {
      const stats = await ProdutoImagem.getStats();
      const productsWithoutImage = await ProdutoImagem.findProductsWithoutMainImage();

      res.json({
        success: true,
        message: 'Estatísticas recuperadas com sucesso',
        data: {
          ...stats,
          produtos_sem_imagem: productsWithoutImage.length,
          produtos_sem_imagem_lista: productsWithoutImage
        }
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Feedback de reconhecimento (para aprendizado)
   */
  static async recognitionFeedback(req, res) {
    try {
      const { recognitionId, selectedProductId, feedback, confidence } = req.body;

      // Salvar dados de aprendizado
      await imageRecognitionService.saveRecognitionLearning({
        recognitionId,
        selectedProductId,
        userFeedback: feedback,
        confidence
      });

      res.json({
        success: true,
        message: 'Feedback registrado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default PhotoController;

