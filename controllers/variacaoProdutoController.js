// controllers/variacaoProdutoController.js
import VariacaoProduto from '../models/VariacaoProduto.js';
import FatorConversao from '../models/FatorConversao.js';
import { validationResult } from 'express-validator';

class VariacaoProdutoController {
  // Criar nova variação de produto
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

      const { fatores_conversao, ...variacaoData } = req.body;
      
      // Criar a variação
      const variacao = await VariacaoProduto.create(variacaoData);
      
      // Criar fatores de conversão se fornecidos
      if (fatores_conversao && fatores_conversao.length > 0) {
        const fatoresComVariacao = fatores_conversao.map(fator => ({
          ...fator,
          id_variacao_produto: variacao.id
        }));
        
        await FatorConversao.createMultiple(fatoresComVariacao);
      }
      
      res.status(201).json({
        success: true,
        message: 'Variação de produto criada com sucesso',
        data: variacao
      });
    } catch (error) {
      console.error('Erro ao criar variação de produto:', error);
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Produto ou unidade de medida não encontrado'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar todas as variações
  static async getAll(req, res) {
    try {
      const filters = {
        includeInactive: req.query.includeInactive === 'true',
        id_setor: req.query.setor,
        id_categoria: req.query.categoria,
        nome: req.query.nome,
        estoque_baixo: req.query.estoque_baixo === 'true'
      };
      
      const variacoes = await VariacaoProduto.findAll(filters);
      
      res.json({
        success: true,
        data: variacoes,
        total: variacoes.length
      });
    } catch (error) {
      console.error('Erro ao buscar variações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar variação por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const variacao = await VariacaoProduto.findById(id);
      
      if (!variacao) {
        return res.status(404).json({
          success: false,
          message: 'Variação não encontrada'
        });
      }
      
      // Buscar fatores de conversão
      const fatores = await FatorConversao.findByVariacao(id);
      variacao.fatores_conversao = fatores;
      
      res.json({
        success: true,
        data: variacao
      });
    } catch (error) {
      console.error('Erro ao buscar variação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar variações por produto
  static async getByProduct(req, res) {
    try {
      const { id_produto } = req.params;
      const variacoes = await VariacaoProduto.findByProduct(id_produto);
      
      res.json({
        success: true,
        data: variacoes,
        total: variacoes.length
      });
    } catch (error) {
      console.error('Erro ao buscar variações do produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar variação
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
      const { fatores_conversao, ...variacaoData } = req.body;
      
      // Atualizar a variação
      const variacao = await VariacaoProduto.update(id, variacaoData);
      
      if (!variacao) {
        return res.status(404).json({
          success: false,
          message: 'Variação não encontrada'
        });
      }
      
      // Atualizar fatores de conversão se fornecidos
      if (fatores_conversao && fatores_conversao.length > 0) {
        // Remover fatores existentes
        await FatorConversao.deleteByVariacao(id);
        
        // Criar novos fatores
        const fatoresComVariacao = fatores_conversao.map(fator => ({
          ...fator,
          id_variacao_produto: id
        }));
        
        await FatorConversao.createMultiple(fatoresComVariacao);
      }
      
      res.json({
        success: true,
        message: 'Variação atualizada com sucesso',
        data: variacao
      });
    } catch (error) {
      console.error('Erro ao atualizar variação:', error);
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar estoque
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { estoque_atual } = req.body;
      
      if (estoque_atual === undefined || estoque_atual < 0) {
        return res.status(400).json({
          success: false,
          message: 'Estoque atual deve ser um número válido e não negativo'
        });
      }
      
      const variacao = await VariacaoProduto.updateStock(id, estoque_atual);
      
      if (!variacao) {
        return res.status(404).json({
          success: false,
          message: 'Variação não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Estoque atualizado com sucesso',
        data: variacao
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar variação
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      const variacao = await VariacaoProduto.deactivate(id);
      
      if (!variacao) {
        return res.status(404).json({
          success: false,
          message: 'Variação não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Variação desativada com sucesso',
        data: variacao
      });
    } catch (error) {
      console.error('Erro ao desativar variação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar variação
  static async reactivate(req, res) {
    try {
      const { id } = req.params;
      const variacao = await VariacaoProduto.reactivate(id);
      
      if (!variacao) {
        return res.status(404).json({
          success: false,
          message: 'Variação não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Variação reativada com sucesso',
        data: variacao
      });
    } catch (error) {
      console.error('Erro ao reativar variação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar variações com estoque baixo
  static async getLowStock(req, res) {
    try {
      const variacoes = await VariacaoProduto.findLowStock();
      
      res.json({
        success: true,
        data: variacoes,
        total: variacoes.length
      });
    } catch (error) {
      console.error('Erro ao buscar variações com estoque baixo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default VariacaoProdutoController;

