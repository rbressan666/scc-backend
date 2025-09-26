import pool from '../config/database.js';

export const createTurno = async (req, res) => {
    const { data_turno, tipo_turno, horario_inicio, observacoes_abertura } = req.body;
    const usuario_abertura = req.user.id;

    try {
        const newTurno = await pool.query(
            'INSERT INTO turnos (data_turno, tipo_turno, horario_inicio, usuario_abertura, observacoes_abertura) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [data_turno, tipo_turno, horario_inicio, usuario_abertura, observacoes_abertura]
        );
        res.status(201).json(newTurno.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllTurnos = async (req, res) => {
    try {
        const allTurnos = await pool.query('SELECT * FROM turnos ORDER BY data_turno DESC, horario_inicio DESC');
        res.status(200).json(allTurnos.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getTurnoById = async (req, res) => {
    const { id } = req.params;
    try {
        const turno = await pool.query('SELECT * FROM turnos WHERE id = $1', [id]);
        if (turno.rows.length === 0) {
            return res.status(404).json({ message: 'Turno não encontrado' });
        }
        res.status(200).json(turno.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(200).json(updatedTurno.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const currentTurno = await pool.query('SELECT * FROM turnos WHERE status = $1 ORDER BY data_turno DESC, horario_inicio DESC LIMIT 1', ['aberto']);
        if (currentTurno.rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum turno aberto encontrado' });
        }
        res.status(200).json(currentTurno.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
