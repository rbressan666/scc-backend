-- Tabela de participantes de turno (MVP3 - inclusão de usuários ao entrar no turno)
CREATE TABLE IF NOT EXISTS turno_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    papel VARCHAR(30), -- opcional: operador, supervisor, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turno_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_turno_participantes_turno ON turno_participantes(turno_id);
CREATE INDEX IF NOT EXISTS idx_turno_participantes_usuario ON turno_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turno_participantes_active ON turno_participantes(turno_id, left_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION tp_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tp_updated_at BEFORE UPDATE ON turno_participantes
FOR EACH ROW EXECUTE FUNCTION tp_set_updated_at();