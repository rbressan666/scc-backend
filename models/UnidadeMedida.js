// models/UnidadeMedida.js
import pool from '../config/database.js';

class UnidadeMedida {
  // Criar nova unidade de medida
  static async create(data) {
    const { nome, sigla, quantidade = 1 } = data;
    
    const query = `
      INSERT INTO unidades_de_medida (nome, sigla, quantidade)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, sigla, quantidade]);
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
    console.log('UnidadeMedida.update - ID:', id);
    console.log('UnidadeMedida.update - Data recebida:', data);
    
    const { nome, sigla, quantidade, ativo } = data;
    
    // Construir query dinamicamente para incluir apenas campos fornecidos
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (nome !== undefined && nome !== null) {
      fields.push(`nome = $${paramIndex}`);
      values.push(nome);
      paramIndex++;
    }
    
    if (sigla !== undefined && sigla !== null) {
      fields.push(`sigla = $${paramIndex}`);
      values.push(sigla);
      paramIndex++;
    }
    
    if (quantidade !== undefined && quantidade !== null) {
      fields.push(`quantidade = $${paramIndex}`);
      values.push(parseFloat(quantidade));
      paramIndex++;
    }
    
    if (ativo !== undefined && ativo !== null) {
      fields.push(`ativo = $${paramIndex}`);
      values.push(ativo);
      paramIndex++;
    }
    
    // Sempre atualizar updated_at
    fields.push('updated_at = NOW()');
    
    // Verificar se há campos para atualizar
    if (fields.length === 1) { // Só tem updated_at
      console.log('UnidadeMedida.update - Nenhum campo para atualizar, apenas updated_at');
    }
    
    // Adicionar ID como último parâmetro
    values.push(id);
    
    const query = `
      UPDATE unidades_de_medida 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    console.log('UnidadeMedida.update - Query:', query);
    console.log('UnidadeMedida.update - Values:', values);
    
    try {
      const result = await pool.query(query, values);
      console.log('UnidadeMedida.update - Resultado:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('UnidadeMedida.update - Erro na query:', error);
      throw error;
    }
  }

  // Desativar unidade de medida (soft delete)
  static async deactivate(id) {
    console.log('UnidadeMedida.deactivate - ID:', id);
    
    const query = `
      UPDATE unidades_de_medida 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id]);
      console.log('UnidadeMedida.deactivate - Resultado:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('UnidadeMedida.deactivate - Erro:', error);
      throw error;
    }
  }

  // Reativar unidade de medida
  static async reactivate(id) {
    console.log('UnidadeMedida.reactivate - ID:', id);
    
    const query = `
      UPDATE unidades_de_medida 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id]);
      console.log('UnidadeMedida.reactivate - Resultado:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('UnidadeMedida.reactivate - Erro:', error);
      throw error;
    }
  }

  // Verificar se unidade de medida está sendo usada
  static async isInUse(id) {
    console.log('UnidadeMedida.isInUse - Verificando ID:', id);
    
    try {
      // Verificar em variacoes_produto
      const queryVariacoes = `
        SELECT COUNT(*) as count 
        FROM variacoes_produto 
        WHERE id_unidade_controle = $1
      `;
      
      console.log('UnidadeMedida.isInUse - Query variacoes:', queryVariacoes);
      const resultVariacoes = await pool.query(queryVariacoes, [id]);
      const countVariacoes = parseInt(resultVariacoes.rows[0].count) || 0;
      console.log('UnidadeMedida.isInUse - Count variacoes:', countVariacoes);
      
      // Verificar em fatores_conversao
      const queryFatores = `
        SELECT COUNT(*) as count 
        FROM fatores_conversao 
        WHERE id_unidade_medida = $1
      `;
      
      console.log('UnidadeMedida.isInUse - Query fatores:', queryFatores);
      const resultFatores = await pool.query(queryFatores, [id]);
      const countFatores = parseInt(resultFatores.rows[0].count) || 0;
      console.log('UnidadeMedida.isInUse - Count fatores:', countFatores);
      
      const totalCount = countVariacoes + countFatores;
      const isInUse = totalCount > 0;
      
      console.log('UnidadeMedida.isInUse - Total count:', totalCount);
      console.log('UnidadeMedida.isInUse - Is in use:', isInUse);
      
      return isInUse;
      
    } catch (error) {
      console.error('UnidadeMedida.isInUse - Erro:', error);
      
      // Se as tabelas não existem, assumir que não está em uso
      if (error.code === '42P01') { // relation does not exist
        console.log('UnidadeMedida.isInUse - Tabela não existe, assumindo não está em uso');
        return false;
      }
      
      throw error;
    }
  }
}

export default UnidadeMedida;
