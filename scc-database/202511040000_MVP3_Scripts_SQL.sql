-- =====================================================
-- Sistema Contagem Cadoz (SCC) - MVP 3
-- Scripts SQL Completos para Implementação
-- Data: 26/09/2025
-- =====================================================

-- =====================================================
-- 1. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- =====================================================

-- Tabela: turnos
-- Controla os turnos de trabalho (diurno, noturno, especial)
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: não permitir dois turnos abertos na mesma data
    CONSTRAINT unique_turno_aberto_por_data UNIQUE (data_turno, status) DEFERRABLE INITIALLY DEFERRED
);

-- Tabela: contagens
-- Registra as contagens (inicial/final) de cada turno
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: apenas uma contagem de cada tipo por turno
    UNIQUE(turno_id, tipo_contagem)
);

-- Tabela: itens_contagem
-- Registra cada item contado em uma contagem específica
CREATE TABLE IF NOT EXISTS itens_contagem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contagem_id UUID NOT NULL REFERENCES contagens(id) ON DELETE CASCADE,
    variacao_id UUID NOT NULL REFERENCES variacoes_produto(id),
    quantidade_contada DECIMAL(10,3) NOT NULL CHECK (quantidade_contada >= 0),
    unidade_medida_id UUID NOT NULL REFERENCES unidades_medida(id),
    quantidade_convertida DECIMAL(10,3) NOT NULL CHECK (quantidade_convertida >= 0), -- Quantidade na unidade principal
    usuario_contador UUID NOT NULL REFERENCES usuarios(id),
    observacoes TEXT,
    data_contagem TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: evitar contagem duplicada do mesmo item na mesma contagem
    UNIQUE(contagem_id, variacao_id)
);

-- Tabela: log_auditoria
-- Registra todas as ações dos usuários para rastreabilidade
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
-- Sistema de alertas inteligentes para gestão
CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('variacao_inconsistente', 'estoque_baixo', 'compra_urgente', 'falha_contagem', 'parecer_operador')),
    prioridade VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    dados_contexto JSONB, -- Dados específicos do alerta (IDs, quantidades, etc.)
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
-- Análise automática de variações entre contagens
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
-- Configurações de notificação por e-mail para cada usuário
CREATE TABLE IF NOT EXISTS configuracoes_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    receber_alertas BOOLEAN DEFAULT TRUE,
    tipos_alerta TEXT[] DEFAULT ARRAY['urgente', 'parecer_operador'], -- Array de tipos que o usuário quer receber
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(usuario_id)
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para turnos
CREATE INDEX IF NOT EXISTS idx_turnos_data ON turnos(data_turno);
CREATE INDEX IF NOT EXISTS idx_turnos_status ON turnos(status);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario_abertura ON turnos(usuario_abertura);
CREATE INDEX IF NOT EXISTS idx_turnos_tipo ON turnos(tipo_turno);

-- Índices para contagens
CREATE INDEX IF NOT EXISTS idx_contagens_turno ON contagens(turno_id);
CREATE INDEX IF NOT EXISTS idx_contagens_tipo ON contagens(tipo_contagem);
CREATE INDEX IF NOT EXISTS idx_contagens_status ON contagens(status);
CREATE INDEX IF NOT EXISTS idx_contagens_usuario ON contagens(usuario_responsavel);
CREATE INDEX IF NOT EXISTS idx_contagens_data_inicio ON contagens(data_inicio);

-- Índices para itens_contagem
CREATE INDEX IF NOT EXISTS idx_itens_contagem_contagem ON itens_contagem(contagem_id);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_variacao ON itens_contagem(variacao_id);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_usuario ON itens_contagem(usuario_contador);
CREATE INDEX IF NOT EXISTS idx_itens_contagem_data ON itens_contagem(data_contagem);

-- Índices para log_auditoria
CREATE INDEX IF NOT EXISTS idx_log_auditoria_usuario ON log_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_acao ON log_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_timestamp ON log_auditoria(timestamp);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_tabela ON log_auditoria(tabela_afetada);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_prioridade ON alertas(prioridade);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_alertas_usuario_responsavel ON alertas(usuario_responsavel);
CREATE INDEX IF NOT EXISTS idx_alertas_created_at ON alertas(created_at);

