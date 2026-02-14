import pool from '../config/database.js';
import { auditService } from '../services/auditService.js';

const pedidosController = {
  // Listar todos os pedidos (com filtro de últimas 24h opcional)
  async getAll(req, res) {
    try {
      const { ultimas24h } = req.query;
      
      let query = `
        SELECT * FROM pedidos 
        WHERE deletado_em IS NULL
      `;
      
      if (ultimas24h === 'true') {
        query += ` AND data_hora >= NOW() - INTERVAL '24 hours'`;
      }
      
      query += ` ORDER BY data_hora DESC`;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar pedidos',
        error: error.message
      });
    }
  },

  // Buscar pedido por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(
        'SELECT * FROM pedidos WHERE id = $1 AND deletado_em IS NULL',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar pedido',
        error: error.message
      });
    }
  },

  // Criar novo pedido
  async create(req, res) {
    try {
      const { numero_pedido, observacao, usuario_email } = req.body;
      
      // Validar número do pedido
      if (!numero_pedido || isNaN(numero_pedido)) {
        return res.status(400).json({
          success: false,
          message: 'Número do pedido inválido'
        });
      }
      
      // Verificar se o número já existe hoje
      const checkResult = await pool.query(
        `SELECT id FROM pedidos 
         WHERE numero_pedido = $1 
         AND data_pedido = CURRENT_DATE 
         AND deletado_em IS NULL`,
        [numero_pedido]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Este número de pedido já existe hoje'
        });
      }
      
      const result = await pool.query(
        `INSERT INTO pedidos (numero_pedido, observacao, usuario_email)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [numero_pedido, observacao, usuario_email]
      );
      
      // Auditoria
      await auditService.log({
        tabela: 'pedidos',
        operacao: 'INSERT',
        registro_id: result.rows[0].id,
        usuario_id: req.user?.id,
        dados_novos: result.rows[0]
      });
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Pedido criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      
      // Tratar erro de constraint unique
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Este número de pedido já existe hoje'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro ao criar pedido',
        error: error.message
      });
    }
  },

  // Atualizar pedido
  async update(req, res) {
    try {
      const { id } = req.params;
      const { observacao, status } = req.body;
      
      // Buscar dados antigos para auditoria
      const oldData = await pool.query(
        'SELECT * FROM pedidos WHERE id = $1',
        [id]
      );
      
      if (oldData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }
      
      const result = await pool.query(
        `UPDATE pedidos 
         SET observacao = COALESCE($1, observacao),
             status = COALESCE($2, status),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [observacao, status, id]
      );
      
      // Auditoria
      await auditService.log({
        tabela: 'pedidos',
        operacao: 'UPDATE',
        registro_id: id,
        usuario_id: req.user?.id,
        dados_antigos: oldData.rows[0],
        dados_novos: result.rows[0]
      });
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Pedido atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar pedido',
        error: error.message
      });
    }
  },

  // Soft delete de pedido
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Buscar dados para auditoria
      const oldData = await pool.query(
        'SELECT * FROM pedidos WHERE id = $1',
        [id]
      );
      
      if (oldData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }
      
      const result = await pool.query(
        `UPDATE pedidos 
         SET status = 'deletado',
             deletado_em = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      
      // Auditoria
      await auditService.log({
        tabela: 'pedidos',
        operacao: 'DELETE',
        registro_id: id,
        usuario_id: req.user?.id,
        dados_antigos: oldData.rows[0],
        dados_novos: result.rows[0]
      });
      
      res.json({
        success: true,
        message: 'Pedido excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir pedido',
        error: error.message
      });
    }
  }
};

export default pedidosController;
