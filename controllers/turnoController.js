import pool from '../config/database.js';
import { enqueueNotification } from '../services/notificationsService.js';
import FatorConversao from '../models/FatorConversao.js';

export const createTurno = async (req, res) => {
    try {
        const { data_turno, tipo_turno, horario_inicio, observacoes_abertura } = req.body;
        const usuario_abertura = req.user.id;

        // Verificar se já existe um turno aberto
        const turnoAberto = await pool.query(
            'SELECT id FROM turnos WHERE status = $1',
            ['aberto']
        );

        if (turnoAberto.rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Já existe um turno aberto. Feche o turno atual antes de abrir um novo.' 
            });
        }

        // Usar valores padrão se não fornecidos
        const dataAtual = new Date();
        const dataTurno = data_turno || dataAtual.toISOString().split('T')[0];
        const tipoTurno = tipo_turno || 'diurno';
        const horarioInicio = horario_inicio || dataAtual.toISOString();
        const observacoes = observacoes_abertura || 'Turno criado pelo sistema';

        const newTurno = await pool.query(
            'INSERT INTO turnos (data_turno, tipo_turno, horario_inicio, usuario_abertura, observacoes_abertura, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [dataTurno, tipoTurno, horarioInicio, usuario_abertura, observacoes, 'aberto']
        );
        
        // Notificar administradores (e o usuário que abriu) sobre abertura de turno (simplificado)
        try {
            const adminUsers = await pool.query("SELECT id, email FROM usuarios WHERE ativo = true AND perfil = 'admin'");
            const whenUtc = new Date().toISOString();
            for (const u of adminUsers.rows) {
                await enqueueNotification({
                    userId: u.id,
                    type: 'admin_notice',
                    scheduledAtUtc: whenUtc,
                    subject: `Turno aberto (${tipoTurno})`,
                    html: `<p>O turno ${tipoTurno} foi aberto por ${usuario_abertura} em ${new Date(horarioInicio).toLocaleString()}.</p>`,
                    text: `Turno ${tipoTurno} aberto.`,
                    pushPayload: { title: 'Turno aberto', body: `Turno ${tipoTurno} aberto.` }
                });
            }
        } catch (e) { console.error('Falha ao enfileirar admin_notice abertura de turno', e); }

        res.status(201).json({
            success: true,
            message: 'Turno criado com sucesso',
            data: newTurno.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar turno:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
};

export const getAllTurnos = async (req, res) => {
    try {
        const allTurnos = await pool.query('SELECT * FROM turnos ORDER BY data_turno DESC, horario_inicio DESC');
        res.status(200).json({
            success: true,
            data: allTurnos.rows
        });
    } catch (error) {
        console.error('Erro ao buscar turnos:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao buscar turnos',
            error: error.message 
        });
    }
};

export const getTurnoById = async (req, res) => {
    const { id } = req.params;
    try {
        const turno = await pool.query('SELECT * FROM turnos WHERE id = $1', [id]);
        if (turno.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Turno não encontrado' 
            });
        }
        res.status(200).json({
            success: true,
            data: turno.rows[0]
        });
    } catch (error) {
        console.error('Erro ao buscar turno por ID:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao buscar turno',
            error: error.message 
        });
    }
};

export const closeTurno = async (req, res) => {
    const { id } = req.params;
    const { observacoes_fechamento } = req.body;
    const usuario_fechamento = req.user.id;

    try {
        const updatedTurno = await pool.query(
            'UPDATE turnos SET status = $1, horario_fim = $2, usuario_fechamento = $3, observacoes_fechamento = $4 WHERE id = $5 RETURNING *',
            ['fechado', new Date(), usuario_fechamento, observacoes_fechamento, id]
        );
        
        if (updatedTurno.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno não encontrado'
            });
        }
        // Notificar admins sobre fechamento do turno
        try {
            const adminUsers = await pool.query("SELECT id, email FROM usuarios WHERE ativo = true AND perfil = 'admin'");
            const whenUtc = new Date().toISOString();
            for (const u of adminUsers.rows) {
                await enqueueNotification({
                    userId: u.id,
                    type: 'admin_notice',
                    scheduledAtUtc: whenUtc,
                    subject: `Turno fechado (#${id})`,
                    html: `<p>O turno #${id} foi fechado por ${usuario_fechamento} em ${new Date().toLocaleString()}.</p>`,
                    text: `Turno #${id} fechado.`,
                    pushPayload: { title: 'Turno fechado', body: `Turno #${id} fechado.` }
                });
            }
        } catch (e) { console.error('Falha ao enfileirar admin_notice fechamento de turno', e); }
        
        res.status(200).json({
            success: true,
            message: 'Turno fechado com sucesso',
            data: updatedTurno.rows[0]
        });
    } catch (error) {
        console.error('Erro ao fechar turno:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao fechar turno',
            error: error.message 
        });
    }
};

