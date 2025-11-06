// controllers/authController.js (CORRIGIDO PARA COLUNAS DO SUPABASE)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { notifyAdminsOnLogin } from '../services/emailService.js';
import crypto from 'crypto';

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log(`🔐 Tentativa de login para: ${email}`);
    
    // Buscar usuário - CORRIGIDO para nomes das colunas do Supabase
    const result = await pool.query(`
      SELECT 
        id,
        nome_completo,
        email,
        senha_hash,
        perfil,
        ativo,
        data_criacao,
        data_atualizacao
      FROM usuarios 
      WHERE email = $1 AND ativo = true
    `, [email]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Usuário não encontrado ou inativo: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    const user = result.rows[0];
    console.log(`🔍 Usuário encontrado: ${user.email}, perfil: ${user.perfil}`);
    
    console.log('🔍 SENHA DIGITADA:', senha);
    console.log('🔍 HASH DO BANCO:', user.senha_hash);
    console.log('🧪 HASH GERADO DA SENHA DIGITADA:', await bcrypt.hash(senha, 12));
    
    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha_hash);
    console.log('🔍 RESULTADO BCRYPT.COMPARE:', validPassword);
    
    // Teste com senha hardcoded
    const testResult = await bcrypt.compare('Cadoz@001', user.senha_hash);
    console.log('🧪 TESTE COM SENHA HARDCODED Cadoz@001:', testResult);

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
    
    // Atualizar último login - CORRIGIDO para usar data_atualizacao
    await pool.query(
      'UPDATE usuarios SET data_atualizacao = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Remover senha da resposta e normalizar nomes
    const userResponse = {
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      created_at: user.data_criacao,
      updated_at: user.data_atualizacao
    };
    
    console.log(`✅ Login bem-sucedido para: ${email}`);
    
    // Metadados de auditoria
    req.audit = {
      action: 'login',
      entity: 'auth',
      entityId: user.id,
      payload: { email },
      message: 'Login realizado com sucesso'
    };

    // Disparar email para admins de forma não-bloqueante
    notifyAdminsOnLogin({ user: userResponse, req }).catch(() => {});

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: userResponse
    });
    
    console.log('📤 RESPOSTA ENVIADA:', JSON.stringify({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: userResponse
    }));
    
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
  req.audit = { action: 'logout', entity: 'auth', entityId: req.user.id };
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
};

export const verify = async (req, res) => {
  try {
    // Buscar dados atualizados do usuário - CORRIGIDO para colunas do Supabase
    const result = await pool.query(`
      SELECT 
        id, 
        nome_completo, 
        email, 
        perfil, 
        ativo, 
        data_criacao, 
        data_atualizacao 
      FROM usuarios 
      WHERE id = $1 AND ativo = true
    `, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }
    
    const user = result.rows[0];
    
    // Normalizar nomes das colunas para resposta
    const userResponse = {
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      created_at: user.data_criacao,
      updated_at: user.data_atualizacao
    };
    
    res.json({
      success: true,
      user: userResponse
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
    
    // Buscar usuário atual - CORRIGIDO para senha_hash
    const result = await pool.query(
      'SELECT senha_hash FROM usuarios WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar senha atual - CORRIGIDO para usar senha_hash
    const validPassword = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }
    
    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);
    
    // Atualizar senha - CORRIGIDO para usar senha_hash e data_atualizacao
    await pool.query(
      'UPDATE usuarios SET senha_hash = $1, data_atualizacao = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
    
    console.log(`🔑 Senha alterada para usuário ID: ${userId}`);
    
    req.audit = {
      action: 'change_password',
      entity: 'user',
      entityId: userId,
    };

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

// Confirmar e-mail a partir de token e redirecionar para definir senha
export const confirmSignup = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token ausente' });

    const { rows } = await pool.query(
      `SELECT user_id, purpose, expires_at, used_at FROM user_signup_tokens WHERE token = $1`,
      [token]
    );
    if (!rows.length || rows[0].purpose !== 'confirm_email') {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }
    const t = rows[0];
    if (t.used_at) return res.status(400).json({ success: false, message: 'Token já utilizado' });
    if (new Date(t.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'Token expirado' });

    await pool.query(`UPDATE usuarios SET email_confirmado_em = NOW(), data_atualizacao = NOW() WHERE id = $1`, [t.user_id]);
    await pool.query(`UPDATE user_signup_tokens SET used_at = NOW() WHERE token = $1`, [token]);

    // Gera token para definir senha
    const newToken = crypto.randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO user_signup_tokens(user_id, token, purpose, expires_at) VALUES ($1,$2,'set_password',$3)`,
      [t.user_id, newToken, exp]
    );

    const frontendBase = process.env.FRONTEND_URL || 'https://scc-frontend-z3un.onrender.com';
    const setUrl = `${frontendBase}/definir-senha?token=${newToken}`;
    res.json({ success: true, setPasswordUrl: setUrl });
  } catch (err) {
    console.error('Erro ao confirmar cadastro:', err);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

// Definir senha usando token de set_password
export const setPasswordWithToken = async (req, res) => {
  try {
    const { token, senha } = req.body;
    if (!token || !senha) return res.status(400).json({ success: false, message: 'Dados inválidos' });
    const { rows } = await pool.query(
      `SELECT user_id, purpose, expires_at, used_at FROM user_signup_tokens WHERE token = $1`,
      [token]
    );
    if (!rows.length || rows[0].purpose !== 'set_password') {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }
    const t = rows[0];
    if (t.used_at) return res.status(400).json({ success: false, message: 'Token já utilizado' });
    if (new Date(t.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'Token expirado' });

    const hashed = await bcrypt.hash(senha, 12);
    await pool.query(`UPDATE usuarios SET senha_hash = $1, data_atualizacao = NOW() WHERE id = $2`, [hashed, t.user_id]);
    await pool.query(`UPDATE user_signup_tokens SET used_at = NOW() WHERE token = $1`, [token]);
    res.json({ success: true, message: 'Senha definida com sucesso' });
  } catch (err) {
    console.error('Erro ao definir senha:', err);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

