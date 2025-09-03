// models/VariacaoProduto.js
import pool from '../config/database.js';

class VariacaoProduto {
  // Criar nova variação de produto
  static async create(data) {
    const { 
      id_produto, 
      nome, 
      estoque_atual, 
      estoque_minimo, 
      preco_custo, 
      fator_prioridade, 
      id_unidade_controle 
    } = data;
    
    const query = `
      INSERT INTO variacoes_produto (
        id_produto, nome, estoque_atual, estoque_minimo, 
        preco_custo, fator_prioridade, id_unidade_controle
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      id_produto, nome, estoque_atual || 0, estoque_minimo || 0,
      preco_custo || 0, fator_prioridade || 3, id_unidade_controle
    ]);
    
    return result.rows[0];
  }

  // Buscar todas as variações
  static async findAll(filters = {}) {
    let query = `
      SELECT vp.*, p.nome as produto_nome, c.nome as categoria_nome, 
             s.nome as setor_nome, um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM variacoes_produto vp
      LEFT JOIN produtos p ON vp.id_produto = p.id
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN setores s ON p.id_setor = s.id
      LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (!filters.includeInactive) {
      conditions.push('vp.ativo = true AND p.ativo = true');
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
      conditions.push(`(vp.nome ILIKE $${paramIndex} OR p.nome ILIKE $${paramIndex})`);
      params.push(`%${filters.nome}%`);
      paramIndex++;
    }
    
    if (filters.estoque_baixo) {
      conditions.push('vp.estoque_atual <= vp.estoque_minimo');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY p.nome ASC, vp.nome ASC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Buscar variação por ID
  static async findById(id) {
    const query = `
      SELECT vp.*, p.nome as produto_nome, c.nome as categoria_nome, 
             s.nome as setor_nome, um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM variacoes_produto vp
      LEFT JOIN produtos p ON vp.id_produto = p.id
      LEFT JOIN categorias c ON p.id_categoria = c.id
      LEFT JOIN setores s ON p.id_setor = s.id
      LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
      WHERE vp.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar variações por produto
  static async findByProduct(id_produto) {
    const query = `
      SELECT vp.*, um.nome as unidade_nome, um.sigla as unidade_sigla
      FROM variacoes_produto vp
      LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
      WHERE vp.id_produto = $1 AND vp.ativo = true
      ORDER BY vp.nome ASC
    `;
    
    const result = await pool.query(query, [id_produto]);
    return result.rows;
  }

  // Atualizar variação
  static async update(id, data) {
    const { 
      nome, 
      estoque_atual, 
      estoque_minimo, 
      preco_custo, 
      fator_prioridade, 
      id_unidade_controle,
      ativo 
    } = data;
    
    const query = `
      UPDATE variacoes_produto 
      SET nome = $1, estoque_atual = $2, estoque_minimo = $3, 
          preco_custo = $4, fator_prioridade = $5, id_unidade_controle = $6,
          ativo = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      nome, estoque_atual, estoque_minimo, preco_custo, 
      fator_prioridade, id_unidade_controle, ativo, id
    ]);
    
    return result.rows[0];
  }

  // Atualizar estoque
  static async updateStock(id, novoEstoque) {
    const query = `
      UPDATE variacoes_produto 
      SET estoque_atual = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [novoEstoque, id]);
    return result.rows[0];
  }

  // Desativar variação (soft delete)
  static async deactivate(id) {
    const query = `
      UPDATE variacoes_produto 
      SET ativo = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Reativar variação
  static async reactivate(id) {
    const query = `
      UPDATE variacoes_produto 
      SET ativo = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar variações com estoque baixo
  static async findLowStock() {
    const query = `
      SELECT vp.*, p.nome as produto_nome, s.nome as setor_nome
      FROM variacoes_produto vp
      LEFT JOIN produtos p ON vp.id_produto = p.id
      LEFT JOIN setores s ON p.id_setor = s.id
      WHERE vp.ativo = true AND p.ativo = true 
        AND vp.estoque_atual <= vp.estoque_minimo
      ORDER BY vp.fator_prioridade DESC, p.nome ASC, vp.nome ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

export default VariacaoProduto;

