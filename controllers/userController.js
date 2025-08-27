const User = require('../models/User');
const { validationResult } = require('express-validator');

class UserController {
  // Listar todos os usuários
  static async getAll(req, res) {
    try {
      const users = await User.findAll();
      
      res.json({
        success: true,
        message: 'Usuários listados com sucesso',
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar usuário por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuário encontrado',
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar novo usuário
  static async create(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { nome_completo, email, senha, perfil } = req.body;

      // Verificar se o email já existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }

      // Criar usuário
      const newUser = await User.create({
        nome_completo,
        email,
        senha,
        perfil: perfil || 'operador'
      });

      console.log(`👤 Usuário criado: ${newUser.email} (${newUser.perfil}) por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: newUser.toJSON()
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      // Verificar se é erro de email duplicado
      if (error.code === '23505' && error.constraint === 'usuarios_email_key') {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar usuário
  static async update(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { nome_completo, email, perfil, ativo } = req.body;

      // Verificar se o usuário existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se o email já está em uso por outro usuário
      if (email && email !== existingUser.email) {
        const emailInUse = await User.findByEmail(email);
        if (emailInUse && emailInUse.id !== id) {
          return res.status(409).json({
            success: false,
            message: 'Email já está em uso por outro usuário'
          });
        }
      }

      // Atualizar usuário
      const updatedUser = await User.update(id, {
        nome_completo: nome_completo || existingUser.nome_completo,
        email: email || existingUser.email,
        perfil: perfil || existingUser.perfil,
        ativo: ativo !== undefined ? ativo : existingUser.ativo
      });

      console.log(`✏️ Usuário atualizado: ${updatedUser.email} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser.toJSON()
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      // Verificar se é erro de email duplicado
      if (error.code === '23505' && error.constraint === 'usuarios_email_key') {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Desativar usuário (exclusão lógica)
  static async deactivate(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o usuário existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Não permitir que o usuário desative a si mesmo
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Você não pode desativar sua própria conta'
        });
      }

      // Desativar usuário
      const deactivatedUser = await User.deactivate(id);

      console.log(`🗑️ Usuário desativado: ${deactivatedUser.email} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Usuário desativado com sucesso',
        data: deactivatedUser.toJSON()
      });

    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Reativar usuário
  static async reactivate(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o usuário existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Reativar usuário
      const reactivatedUser = await User.update(id, {
        nome_completo: existingUser.nome_completo,
        email: existingUser.email,
        perfil: existingUser.perfil,
        ativo: true
      });

      console.log(`🔄 Usuário reativado: ${reactivatedUser.email} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Usuário reativado com sucesso',
        data: reactivatedUser.toJSON()
      });

    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter perfil do usuário logado
  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        message: 'Perfil do usuário',
        data: req.user.toJSON()
      });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = UserController;

