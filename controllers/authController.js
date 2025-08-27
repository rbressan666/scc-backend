const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

class AuthController {
  // Login de usuário
  static async login(req, res) {
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

      const { email, senha } = req.body;

      // Buscar usuário por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Verificar se o usuário está ativo
      if (!user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Usuário inativo. Entre em contato com o administrador.'
        });
      }

      // Verificar senha
      const senhaValida = await user.verifyPassword(senha);
      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Gerar token JWT
      const token = generateToken(user);

      // Log de login bem-sucedido
      console.log(`✅ Login realizado: ${user.email} (${user.perfil})`);

      // Retornar dados do usuário e token
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: user.toJSON(),
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar token (para validação do frontend)
  static async verifyToken(req, res) {
    try {
      // Se chegou até aqui, o token é válido (middleware authenticateToken)
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user.toJSON()
        }
      });
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Logout (para implementação futura com blacklist de tokens)
  static async logout(req, res) {
    try {
      // Por enquanto, apenas retorna sucesso
      // Em uma implementação completa, adicionaria o token a uma blacklist
      
      console.log(`🚪 Logout realizado: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Alterar senha do usuário logado
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { senhaAtual, novaSenha } = req.body;
      const userId = req.user.id;

      // Buscar usuário atual
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const senhaValida = await user.verifyPassword(senhaAtual);
      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      await User.updatePassword(userId, novaSenha);

      console.log(`🔑 Senha alterada: ${user.email}`);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = AuthController;

