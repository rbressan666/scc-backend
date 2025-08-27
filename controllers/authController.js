// controllers/authController.js (CORRIGIDO PARA COLUNAS DO SUPABASE)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

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
    
    // CÓDIGO TEMPORÁRIO PARA DEBUG - ADICIONE ANTES DA VERIFICAÇÃO
    const bcryptTest = await bcrypt.hash(senha, 12);
    console.log('🧪 HASH GERADO DA SENHA DIGITADA:', bcryptTest);

    // Teste direto com a senha conhecida
    const testPassword = 'Cadoz@001';
    const testResult = await bcrypt.compare(testPassword, user.senha_hash);
    console.log('🧪 TESTE COM SENHA HARDCODED:', testResult);


    // Verificar senha - CORRIGIDO para usar senha_hash
    console.log('🔍 SENHA DIGITADA:', senha);
    console.log('🔍 HASH DO BANCO:', user.senha_hash);
    console.log('🔍 TIPO SENHA:', typeof senha);
    console.log('🔍 TIPO HASH:', typeof user.senha_hash);
    console.log('🔍 COMPRIMENTO SENHA:', senha.length);
    console.log('🔍 COMPRIMENTO HASH:', user.senha_hash.length);

    const validPassword = await bcrypt.compare(senha, user.senha_hash);
    console.log('🔍 RESULTADO BCRYPT.COMPARE:', validPassword);

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
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: userResponse
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