export const reopenTurno = async (req, res) => {
    const { id } = req.params;

    try {
        const updatedTurno = await pool.query(
            'UPDATE turnos SET status = $1, horario_fim = $2, usuario_fechamento = $3 WHERE id = $4 RETURNING *',
            ['aberto', null, null, id]
        );
        res.status(200).json(updatedTurno.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCurrentTurno = async (req, res) => {
    try {
        const turnoAtual = await pool.query('SELECT * FROM turnos WHERE status = $1', ['aberto']);
        if (turnoAtual.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Nenhum turno aberto encontrado' 
            });
        }
        res.status(200).json({
            success: true,
            data: turnoAtual.rows[0]
        });
    } catch (error) {
        console.error('Erro ao buscar turno atual:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao buscar turno atual',
            error: error.message 
        });
    }
};

// Participação: entrar em turno aberto
export const joinTurno = async (req, res) => {
    try {
        const { id } = req.params; // turno id
        const usuarioId = req.user.id;
        // Verificar se turno está aberto
        const turnoRes = await pool.query('SELECT id, status FROM turnos WHERE id = $1', [id]);
        if (!turnoRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Turno não encontrado' });
        }
        if (turnoRes.rows[0].status !== 'aberto') {
            return res.status(400).json({ success: false, message: 'Turno não está aberto' });
        }
        // Inserir ou ignorar se já existe
        const upsert = await pool.query(
            `INSERT INTO turno_participantes (turno_id, usuario_id)
             VALUES ($1, $2)
             ON CONFLICT (turno_id, usuario_id) DO UPDATE SET left_at = NULL, updated_at = NOW()
             RETURNING id, turno_id, usuario_id, joined_at, left_at, papel`,
            [id, usuarioId]
        );
        return res.json({ success: true, data: upsert.rows[0] });
    } catch (error) {
        console.error('Erro ao entrar no turno:', error);
        res.status(500).json({ success: false, message: 'Erro ao entrar no turno', error: error.message });
    }
};

// Participação: listar participantes ativos do turno
export const listTurnoParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await pool.query(
            `SELECT tp.id, tp.turno_id, tp.usuario_id, tp.joined_at, tp.left_at, tp.papel,
                    u.nome_completo, u.email
               FROM turno_participantes tp
               JOIN usuarios u ON u.id = tp.usuario_id
              WHERE tp.turno_id = $1 AND tp.left_at IS NULL
              ORDER BY tp.joined_at ASC`,
            [id]
        );
        return res.json({ success: true, data: rows.rows });
    } catch (error) {
        console.error('Erro ao listar participantes do turno:', error);
        res.status(500).json({ success: false, message: 'Erro ao listar participantes', error: error.message });
    }
};

