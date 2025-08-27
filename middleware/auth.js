import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  if (req.user.perfil !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões de administrador requeridas.'
    });
  }

  next();
};

// Middleware para verificar se o usuário pode acessar seus próprios dados ou é admin
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  const requestedUserId = req.params.id;
  const currentUserId = req.user.id;
  const isAdmin = req.user.perfil === 'admin';

  if (!isAdmin && requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Você só pode acessar seus próprios dados.'
    });
  }

  next();
};

// Função para gerar token JWT
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    perfil: user.perfil
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Função para gerar refresh token (para implementação futura)
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  generateToken,
  generateRefreshToken
};

