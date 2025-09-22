// services/imageStorageService.js
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { createHash } from 'crypto';

class ImageStorageService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads/images';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.thumbnailSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 800, height: 600 }
    };
    
    this.ensureUploadDir();
  }

  /**
   * Garante que o diretório de upload existe
   */
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log(`Diretório de upload criado: ${this.uploadDir}`);
    }
  }

  /**
   * Salva imagem a partir de base64
   * @param {string} imageBase64 - Imagem em base64
   * @param {Object} metadata - Metadados da imagem
   * @returns {Promise<Object>} Informações da imagem salva
   */
  async saveImageFromBase64(imageBase64, metadata = {}) {
    try {
      // Validar e processar base64
      const { buffer, mimeType } = this.processBase64(imageBase64);
      
      // Validar tipo de arquivo
      if (!this.allowedTypes.includes(mimeType)) {
        throw new Error(`Tipo de arquivo não permitido: ${mimeType}`);
      }
      
      // Validar tamanho
      if (buffer.length > this.maxFileSize) {
        throw new Error(`Arquivo muito grande: ${buffer.length} bytes (máximo: ${this.maxFileSize})`);
      }
      
      // Gerar hash único
      const hash = this.generateHash(buffer);
      const filename = `${hash}.webp`; // Converter tudo para WebP
      const filepath = path.join(this.uploadDir, filename);
      
      // Verificar se já existe
      try {
        await fs.access(filepath);
        console.log(`Imagem já existe: ${filename}`);
        return await this.getImageInfo(filepath, hash, metadata);
      } catch {
        // Arquivo não existe, continuar com o salvamento
      }
      
      // Processar e salvar imagem
      const imageInfo = await this.processAndSaveImage(buffer, filepath, metadata);
      
      // Gerar thumbnails
      await this.generateThumbnails(filepath, hash);
      
      return {
        ...imageInfo,
        hash,
        filename,
        url: this.getImageUrl(filename),
        thumbnails: this.getThumbnailUrls(hash)
      };
      
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      throw error;
    }
  }

  /**
   * Salva imagem a partir de URL
   */
  async saveImageFromUrl(imageUrl, metadata = {}) {
    try {
      console.log(`Baixando imagem de: ${imageUrl}`);
      
      // Baixar imagem
      const response = await fetch(imageUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SCC-Sistema-Contagem-Cadoz/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar imagem: ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type');
      
      // Validar tipo
      if (!this.allowedTypes.includes(contentType)) {
        throw new Error(`Tipo de arquivo não permitido: ${contentType}`);
      }
      
      // Converter para base64 e processar
      const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
      
      return await this.saveImageFromBase64(base64, {
        ...metadata,
        originalUrl: imageUrl,
        origem: 'internet_download'
      });
      
    } catch (error) {
      console.error('Erro ao salvar imagem da URL:', error);
      throw error;
    }
  }

  /**
   * Processa string base64
   */
  processBase64(imageBase64) {
    try {
      // Extrair tipo MIME e dados
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Formato base64 inválido');
      }
      
      const mimeType = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      
      return { buffer, mimeType };
    } catch (error) {
      throw new Error('Erro ao processar base64: ' + error.message);
    }
  }

  /**
   * Processa e salva imagem otimizada
   */
  async processAndSaveImage(buffer, filepath, metadata) {
    try {
      // Usar Sharp para processar e otimizar
      const image = sharp(buffer);
      const imageMetadata = await image.metadata();
      
      // Otimizar e converter para WebP
      await image
        .webp({ quality: 85, effort: 4 })
        .toFile(filepath);
      
      // Obter informações do arquivo salvo
      const stats = await fs.stat(filepath);
      
      return {
        width: imageMetadata.width,
        height: imageMetadata.height,
        format: 'webp',
        size: stats.size,
        originalFormat: imageMetadata.format,
        ...metadata
      };
      
    } catch (error) {
      throw new Error('Erro ao processar imagem: ' + error.message);
    }
  }

  /**
   * Gera thumbnails em diferentes tamanhos
   */
  async generateThumbnails(originalPath, hash) {
    try {
      const image = sharp(originalPath);
      
      for (const [size, dimensions] of Object.entries(this.thumbnailSizes)) {
        const thumbnailPath = path.join(
          this.uploadDir, 
          `${hash}_${size}.webp`
        );
        
        await image
          .clone()
          .resize(dimensions.width, dimensions.height, { 
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);
      }
      
    } catch (error) {
      console.error('Erro ao gerar thumbnails:', error);
      // Não falhar se thumbnails não puderem ser gerados
    }
  }

  /**
   * Gera hash único para a imagem
   */
  generateHash(buffer) {
    return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  }

  /**
   * Obtém informações de uma imagem existente
   */
  async getImageInfo(filepath, hash, metadata) {
    try {
      const stats = await fs.stat(filepath);
      const image = sharp(filepath);
      const imageMetadata = await image.metadata();
      
      return {
        width: imageMetadata.width,
        height: imageMetadata.height,
        format: imageMetadata.format,
        size: stats.size,
        ...metadata
      };
    } catch (error) {
      throw new Error('Erro ao obter informações da imagem: ' + error.message);
    }
  }

  /**
   * Gera URL pública da imagem
   */
  getImageUrl(filename) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/images/${filename}`;
  }

  /**
   * Gera URLs dos thumbnails
   */
  getThumbnailUrls(hash) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const thumbnails = {};
    
    for (const size of Object.keys(this.thumbnailSizes)) {
      thumbnails[size] = `${baseUrl}/uploads/images/${hash}_${size}.webp`;
    }
    
    return thumbnails;
  }

  /**
   * Remove imagem e seus thumbnails
   */
  async deleteImage(filename) {
    try {
      const hash = filename.replace('.webp', '');
      const filepath = path.join(this.uploadDir, filename);
      
      // Remover arquivo principal
      try {
        await fs.unlink(filepath);
      } catch (error) {
        console.warn(`Arquivo principal não encontrado: ${filename}`);
      }
      
      // Remover thumbnails
      for (const size of Object.keys(this.thumbnailSizes)) {
        const thumbnailPath = path.join(this.uploadDir, `${hash}_${size}.webp`);
        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          console.warn(`Thumbnail não encontrado: ${hash}_${size}.webp`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }

  /**
   * Lista todas as imagens no diretório
   */
  async listImages() {
    try {
      const files = await fs.readdir(this.uploadDir);
      const images = files
        .filter(file => file.endsWith('.webp') && !file.includes('_'))
        .map(file => ({
          filename: file,
          url: this.getImageUrl(file),
          hash: file.replace('.webp', '')
        }));
      
      return images;
    } catch (error) {
      console.error('Erro ao listar imagens:', error);
      return [];
    }
  }

  /**
   * Limpa imagens órfãs (sem referência no banco)
   */
  async cleanupOrphanedImages(validHashes = []) {
    try {
      const files = await fs.readdir(this.uploadDir);
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.webp')) {
          const hash = file.split('_')[0].replace('.webp', '');
          
          if (!validHashes.includes(hash)) {
            await fs.unlink(path.join(this.uploadDir, file));
            deletedCount++;
          }
        }
      }
      
      console.log(`Limpeza concluída: ${deletedCount} arquivos removidos`);
      return deletedCount;
    } catch (error) {
      console.error('Erro na limpeza de imagens:', error);
      return 0;
    }
  }
}

export default new ImageStorageService();

