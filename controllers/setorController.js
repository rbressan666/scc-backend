// controllers/setorController.js
import Setor from '../models/Setor.js';
import { validationResult } from 'express-validator';

class SetorController {
  // Criar novo setor
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

      const setor = await Setor.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Setor criado com sucesso',
        data: setor
      });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe um setor com este nome'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar todos os setores
  static async getAll(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const setores = await Setor.findAll(includeInactive);
      
      res.json({
        success: true,
        data: setores,
        total: setores.length
      });
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar setor por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const setor = await Setor.findById(id);
      
      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: setor
      });
    } catch (error) {
      console.error('Erro ao buscar setor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar setor
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
      const setor = await Setor.update(id, req.body);
      
      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Setor atualizado com sucesso',
        data: setor
      });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Já existe um setor com este nome'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar setor
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se o setor está sendo usado
      const isInUse = await Setor.isInUse(id);
      if (isInUse) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível desativar este setor pois ele está sendo usado por produtos'
        });
      }
      
      const setor = await Setor.deactivate(id);
      
      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Setor desativado com sucesso',
        data: setor
      });
    } catch (error) {
      console.error('Erro ao desativar setor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar setor
  static async reactivate(req, res) {
    try {
      const { id } = req.params;
      const setor = await Setor.reactivate(id);
      
      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Setor reativado com sucesso',
        data: setor
      });
    } catch (error) {
      console.error('Erro ao reativar setor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default SetorController;