// Participação: sair do turno (marca left_at)
export const leaveTurno = async (req, res) => {
    try {
        const { id } = req.params; // turno id
        const usuarioId = req.user.id;
        const upd = await pool.query(
            `UPDATE turno_participantes
                SET left_at = NOW(), updated_at = NOW()
              WHERE turno_id = $1 AND usuario_id = $2 AND left_at IS NULL
              RETURNING id`,
            [id, usuarioId]
        );
        if (!upd.rows.length) {
            return res.status(404).json({ success: false, message: 'Participação não encontrada ou já encerrada' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Erro ao sair do turno:', error);
        res.status(500).json({ success: false, message: 'Erro ao sair do turno', error: error.message });
    }
};

export const getTurnoStatistics = async (req, res) => {
    try {
        const stats = await pool.query('SELECT tipo_turno, status, count(*) as total FROM turnos GROUP BY tipo_turno, status');
        res.status(200).json(stats.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Buscar detalhe do turno com comparação de contagens
export const getTurnoDetailWithComparison = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Buscar informações do turno
        const turnoResult = await pool.query(
            `SELECT 
                t.*,
                u_abertura.nome_completo as usuario_abertura_nome,
                u_fechamento.nome_completo as usuario_fechamento_nome
             FROM turnos t
             LEFT JOIN usuarios u_abertura ON t.usuario_abertura = u_abertura.id
             LEFT JOIN usuarios u_fechamento ON t.usuario_fechamento = u_fechamento.id
             WHERE t.id = $1`,
            [id]
        );

        if (turnoResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Turno não encontrado' 
            });
        }

        const turno = turnoResult.rows[0];

        // 2. Buscar as duas últimas contagens do sistema, independentemente do turno
        const latestContagensResult = await pool.query(`
            SELECT
                c.id,
                c.turno_id,
                c.tipo_contagem,
                c.status,
                c.data_inicio
            FROM contagens c
            WHERE c.status IN ('em_andamento', 'pre_fechada', 'fechada', 'reaberta')
            ORDER BY c.data_inicio DESC
            LIMIT 2
        `);

        const latestContagemIds = latestContagensResult.rows.map((row) => row.id);

        const comparacaoResult = await pool.query(`
            WITH ranked_contagens AS (
              SELECT
                c.id,
                c.turno_id,
                c.data_inicio,
                c.tipo_contagem,
                c.status,
                ROW_NUMBER() OVER (ORDER BY c.data_inicio DESC) AS rn
              FROM contagens c
              WHERE c.id = ANY($1)
            ),
            variation_counts AS (
              SELECT
                vp.id AS variacao_id,
                vp.id_produto AS produto_id,
                vp.nome AS variacao_nome,
                vp.id_unidade_controle,
                um.nome AS unidade_nome,
                um.sigla AS unidade_sigla,
                COALESCE(SUM(CASE WHEN rc.rn = 1 THEN ic.quantidade_convertida ELSE 0 END), 0) AS contagem_atual,
                COALESCE(SUM(CASE WHEN rc.rn = 2 THEN ic.quantidade_convertida ELSE 0 END), 0) AS contagem_anterior,
                (ARRAY_AGG(ic.id) FILTER (WHERE rc.rn = 1))[1] AS item_contagem_id_atual,
                (ARRAY_AGG(ic.id) FILTER (WHERE rc.rn = 2))[1] AS item_contagem_id_anterior
              FROM variacoes_produto vp
              LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
              LEFT JOIN itens_contagem ic ON ic.variacao_id = vp.id
              LEFT JOIN ranked_contagens rc ON rc.id = ic.contagem_id
              WHERE vp.ativo = true
              GROUP BY vp.id, vp.id_produto, vp.nome, vp.id_unidade_controle, um.nome, um.sigla
            ),
            produto_meta AS (
              SELECT DISTINCT ON (p.id)
                p.id AS produto_id,
                p.nome AS produto_nome,
                p.id_categoria AS categoria_id,
                c.nome AS categoria_nome,
                p.id_setor AS setor_id,
                s.nome AS setor_nome,
                vp.id AS variacao_principal_id,
                vp.nome AS variacao_principal_nome,
                vp.id_unidade_controle AS unidade_principal_id,
                um.nome AS unidade_principal_nome,
                um.sigla AS unidade_principal_sigla
              FROM produtos p
              LEFT JOIN categorias c ON p.id_categoria = c.id
              LEFT JOIN setores s ON p.id_setor = s.id
              LEFT JOIN variacoes_produto vp ON vp.id_produto = p.id AND vp.ativo = true
              LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
              ORDER BY p.id, vp.fator_prioridade ASC NULLS LAST, vp.nome ASC
            ),
            product_totals AS (
              SELECT
                vc.produto_id,
                COALESCE(SUM(vc.contagem_atual), 0) AS contagem_atual,
                COALESCE(SUM(vc.contagem_anterior), 0) AS contagem_anterior
              FROM variation_counts vc
              GROUP BY vc.produto_id
            ),
            product_variations AS (
              SELECT
                produto_id,
                json_agg(
                  json_build_object(
                    'variacao_id', variacao_id,
                    'variacao_nome', variacao_nome,
                    'id_unidade_controle', id_unidade_controle,
                    'unidade_nome', unidade_nome,
                    'unidade_sigla', unidade_sigla,
                    'contagem_atual', contagem_atual,
                    'contagem_anterior', contagem_anterior,
                    'item_contagem_id_atual', item_contagem_id_atual,
                    'item_contagem_id_anterior', item_contagem_id_anterior
                  ) ORDER BY variacao_nome
                ) AS variacoes
              FROM variation_counts
              GROUP BY produto_id
            )
            SELECT
              pm.produto_id,
              pm.produto_nome,
              pm.categoria_id,
              pm.categoria_nome,
              pm.setor_id,
              pm.setor_nome,
              pm.variacao_principal_id,
              pm.variacao_principal_nome,
              pm.unidade_principal_id,
              pm.unidade_principal_nome,
              pm.unidade_principal_sigla,
              COALESCE(pt.contagem_atual, 0) AS contagem_atual,
              COALESCE(pt.contagem_anterior, 0) AS contagem_anterior,
              COALESCE(pv.variacoes, '[]'::json) AS variacoes
            FROM produto_meta pm
            LEFT JOIN product_totals pt ON pt.produto_id = pm.produto_id
            LEFT JOIN product_variations pv ON pv.produto_id = pm.produto_id
            ORDER BY pm.produto_nome ASC
        `, [latestContagemIds]);

        res.status(200).json({
            success: true,
            data: {
                turno,
                comparacao: comparacaoResult.rows,
                contagens: latestContagensResult.rows
            }
        });
    } catch (error) {
        console.error('Erro ao buscar detalhe do turno:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
};

// Salvar ou criar item de contagem
export const saveContagemItem = async (req, res) => {
    const { contagemId, variacaoId, quantidade, unidadeMedidaId, observacoes } = req.body;
    const usuarioContador = req.user.id;

    try {
        if (!contagemId || !variacaoId || quantidade === undefined || !unidadeMedidaId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Campos obrigatórios faltando' 
            });
        }

        const variacaoResult = await pool.query(
            'SELECT id_unidade_controle FROM variacoes_produto WHERE id = $1',
            [variacaoId]
        );

        if (variacaoResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Variação não encontrada' });
        }

        const unidadeControleId = variacaoResult.rows[0].id_unidade_controle;
        let quantidadeConvertida = parseFloat(quantidade);

        if (isNaN(quantidadeConvertida) || quantidadeConvertida < 0) {
            return res.status(400).json({ success: false, message: 'Quantidade inválida' });
        }

        if (unidadeMedidaId !== unidadeControleId) {
            try {
                const conversion = await FatorConversao.convertQuantity(
                    variacaoId,
                    quantidadeConvertida,
                    unidadeMedidaId,
                    unidadeControleId
                );
                quantidadeConvertida = parseFloat(conversion);
            } catch (conversionError) {
                return res.status(400).json({
                    success: false,
                    message: `Não foi possível converter a quantidade para a unidade principal: ${conversionError.message}`
                });
            }
        }

        // Verificar se já existe item para essa variação nesta contagem
        const existingItem = await pool.query(
            'SELECT id FROM itens_contagem WHERE contagem_id = $1 AND variacao_id = $2',
            [contagemId, variacaoId]
        );

        let result;
        if (existingItem.rows.length > 0) {
            // Atualizar
            result = await pool.query(
                'UPDATE itens_contagem SET quantidade_contada = $1, quantidade_convertida = $2, unidade_medida_id = $3, observacoes = $4 WHERE contagem_id = $5 AND variacao_id = $6 RETURNING *',
                [quantidade, quantidadeConvertida, unidadeMedidaId, observacoes, contagemId, variacaoId]
            );
        } else {
            // Criar novo
            result = await pool.query(
                'INSERT INTO itens_contagem (contagem_id, variacao_id, quantidade_contada, quantidade_convertida, unidade_medida_id, usuario_contador, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [contagemId, variacaoId, quantidade, quantidadeConvertida, unidadeMedidaId, usuarioContador, observacoes]
            );
        }

        res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error('Erro ao salvar item de contagem:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao salvar item de contagem',
            error: error.message 
        });
    }
};

// Finalizar contagem atual
export const finalizarContagem = async (req, res) => {
    const { contagemId } = req.body;

    try {
        if (!contagemId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Contagem ID é obrigatório' 
            });
        }

        const result = await pool.query(
            'UPDATE contagens SET status = $1, data_conclusao = NOW() WHERE id = $2 RETURNING *',
            ['pre_fechada', contagemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Contagem não encontrada' 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error('Erro ao finalizar contagem:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao finalizar contagem',
            error: error.message 
        });
    }
};

// Iniciar nova contagem
export const iniciarNovaContagem = async (req, res) => {
    const usuarioResponsavel = req.user.id;

    try {
        // Criar nova contagem com status em_andamento
        const result = await pool.query(
            'INSERT INTO contagens (tipo_contagem, status, usuario_responsavel) VALUES ($1, $2, $3) RETURNING *',
            ['inicial', 'em_andamento', usuarioResponsavel]
        );

        res.status(201).json({ 
            success: true, 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error('Erro ao iniciar nova contagem:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao iniciar nova contagem',
            error: error.message 
        });
    }
};
