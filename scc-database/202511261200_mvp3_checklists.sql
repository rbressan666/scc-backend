-- MVP3 - Checklists de Turno (entrada/saída), perguntas, respostas e locks
-- Criação de tabelas para definição de perguntas por setor e respostas por turno

CREATE TABLE IF NOT EXISTS checklist_perguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada','saida')),
    setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
    pergunta TEXT NOT NULL,
    instrucao TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    ordem INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_perguntas_tipo ON checklist_perguntas(tipo);
CREATE INDEX IF NOT EXISTS idx_checklist_perguntas_setor ON checklist_perguntas(setor_id);

-- Resposta por turno/pergunta (uma por pergunta por turno)
CREATE TABLE IF NOT EXISTS checklist_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
    pergunta_id UUID NOT NULL REFERENCES checklist_perguntas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    resposta VARCHAR(3) NOT NULL CHECK (resposta IN ('SIM','NAO','NA')),
    justificativa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turno_id, pergunta_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_respostas_turno ON checklist_respostas(turno_id);
CREATE INDEX IF NOT EXISTS idx_checklist_respostas_pergunta ON checklist_respostas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_checklist_respostas_usuario ON checklist_respostas(usuario_id);

-- Locks para evitar concorrência na resposta de uma pergunta
CREATE TABLE IF NOT EXISTS checklist_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
    pergunta_id UUID NOT NULL REFERENCES checklist_perguntas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    UNIQUE(turno_id, pergunta_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_locks_turno_pergunta ON checklist_locks(turno_id, pergunta_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION checklist_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_checklist_perguntas_updated_at BEFORE UPDATE ON checklist_perguntas
FOR EACH ROW EXECUTE FUNCTION checklist_set_updated_at();

CREATE TRIGGER trg_checklist_respostas_updated_at BEFORE UPDATE ON checklist_respostas
FOR EACH ROW EXECUTE FUNCTION checklist_set_updated_at();
