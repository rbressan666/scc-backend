// controllers/userController.js
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        nome_completo, 
        email, 
        perfil, 
        ativo, 
        created_at, 
        updated_at, 
        ultimo_login 
      FROM usuarios 
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 Lista de usuários solicitada por admin ID: ${req.user.id}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
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
    
    // Criar usuário
    const result = await pool.query(`
      INSERT INTO usuarios (nome_completo, email, senha, perfil, ativo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING id, nome_completo, email, perfil, ativo, created_at
    `, [nome_completo, email, hashedPassword, perfil]);
    
    const newUser = result.rows[0];
    
    console.log(`👤 Usuário criado: ${email} por admin ID: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: newUser
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
    if (requestingUserProfile !== 'admin' && parseInt(id) !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const result = await pool.query(`
      SELECT 
        id, 
        nome_completo, 
        email, 
        perfil, 
        ativo, 
        created_at, 
        updated_at, 
        ultimo_login 
      FROM usuarios 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
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
    
    // Preparar campos para atualização
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
      updateFields.push(`senha = $${paramCount}`);
      updateValues.push(hashedPassword);
      paramCount++;
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);
    
    const query = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, nome_completo, email, perfil, ativo, created_at, updated_at
    `;
    
    const result = await pool.query(query, updateValues);
    
    console.log(`✏️ Usuário ID ${id} atualizado por admin ID: ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: result.rows[0]
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
    if (parseInt(id) === requestingUserId) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível desativar sua própria conta'
      });
    }
    
    const result = await pool.query(`
      UPDATE usuarios 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1 AND ativo = true
      RETURNING id, nome_completo, email, ativo
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou já está inativo'
      });
    }
    
    console.log(`🚫 Usuário ID ${id} desativado por admin ID: ${requestingUserId}`);
    
    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: result.rows[0]
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
    
    const result = await pool.query(`
      UPDATE usuarios 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1 AND ativo = false
      RETURNING id, nome_completo, email, ativo
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou já está ativo'
      });
    }
    
    console.log(`✅ Usuário ID ${id} reativado por admin ID: ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Usuário reativado com sucesso',
      data: result.rows[0]
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
    
    const result = await pool.query(`
      SELECT 
        id, 
        nome_completo, 
        email, 
        perfil, 
        ativo, 
        created_at, 
        ultimo_login 
      FROM usuarios 
      WHERE id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

