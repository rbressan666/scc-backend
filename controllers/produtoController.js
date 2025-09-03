// controllers/produtoController.js
import Produto from '../models/Produto.js';
import { validationResult } from 'express-validator';

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

