import pool from '../config/database.js';

export const getAllAlertas = async (req, res) => {
    try {
        const allAlertas = await pool.query('SELECT * FROM alertas ORDER BY created_at DESC');
        res.status(200).json(allAlertas.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAlertaById = async (req, res) => {
    const { id } = req.params;
    try {
        const alerta = await pool.query('SELECT * FROM alertas WHERE id = $1', [id]);
        if (alerta.rows.length === 0) {
            return res.status(404).json({ message: 'Alerta não encontrado' });
        }
        res.status(200).json(alerta.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markAlertaAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedAlerta = await pool.query(
            'UPDATE alertas SET status = $1 WHERE id = $2 RETURNING *',
            ['lido', id]
        );
        res.status(200).json(updatedAlerta.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const resolveAlerta = async (req, res) => {
    const { id } = req.params;
    const { justificativa_admin } = req.body;
    try {
        const updatedAlerta = await pool.query(
            'UPDATE alertas SET status = $1, justificativa_admin = $2, data_resolucao = $3 WHERE id = $4 RETURNING *',
            ['resolvido', justificativa_admin, new Date(), id]
        );
        res.status(200).json(updatedAlerta.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const ignoreAlerta = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedAlerta = await pool.query(
            'UPDATE alertas SET status = $1 WHERE id = $2 RETURNING *',
            ['ignorado', id]
        );
        res.status(200).json(updatedAlerta.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
