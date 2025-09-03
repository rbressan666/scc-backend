// models/Categoria.js
import pool from '../config/database.js';

class Categoria {
  // Criar nova categoria
  static async create(data) {
    const { nome, id_categoria_pai } = data;
    
    const query = `
      INSERT INTO categorias (nome, id_categoria_pai)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, id_categoria_pai || null]);
    return result.rows[0];
  }

  // Buscar todas as categorias
  static async findAll(includeInactive = false) {
    let query = `
      SELECT c.*, cp.nome as categoria_pai_nome
      FROM categorias c
      LEFT JOIN categorias cp ON c.id_categoria_pai = cp.id
    `;
    
    if (!includeInactive) {
      query += ' WHERE c.ativo = true';
    }
    
    query += ' ORDER BY c.nome ASC';
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Buscar categorias em árvore hierárquica
  static async findTree() {
    const query = `
      WITH RECURSIVE categoria_tree AS (
        -- Categorias raiz (sem pai)
        SELECT id, nome, id_categoria_pai, ativo, 0 as nivel, 
               ARRAY[nome] as caminho
        FROM categorias 
        WHERE id_categoria_pai IS NULL AND ativo = true
        
        UNION ALL
        
        -- Subcategorias
        SELECT c.id, c.nome, c.id_categoria_pai, c.ativo, ct.nivel + 1,
               ct.caminho || c.nome
        FROM categorias c
        INNER JOIN categoria_tree ct ON c.id_categoria_pai = ct.id
        WHERE c.ativo = true
      )
      SELECT * FROM categoria_tree
      ORDER BY caminho
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Buscar categoria por ID
  static async findById(id) {
    const query = `
      SELECT c.*, cp.nome as categoria_pai_nome
      FROM categorias c
      LEFT JOIN categorias cp ON c.id_categoria_pai = cp.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar subcategorias de uma categoria
  static async findChildren(id) {
    const query = `
      SELECT * FROM categorias 
      WHERE id_categoria_pai = $1 AND ativo = true
      ORDER BY nome ASC
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }

  // Atualizar categoria
  static async update(id, data) {
    const { nome, id_categoria_pai, ativo } = data;
    
    const query = `
      UPDATE categorias 
      SET nome = $1, id_categoria_pai = $2, ativo = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [nome, id_categoria_pai || null, ativo, id]);
    return result.rows[0];
  }

  // Desativar categoria (soft delete)
  static async deactivate(id) {
    const query = `
      UPDATE categorias 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Reativar categoria
  static async reactivate(id) {
    const query = `
      UPDATE categorias 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verificar se categoria está sendo usada
  static async isInUse(id) {
    const query = `
      SELECT COUNT(*) as count 
      FROM produtos 
      WHERE id_categoria = $1
      UNION ALL
      SELECT COUNT(*) as count 
      FROM categorias 
      WHERE id_categoria_pai = $1
    `;
    const result = await pool.query(query, [id, id]);
    const totalCount = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    return totalCount > 0;
  }
}

export default Categoria;

