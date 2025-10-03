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
    console.log('Categoria.update - ID:', id);
    console.log('Categoria.update - Data recebida:', data);
    
    // Construir query dinamicamente apenas com campos fornecidos
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (data.nome !== undefined) {
      fields.push(`nome = $${paramCount}`);
      values.push(data.nome);
      paramCount++;
    }
    
    if (data.id_categoria_pai !== undefined) {
      fields.push(`id_categoria_pai = $${paramCount}`);
      values.push(data.id_categoria_pai);
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
      UPDATE categorias 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);
    
    console.log('Categoria.update - Query:', query);
    console.log('Categoria.update - Values:', values);
    
    const result = await pool.query(query, values);
    console.log('Categoria.update - Resultado:', result.rows[0]);
    
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
    console.log('Categoria.isInUse - Verificando ID:', id);
    
    try {
      // Query 1: Verificar produtos que usam esta categoria
      const queryProdutos = `SELECT COUNT(*) as count FROM produtos WHERE id_categoria = $1`;
      console.log('Categoria.isInUse - Query produtos:', queryProdutos);
      const resultProdutos = await pool.query(queryProdutos, [id]);
      const countProdutos = parseInt(resultProdutos.rows[0].count);
      console.log('Categoria.isInUse - Count produtos:', countProdutos);
      
      // Query 2: Verificar subcategorias que usam esta categoria como pai
      const querySubcategorias = `SELECT COUNT(*) as count FROM categorias WHERE id_categoria_pai = $1`;
      console.log('Categoria.isInUse - Query subcategorias:', querySubcategorias);
      const resultSubcategorias = await pool.query(querySubcategorias, [id]);
      const countSubcategorias = parseInt(resultSubcategorias.rows[0].count);
      console.log('Categoria.isInUse - Count subcategorias:', countSubcategorias);
      
      // Total
      const totalCount = countProdutos + countSubcategorias;
      console.log('Categoria.isInUse - Total count:', totalCount);
      
      const isInUse = totalCount > 0;
      console.log('Categoria.isInUse - Resultado:', isInUse);
      
      return isInUse;
      
    } catch (error) {
      console.error('Categoria.isInUse - Erro:', error);
      throw error;
    }
  }
}

export default Categoria;
