// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log(`🔐 Tentativa de login para: ${email}`);
    
    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Usuário não encontrado ou inativo: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      console.log(`❌ Senha inválida para: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Gerar token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        perfil: user.perfil 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Atualizar último login
    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Remover senha da resposta
    const { senha: _, ...userWithoutPassword } = user;
    
    console.log(`✅ Login bem-sucedido para: ${email}`);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const logout = (req, res) => {
  console.log(`🚪 Logout realizado para usuário ID: ${req.user.id}`);
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
};

export const verify = async (req, res) => {
  try {
    // Buscar dados atualizados do usuário
    const result = await pool.query(
      'SELECT id, nome_completo, email, perfil, ativo, created_at, ultimo_login FROM usuarios WHERE id = $1 AND ativo = true',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.user.id;
    
    // Buscar usuário atual
    const result = await pool.query(
      'SELECT senha FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar senha atual
    const validPassword = await bcrypt.compare(senhaAtual, user.senha);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }
    
    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);
    
    // Atualizar senha
    await pool.query(
      'UPDATE usuarios SET senha = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
    
    console.log(`🔑 Senha alterada para usuário ID: ${userId}`);
    
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
};

