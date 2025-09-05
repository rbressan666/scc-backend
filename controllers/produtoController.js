// controllers/produtoController.js
import Produto from '../models/Produto.js';
import { validationResult } from 'express-validator';
import axios from 'axios';

class ProdutoController {
  // Criar novo produto
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const produto = await Produto.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Produto criado com sucesso',
        data: produto
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe um produto com este nome'
        });
      }
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Categoria ou setor não encontrado'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar produto por código EAN/código de barras
  static async lookupByEan(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Código EAN inválido',
          errors: errors.array()
        });
      }

      const { ean_code } = req.body;
      
      if (!ean_code || ean_code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código EAN é obrigatório'
        });
      }

      try {
        // Consulta à API da Open Food Facts
        const response = await axios.get(
          `https://world.openfoodfacts.org/api/v2/product/${ean_code}.json`,
          {
            timeout: 10000, // 10 segundos de timeout
            headers: {
              'User-Agent': 'SCC-Sistema-Contagem-Cadoz/1.0'
            }
          }
        );

        if (response.data.status === 1 && response.data.product) {
          const product = response.data.product;
          
          // Extrair e formatar os dados do produto
          const productData = {
            found: true,
            ean_code: ean_code,
            product_name: product.product_name_pt || product.product_name || 'Produto não identificado',
            brands: product.brands || '',
            categories: product.categories || '',
            image_url: product.image_front_url || product.image_url || null,
            quantity: product.quantity || '',
            ingredients_text: product.ingredients_text_pt || product.ingredients_text || '',
            nutriscore_grade: product.nutriscore_grade || null,
            ecoscore_grade: product.ecoscore_grade || null,
            // Campos formatados para o sistema
            suggested_name: this.formatProductName(product.brands, product.product_name_pt || product.product_name),
            suggested_variation_name: this.formatVariationName(product.quantity),
            suggested_category: this.mapCategory(product.categories)
          };

          res.json({
            success: true,
            message: 'Produto encontrado com sucesso',
            data: productData
          });
        } else {
          // Produto não encontrado na base de dados
          res.json({
            success: true,
            message: 'Produto não encontrado na base de dados',
            data: {
              found: false,
              ean_code: ean_code,
              suggested_name: '',
              suggested_variation_name: '',
              suggested_category: null
            }
          });
        }
      } catch (apiError) {
        console.error('Erro ao consultar API Open Food Facts:', apiError);
        
        // Em caso de erro na API externa, retorna que não foi encontrado
        res.json({
          success: true,
          message: 'Não foi possível consultar a base de dados externa',
          data: {
            found: false,
            ean_code: ean_code,
            suggested_name: '',
            suggested_variation_name: '',
            suggested_category: null,
            error: 'API externa indisponível'
          }
        });
      }
    } catch (error) {
      console.error('Erro no lookup por EAN:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Método auxiliar para formatar nome do produto
  static formatProductName(brands, productName) {
    if (!productName) return '';
    
    if (brands && brands.trim() !== '') {
      const brandList = brands.split(',').map(b => b.trim());
      const mainBrand = brandList[0];
      
      // Se o nome do produto já contém a marca, não duplicar
      if (productName.toLowerCase().includes(mainBrand.toLowerCase())) {
        return productName;
      }
      
      return `${mainBrand} - ${productName}`;
    }
    
    return productName;
  }

  // Método auxiliar para formatar nome da variação
  static formatVariationName(quantity) {
    if (!quantity || quantity.trim() === '') {
      return 'Unidade padrão';
    }
    
    // Limpar e formatar a quantidade
    const cleanQuantity = quantity.trim();
    
    // Se já tem formato adequado, retornar
    if (cleanQuantity.match(/^\d+\s*(ml|l|g|kg|un|unidades?)/i)) {
      return cleanQuantity;
    }
    
    return cleanQuantity;
  }

  // Método auxiliar para mapear categoria
  static mapCategory(categories) {
    if (!categories || categories.trim() === '') {
      return null;
    }
    
    // Mapeamento básico de categorias da Open Food Facts para categorias do sistema
    const categoryMappings = {
      'beverages': 'Bebidas',
      'dairy': 'Laticínios',
      'meat': 'Carnes',
      'snacks': 'Lanches',
      'cereals': 'Cereais',
      'fruits': 'Frutas',
      'vegetables': 'Vegetais',
      'frozen': 'Congelados',
      'canned': 'Enlatados',
      'bakery': 'Padaria'
    };
    
    const categoryList = categories.toLowerCase().split(',').map(c => c.trim());
    
    for (const category of categoryList) {
      for (const [key, value] of Object.entries(categoryMappings)) {
        if (category.includes(key)) {
          return value;
        }
      }
    }
    
    return null;
  }

  // Listar todos os produtos
  static async getAll(req, res) {
    try {
      const filters = {
        includeInactive: req.query.includeInactive === 'true',
        id_setor: req.query.setor,
        id_categoria: req.query.categoria,
        nome: req.query.nome
      };
      
      const produtos = await Produto.findAll(filters);
      
      res.json({
        success: true,
        data: produtos,
        total: produtos.length
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar produto por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.findById(id);
      
      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: produto
      });
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar produto
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const produto = await Produto.update(id, req.body);
      
      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: produto
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe um produto com este nome'
        });
      }
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Categoria ou setor não encontrado'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar produto
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.deactivate(id);
      
      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Produto e suas variações foram desativados com sucesso',
        data: produto
      });
    } catch (error) {
      console.error('Erro ao desativar produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar produto
  static async reactivate(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.reactivate(id);
      
      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Produto reativado com sucesso',
        data: produto
      });
    } catch (error) {
      console.error('Erro ao reativar produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default ProdutoController;

