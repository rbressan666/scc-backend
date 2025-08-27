// models/User.js
import pool from '../config/database.js';
import bcrypt from 'bcrypt';

export class User {
  constructor(data) {
    this.id = data.id;
    this.nome_completo = data.nome_completo;
    this.email = data.email;
    this.perfil = data.perfil;
    this.ativo = data.ativo;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.ultimo_login = data.ultimo_login;
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar todos os usuários
  static async findAll() {
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
      
      return result.rows.map(row => new User(row));
    } catch (error) {
      throw error;
    }
  }

  // Criar novo usuário
  static async create(userData) {
    try {
      const { nome_completo, email, senha, perfil } = userData;
      
      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(senha, saltRounds);
      
      const result = await pool.query(`
        INSERT INTO usuarios (nome_completo, email, senha, perfil, ativo, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING id, nome_completo, email, perfil, ativo, created_at, updated_at
      `, [nome_completo, email, hashedPassword, perfil]);
      
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Verificar senha
  async verifyPassword(password) {
    try {
      const result = await pool.query(
        'SELECT senha FROM usuarios WHERE id = $1',
        [this.id]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return await bcrypt.compare(password, result.rows[0].senha);
    } catch (error) {
      throw error;
    }
  }

  // Atualizar último login
  async updateLastLogin() {
    try {
      await pool.query(
        'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
        [this.id]
      );
      
      // Atualizar instância local
      this.ultimo_login = new Date();
    } catch (error) {
      throw error;
    }
  }

  // Atualizar dados do usuário
  async update(updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Construir query dinamicamente
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      fields.push('updated_at = NOW()');
      values.push(this.id);

      const query = `
        UPDATE usuarios 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, nome_completo, email, perfil, ativo, created_at, updated_at, ultimo_login
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar instância atual
      Object.assign(this, result.rows[0]);
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Desativar usuário
  async deactivate() {
    try {
      const result = await pool.query(`
        UPDATE usuarios 
        SET ativo = false, updated_at = NOW()
        WHERE id = $1
        RETURNING ativo, updated_at
      `, [this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      this.ativo = false;
      this.updated_at = result.rows[0].updated_at;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Reativar usuário
  async reactivate() {
    try {
      const result = await pool.query(`
        UPDATE usuarios 
        SET ativo = true, updated_at = NOW()
        WHERE id = $1
        RETURNING ativo, updated_at
      `, [this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      this.ativo = true;
      this.updated_at = result.rows[0].updated_at;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Converter para JSON (sem senha)
  toJSON() {
    const { senha, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Verificar se é admin
  isAdmin() {
    return this.perfil === 'admin';
  }

  // Verificar se está ativo
  isActive() {
    return this.ativo === true;
  }
}

export default User;

