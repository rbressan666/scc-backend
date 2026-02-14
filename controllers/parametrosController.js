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
        return res.status(404).json({
          success: false,
          message: 'Parâmetros não encontrados'
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
        iniciar_com_android,
        modo_exibicao,
        tipo_fundo,
        cor_fundo,
        caminho_imagem_fundo,
        cor_fonte,
        nome_fonte,
        tempo_exibicao_pedido,
        intervalo_consulta_pedidos,
        notificar_som,
        caminho_som_notificacao,
        tempo_inicio_propaganda,
        ordem_imagens_propaganda
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
      
      if (iniciar_com_android !== undefined) {
        updates.push(`iniciar_com_android = $${paramIndex++}`);
        values.push(iniciar_com_android);
      }
      if (modo_exibicao !== undefined) {
        updates.push(`modo_exibicao = $${paramIndex++}`);
        values.push(modo_exibicao);
      }
      if (tipo_fundo !== undefined) {
        updates.push(`tipo_fundo = $${paramIndex++}`);
        values.push(tipo_fundo);
      }
      if (cor_fundo !== undefined) {
        updates.push(`cor_fundo = $${paramIndex++}`);
        values.push(cor_fundo);
      }
      if (caminho_imagem_fundo !== undefined) {
        updates.push(`caminho_imagem_fundo = $${paramIndex++}`);
        values.push(caminho_imagem_fundo);
      }
      if (cor_fonte !== undefined) {
        updates.push(`cor_fonte = $${paramIndex++}`);
        values.push(cor_fonte);
      }
      if (nome_fonte !== undefined) {
        updates.push(`nome_fonte = $${paramIndex++}`);
        values.push(nome_fonte);
      }
      if (tempo_exibicao_pedido !== undefined) {
        updates.push(`tempo_exibicao_pedido = $${paramIndex++}`);
        values.push(tempo_exibicao_pedido);
      }
      if (intervalo_consulta_pedidos !== undefined) {
        updates.push(`intervalo_consulta_pedidos = $${paramIndex++}`);
        values.push(intervalo_consulta_pedidos);
      }
      if (notificar_som !== undefined) {
        updates.push(`notificar_som = $${paramIndex++}`);
        values.push(notificar_som);
      }
      if (caminho_som_notificacao !== undefined) {
        updates.push(`caminho_som_notificacao = $${paramIndex++}`);
        values.push(caminho_som_notificacao);
      }
      if (tempo_inicio_propaganda !== undefined) {
        updates.push(`tempo_inicio_propaganda = $${paramIndex++}`);
        values.push(tempo_inicio_propaganda);
      }
      if (ordem_imagens_propaganda !== undefined) {
        updates.push(`ordem_imagens_propaganda = $${paramIndex++}`);
        values.push(ordem_imagens_propaganda);
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
