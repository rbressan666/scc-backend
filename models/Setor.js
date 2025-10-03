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
    console.log('Setor.update - ID:', id);
    console.log('Setor.update - Data recebida:', data);
    
    // Construir query dinamicamente apenas com campos fornecidos
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (data.nome !== undefined) {
      fields.push(`nome = $${paramCount}`);
      values.push(data.nome);
      paramCount++;
    }
    
    if (data.ativo !== undefined) {
      fields.push(`ativo = $${paramCount}`);
      values.push(data.ativo);
      paramCount++;
    }
    
    // Sempre atualizar updated_at
    fields.push(`updated_at = NOW()`);
    
    if (fields.length === 1) { // Só updated_at
      throw new Error('Nenhum campo para atualizar');
    }
    
    const query = `
      UPDATE setores 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);
    
    console.log('Setor.update - Query:', query);
    console.log('Setor.update - Values:', values);
    
    const result = await pool.query(query, values);
    console.log('Setor.update - Resultado:', result.rows[0]);
    
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
    console.log('Setor.isInUse - Verificando ID:', id);
    
    try {
      const query = 'SELECT COUNT(*) as count FROM produtos WHERE id_setor = $1';
      console.log('Setor.isInUse - Query:', query);
      const result = await pool.query(query, [id]);
      const count = parseInt(result.rows[0].count);
      console.log('Setor.isInUse - Count:', count);
      
      const isInUse = count > 0;
      console.log('Setor.isInUse - Resultado:', isInUse);
      
      return isInUse;
      
    } catch (error) {
      console.error('Setor.isInUse - Erro:', error);
      throw error;
    }
  }
}

export default Setor;
