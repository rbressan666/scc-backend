-- Script SQL para funcionalidades de busca e reconhecimento por foto
-- Sistema Contagem Cadoz (SCC) - MVP3
-- Data: 16/09/2025

-- Tabela: produto_imagens
-- Armazena múltiplas imagens de referência para cada produto
CREATE TABLE IF NOT EXISTS produto_imagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    url_imagem TEXT NOT NULL,
    tipo_imagem VARCHAR(20) NOT NULL DEFAULT 'referencia', 
    -- Tipos: 'principal', 'referencia', 'internet', 'contagem'
    origem VARCHAR(50), 
    -- Origens: 'upload', 'internet_search', 'open_food_facts', 'user_capture'
    descricao TEXT,
    largura INTEGER,
    altura INTEGER,
    tamanho_bytes INTEGER,
    hash_imagem VARCHAR(64), -- Para evitar duplicatas
    features_vector TEXT, -- JSON com características extraídas para ML
    confianca_score DECIMAL(3,2), -- Score de confiança da identificação (0.00-1.00)
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna de imagem principal na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_principal_url TEXT;

-- Tabela: busca_foto_historico
-- Histórico de buscas por foto para análise e melhoria
CREATE TABLE IF NOT EXISTS busca_foto_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_busca VARCHAR(20) NOT NULL, -- 'internet', 'reconhecimento'
    imagem_hash VARCHAR(64),
    termos_busca TEXT[], -- Array de termos usados na busca
    resultados_encontrados INTEGER DEFAULT 0,
    produto_selecionado UUID REFERENCES produtos(id),
    tempo_resposta_ms INTEGER,
    api_utilizada VARCHAR(50), -- 'bing', 'unsplash', 'google', 'local'
    sucesso BOOLEAN DEFAULT false,
    erro_detalhes TEXT,
    user_id UUID, -- Para análise de padrões de uso
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: reconhecimento_aprendizado
-- Armazena dados de aprendizado do sistema de reconhecimento
CREATE TABLE IF NOT EXISTS reconhecimento_aprendizado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    imagem_original_hash VARCHAR(64) NOT NULL,
    imagem_reconhecida_hash VARCHAR(64),
    score_similaridade DECIMAL(5,4), -- Score de 0.0000 a 1.0000
    confirmado_usuario BOOLEAN DEFAULT false,
    feedback_usuario VARCHAR(20), -- 'correto', 'incorreto', 'parcial'
    contexto_uso VARCHAR(50), -- 'contagem', 'cadastro', 'busca'
    melhorias_aplicadas TEXT, -- JSON com ajustes feitos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produto_imagens_produto ON produto_imagens(id_produto);
CREATE INDEX IF NOT EXISTS idx_produto_imagens_tipo ON produto_imagens(tipo_imagem);
CREATE INDEX IF NOT EXISTS idx_produto_imagens_hash ON produto_imagens(hash_imagem);
CREATE INDEX IF NOT EXISTS idx_produto_imagens_ativo ON produto_imagens(ativo);

CREATE INDEX IF NOT EXISTS idx_busca_historico_tipo ON busca_foto_historico(tipo_busca);
CREATE INDEX IF NOT EXISTS idx_busca_historico_data ON busca_foto_historico(created_at);
CREATE INDEX IF NOT EXISTS idx_busca_historico_sucesso ON busca_foto_historico(sucesso);

CREATE INDEX IF NOT EXISTS idx_reconhecimento_produto ON reconhecimento_aprendizado(id_produto);
CREATE INDEX IF NOT EXISTS idx_reconhecimento_confirmado ON reconhecimento_aprendizado(confirmado_usuario);
CREATE INDEX IF NOT EXISTS idx_reconhecimento_score ON reconhecimento_aprendizado(score_similaridade);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_produto_imagens_updated_at 
    BEFORE UPDATE ON produto_imagens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar imagem principal automaticamente
