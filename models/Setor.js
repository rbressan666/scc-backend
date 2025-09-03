// models/Setor.js
import pool from '../config/database.js';

class Setor {
  // Criar novo setor
  static async create(data) {
    const { nome } = data;
    
    const query = `
      INSERT INTO setores (nome)
      VALUES ($1)
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome]);
    return result.rows[0];
  }

  // Buscar todos os setores
  static async findAll(includeInactive = false) {
    let query = 'SELECT * FROM setores';
    
    if (!includeInactive) {
      query += ' WHERE ativo = true';
    }
    
    query += ' ORDER BY nome ASC';
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Buscar setor por ID
  static async findById(id) {
    const query = 'SELECT * FROM setores WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Atualizar setor
  static async update(id, data) {
    const { nome, ativo } = data;
    
    const query = `
      UPDATE setores 
      SET nome = $1, ativo = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, ativo, id]);
    return result.rows[0];
  }

  // Desativar setor (soft delete)
  static async deactivate(id) {
    const query = `
      UPDATE setores 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Reativar setor
  static async reactivate(id) {
    const query = `
      UPDATE setores 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verificar se setor está sendo usado
  static async isInUse(id) {
    const query = 'SELECT COUNT(*) as count FROM produtos WHERE id_setor = $1';
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  }
}

export default Setor;

