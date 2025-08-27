// controllers/userController.js (CORRIGIDO PARA COLUNAS DO SUPABASE)
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    // CORRIGIDO para usar nomes das colunas do Supabase
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
      ORDER BY data_criacao DESC
    `);
    
    console.log(`📋 Lista de usuários solicitada por admin ID: ${req.user.id}`);
    
    // Normalizar nomes das colunas para resposta
    const users = result.rows.map(user => ({
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      created_at: user.data_criacao,
      updated_at: user.data_atualizacao
    }));
    
    res.json({
      success: true,
      data: users,
      total: users.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nome_completo, email, senha, perfil } = req.body;
    
    // Verificar se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email já está em uso'
      });
    }
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    
    // Criar usuário - CORRIGIDO para usar nomes das colunas do Supabase
    const result = await pool.query(`
      INSERT INTO usuarios (nome_completo, email, senha_hash, perfil, ativo, data_criacao, data_atualizacao)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
    `, [nome_completo, email, hashedPassword, perfil]);
    
    const newUser = result.rows[0];
    
    // Normalizar nomes das colunas para resposta
    const userResponse = {
      id: newUser.id,
      nome_completo: newUser.nome_completo,
      email: newUser.email,
      perfil: newUser.perfil,
      ativo: newUser.ativo,
      created_at: newUser.data_criacao,
      updated_at: newUser.data_atualizacao
    };
    
    console.log(`👤 Usuário criado: ${email} por admin ID: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;
    const requestingUserProfile = req.user.perfil;
    
    // Verificar se é admin ou se está buscando próprio perfil
    if (requestingUserProfile !== 'admin' && id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    // CORRIGIDO para usar nomes das colunas do Supabase
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
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
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
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, email, perfil, senha } = req.body;
    
    // Verificar se usuário existe
    const existingUser = await pool.query(
      'SELECT id, email FROM usuarios WHERE id = $1',
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se email já está em uso por outro usuário
    if (email && email !== existingUser.rows[0].email) {
      const emailCheck = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }
    }
    
    // Preparar campos para atualização - CORRIGIDO para usar nomes das colunas do Supabase
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;
    
    if (nome_completo) {
      updateFields.push(`nome_completo = $${paramCount}`);
      updateValues.push(nome_completo);
      paramCount++;
    }
    
    if (email) {
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
      paramCount++;
    }
    
    if (perfil) {
      updateFields.push(`perfil = $${paramCount}`);
      updateValues.push(perfil);
      paramCount++;
    }
    
    if (senha) {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(senha, saltRounds);
      updateFields.push(`senha_hash = $${paramCount}`);
      updateValues.push(hashedPassword);
      paramCount++;
    }
    
    updateFields.push(`data_atualizacao = NOW()`);
    updateValues.push(id);
    
    const query = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
    `;
    
    const result = await pool.query(query, updateValues);
    const updatedUser = result.rows[0];
    
    // Normalizar nomes das colunas para resposta
    const userResponse = {
      id: updatedUser.id,
      nome_completo: updatedUser.nome_completo,
      email: updatedUser.email,
      perfil: updatedUser.perfil,
      ativo: updatedUser.ativo,
      created_at: updatedUser.data_criacao,
      updated_at: updatedUser.data_atualizacao
    };
    
    console.log(`✏️ Usuário ID ${id} atualizado por admin ID: ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;
    
    // Não permitir que usuário desative a si mesmo
    if (id === requestingUserId) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível desativar sua própria conta'
      });
    }
    
    // CORRIGIDO para usar data_atualizacao
    const result = await pool.query(`
      UPDATE usuarios 
      SET ativo = false, data_atualizacao = NOW()
      WHERE id = $1 AND ativo = true
      RETURNING id, nome_completo, email, ativo, data_atualizacao
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou já está inativo'
      });
    }
    
    const user = result.rows[0];
    
    // Normalizar nomes das colunas para resposta
    const userResponse = {
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      ativo: user.ativo,
      updated_at: user.data_atualizacao
    };
    
    console.log(`🚫 Usuário ID ${id} desativado por admin ID: ${requestingUserId}`);
    
    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // CORRIGIDO para usar data_atualizacao
    const result = await pool.query(`
      UPDATE usuarios 
      SET ativo = true, data_atualizacao = NOW()
      WHERE id = $1 AND ativo = false
      RETURNING id, nome_completo, email, ativo, data_atualizacao
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou já está ativo'
      });
    }
    
    const user = result.rows[0];
    
    // Normalizar nomes das colunas para resposta
    const userResponse = {
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      ativo: user.ativo,
      updated_at: user.data_atualizacao
    };
    
    console.log(`✅ Usuário ID ${id} reativado por admin ID: ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Usuário reativado com sucesso',
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // CORRIGIDO para usar nomes das colunas do Supabase
    const result = await pool.query(`
      SELECT 
        id, 
        nome_completo, 
        email, 
        perfil, 
        ativo, 
        data_criacao
      FROM usuarios 
      WHERE id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
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
      created_at: user.data_criacao
    };
    
    res.json({
      success: true,
      data: userResponse
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

