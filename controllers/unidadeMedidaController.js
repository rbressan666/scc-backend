// controllers/unidadeMedidaController.js
import UnidadeMedida from '../models/UnidadeMedida.js';
import { validationResult } from 'express-validator';

class UnidadeMedidaController {
  // Criar nova unidade de medida
  static async create(req, res) {
    try {
      console.log(`[${new Date().toISOString()}] - POST /api/unidades-medida`);
      console.log('Dados recebidos:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Erros de validação:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const unidade = await UnidadeMedida.create(req.body);
      
      console.log('Unidade criada com sucesso:', unidade);
      
      res.status(201).json({
        success: true,
        message: 'Unidade de medida criada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao criar unidade de medida:', error);
      console.error('Stack trace:', error.stack);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe uma unidade de medida com este nome ou sigla'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Listar todas as unidades de medida
  static async getAll(req, res) {
    try {
      console.log(`[${new Date().toISOString()}] - GET /api/unidades-medida`);
      
      const includeInactive = req.query.includeInactive === 'true';
      const unidades = await UnidadeMedida.findAll(includeInactive);
      
      console.log(`Retornando ${unidades.length} unidades de medida`);
      
      res.json({
        success: true,
        data: unidades,
        total: unidades.length
      });
    } catch (error) {
      console.error('Erro ao buscar unidades de medida:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar unidade de medida por ID
  static async getById(req, res) {
    try {
      console.log(`[${new Date().toISOString()}] - GET /api/unidades-medida/${req.params.id}`);
      
      const { id } = req.params;
      const unidade = await UnidadeMedida.findById(id);
      
      if (!unidade) {
        console.log('Unidade não encontrada:', id);
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      console.log('Unidade encontrada:', unidade);
      
      res.json({
        success: true,
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao buscar unidade de medida:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar unidade de medida
  static async update(req, res) {
    try {
      console.log(`[${new Date().toISOString()}] - PUT /api/unidades-medida/${req.params.id}`);
      console.log('Dados recebidos no controller:', req.body);
      console.log('Parâmetros da URL:', req.params);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Erros de validação:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      
      // Verificar se a unidade existe antes de tentar atualizar
      const unidadeExistente = await UnidadeMedida.findById(id);
      if (!unidadeExistente) {
        console.log('Unidade não encontrada para atualização:', id);
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      console.log('Unidade existente encontrada:', unidadeExistente);
      
      const unidade = await UnidadeMedida.update(id, req.body);
      
      if (!unidade) {
        console.log('Falha na atualização - nenhuma linha retornada');
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      console.log('Unidade atualizada com sucesso no controller:', unidade);
      
      res.json({
        success: true,
        message: 'Unidade de medida atualizada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao atualizar unidade de medida no controller:', error);
      console.error('Stack trace completo:', error.stack);
      console.error('Código do erro:', error.code);
      console.error('Detalhes do erro:', error.detail);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe uma unidade de medida com este nome ou sigla'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code,
        detail: error.detail
      });
    }
  }

  // Desativar unidade de medida
  static async deactivate(req, res) {
    try {
      console.log(`[${new Date().toISOString()}] - POST /api/unidades-medida/${req.params.id}/deactivate`);
      
      const { id } = req.params;
      
      // Verificar se a unidade está sendo usada
      const isInUse = await UnidadeMedida.isInUse(id);
      if (isInUse) {
        console.log('Tentativa de desativar unidade em uso:', id);
        return res.status(409).json({
          success: false,
          message: 'Não é possível desativar esta unidade de medida pois ela está sendo usada por produtos'
        });
      }
      
      const unidade = await UnidadeMedida.deactivate(id);
      
      if (!unidade) {
        console.log('Unidade não encontrada para desativação:', id);
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      console.log('Unidade desativada com sucesso no controller:', unidade);
      
      res.json({
        success: true,
        message: 'Unidade de medida desativada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao desativar unidade de medida:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reativar unidade de medida
  static async reactivate(req, res) {
    try {
      console.log(`[${new Date().toISOString()}] - POST /api/unidades-medida/${req.params.id}/reactivate`);
      
      const { id } = req.params;
      const unidade = await UnidadeMedida.reactivate(id);
      
      if (!unidade) {
        console.log('Unidade não encontrada para reativação:', id);
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      console.log('Unidade reativada com sucesso no controller:', unidade);
      
      res.json({
        success: true,
        message: 'Unidade de medida reativada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao reativar unidade de medida:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default UnidadeMedidaController;
