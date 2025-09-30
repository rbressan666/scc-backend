// models/Produto.js
import pool from '../config/database.js';

class Produto {
  // Criar novo produto
  static async create(data) {
    const { nome, id_categoria, id_setor } = data;
    
    const query = `
      INSERT INTO produtos (nome, id_categoria, id_setor)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, id_categoria, id_setor]);
    return result.rows[0];
  }

  // Buscar todos os produtos
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, c.nome as categoria_nome, s.nome as setor_nome,
             COUNT(vp.id) as total_variacoes
      FROM produtos p
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN setores s ON p.id_setor = s.id
      LEFT JOIN variacoes_produto vp ON p.id = vp.id_produto AND vp.ativo = true
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (!filters.includeInactive) {
      conditions.push('p.ativo = true');
    }
    
    if (filters.id_setor) {
      conditions.push(`p.id_setor = $${paramIndex}`);
      params.push(filters.id_setor);
      paramIndex++;
    }
    
    if (filters.id_categoria) {
      conditions.push(`p.id_categoria = $${paramIndex}`);
      params.push(filters.id_categoria);
      paramIndex++;
    }
    
    if (filters.nome) {
      conditions.push(`p.nome ILIKE $${paramIndex}`);
      params.push(`%${filters.nome}%`);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY p.id, c.nome, s.nome ORDER BY p.nome ASC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Buscar produto por ID com suas variações
  static async findById(id) {
    const produtoQuery = `
      SELECT p.*, c.nome as categoria_nome, s.nome as setor_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN setores s ON p.id_setor = s.id
      WHERE p.id = $1
    `;
    
    const variacoesQuery = `
      SELECT vp.*, um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM variacoes_produto vp
      LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
      WHERE vp.id_produto = $1 AND vp.ativo = true
      ORDER BY vp.nome ASC
    `;
    
    const [produtoResult, variacoesResult] = await Promise.all([
      pool.query(produtoQuery, [id]),
      pool.query(variacoesQuery, [id])
    ]);
    
    if (produtoResult.rows.length === 0) {
      return null;
    }
    
    const produto = produtoResult.rows[0];
    produto.variacoes = variacoesResult.rows;
    
    return produto;
  }

  // Atualizar produto
  static async update(id, data) {
    const { nome, id_categoria, id_setor, ativo, imagem_principal_url } = data;
    
    // Construir query dinamicamente para incluir apenas campos fornecidos
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (nome !== undefined) {
      fields.push(`nome = $${paramIndex}`);
      values.push(nome);
      paramIndex++;
    }
    
    if (id_categoria !== undefined) {
      fields.push(`id_categoria = $${paramIndex}`);
      values.push(id_categoria);
      paramIndex++;
    }
    
    if (id_setor !== undefined) {
      fields.push(`id_setor = $${paramIndex}`);
      values.push(id_setor);
      paramIndex++;
    }
    
    if (ativo !== undefined) {
      fields.push(`ativo = $${paramIndex}`);
      values.push(ativo);
      paramIndex++;
    }
    
    if (imagem_principal_url !== undefined) {
      fields.push(`imagem_principal_url = $${paramIndex}`);
      values.push(imagem_principal_url);
      paramIndex++;
    }
    
    // Sempre atualizar updated_at
    fields.push('updated_at = NOW()');
    
    // Adicionar ID como último parâmetro
    values.push(id);
    
    const query = `
      UPDATE produtos 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Desativar produto (soft delete)
  static async deactivate(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Desativar todas as variações do produto
      await client.query(`
        UPDATE variacoes_produto 
        SET ativo = false, updated_at = NOW()
        WHERE id_produto = $1
      `, [id]);
      
      // Desativar o produto
      const result = await client.query(`
        UPDATE produtos 
        SET ativo = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reativar produto
  static async reactivate(id) {
    const query = `
      UPDATE produtos 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verificar se produto tem variações
  static async hasVariations(id) {
    const query = 'SELECT COUNT(*) as count FROM variacoes_produto WHERE id_produto = $1';
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count) > 0;
  }
}

export default Produto;