-- Índices para analise_variacao
CREATE INDEX IF NOT EXISTS idx_analise_variacao_variacao ON analise_variacao(variacao_id);
CREATE INDEX IF NOT EXISTS idx_analise_variacao_contagem_atual ON analise_variacao(contagem_atual_id);
CREATE INDEX IF NOT EXISTS idx_analise_variacao_tipo ON analise_variacao(tipo_variacao);
CREATE INDEX IF NOT EXISTS idx_analise_variacao_created_at ON analise_variacao(created_at);

-- Índices para configuracoes_email
CREATE INDEX IF NOT EXISTS idx_configuracoes_email_usuario ON configuracoes_email(usuario_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_email_ativo ON configuracoes_email(ativo);

-- =====================================================
-- 3. TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_turnos_updated_at 
    BEFORE UPDATE ON turnos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contagens_updated_at 
    BEFORE UPDATE ON contagens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_updated_at 
    BEFORE UPDATE ON alertas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_email_updated_at 
    BEFORE UPDATE ON configuracoes_email 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular prioridade de alerta
CREATE OR REPLACE FUNCTION calcular_prioridade_alerta(
    quantidade_atual DECIMAL,
    estoque_minimo DECIMAL,
    fator_prioridade INTEGER,
    variacao DECIMAL DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Fator de prioridade do produto (0-100)
    score := score + (fator_prioridade * 0.4)::INTEGER;
    
    -- Proximidade do estoque mínimo
    IF quantidade_atual <= 0 THEN
        score := score + 40; -- Zerado
    ELSIF quantidade_atual <= estoque_minimo * 0.5 THEN
        score := score + 30; -- 50% do mínimo
    ELSIF quantidade_atual <= estoque_minimo THEN
        score := score + 20; -- No mínimo
    END IF;
    
    -- Variação suspeita (aumento)
    IF variacao > 0 THEN
        score := score + 30; -- Aumento suspeito
    END IF;
    
    -- Limitar score entre 0 e 100
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Função para converter prioridade numérica em texto
CREATE OR REPLACE FUNCTION score_para_prioridade(score INTEGER) 
RETURNS VARCHAR(20) AS $$
BEGIN
    CASE 
        WHEN score >= 76 THEN RETURN 'urgente';
        WHEN score >= 51 THEN RETURN 'alta';
        WHEN score >= 26 THEN RETURN 'media';
        ELSE RETURN 'baixa';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para obter turno atual ativo
CREATE OR REPLACE FUNCTION get_turno_atual() 
RETURNS UUID AS $$
DECLARE
    turno_id UUID;
BEGIN
    SELECT id INTO turno_id 
    FROM turnos 
    WHERE status = 'aberto' 
    AND data_turno = CURRENT_DATE 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RETURN turno_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VIEWS ÚTEIS PARA CONSULTAS
-- =====================================================

-- View: resumo_turnos
-- Visão consolidada dos turnos com estatísticas
CREATE OR REPLACE VIEW resumo_turnos AS
SELECT 
    t.id,
    t.data_turno,
    t.tipo_turno,
    t.status,
    t.horario_inicio,
    t.horario_fim,
    ua.nome_completo as usuario_abertura_nome,
    uf.nome_completo as usuario_fechamento_nome,
    COUNT(c.id) as total_contagens,
    COUNT(CASE WHEN c.status = 'fechada' THEN 1 END) as contagens_fechadas,
    COUNT(CASE WHEN c.tipo_contagem = 'inicial' THEN 1 END) as tem_contagem_inicial,
    COUNT(CASE WHEN c.tipo_contagem = 'final' THEN 1 END) as tem_contagem_final
FROM turnos t
LEFT JOIN usuarios ua ON t.usuario_abertura = ua.id
LEFT JOIN usuarios uf ON t.usuario_fechamento = uf.id
LEFT JOIN contagens c ON t.id = c.turno_id
GROUP BY t.id, ua.nome_completo, uf.nome_completo;

-- View: alertas_resumo
-- Resumo de alertas por prioridade e status
CREATE OR REPLACE VIEW alertas_resumo AS
SELECT 
    prioridade,
    status,
    COUNT(*) as total,
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as hoje,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as ultima_semana
FROM alertas
GROUP BY prioridade, status;

-- View: contagem_detalhada
-- Detalhes completos de uma contagem com produtos
CREATE OR REPLACE VIEW contagem_detalhada AS
SELECT 
    c.id as contagem_id,
    c.tipo_contagem,
    c.status as contagem_status,
    t.data_turno,
    u.nome_completo as responsavel,
    ic.id as item_id,
    p.nome as produto_nome,
    vp.nome as variacao_nome,
    ic.quantidade_contada,
    um.nome as unidade_medida,
    ic.quantidade_convertida,
    ic.observacoes,
    ic.data_contagem,
    uc.nome_completo as contador_nome
FROM contagens c
JOIN turnos t ON c.turno_id = t.id
JOIN usuarios u ON c.usuario_responsavel = u.id
LEFT JOIN itens_contagem ic ON c.id = ic.contagem_id
LEFT JOIN variacoes_produto vp ON ic.variacao_id = vp.id
LEFT JOIN produtos p ON vp.produto_id = p.id
LEFT JOIN unidades_medida um ON ic.unidade_medida_id = um.id
LEFT JOIN usuarios uc ON ic.usuario_contador = uc.id;

-- =====================================================
-- 6. DADOS INICIAIS E CONFIGURAÇÕES
-- =====================================================

-- Configurações padrão de e-mail para usuários admin existentes
INSERT INTO configuracoes_email (usuario_id, receber_alertas, tipos_alerta, ativo)
SELECT 
    id,
    true,
    ARRAY['urgente', 'parecer_operador', 'alta'],
    true
FROM usuarios 
WHERE perfil = 'admin'
ON CONFLICT (usuario_id) DO NOTHING;

-- Configurações padrão de e-mail para usuários operador existentes
INSERT INTO configuracoes_email (usuario_id, receber_alertas, tipos_alerta, ativo)
SELECT 
    id,
    false, -- Operadores não recebem por padrão
    ARRAY[]::TEXT[],
    true
FROM usuarios 
WHERE perfil = 'operador'
ON CONFLICT (usuario_id) DO NOTHING;

-- =====================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

-- Adicionar comentários nas tabelas para documentação
COMMENT ON TABLE turnos IS 'Controla os turnos de trabalho do estabelecimento';
COMMENT ON TABLE contagens IS 'Registra as contagens de inventário (inicial/final) por turno';
COMMENT ON TABLE itens_contagem IS 'Itens específicos contados em cada contagem';
COMMENT ON TABLE log_auditoria IS 'Log completo de auditoria de todas as ações do sistema';
COMMENT ON TABLE alertas IS 'Sistema de alertas inteligentes para gestão';
COMMENT ON TABLE analise_variacao IS 'Análise automática de variações entre contagens';
COMMENT ON TABLE configuracoes_email IS 'Configurações de notificação por e-mail dos usuários';

-- Comentários em campos importantes
COMMENT ON COLUMN turnos.status IS 'Status do turno: aberto, fechado, cancelado';
COMMENT ON COLUMN contagens.tipo_contagem IS 'Tipo: inicial (abertura) ou final (fechamento)';
COMMENT ON COLUMN contagens.status IS 'Status: em_andamento, pre_fechada, fechada, reaberta';
COMMENT ON COLUMN itens_contagem.quantidade_convertida IS 'Quantidade convertida para a unidade principal do produto';
COMMENT ON COLUMN alertas.dados_contexto IS 'JSON com dados específicos do contexto do alerta';
COMMENT ON COLUMN analise_variacao.tipo_variacao IS 'Classificação automática da variação detectada';

-- =====================================================
-- 8. VERIFICAÇÕES DE INTEGRIDADE
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    tabelas_esperadas TEXT[] := ARRAY['turnos', 'contagens', 'itens_contagem', 'log_auditoria', 'alertas', 'analise_variacao', 'configuracoes_email'];
    tabela TEXT;
    existe BOOLEAN;
BEGIN
    FOREACH tabela IN ARRAY tabelas_esperadas
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tabela
        ) INTO existe;
        
        IF NOT existe THEN
            RAISE EXCEPTION 'Tabela % não foi criada!', tabela;
        ELSE
            RAISE NOTICE 'Tabela % criada com sucesso', tabela;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Todas as tabelas do MVP 3 foram criadas com sucesso!';
END
$$;

-- =====================================================
-- FIM DO SCRIPT MVP 3
-- =====================================================

-- Script executado com sucesso!
-- Próximos passos:
-- 1. Implementar controllers no backend
-- 2. Criar rotas da API
-- 3. Desenvolver interface do frontend
-- 4. Implementar sistema de notificações
-- 5. Testes de integração

