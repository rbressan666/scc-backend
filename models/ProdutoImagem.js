// models/ProdutoImagem.js
import db from '../config/database.js';

class ProdutoImagem {
  /**
   * Criar nova imagem de produto
   */
  static async create(imagemData) {
    const query = `
      INSERT INTO produto_imagens (
        id_produto, url_imagem, tipo_imagem, origem, descricao,
        largura, altura, tamanho_bytes, hash_imagem, features_vector,
        confianca_score, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      imagemData.id_produto,
      imagemData.url_imagem,
      imagemData.tipo_imagem || 'referencia',
      imagemData.origem || 'upload',
      imagemData.descricao || null,
      imagemData.largura || null,
      imagemData.altura || null,
      imagemData.tamanho_bytes || null,
      imagemData.hash_imagem || null,
      imagemData.features_vector || null,
      imagemData.confianca_score || null,
      imagemData.ativo !== undefined ? imagemData.ativo : true
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar imagem de produto:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as imagens de um produto
   */
  static async findByProduct(idProduto, includeInactive = false) {
    let query = `
      SELECT 
        pi.*,
        p.nome as produto_nome
      FROM produto_imagens pi
      JOIN produtos p ON pi.id_produto = p.id
      WHERE pi.id_produto = $1
    `;
    
    if (!includeInactive) {
      query += ' AND pi.ativo = true';
    }
    
    query += ' ORDER BY pi.tipo_imagem DESC, pi.created_at DESC';
    
    try {
      const result = await db.query(query, [idProduto]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar imagens do produto:', error);
      throw error;
    }
  }

  /**
   * Buscar imagem por ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        pi.*,
        p.nome as produto_nome
      FROM produto_imagens pi
      JOIN produtos p ON pi.id_produto = p.id
      WHERE pi.id = $1
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar imagem por ID:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as imagens de referência para reconhecimento
   */
  static async findAllForRecognition() {
    const query = `
      SELECT 
        pi.*,
        p.nome as produto_nome,
        p.id as produto_id
      FROM produto_imagens pi
      JOIN produtos p ON pi.id_produto = p.id
      WHERE pi.ativo = true 
        AND p.ativo = true
        AND pi.tipo_imagem IN ('principal', 'referencia')
      ORDER BY pi.tipo_imagem DESC, pi.confianca_score DESC NULLS LAST
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar imagens para reconhecimento:', error);
      throw error;
    }
  }

  /**
   * Definir imagem como principal
   */
  static async setPrincipal(id, idProduto) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Remover status principal de outras imagens do mesmo produto
      await client.query(
        'UPDATE produto_imagens SET tipo_imagem = $1 WHERE id_produto = $2 AND tipo_imagem = $3',
        ['referencia', idProduto, 'principal']
      );
      
      // Definir nova imagem principal
      const result = await client.query(
        'UPDATE produto_imagens SET tipo_imagem = $1, updated_at = NOW() WHERE id = $2 AND id_produto = $3 RETURNING *',
        ['principal', id, idProduto]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao definir imagem principal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Atualizar imagem
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    // Campos permitidos para atualização
    const allowedFields = [
      'descricao', 'tipo_imagem', 'origem', 'largura', 'altura',
      'tamanho_bytes', 'features_vector', 'confianca_score', 'ativo'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE produto_imagens 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      throw error;
    }
  }

  /**
   * Desativar imagem
   */
  static async deactivate(id) {
    const query = `
      UPDATE produto_imagens 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao desativar imagem:', error);
      throw error;
    }
  }

  /**
   * Deletar imagem permanentemente
   */
  static async delete(id) {
    const query = 'DELETE FROM produto_imagens WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }

  /**
   * Buscar imagens por hash (evitar duplicatas)
   */
  static async findByHash(hash) {
    const query = `
      SELECT * FROM produto_imagens 
      WHERE hash_imagem = $1 AND ativo = true
    `;
    
    try {
      const result = await db.query(query, [hash]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar por hash:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de imagens
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_imagens,
        COUNT(CASE WHEN tipo_imagem = 'principal' THEN 1 END) as principais,
        COUNT(CASE WHEN tipo_imagem = 'referencia' THEN 1 END) as referencias,
        COUNT(CASE WHEN origem = 'internet_search' THEN 1 END) as da_internet,
        COUNT(CASE WHEN origem = 'user_capture' THEN 1 END) as do_usuario,
        COUNT(DISTINCT id_produto) as produtos_com_imagem,
        AVG(tamanho_bytes) as tamanho_medio,
        SUM(tamanho_bytes) as tamanho_total
      FROM produto_imagens 
      WHERE ativo = true
    `;
    
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Limpar imagens órfãs
   */
  static async cleanupOrphaned() {
    const query = `
      UPDATE produto_imagens 
      SET ativo = false, updated_at = NOW()
      WHERE id_produto NOT IN (SELECT id FROM produtos WHERE ativo = true)
        AND ativo = true
      RETURNING count(*)
    `;
    
    try {
      const result = await db.query(query);
      return result.rowCount;
    } catch (error) {
      console.error('Erro ao limpar imagens órfãs:', error);
      throw error;
    }
  }

  /**
   * Buscar produtos sem imagem principal
   */
  static async findProductsWithoutMainImage() {
    const query = `
      SELECT p.id, p.nome
      FROM produtos p
      LEFT JOIN produto_imagens pi ON p.id = pi.id_produto 
        AND pi.tipo_imagem = 'principal' 
        AND pi.ativo = true
      WHERE p.ativo = true 
        AND pi.id IS NULL
      ORDER BY p.nome
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar produtos sem imagem:', error);
      throw error;
    }
  }
}

export default ProdutoImagem;

