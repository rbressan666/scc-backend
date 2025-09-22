// services/imageSearchService.js
import axios from 'axios';
import crypto from 'crypto';

class ImageSearchService {
  constructor() {
    // Configurações das APIs (usar variáveis de ambiente)
    this.bingApiKey = process.env.BING_SEARCH_API_KEY;
    this.unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.googleCxId = process.env.GOOGLE_SEARCH_CX_ID;
    
    // Configurações de timeout e limites
    this.timeout = 10000; // 10 segundos
    this.maxResults = 5;
  }

  /**
   * Busca imagens na internet usando múltiplas APIs
   * @param {string[]} searchTerms - Termos de busca derivados da análise da imagem
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Resultados da busca
   */
  async searchImages(searchTerms, options = {}) {
    const startTime = Date.now();
    const searchId = crypto.randomUUID();
    
    try {
      console.log(`[${searchId}] Iniciando busca por imagens:`, searchTerms);
      
      // Tentar diferentes APIs em ordem de preferência
      const apis = this.getAvailableApis();
      let results = [];
      let usedApi = null;
      let error = null;

      for (const api of apis) {
        try {
          console.log(`[${searchId}] Tentando API: ${api}`);
          results = await this.searchWithApi(api, searchTerms, options);
          usedApi = api;
          break;
        } catch (apiError) {
          console.error(`[${searchId}] Erro na API ${api}:`, apiError.message);
          error = apiError;
          continue;
        }
      }

      const responseTime = Date.now() - startTime;
      
      if (results.length === 0) {
        throw new Error(`Nenhuma imagem encontrada. Último erro: ${error?.message || 'APIs indisponíveis'}`);
      }

      // Processar e filtrar resultados
      const processedResults = this.processResults(results);
      
      console.log(`[${searchId}] Busca concluída: ${processedResults.length} imagens em ${responseTime}ms`);
      
      return {
        success: true,
        searchId,
        results: processedResults,
        totalFound: processedResults.length,
        apiUsed: usedApi,
        responseTime,
        searchTerms
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[${searchId}] Erro na busca:`, error);
      
      return {
        success: false,
        searchId,
        error: error.message,
        results: [],
        totalFound: 0,
        apiUsed: null,
        responseTime,
        searchTerms
      };
    }
  }

  /**
   * Busca usando API específica
   */
  async searchWithApi(apiName, searchTerms, options) {
    const query = searchTerms.join(' ');
    
    switch (apiName) {
      case 'bing':
        return await this.searchBing(query, options);
      case 'unsplash':
        return await this.searchUnsplash(query, options);
      case 'google':
        return await this.searchGoogle(query, options);
      default:
        throw new Error(`API não suportada: ${apiName}`);
    }
  }

  /**
   * Busca no Bing Image Search
   */
  async searchBing(query, options = {}) {
    if (!this.bingApiKey) {
      throw new Error('Bing API key não configurada');
    }

    const response = await axios.get('https://api.cognitive.microsoft.com/bing/v7.0/images/search', {
      headers: {
        'Ocp-Apim-Subscription-Key': this.bingApiKey
      },
      params: {
        q: query,
        count: this.maxResults,
        imageType: 'Photo',
        size: 'Medium',
        safeSearch: 'Moderate',
        ...options
      },
      timeout: this.timeout
    });

    return response.data.value?.map(item => ({
      url: item.contentUrl,
      thumbnailUrl: item.thumbnailUrl,
      title: item.name,
      source: 'bing',
      width: item.width,
      height: item.height,
      size: item.contentSize
    })) || [];
  }

  /**
   * Busca no Unsplash
   */
  async searchUnsplash(query, options = {}) {
    if (!this.unsplashApiKey) {
      throw new Error('Unsplash API key não configurada');
    }

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      headers: {
        'Authorization': `Client-ID ${this.unsplashApiKey}`
      },
      params: {
        query: query,
        per_page: this.maxResults,
        orientation: 'all',
        ...options
      },
      timeout: this.timeout
    });

    return response.data.results?.map(item => ({
      url: item.urls.regular,
      thumbnailUrl: item.urls.thumb,
      title: item.alt_description || item.description || query,
      source: 'unsplash',
      width: item.width,
      height: item.height,
      photographer: item.user.name
    })) || [];
  }

  /**
   * Busca no Google Custom Search
   */
  async searchGoogle(query, options = {}) {
    if (!this.googleApiKey || !this.googleCxId) {
      throw new Error('Google API key ou CX ID não configurados');
    }

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: this.googleApiKey,
        cx: this.googleCxId,
        q: query,
        searchType: 'image',
        num: this.maxResults,
        safe: 'medium',
        ...options
      },
      timeout: this.timeout
    });

    return response.data.items?.map(item => ({
      url: item.link,
      thumbnailUrl: item.image.thumbnailLink,
      title: item.title,
      source: 'google',
      width: item.image.width,
      height: item.image.height,
      contextLink: item.image.contextLink
    })) || [];
  }

  /**
   * Retorna APIs disponíveis baseado nas chaves configuradas
   */
  getAvailableApis() {
    const apis = [];
    
    if (this.bingApiKey) apis.push('bing');
    if (this.unsplashApiKey) apis.push('unsplash');
    if (this.googleApiKey && this.googleCxId) apis.push('google');
    
    if (apis.length === 0) {
      console.warn('Nenhuma API de busca de imagens configurada');
    }
    
    return apis;
  }

  /**
   * Processa e filtra resultados
   */
  processResults(results) {
    return results
      .filter(item => item.url && item.thumbnailUrl)
      .filter(item => this.isValidImageUrl(item.url))
      .slice(0, this.maxResults)
      .map((item, index) => ({
        ...item,
        id: crypto.randomUUID(),
        rank: index + 1,
        confidence: this.calculateConfidence(item, index)
      }));
  }

  /**
   * Valida se a URL é de uma imagem válida
   */
  isValidImageUrl(url) {
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const pathname = urlObj.pathname.toLowerCase();
      
      return validExtensions.some(ext => pathname.includes(ext)) || 
             urlObj.hostname.includes('images') ||
             urlObj.hostname.includes('photo');
    } catch {
      return false;
    }
  }

  /**
   * Calcula score de confiança baseado na posição e fonte
   */
  calculateConfidence(item, index) {
    let confidence = 1.0 - (index * 0.1); // Diminui com a posição
    
    // Ajustar baseado na fonte
    switch (item.source) {
      case 'google':
        confidence *= 0.95; // Google geralmente tem boa qualidade
        break;
      case 'bing':
        confidence *= 0.90;
        break;
      case 'unsplash':
        confidence *= 0.85; // Mais artístico, menos comercial
        break;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Extrai termos de busca de uma imagem (placeholder para futura implementação de ML)
   */
  async extractSearchTermsFromImage(imageBase64) {
    // Por enquanto, retorna termos genéricos
    // Futuramente, usar ML para extrair características da imagem
    
    try {
      // Simular análise da imagem
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retornar termos genéricos por enquanto
      return [
        'produto',
        'bebida',
        'alimento',
        'embalagem'
      ];
    } catch (error) {
      console.error('Erro ao extrair termos da imagem:', error);
      return ['produto'];
    }
  }

  /**
   * Salva histórico da busca para análise
   */
  async saveSearchHistory(searchData) {
    try {
      // Implementar salvamento no banco de dados
      console.log('Salvando histórico de busca:', {
        searchId: searchData.searchId,
        terms: searchData.searchTerms,
        success: searchData.success,
        apiUsed: searchData.apiUsed,
        responseTime: searchData.responseTime
      });
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }
}

export default new ImageSearchService();

