import pool from '../config/database.js';
import { auditService } from '../services/auditService.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hasColumn = async (tableName, columnName) => {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return result.rows.length > 0;
};

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
  },

  // Upload de imagem de propaganda (base64)
  async uploadImagemPropaganda(req, res) {
    try {
      const { imageBase64, nome } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'imageBase64 é obrigatório'
        });
      }

      const match = imageBase64.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/i);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Formato inválido. Use PNG/JPG/JPEG em base64'
        });
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[3];
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Imagem muito grande (máximo 5MB)'
        });
      }

      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const fileName = `propaganda_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const propagandaDir = join(__dirname, '..', 'public', 'images', 'propaganda');
      const filePath = join(propagandaDir, fileName);

      await fs.mkdir(propagandaDir, { recursive: true });
      await fs.writeFile(filePath, buffer);

      const urlArquivo = `/images/propaganda/${fileName}`;
      const ordemExists = await hasColumn('midia_propaganda', 'ordem');
      const deletadoEmExists = await hasColumn('midia_propaganda', 'deletado_em');

      let result;
      if (ordemExists) {
        const ordemRes = await pool.query(
          `SELECT COALESCE(MAX(ordem), -1) + 1 AS proxima_ordem
           FROM midia_propaganda
           WHERE tipo = 'imagem' ${deletadoEmExists ? 'AND deletado_em IS NULL' : ''}`
        );
        const proximaOrdem = Number(ordemRes.rows[0]?.proxima_ordem ?? 0);

        result = await pool.query(
          `INSERT INTO midia_propaganda (nome, tipo, url_arquivo, tamanho_bytes, mime_type, ativa, ordem)
           VALUES ($1, 'imagem', $2, $3, $4, true, $5)
           RETURNING *`,
          [nome || fileName, urlArquivo, buffer.length, mimeType, proximaOrdem]
        );
      } else {
        result = await pool.query(
          `INSERT INTO midia_propaganda (nome, tipo, url_arquivo, tamanho_bytes, mime_type, ativa)
           VALUES ($1, 'imagem', $2, $3, $4, true)
           RETURNING *`,
          [nome || fileName, urlArquivo, buffer.length, mimeType]
        );
      }

      const urlPublica = `${req.protocol}://${req.get('host')}${urlArquivo}`;

      res.status(201).json({
        success: true,
        data: {
          ...result.rows[0],
          url_publica: urlPublica
        },
        message: 'Imagem de propaganda enviada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem de propaganda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload da imagem de propaganda',
        error: error.message
      });
    }
  },

  // Listar mídias de propaganda
  async listMidias(req, res) {
    try {
      const { tipo } = req.query;
      const params = [];
      const deletadoEmExists = await hasColumn('midia_propaganda', 'deletado_em');
      const ordemExists = await hasColumn('midia_propaganda', 'ordem');
      let query = `
        SELECT * FROM midia_propaganda
        WHERE 1=1
      `;

      if (deletadoEmExists) {
        query += ' AND deletado_em IS NULL';
      }

      if (tipo) {
        params.push(tipo);
        query += ` AND LOWER(TRIM(tipo)) = LOWER(TRIM($${params.length}))`;
      }

      query += ordemExists ? ' ORDER BY ordem ASC, created_at DESC' : ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);

      const data = result.rows.map((row) => ({
        ...row,
        url_publica: `${req.protocol}://${req.get('host')}${row.url_arquivo}`
      }));

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Erro ao listar mídias de propaganda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar mídias de propaganda',
        error: error.message
      });
    }
  },

  // Reordenar mídias de propaganda
  async reorderMidias(req, res) {
    const client = await pool.connect();
    try {
      const { orderedIds } = req.body;

      const ordemExists = await hasColumn('midia_propaganda', 'ordem');
      if (!ordemExists) {
        return res.status(400).json({
          success: false,
          message: 'A coluna ordem não existe em midia_propaganda. Aplique a migration antes de reordenar.'
        });
      }

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'orderedIds deve ser um array com ao menos um ID'
        });
      }

      await client.query('BEGIN');

      for (let i = 0; i < orderedIds.length; i += 1) {
        await client.query(
          `UPDATE midia_propaganda
           SET ordem = $1, updated_at = NOW()
           WHERE id = $2 AND deletado_em IS NULL`,
          [i, orderedIds[i]]
        );
      }

      await client.query('COMMIT');

      const result = await pool.query(
        `SELECT * FROM midia_propaganda
         WHERE deletado_em IS NULL
         ORDER BY ordem ASC, created_at DESC`
      );

      res.json({
        success: true,
        data: result.rows,
        message: 'Ordem das mídias atualizada com sucesso'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao reordenar mídias de propaganda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao reordenar mídias de propaganda',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Excluir mídia de propaganda (soft delete + tentativa de remover arquivo)
  async deleteMidia(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const hasDeletadoEm = await hasColumn('midia_propaganda', 'deletado_em');
      const hasAtiva = await hasColumn('midia_propaganda', 'ativa');
      const hasUpdatedAt = await hasColumn('midia_propaganda', 'updated_at');

      const mediaRes = await client.query(
        `SELECT id, url_arquivo, tipo
         FROM midia_propaganda
         WHERE id = $1`,
        [id]
      );

      if (mediaRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mídia não encontrada'
        });
      }

      const midia = mediaRes.rows[0];

      await client.query('BEGIN');

      const updateSet = [];
      if (hasDeletadoEm) updateSet.push('deletado_em = NOW()');
      if (hasAtiva) updateSet.push('ativa = false');
      if (hasUpdatedAt) updateSet.push('updated_at = NOW()');

      if (updateSet.length === 0) {
        await client.query('DELETE FROM midia_propaganda WHERE id = $1', [id]);
      } else {
        await client.query(
          `UPDATE midia_propaganda
           SET ${updateSet.join(', ')}
           WHERE id = $1`,
          [id]
        );
      }

      await client.query(
        `UPDATE parametros_app_pedidos_propaganda
         SET imagem_fundo_id = NULL,
             updated_at = NOW()
         WHERE imagem_fundo_id = $1`,
        [id]
      );

      await client.query(
        `UPDATE parametros_app_pedidos_propaganda
         SET video_propaganda_id = NULL,
             updated_at = NOW()
         WHERE video_propaganda_id = $1`,
        [id]
      );

      await client.query('COMMIT');

      if (midia.url_arquivo?.startsWith('/images/')) {
        const localPath = join(__dirname, '..', 'public', midia.url_arquivo.replace('/images/', 'images/'));
        try {
          await fs.unlink(localPath);
        } catch {
          // ignora se arquivo já não existir
        }
      }

      res.json({
        success: true,
        message: 'Mídia excluída com sucesso'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao excluir mídia de propaganda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir mídia de propaganda',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Ativar/desativar mídia na sequência de exibição
  async setMidiaAtiva(req, res) {
    try {
      const { id } = req.params;
      const { ativa } = req.body;

      if (typeof ativa !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Campo ativa deve ser boolean'
        });
      }

      const hasAtiva = await hasColumn('midia_propaganda', 'ativa');
      if (!hasAtiva) {
        return res.status(400).json({
          success: false,
          message: 'Coluna ativa não existe em midia_propaganda'
        });
      }

      const hasUpdatedAt = await hasColumn('midia_propaganda', 'updated_at');
      const result = await pool.query(
        `UPDATE midia_propaganda
         SET ativa = $1${hasUpdatedAt ? ', updated_at = NOW()' : ''}
         WHERE id = $2
         RETURNING *`,
        [ativa, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mídia não encontrada'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: ativa ? 'Imagem incluída na sequência' : 'Imagem removida da sequência'
      });
    } catch (error) {
      console.error('Erro ao atualizar status ativo da mídia:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status da mídia',
        error: error.message
      });
    }
  },

  // Diagnóstico de mídia propaganda (DB + arquivo local)
  async diagnosticoMidias(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, nome, tipo, url_arquivo, ordem, created_at
         FROM midia_propaganda
         ORDER BY created_at DESC
         LIMIT 30`
      );

      const itens = await Promise.all(result.rows.map(async (row) => {
        let arquivoExiste = null;
        if (row.url_arquivo?.startsWith('/images/')) {
          const localPath = join(__dirname, '..', 'public', row.url_arquivo.replace('/images/', 'images/'));
          try {
            await fs.access(localPath);
            arquivoExiste = true;
          } catch {
            arquivoExiste = false;
          }
        }

        return {
          ...row,
          url_publica: `${req.protocol}://${req.get('host')}${row.url_arquivo}`,
          arquivo_existe_no_container: arquivoExiste
        };
      }));

      res.json({
        success: true,
        total: itens.length,
        data: itens
      });
    } catch (error) {
      console.error('Erro no diagnóstico de mídias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro no diagnóstico de mídias',
        error: error.message
      });
    }
  }
};

export default parametrosController;
