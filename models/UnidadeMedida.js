// models/UnidadeMedida.js
import pool from '../config/database.js';

class UnidadeMedida {
  // Criar nova unidade de medida
  static async create(data) {
    const { nome, sigla } = data;
    
    const query = `
      INSERT INTO unidades_de_medida (nome, sigla)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, sigla]);
    return result.rows[0];
  }

  // Buscar todas as unidades de medida
  static async findAll(includeInactive = false) {
    let query = 'SELECT * FROM unidades_de_medida';
    
    if (!includeInactive) {
      query += ' WHERE ativo = true';
    }
    
    query += ' ORDER BY nome ASC';
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Buscar unidade de medida por ID
  static async findById(id) {
    const query = 'SELECT * FROM unidades_de_medida WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar unidade de medida por sigla
  static async findBySigla(sigla) {
    const query = 'SELECT * FROM unidades_de_medida WHERE sigla = $1';
    const result = await pool.query(query, [sigla]);
    return result.rows[0];
  }

  // Atualizar unidade de medida
  static async update(id, data) {
    const { nome, sigla, ativo } = data;
    
    const query = `
      UPDATE unidades_de_medida 
      SET nome = $1, sigla = $2, ativo = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, sigla, ativo, id]);
    return result.rows[0];
  }

  // Desativar unidade de medida (soft delete)
  static async deactivate(id) {
    const query = `
      UPDATE unidades_de_medida 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Reativar unidade de medida
  static async reactivate(id) {
    const query = `
      UPDATE unidades_de_medida 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verificar se unidade de medida está sendo usada
  static async isInUse(id) {
    const query = `
      SELECT COUNT(*) as count 
      FROM variacoes_produto 
      WHERE id_unidade_controle = $1
      UNION ALL
      SELECT COUNT(*) as count 
      FROM fatores_conversao 
      WHERE id_unidade_medida = $1
    `;
    const result = await pool.query(query, [id, id]);
    const totalCount = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    return totalCount > 0;
  }
}

export default UnidadeMedida;

