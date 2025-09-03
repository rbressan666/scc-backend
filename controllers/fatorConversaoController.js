// controllers/fatorConversaoController.js
import FatorConversao from '../models/FatorConversao.js';
import { validationResult } from 'express-validator';

class FatorConversaoController {
  // Criar novo fator de conversão
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

      const fator = await FatorConversao.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Fator de conversão criado com sucesso',
        data: fator
      });
    } catch (error) {
      console.error('Erro ao criar fator de conversão:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe um fator de conversão para esta variação e unidade de medida'
        });
      }
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Variação de produto ou unidade de medida não encontrada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar fatores por variação
  static async getByVariacao(req, res) {
    try {
      const { id } = req.params;
      const fatores = await FatorConversao.findByVariacao(id);
      
      res.json({
        success: true,
        data: fatores,
        total: fatores.length
      });
    } catch (error) {
      console.error('Erro ao buscar fatores de conversão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar fator por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const fator = await FatorConversao.findById(id);
      
      if (!fator) {
        return res.status(404).json({
          success: false,
          message: 'Fator de conversão não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: fator
      });
    } catch (error) {
      console.error('Erro ao buscar fator de conversão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar fator de conversão
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
      const fator = await FatorConversao.update(id, req.body);
      
      if (!fator) {
        return res.status(404).json({
          success: false,
          message: 'Fator de conversão não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Fator de conversão atualizado com sucesso',
        data: fator
      });
    } catch (error) {
      console.error('Erro ao atualizar fator de conversão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Deletar fator de conversão
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const fator = await FatorConversao.delete(id);
      
      if (!fator) {
        return res.status(404).json({
          success: false,
          message: 'Fator de conversão não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Fator de conversão removido com sucesso',
        data: fator
      });
    } catch (error) {
      console.error('Erro ao deletar fator de conversão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar múltiplos fatores de conversão
  static async createMultiple(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { fatores } = req.body;
      
      if (!Array.isArray(fatores) || fatores.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de fatores é obrigatória'
        });
      }
      
      const fatoresCriados = await FatorConversao.createMultiple(fatores);
      
      res.status(201).json({
        success: true,
        message: 'Fatores de conversão criados com sucesso',
        data: fatoresCriados,
        total: fatoresCriados.length
      });
    } catch (error) {
      console.error('Erro ao criar fatores de conversão:', error);
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Variação de produto ou unidade de medida não encontrada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Converter quantidade entre unidades
  static async convertQuantity(req, res) {
    try {
      const { id_variacao_produto } = req.params;
      const { quantidade, id_unidade_origem, id_unidade_destino } = req.body;
      
      if (!quantidade || !id_unidade_origem || !id_unidade_destino) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade, unidade de origem e unidade de destino são obrigatórias'
        });
      }
      
      const quantidadeConvertida = await FatorConversao.convertQuantity(
        id_variacao_produto,
        quantidade,
        id_unidade_origem,
        id_unidade_destino
      );
      
      res.json({
        success: true,
        data: {
          quantidade_original: quantidade,
          quantidade_convertida: quantidadeConvertida,
          id_unidade_origem,
          id_unidade_destino
        }
      });
    } catch (error) {
      console.error('Erro ao converter quantidade:', error);
      
      if (error.message.includes('Fatores de conversão não encontrados')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default FatorConversaoController;

