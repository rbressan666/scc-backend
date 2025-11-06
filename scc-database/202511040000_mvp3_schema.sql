-- Sistema Contagem Cadoz (SCC) - MVP 3
-- Script de Banco de Dados
-- Versão: 3.0
-- Data: 26/09/2025

--
-- 2.1 Novas Tabelas para MVP 3
--

-- Tabela: turnos
CREATE TABLE IF NOT EXISTS turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_turno DATE NOT NULL,
    tipo_turno VARCHAR(20) NOT NULL CHECK (tipo_turno IN ('diurno', 'noturno', 'especial')),
    horario_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    horario_fim TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado', 'cancelado')),
    usuario_abertura UUID NOT NULL REFERENCES usuarios(id),
    usuario_fechamento UUID REFERENCES usuarios(id),
    observacoes_abertura TEXT,
    observacoes_fechamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: contagens
CREATE TABLE IF NOT EXISTS contagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
    tipo_contagem VARCHAR(20) NOT NULL CHECK (tipo_contagem IN ('inicial', 'final')),
    status VARCHAR(20) NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'pre_fechada', 'fechada', 'reaberta')),
    usuario_responsavel UUID NOT NULL REFERENCES usuarios(id),
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_conclusao TIMESTAMP WITH TIME ZONE,
    data_fechamento TIMESTAMP WITH TIME ZONE,
    parecer_operador TEXT,
    total_itens_contados INTEGER DEFAULT 0,
    tempo_total_minutos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: itens_contagem
CREATE TABLE IF NOT EXISTS itens_contagem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contagem_id UUID NOT NULL REFERENCES contagens(id) ON DELETE CASCADE,
    variacao_id UUID NOT NULL REFERENCES variacoes_produto(id),
    quantidade_contada DECIMAL(10,3) NOT NULL,
    unidade_medida_id UUID NOT NULL REFERENCES unidades_medida(id),
    quantidade_convertida DECIMAL(10,3) NOT NULL, -- Quantidade na unidade principal
    usuario_contador UUID NOT NULL REFERENCES usuarios(id),
    observacoes TEXT,
    data_contagem TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contagem_id, variacao_id)
);

-- Tabela: log_auditoria
CREATE TABLE IF NOT EXISTS log_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(50),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: alertas
CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('variacao_inconsistente', 'estoque_baixo', 'compra_urgente', 'falha_contagem', 'parecer_operador')),
    prioridade VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    dados_contexto JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'lido', 'resolvido', 'ignorado')),
    usuario_gerador UUID REFERENCES usuarios(id),
    usuario_responsavel UUID REFERENCES usuarios(id),
    data_resolucao TIMESTAMP WITH TIME ZONE,
    justificativa_admin TEXT,
    enviado_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: analise_variacao
CREATE TABLE IF NOT EXISTS analise_variacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variacao_id UUID NOT NULL REFERENCES variacoes_produto(id),
    contagem_anterior_id UUID REFERENCES contagens(id),
    contagem_atual_id UUID NOT NULL REFERENCES contagens(id),
    quantidade_anterior DECIMAL(10,3),
    quantidade_atual DECIMAL(10,3) NOT NULL,
    diferenca DECIMAL(10,3) NOT NULL,
    percentual_variacao DECIMAL(5,2),
    tipo_variacao VARCHAR(20) NOT NULL CHECK (tipo_variacao IN ('normal', 'aumento_suspeito', 'reducao_esperada', 'reducao_excessiva', 'zerado')),
    alerta_gerado BOOLEAN DEFAULT FALSE,
    alerta_id UUID REFERENCES alertas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: configuracoes_email
CREATE TABLE IF NOT EXISTS configuracoes_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    receber_alertas BOOLEAN DEFAULT TRUE,
    tipos_alerta TEXT[] DEFAULT ARRAY['urgente', 'parecer_operador'],
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

--
-- 2.2 Índices para Performance
--

CREATE INDEX IF NOT EXISTS idx_turnos_data ON turnos(data_turno);
CREATE INDEX IF NOT EXISTS idx_turnos_status ON turnos(status);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario_abertura ON turnos(usuario_abertura);

CREATE INDEX IF NOT EXISTS idx_contagens_turno ON contagens(turno_id);
CREATE INDEX IF NOT EXISTS idx_contagens_tipo ON contagens(tipo_contagem);
CREATE INDEX IF NOT EXISTS idx_contagens_status ON contagens(status);
CREATE INDEX IF NOT EXISTS idx_contagens_usuario ON contagens(usuario_responsavel);

CREATE INDEX IF NOT EXISTS idx_itens_contagem_contagem ON itens_contagem(contagem_id);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_variacao ON itens_contagem(variacao_id);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_usuario ON itens_contagem(usuario_contador);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_data ON itens_contagem(data_contagem);

CREATE INDEX IF NOT EXISTS idx_log_auditoria_usuario ON log_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_acao ON log_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_timestamp ON log_auditoria(timestamp);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_tabela ON log_auditoria(tabela_afetada);

CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_prioridade ON alertas(prioridade);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_alertas_usuario_responsavel ON alertas(usuario_responsavel);
CREATE INDEX IF NOT EXISTS idx_alertas_created_at ON alertas(created_at);

CREATE INDEX IF NOT EXISTS idx_analise_variacao_variacao ON analise_variacao(variacao_id);
CREATE INDEX IF NOT EXISTS idx_analise_variacao_contagem_atual ON analise_variacao(contagem_atual_id);
CREATE INDEX IF NOT EXISTS idx_analise_variacao_tipo ON analise_variacao(tipo_variacao);

--
-- 2.3 Triggers Automáticos
--

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_turnos_updated_at BEFORE UPDATE ON turnos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contagens_updated_at BEFORE UPDATE ON contagens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON alertas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_email_updated_at BEFORE UPDATE ON configuracoes_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
