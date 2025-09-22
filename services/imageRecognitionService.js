// services/imageRecognitionService.js
import crypto from 'crypto';
import sharp from 'sharp';
import { createHash } from 'crypto';

class ImageRecognitionService {
  constructor() {
    this.similarityThreshold = 0.7; // Threshold mínimo para considerar similar
    this.maxCandidates = 5; // Máximo de candidatos a retornar
  }

  /**
   * Reconhece produto pela foto comparando com imagens do banco
   * @param {string} imageBase64 - Imagem em base64
   * @param {Array} referenceImages - Imagens de referência do banco
   * @returns {Promise<Object>} Resultados do reconhecimento
   */
  async recognizeProduct(imageBase64, referenceImages = []) {
    const startTime = Date.now();
    const recognitionId = crypto.randomUUID();
    
    try {
      console.log(`[${recognitionId}] Iniciando reconhecimento de produto`);
      
      // Processar imagem de entrada
      const inputFeatures = await this.extractImageFeatures(imageBase64);
      const inputHash = this.generateImageHash(imageBase64);
      
      // Comparar com imagens de referência
      const candidates = [];
      
      for (const refImage of referenceImages) {
        try {
          const similarity = await this.compareImages(inputFeatures, refImage);
          
          if (similarity.score >= this.similarityThreshold) {
            candidates.push({
              productId: refImage.id_produto,
              productName: refImage.produto_nome,
              imageId: refImage.id,
              imageUrl: refImage.url_imagem,
              similarity: similarity.score,
              confidence: this.calculateConfidence(similarity.score, refImage),
              matchDetails: similarity.details
            });
          }
        } catch (error) {
          console.error(`Erro ao comparar com imagem ${refImage.id}:`, error);
        }
      }
      
      // Ordenar por similaridade
      candidates.sort((a, b) => b.similarity - a.similarity);
      
      // Limitar resultados
      const topCandidates = candidates.slice(0, this.maxCandidates);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`[${recognitionId}] Reconhecimento concluído: ${topCandidates.length} candidatos em ${responseTime}ms`);
      
      return {
        success: true,
        recognitionId,
        inputHash,
        candidates: topCandidates,
        totalCandidates: topCandidates.length,
        responseTime,
        threshold: this.similarityThreshold
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[${recognitionId}] Erro no reconhecimento:`, error);
      
      return {
        success: false,
        recognitionId,
        error: error.message,
        candidates: [],
        totalCandidates: 0,
        responseTime
      };
    }
  }

  /**
   * Extrai características da imagem para comparação
   */
  async extractImageFeatures(imageBase64) {
    try {
      // Converter base64 para buffer
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      // Redimensionar e normalizar imagem
      const processedImage = await sharp(imageBuffer)
        .resize(256, 256, { fit: 'cover' })
        .greyscale()
        .raw()
        .toBuffer();
      
      // Extrair características básicas
      const features = {
        histogram: await this.calculateHistogram(processedImage),
        edges: await this.detectEdges(processedImage),
        texture: await this.analyzeTexture(processedImage),
        dimensions: { width: 256, height: 256 }
      };
      
      return features;
    } catch (error) {
      console.error('Erro ao extrair características:', error);
      throw new Error('Falha na extração de características da imagem');
    }
  }

  /**
   * Calcula histograma da imagem
   */
  async calculateHistogram(imageBuffer) {
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < imageBuffer.length; i++) {
      const pixel = imageBuffer[i];
      histogram[pixel]++;
    }
    
    // Normalizar histograma
    const total = imageBuffer.length;
    return histogram.map(count => count / total);
  }

  /**
   * Detecta bordas na imagem (algoritmo simples)
   */
  async detectEdges(imageBuffer) {
    const width = 256;
    const height = 256;
    const edges = [];
    
    // Aplicar filtro Sobel simplificado
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        const gx = 
          -imageBuffer[idx - width - 1] + imageBuffer[idx - width + 1] +
          -2 * imageBuffer[idx - 1] + 2 * imageBuffer[idx + 1] +
          -imageBuffer[idx + width - 1] + imageBuffer[idx + width + 1];
        
        const gy = 
          -imageBuffer[idx - width - 1] - 2 * imageBuffer[idx - width] - imageBuffer[idx - width + 1] +
          imageBuffer[idx + width - 1] + 2 * imageBuffer[idx + width] + imageBuffer[idx + width + 1];
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges.push(magnitude);
      }
    }
    
    return edges;
  }

  /**
   * Analisa textura da imagem
   */
  async analyzeTexture(imageBuffer) {
    const width = 256;
    const height = 256;
    
    // Calcular variância local como medida de textura
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    const textureMap = [];
    
    for (let y = halfWindow; y < height - halfWindow; y++) {
      for (let x = halfWindow; x < width - halfWindow; x++) {
        let sum = 0;
        let sumSquares = 0;
        let count = 0;
        
        // Calcular média e variância na janela
        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const idx = (y + dy) * width + (x + dx);
            const pixel = imageBuffer[idx];
            sum += pixel;
            sumSquares += pixel * pixel;
            count++;
          }
        }
        
        const mean = sum / count;
        const variance = (sumSquares / count) - (mean * mean);
        textureMap.push(variance);
      }
    }
    
    return textureMap;
  }

  /**
   * Compara duas imagens e retorna score de similaridade
   */
  async compareImages(inputFeatures, referenceImage) {
    try {
      // Se a imagem de referência não tem features, extrair
      let refFeatures;
      if (referenceImage.features_vector) {
        refFeatures = JSON.parse(referenceImage.features_vector);
      } else {
        // Extrair features da URL da imagem (implementação futura)
        refFeatures = await this.extractFeaturesFromUrl(referenceImage.url_imagem);
      }
      
      // Comparar histogramas
      const histogramSimilarity = this.compareHistograms(
        inputFeatures.histogram, 
        refFeatures.histogram
      );
      
      // Comparar bordas
      const edgeSimilarity = this.compareArrays(
        inputFeatures.edges, 
        refFeatures.edges
      );
      
      // Comparar textura
      const textureSimilarity = this.compareArrays(
        inputFeatures.texture, 
        refFeatures.texture
      );
      
      // Calcular score final (média ponderada)
      const finalScore = (
        histogramSimilarity * 0.4 +
        edgeSimilarity * 0.3 +
        textureSimilarity * 0.3
      );
      
      return {
        score: finalScore,
        details: {
          histogram: histogramSimilarity,
          edges: edgeSimilarity,
          texture: textureSimilarity
        }
      };
      
    } catch (error) {
      console.error('Erro na comparação de imagens:', error);
      return { score: 0, details: { error: error.message } };
    }
  }

  /**
   * Compara dois histogramas usando correlação
   */
  compareHistograms(hist1, hist2) {
    if (!hist1 || !hist2 || hist1.length !== hist2.length) {
      return 0;
    }
    
    // Calcular correlação de Pearson
    const n = hist1.length;
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    
    for (let i = 0; i < n; i++) {
      sum1 += hist1[i];
      sum2 += hist2[i];
      sum1Sq += hist1[i] * hist1[i];
      sum2Sq += hist2[i] * hist2[i];
      pSum += hist1[i] * hist2[i];
    }
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    if (den === 0) return 0;
    
    const correlation = num / den;
    return Math.max(0, correlation); // Retornar apenas valores positivos
  }

  /**
   * Compara dois arrays usando distância euclidiana normalizada
   */
  compareArrays(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) {
      return 0;
    }
    
    let sumSquaredDiff = 0;
    let maxPossibleDiff = 0;
    
    for (let i = 0; i < arr1.length; i++) {
      const diff = arr1[i] - arr2[i];
      sumSquaredDiff += diff * diff;
      maxPossibleDiff += Math.max(arr1[i], arr2[i]) * Math.max(arr1[i], arr2[i]);
    }
    
    if (maxPossibleDiff === 0) return 1;
    
    const normalizedDistance = Math.sqrt(sumSquaredDiff / maxPossibleDiff);
    return Math.max(0, 1 - normalizedDistance);
  }

  /**
   * Calcula confiança baseado no score e metadados da imagem
   */
  calculateConfidence(similarityScore, referenceImage) {
    let confidence = similarityScore;
    
    // Ajustar baseado no tipo de imagem
    if (referenceImage.tipo_imagem === 'principal') {
      confidence *= 1.1; // Imagens principais têm mais peso
    }
    
    // Ajustar baseado na origem
    switch (referenceImage.origem) {
      case 'user_capture':
        confidence *= 1.05; // Fotos do usuário são mais confiáveis
        break;
      case 'upload':
        confidence *= 1.02;
        break;
      case 'internet_search':
        confidence *= 0.95; // Imagens da internet podem ser menos precisas
        break;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Gera hash da imagem para identificação
   */
  generateImageHash(imageBase64) {
    return createHash('sha256')
      .update(imageBase64.replace(/^data:image\/\w+;base64,/, ''))
      .digest('hex');
  }

  /**
   * Extrai features de uma URL de imagem (implementação futura)
   */
  async extractFeaturesFromUrl(imageUrl) {
    // Por enquanto, retornar features vazias
    // Futuramente, baixar a imagem e extrair features
    return {
      histogram: new Array(256).fill(0),
      edges: [],
      texture: []
    };
  }

  /**
   * Salva dados de aprendizado
   */
  async saveRecognitionLearning(data) {
    try {
      console.log('Salvando dados de aprendizado:', {
        productId: data.productId,
        inputHash: data.inputHash,
        selectedCandidate: data.selectedCandidate,
        userFeedback: data.userFeedback
      });
      
      // Implementar salvamento no banco de dados
    } catch (error) {
      console.error('Erro ao salvar aprendizado:', error);
    }
  }
}

export default new ImageRecognitionService();

