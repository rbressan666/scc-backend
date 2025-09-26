import pool from '../config/database.js';

export const createContagem = async (req, res) => {
    const { turno_id, tipo_contagem } = req.body;
    const usuario_responsavel = req.user.id;

    try {
        const newContagem = await pool.query(
            'INSERT INTO contagens (turno_id, tipo_contagem, usuario_responsavel) VALUES ($1, $2, $3) RETURNING *',
            [turno_id, tipo_contagem, usuario_responsavel]
        );
        res.status(201).json(newContagem.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addItemContagem = async (req, res) => {
    const { id } = req.params;
    const { variacao_id, quantidade_contada, unidade_medida_id, quantidade_convertida, observacoes } = req.body;
    const usuario_contador = req.user.id;

    try {
        const newItem = await pool.query(
            'INSERT INTO itens_contagem (contagem_id, variacao_id, quantidade_contada, unidade_medida_id, quantidade_convertida, usuario_contador, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, variacao_id, quantidade_contada, unidade_medida_id, quantidade_convertida, usuario_contador, observacoes]
        );
        res.status(201).json(newItem.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateItemContagem = async (req, res) => {
    const { itemId } = req.params;
    const { quantidade_contada, quantidade_convertida, observacoes } = req.body;

    try {
        const updatedItem = await pool.query(
            'UPDATE itens_contagem SET quantidade_contada = $1, quantidade_convertida = $2, observacoes = $3 WHERE id = $4 RETURNING *',
            [quantidade_contada, quantidade_convertida, observacoes, itemId]
        );
        res.status(200).json(updatedItem.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const contagens = await pool.query('SELECT * FROM contagens WHERE turno_id = $1', [turnoId]);
        res.status(200).json(contagens.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
