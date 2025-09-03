// models/FatorConversao.js
import pool from '../config/database.js';

class FatorConversao {
  // Criar novo fator de conversão
  static async create(data) {
    const { id_variacao_produto, id_unidade_medida, fator } = data;
    
    const query = `
      INSERT INTO fatores_conversao (id_variacao_produto, id_unidade_medida, fator)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [id_variacao_produto, id_unidade_medida, fator]);
    return result.rows[0];
  }

  // Buscar fatores de conversão por variação
  static async findByVariacao(id_variacao_produto) {
    const query = `
      SELECT fc.*, um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM fatores_conversao fc
      LEFT JOIN unidades_de_medida um ON fc.id_unidade_medida = um.id
      WHERE fc.id_variacao_produto = $1
      ORDER BY um.nome ASC
    `;
    
    const result = await pool.query(query, [id_variacao_produto]);
    return result.rows;
  }

  // Buscar fator específico
  static async findById(id) {
    const query = `
      SELECT fc.*, um.nome as unidade_nome, um.sigla as unidade_sigla,
             vp.nome as variacao_nome, p.nome as produto_nome
      FROM fatores_conversao fc
      LEFT JOIN unidades_de_medida um ON fc.id_unidade_medida = um.id
      LEFT JOIN variacoes_produto vp ON fc.id_variacao_produto = vp.id
      LEFT JOIN produtos p ON vp.id_produto = p.id
      WHERE fc.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar fator por variação e unidade
  static async findByVariacaoAndUnidade(id_variacao_produto, id_unidade_medida) {
    const query = `
      SELECT fc.*, um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM fatores_conversao fc
      LEFT JOIN unidades_de_medida um ON fc.id_unidade_medida = um.id
      WHERE fc.id_variacao_produto = $1 AND fc.id_unidade_medida = $2
    `;
    
    const result = await pool.query(query, [id_variacao_produto, id_unidade_medida]);
    return result.rows[0];
  }

  // Atualizar fator de conversão
  static async update(id, data) {
    const { fator } = data;
    
    const query = `
      UPDATE fatores_conversao 
      SET fator = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [fator, id]);
    return result.rows[0];
  }

  // Deletar fator de conversão
  static async delete(id) {
    const query = 'DELETE FROM fatores_conversao WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Deletar todos os fatores de uma variação
  static async deleteByVariacao(id_variacao_produto) {
    const query = 'DELETE FROM fatores_conversao WHERE id_variacao_produto = $1';
    const result = await pool.query(query, [id_variacao_produto]);
    return result.rowCount;
  }

  // Criar múltiplos fatores de conversão
  static async createMultiple(fatores) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const fator of fatores) {
        const query = `
          INSERT INTO fatores_conversao (id_variacao_produto, id_unidade_medida, fator)
          VALUES ($1, $2, $3)
          ON CONFLICT (id_variacao_produto, id_unidade_medida) 
          DO UPDATE SET fator = EXCLUDED.fator, updated_at = NOW()
          RETURNING *
        `;
        
        const result = await client.query(query, [
          fator.id_variacao_produto, 
          fator.id_unidade_medida, 
          fator.fator
        ]);
        
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Converter quantidade entre unidades
  static async convertQuantity(id_variacao_produto, quantidade, id_unidade_origem, id_unidade_destino) {
    // Se as unidades são iguais, não precisa converter
    if (id_unidade_origem === id_unidade_destino) {
      return quantidade;
    }
    
    // Buscar fatores de conversão
    const query = `
      SELECT fc.fator, um.sigla
      FROM fatores_conversao fc
      LEFT JOIN unidades_de_medida um ON fc.id_unidade_medida = um.id
      WHERE fc.id_variacao_produto = $1 
        AND fc.id_unidade_medida IN ($2, $3)
    `;
    
    const result = await pool.query(query, [id_variacao_produto, id_unidade_origem, id_unidade_destino]);
    
    if (result.rows.length < 2) {
      throw new Error('Fatores de conversão não encontrados para as unidades especificadas');
    }
    
    const fatores = {};
    result.rows.forEach(row => {
      fatores[row.id_unidade_medida] = row.fator;
    });
    
    // Converter para unidade base e depois para unidade destino
    const quantidadeBase = quantidade * fatores[id_unidade_origem];
    const quantidadeDestino = quantidadeBase / fatores[id_unidade_destino];
    
    return quantidadeDestino;
  }
}

export default FatorConversao;

