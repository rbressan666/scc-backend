-- Correção: Recriar tabela parametros_app_pedidos_propaganda com os campos corretos
-- Backup dos dados existentes
CREATE TABLE IF NOT EXISTS parametros_app_pedidos_propaganda_backup AS
SELECT * FROM parametros_app_pedidos_propaganda;

-- Drop foreign keys se existirem
ALTER TABLE parametros_app_pedidos_propaganda DROP CONSTRAINT IF EXISTS fk_parametros_imagem_fundo;
ALTER TABLE parametros_app_pedidos_propaganda DROP CONSTRAINT IF EXISTS fk_parametros_video_propaganda;
ALTER TABLE parametros_app_pedidos_propaganda DROP CONSTRAINT IF EXISTS fk_parametros_som_notificacao;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_parametros_app_pedidos_propaganda_updated_at ON parametros_app_pedidos_propaganda;

-- Drop tabela antiga
DROP TABLE IF EXISTS parametros_app_pedidos_propaganda;

-- Criar tabela corrigida com os campos esperados pelo frontend e controller
CREATE TABLE IF NOT EXISTS parametros_app_pedidos_propaganda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Comportamento geral do app
    autostart BOOLEAN DEFAULT true,
    modo_exibicao VARCHAR(50) NOT NULL CHECK (modo_exibicao IN ('pedidos-propaganda','pedidos-only','propaganda-only')) DEFAULT 'pedidos-propaganda',
    
    -- Configuração visual
    intervalo_exibicao_seg INTEGER DEFAULT 10,
    exibir_numero_pedido BOOLEAN DEFAULT true,
    exibir_observacao_pedido BOOLEAN DEFAULT true,
    cor_fundo_principal VARCHAR(7) DEFAULT '#000000',
    cor_texto_principal VARCHAR(7) DEFAULT '#FFFFFF',
    cor_destaque_numero VARCHAR(7) DEFAULT '#FFD700',
    
    -- Referências a mídias
    imagem_fundo_id UUID REFERENCES midia_propaganda(id) ON DELETE SET NULL,
    video_propaganda_id UUID REFERENCES midia_propaganda(id) ON DELETE SET NULL,
    som_notificacao_novos_pedidos_id UUID REFERENCES som_notificacao(id) ON DELETE SET NULL,
    
    -- Estado da configuração
    ativa BOOLEAN DEFAULT true,
    
    -- Auditoria
    atualizado_por_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar trigger para updated_at
CREATE TRIGGER trigger_parametros_app_pedidos_propaganda_updated_at
BEFORE UPDATE ON parametros_app_pedidos_propaganda
FOR EACH ROW
EXECUTE FUNCTION app_pedidos_propaganda_set_updated_at();

-- Inserir configuração padrão
INSERT INTO parametros_app_pedidos_propaganda (
    autostart,
    modo_exibicao,
    intervalo_exibicao_seg,
    exibir_numero_pedido,
    exibir_observacao_pedido,
    cor_fundo_principal,
    cor_texto_principal,
    cor_destaque_numero,
    ativa
) VALUES (
    true,
    'pedidos-propaganda',
    10,
    true,
    true,
    '#000000',
    '#FFFFFF',
    '#FFD700',
    true
) ON CONFLICT DO NOTHING;
