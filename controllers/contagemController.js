import pool from '../config/database.js';

export const createContagem = async (req, res) => {
    const { turno_id, tipo_contagem } = req.body;
    const usuario_responsavel = req.user.id;

    try {
        // Validar dados obrigatórios
        if (!turno_id || !tipo_contagem) {
            return res.status(400).json({ 
                success: false, 
                message: 'Turno ID e tipo de contagem são obrigatórios' 
            });
        }

        const newContagem = await pool.query(
            'INSERT INTO contagens (turno_id, tipo_contagem, usuario_responsavel) VALUES ($1, $2, $3) RETURNING *',
            [turno_id, tipo_contagem, usuario_responsavel]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Contagem criada com sucesso',
            data: newContagem.rows[0] 
        });
    } catch (error) {
        console.error('Erro ao criar contagem:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
};

export const addItemContagem = async (req, res) => {
    const { id } = req.params;
    const { variacao_id, quantidade_contada, unidade_medida_id, quantidade_convertida, observacoes } = req.body;
    const usuario_contador = req.user.id;

    console.log('📝 Adicionando item à contagem:', {
        contagem_id: id,
        variacao_id,
        quantidade_contada,
        unidade_medida_id,
        quantidade_convertida,
        usuario_contador,
        observacoes
    });

    try {
        // Validar dados obrigatórios
        if (!variacao_id || !quantidade_contada || !unidade_medida_id || !quantidade_convertida) {
            console.log('❌ Dados obrigatórios faltando:', {
                variacao_id: !!variacao_id,
                quantidade_contada: !!quantidade_contada,
                unidade_medida_id: !!unidade_medida_id,
                quantidade_convertida: !!quantidade_convertida
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Dados obrigatórios faltando',
                missing: {
                    variacao_id: !variacao_id,
                    quantidade_contada: !quantidade_contada,
                    unidade_medida_id: !unidade_medida_id,
                    quantidade_convertida: !quantidade_convertida
                }
            });
        }

        console.log('🔄 Executando INSERT na tabela itens_contagem...');
        
        const newItem = await pool.query(
            'INSERT INTO itens_contagem (contagem_id, variacao_id, quantidade_contada, unidade_medida_id, quantidade_convertida, usuario_contador, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, variacao_id, quantidade_contada, unidade_medida_id, quantidade_convertida, usuario_contador, observacoes]
        );
        
        console.log('✅ Item criado com sucesso:', newItem.rows[0]);
        res.status(201).json(newItem.rows[0]);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar item à contagem:', error);
        console.error('❌ Detalhes do erro:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint
        });
        
        res.status(500).json({ 
            success: false,
            message: 'Erro ao adicionar item à contagem',
            error: error.message,
            code: error.code,
            detail: error.detail
        });
    }
};

export const updateItemContagem = async (req, res) => {
    const { itemId } = req.params;
    const { quantidade_contada, quantidade_convertida, observacoes } = req.body;

    console.log('🔄 Atualizando item da contagem:', {
        itemId,
        quantidade_contada,
        quantidade_convertida,
        observacoes
    });

    try {
        const updatedItem = await pool.query(
            'UPDATE itens_contagem SET quantidade_contada = $1, quantidade_convertida = $2, observacoes = $3 WHERE id = $4 RETURNING *',
            [quantidade_contada, quantidade_convertida, observacoes, itemId]
        );
        
        if (updatedItem.rows.length === 0) {
            console.log('⚠️ Item não encontrado para atualização:', itemId);
            return res.status(404).json({ 
                success: false, 
                message: 'Item não encontrado' 
            });
        }
        
        console.log('✅ Item atualizado com sucesso:', updatedItem.rows[0]);
        res.status(200).json(updatedItem.rows[0]);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar item da contagem:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao atualizar item da contagem',
            error: error.message 
        });
    }
};

export const removeItemContagem = async (req, res) => {
    const { itemId } = req.params;

    try {
        await pool.query('DELETE FROM itens_contagem WHERE id = $1', [itemId]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContagensByTurno = async (req, res) => {
    const { turnoId } = req.params;
    
    try {
        if (!turnoId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Turno ID é obrigatório' 
            });
        }

        const contagens = await pool.query('SELECT * FROM contagens WHERE turno_id = $1', [turnoId]);
        
        res.status(200).json({ 
            success: true, 
            data: contagens.rows 
        });
    } catch (error) {
        console.error('Erro ao buscar contagens por turno:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
};

export const getItensContagem = async (req, res) => {
    const { id } = req.params;
    try {
        const itens = await pool.query('SELECT * FROM itens_contagem WHERE contagem_id = $1', [id]);
        res.status(200).json(itens.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const preCloseContagem = async (req, res) => {
    const { id } = req.params;
    const { parecer_operador } = req.body;
    try {
        const updatedContagem = await pool.query(
            'UPDATE contagens SET status = $1, parecer_operador = $2, data_conclusao = $3 WHERE id = $4 RETURNING *',
            ['pre_fechada', parecer_operador, new Date(), id]
        );
        res.status(200).json(updatedContagem.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const closeContagem = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedContagem = await pool.query(
            'UPDATE contagens SET status = $1, data_fechamento = $2 WHERE id = $3 RETURNING *',
            ['fechada', new Date(), id]
        );
        // Aqui entraria a lógica de gerar análise de variação e alertas
        res.status(200).json(updatedContagem.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const reopenContagem = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedContagem = await pool.query(
            'UPDATE contagens SET status = $1 WHERE id = $2 RETURNING *',
            ['reaberta', id]
        );
        res.status(200).json(updatedContagem.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