CREATE OR REPLACE FUNCTION update_produto_imagem_principal()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a imagem inserida é do tipo 'principal', atualizar a tabela produtos
    IF NEW.tipo_imagem = 'principal' AND NEW.ativo = true THEN
        UPDATE produtos 
        SET imagem_principal_url = NEW.url_imagem,
            updated_at = NOW()
        WHERE id = NEW.id_produto;
    END IF;
    
    -- Se a imagem foi desativada e era a principal, limpar da tabela produtos
    IF OLD.tipo_imagem = 'principal' AND NEW.ativo = false THEN
        UPDATE produtos 
        SET imagem_principal_url = NULL,
            updated_at = NOW()
        WHERE id = NEW.id_produto AND imagem_principal_url = OLD.url_imagem;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para manter sincronização da imagem principal
CREATE TRIGGER sync_produto_imagem_principal
    AFTER INSERT OR UPDATE ON produto_imagens
    FOR EACH ROW EXECUTE FUNCTION update_produto_imagem_principal();

-- Função para limpar imagens órfãs (sem produto)
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Marcar como inativas imagens de produtos que não existem mais
    UPDATE produto_imagens 
    SET ativo = false, updated_at = NOW()
    WHERE id_produto NOT IN (SELECT id FROM produtos WHERE ativo = true)
    AND ativo = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- View para estatísticas de imagens
CREATE OR REPLACE VIEW v_produto_imagens_stats AS
SELECT 
    p.id as produto_id,
    p.nome as produto_nome,
    COUNT(pi.id) as total_imagens,
    COUNT(CASE WHEN pi.tipo_imagem = 'principal' THEN 1 END) as imagens_principais,
    COUNT(CASE WHEN pi.tipo_imagem = 'referencia' THEN 1 END) as imagens_referencia,
    COUNT(CASE WHEN pi.origem = 'internet_search' THEN 1 END) as imagens_internet,
    COUNT(CASE WHEN pi.origem = 'user_capture' THEN 1 END) as imagens_usuario,
    MAX(pi.created_at) as ultima_imagem_adicionada
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.ativo = true
WHERE p.ativo = true
GROUP BY p.id, p.nome;

-- View para histórico de reconhecimento
CREATE OR REPLACE VIEW v_reconhecimento_performance AS
SELECT 
    DATE_TRUNC('day', created_at) as data,
    tipo_busca,
    COUNT(*) as total_tentativas,
    COUNT(CASE WHEN sucesso = true THEN 1 END) as sucessos,
    ROUND(
        (COUNT(CASE WHEN sucesso = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as taxa_sucesso_pct,
    AVG(tempo_resposta_ms) as tempo_medio_ms,
    COUNT(DISTINCT api_utilizada) as apis_utilizadas
FROM busca_foto_historico
GROUP BY DATE_TRUNC('day', created_at), tipo_busca
ORDER BY data DESC;

-- Inserir dados de exemplo para teste
INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao)
SELECT 
    p.id,
    'https://via.placeholder.com/300x300?text=' || REPLACE(p.nome, ' ', '+'),
    'principal',
    'upload',
    'Imagem principal de ' || p.nome
FROM produtos p
WHERE p.ativo = true
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE produto_imagens IS 'Armazena múltiplas imagens de referência para cada produto, incluindo imagem principal e imagens para reconhecimento';
COMMENT ON TABLE busca_foto_historico IS 'Histórico de buscas por foto para análise de performance e melhoria do sistema';
COMMENT ON TABLE reconhecimento_aprendizado IS 'Dados de aprendizado do sistema de reconhecimento para melhorar a precisão';

COMMENT ON COLUMN produto_imagens.features_vector IS 'JSON com características extraídas da imagem para comparação (ex: histograma, features CNN)';
COMMENT ON COLUMN produto_imagens.confianca_score IS 'Score de confiança da identificação automática (0.00 = baixa, 1.00 = alta)';
COMMENT ON COLUMN busca_foto_historico.termos_busca IS 'Array de termos derivados da imagem para busca na internet';
COMMENT ON COLUMN reconhecimento_aprendizado.score_similaridade IS 'Score de similaridade entre imagem capturada e imagem de referência';

COMMIT;

