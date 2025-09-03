// controllers/categoriaController.js
import Categoria from '../models/Categoria.js';
import { validationResult } from 'express-validator';

class CategoriaController {
  // Criar nova categoria
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

      const categoria = await Categoria.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Categoria criada com sucesso',
        data: categoria
      });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Categoria pai não encontrada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar todas as categorias
  static async getAll(req, res) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const tree = req.query.tree === 'true';
      
      let categorias;
      if (tree) {
        categorias = await Categoria.findTree();
      } else {
        categorias = await Categoria.findAll(includeInactive);
      }
      
      res.json({
        success: true,
        data: categorias,
        total: categorias.length
      });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar categoria por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findById(id);
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
      
      // Buscar subcategorias
      const subcategorias = await Categoria.findChildren(id);
      categoria.subcategorias = subcategorias;
      
      res.json({
        success: true,
        data: categoria
      });
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar categoria
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
      
      // Verificar se não está tentando definir ela mesma como pai
      if (req.body.id_categoria_pai === id) {
        return res.status(400).json({
          success: false,
          message: 'Uma categoria não pode ser pai de si mesma'
        });
      }
      
      const categoria = await Categoria.update(id, req.body);
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Categoria atualizada com sucesso',
        data: categoria
      });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Categoria pai não encontrada'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar categoria
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se a categoria está sendo usada
      const isInUse = await Categoria.isInUse(id);
      if (isInUse) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível desativar esta categoria pois ela está sendo usada por produtos ou possui subcategorias'
        });
      }
      
      const categoria = await Categoria.deactivate(id);
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Categoria desativada com sucesso',
        data: categoria
      });
    } catch (error) {
      console.error('Erro ao desativar categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar categoria
  static async reactivate(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.reactivate(id);
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Categoria reativada com sucesso',
        data: categoria
      });
    } catch (error) {
      console.error('Erro ao reativar categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default CategoriaController;

