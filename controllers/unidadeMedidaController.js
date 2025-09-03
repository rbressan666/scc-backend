// controllers/unidadeMedidaController.js
import UnidadeMedida from '../models/UnidadeMedida.js';
import { validationResult } from 'express-validator';

class UnidadeMedidaController {
  // Criar nova unidade de medida
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

      const unidade = await UnidadeMedida.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Unidade de medida criada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao criar unidade de medida:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe uma unidade de medida com este nome ou sigla'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar todas as unidades de medida
  static async getAll(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const unidades = await UnidadeMedida.findAll(includeInactive);
      
      res.json({
        success: true,
        data: unidades,
        total: unidades.length
      });
    } catch (error) {
      console.error('Erro ao buscar unidades de medida:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar unidade de medida por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const unidade = await UnidadeMedida.findById(id);
      
      if (!unidade) {
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      res.json({
        success: true,
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao buscar unidade de medida:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar unidade de medida
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
      const unidade = await UnidadeMedida.update(id, req.body);
      
      if (!unidade) {
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Unidade de medida atualizada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao atualizar unidade de medida:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe uma unidade de medida com este nome ou sigla'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar unidade de medida
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se a unidade está sendo usada
      const isInUse = await UnidadeMedida.isInUse(id);
      if (isInUse) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível desativar esta unidade de medida pois ela está sendo usada por produtos'
        });
      }
      
      const unidade = await UnidadeMedida.deactivate(id);
      
      if (!unidade) {
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Unidade de medida desativada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao desativar unidade de medida:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar unidade de medida
  static async reactivate(req, res) {
    try {
      const { id } = req.params;
      const unidade = await UnidadeMedida.reactivate(id);
      
      if (!unidade) {
        return res.status(404).json({
          success: false,
          message: 'Unidade de medida não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Unidade de medida reativada com sucesso',
        data: unidade
      });
    } catch (error) {
      console.error('Erro ao reativar unidade de medida:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default UnidadeMedidaController;

