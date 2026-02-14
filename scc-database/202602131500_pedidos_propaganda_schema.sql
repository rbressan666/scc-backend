-- MVP3 - Pedidos e Propaganda (Android Apps)
-- Tabelas para controle de pedidos e configuração de visualização em TV Android

-- Tabela de pedidos (acesso direto pelos apps Android via Supabase)
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido INTEGER NOT NULL,
    observacao TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_pedido DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('novo','processando','finalizado','deletado')) DEFAULT 'novo',
    usuario_email VARCHAR(255),
    deletado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (numero_pedido, data_pedido)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_hora ON pedidos(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_email ON pedidos(usuario_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pedido ON pedidos(data_pedido);

-- Trigger para sincronizar data_pedido com data_hora
CREATE OR REPLACE FUNCTION pedidos_sync_data_pedido()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_pedido := DATE(NEW.data_hora);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pedidos_sync_data_pedido
BEFORE INSERT OR UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION pedidos_sync_data_pedido();

-- Tabela de parâmetros gerais do app de Pedidos e Propaganda (TV Android)
CREATE TABLE IF NOT EXISTS parametros_app_pedidos_propaganda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Comportamento geral do app
    iniciar_com_android BOOLEAN DEFAULT FALSE,
    modo_exibicao VARCHAR(50) NOT NULL CHECK (modo_exibicao IN ('pedidos','pedidos_propaganda')) DEFAULT 'pedidos',
    
    -- Configuração visual - fundo
    tipo_fundo VARCHAR(20) NOT NULL CHECK (tipo_fundo IN ('cor','imagem')) DEFAULT 'cor',
    cor_fundo VARCHAR(7) DEFAULT '#FFFFFF', -- Formato hex
    caminho_imagem_fundo VARCHAR(500),
    
    -- Configuração visual - texto
    cor_fonte VARCHAR(7) DEFAULT '#000000', -- Formato hex
    nome_fonte VARCHAR(100) DEFAULT 'Arial',
    
    -- Temporização de pedidos
    tempo_exibicao_pedido INTEGER DEFAULT 10, -- segundos
    intervalo_consulta_pedidos INTEGER DEFAULT 5, -- segundos
    
    -- Som
    notificar_som BOOLEAN DEFAULT FALSE,
    caminho_som_notificacao VARCHAR(500),
    
    -- Propaganda (apenas se modo_exibicao = 'pedidos_propaganda')
    tempo_inicio_propaganda INTEGER, -- segundos
    ordem_imagens_propaganda TEXT, -- JSON array de IDs de imagens/vídeos
    
    -- Auditoria
    atualizado_por_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mídias (imagens e vídeos para propaganda)
CREATE TABLE IF NOT EXISTS midia_propaganda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('imagem','video')),
    url_arquivo VARCHAR(500) NOT NULL,
    tamanho_bytes INTEGER,
    mime_type VARCHAR(100),
    dimensoes_w INTEGER,
    dimensoes_h INTEGER,
    ordem INTEGER DEFAULT 0,
    ativa BOOLEAN DEFAULT TRUE,
    deletado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_midia_propaganda_tipo ON midia_propaganda(tipo);
CREATE INDEX IF NOT EXISTS idx_midia_propaganda_ativa ON midia_propaganda(ativa);

-- Tabela de sons para notificação
CREATE TABLE IF NOT EXISTS som_notificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    url_arquivo VARCHAR(500) NOT NULL,
    tamanho_bytes INTEGER,
    mime_type VARCHAR(100),
    duracao_ms INTEGER,
    ativo BOOLEAN DEFAULT TRUE,
    deletado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_som_notificacao_ativo ON som_notificacao(ativo);

-- Tabela de log de alterações de configuração (auditoria)
CREATE TABLE IF NOT EXISTS log_alteracoes_propaganda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_email VARCHAR(255),
    parametro_alterado VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_alteracoes_propaganda_data ON log_alteracoes_propaganda(created_at DESC);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION app_pedidos_propaganda_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION app_pedidos_propaganda_set_updated_at();

CREATE TRIGGER trigger_parametros_app_pedidos_propaganda_updated_at
BEFORE UPDATE ON parametros_app_pedidos_propaganda
FOR EACH ROW
EXECUTE FUNCTION app_pedidos_propaganda_set_updated_at();

CREATE TRIGGER trigger_midia_propaganda_updated_at
BEFORE UPDATE ON midia_propaganda
FOR EACH ROW
EXECUTE FUNCTION app_pedidos_propaganda_set_updated_at();

CREATE TRIGGER trigger_som_notificacao_updated_at
BEFORE UPDATE ON som_notificacao
FOR EACH ROW
EXECUTE FUNCTION app_pedidos_propaganda_set_updated_at();

-- Inserir configuração padrão (se não existir)
INSERT INTO parametros_app_pedidos_propaganda (
    id, 
    iniciar_com_android, 
    modo_exibicao, 
    tipo_fundo, 
    cor_fundo,
    cor_fonte,
    nome_fonte,
    tempo_exibicao_pedido,
    intervalo_consulta_pedidos,
    notificar_som
) VALUES (
    gen_random_uuid(),
    FALSE,
    'pedidos',
    'cor',
    '#FFFFFF',
    '#000000',
    'Arial',
    10,
    5,
    FALSE
) ON CONFLICT DO NOTHING;