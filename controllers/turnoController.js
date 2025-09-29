import pool from '../config/database.js';

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

export const getTurnoStatistics = async (req, res) => {
    try {
        const stats = await pool.query('SELECT tipo_turno, status, count(*) as total FROM turnos GROUP BY tipo_turno, status');
        res.status(200).json(stats.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
