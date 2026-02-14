import pool from '../config/database.js';
import { auditService } from '../services/auditService.js';

const parametrosController = {
  // Buscar parâmetros atuais
  async get(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM parametros_app_pedidos_propaganda ORDER BY created_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        // Se não existir, retornar padrões
        return res.json({
          success: true,
          data: {
            id: null,
            autostart: true,
            modo_exibicao: 'pedidos-propaganda',
            intervalo_exibicao_seg: 10,
            exibir_numero_pedido: true,
            exibir_observacao_pedido: true,
            cor_fundo_principal: '#000000',
            cor_texto_principal: '#FFFFFF',
            cor_destaque_numero: '#FFD700',
            imagem_fundo_id: null,
            video_propaganda_id: null,
            som_notificacao_novos_pedidos_id: null,
            ativa: true,
            atualizado_por_email: null
          }
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Erro ao buscar parâmetros:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar parâmetros',
        error: error.message
      });
    }
  },

  // Atualizar parâmetros
  async update(req, res) {
    try {
      const {
        autostart,
        modo_exibicao,
        intervalo_exibicao_seg,
        exibir_numero_pedido,
        exibir_observacao_pedido,
        cor_fundo_principal,
        cor_texto_principal,
        cor_destaque_numero,
        imagem_fundo_id,
        video_propaganda_id,
        som_notificacao_novos_pedidos_id,
        ativa
      } = req.body;
      
      // Buscar parâmetros atuais para auditoria
      const oldData = await pool.query(
        'SELECT * FROM parametros_app_pedidos_propaganda ORDER BY created_at DESC LIMIT 1'
      );
      
      if (oldData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parâmetros não encontrados'
        });
      }
      
      const parametroId = oldData.rows[0].id;
      
      // Preparar campos para atualização
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (autostart !== undefined) {
        updates.push(`autostart = $${paramIndex++}`);
        values.push(autostart);
      }
      if (modo_exibicao !== undefined) {
        updates.push(`modo_exibicao = $${paramIndex++}`);
        values.push(modo_exibicao);
      }
      if (intervalo_exibicao_seg !== undefined) {
        updates.push(`intervalo_exibicao_seg = $${paramIndex++}`);
        values.push(intervalo_exibicao_seg);
      }
      if (exibir_numero_pedido !== undefined) {
        updates.push(`exibir_numero_pedido = $${paramIndex++}`);
        values.push(exibir_numero_pedido);
      }
      if (exibir_observacao_pedido !== undefined) {
        updates.push(`exibir_observacao_pedido = $${paramIndex++}`);
        values.push(exibir_observacao_pedido);
      }
      if (cor_fundo_principal !== undefined) {
        updates.push(`cor_fundo_principal = $${paramIndex++}`);
        values.push(cor_fundo_principal);
      }
      if (cor_texto_principal !== undefined) {
        updates.push(`cor_texto_principal = $${paramIndex++}`);
        values.push(cor_texto_principal);
      }
      if (cor_destaque_numero !== undefined) {
        updates.push(`cor_destaque_numero = $${paramIndex++}`);
        values.push(cor_destaque_numero);
      }
      if (imagem_fundo_id !== undefined) {
        updates.push(`imagem_fundo_id = $${paramIndex++}`);
        values.push(imagem_fundo_id);
      }
      if (video_propaganda_id !== undefined) {
        updates.push(`video_propaganda_id = $${paramIndex++}`);
        values.push(video_propaganda_id);
      }
      if (som_notificacao_novos_pedidos_id !== undefined) {
        updates.push(`som_notificacao_novos_pedidos_id = $${paramIndex++}`);
        values.push(som_notificacao_novos_pedidos_id);
      }
      if (ativa !== undefined) {
        updates.push(`ativa = $${paramIndex++}`);
        values.push(ativa);
      }
      
      // Se nenhum campo foi atualizado
      if (updates.length === 0) {
        return res.json({
          success: true,
          data: oldData.rows[0],
          message: 'Nenhuma alteração realizada'
        });
      }
      
      // Adicionar email do usuário que fez a alteração
      if (req.user?.email) {
        updates.push(`atualizado_por_email = $${paramIndex++}`);
        values.push(req.user.email);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(parametroId);
      
      const query = `
        UPDATE parametros_app_pedidos_propaganda
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      // Auditoria detalhada - log de alterações individuais
      const old = oldData.rows[0];
      const novo = result.rows[0];
      
      const alteracoes = [];
      Object.keys(novo).forEach(campo => {
        if (old[campo] !== novo[campo] && campo !== 'updated_at') {
          alteracoes.push({
            parametro: campo,
            valor_anterior: old[campo],
            valor_novo: novo[campo]
          });
        }
      });
      
      // Salvar log de alterações
      for (const alt of alteracoes) {
        await pool.query(
          `INSERT INTO log_alteracoes_propaganda 
           (usuario_email, parametro_alterado, valor_anterior, valor_novo)
           VALUES ($1, $2, $3, $4)`,
          [req.user?.email, alt.parametro, alt.valor_anterior, alt.valor_novo]
        );
      }
      
      // Auditoria geral
      await auditService.log({
        tabela: 'parametros_app_pedidos_propaganda',
        operacao: 'UPDATE',
        registro_id: parametroId,
        usuario_id: req.user?.id,
        dados_antigos: old,
        dados_novos: novo
      });
      
      res.json({
        success: true,
        data: result.rows[0],
        alteracoes: alteracoes.length,
        message: 'Parâmetros atualizados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar parâmetros:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar parâmetros',
        error: error.message
      });
    }
  },

  // Listar histórico de alterações
  async getHistoricoAlteracoes(req, res) {
    try {
      const { limit = 50 } = req.query;
      
      const result = await pool.query(
        `SELECT * FROM log_alteracoes_propaganda 
         ORDER BY created_at DESC 
         LIMIT $1`,
        [limit]
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico de alterações',
        error: error.message
      });
    }
  }
};

export default parametrosController;
