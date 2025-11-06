-- Script para adicionar campo quantidade na tabela unidades_de_medida
-- Data: 30/09/2025
-- Descrição: Adiciona campo para definir quantas unidades base cada unidade representa

-- Adicionar coluna quantidade com valor padrão 1
ALTER TABLE unidades_de_medida 
ADD COLUMN IF NOT EXISTS quantidade NUMERIC(10,3) DEFAULT 1.000 NOT NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN unidades_de_medida.quantidade IS 'Quantidade que esta unidade representa em relação à unidade base (ex: 1 Caixa = 24 Unidades)';

-- Atualizar unidades existentes com valores padrão apropriados
-- Estas são sugestões baseadas em unidades comuns, ajuste conforme necessário

-- Unidades básicas (mantém 1)
UPDATE unidades_de_medida SET quantidade = 1.000 WHERE LOWER(nome) IN ('unidade', 'peça', 'item');

-- Unidades de peso
UPDATE unidades_de_medida SET quantidade = 1000.000 WHERE LOWER(nome) = 'quilograma' OR LOWER(sigla) = 'kg';
UPDATE unidades_de_medida SET quantidade = 1.000 WHERE LOWER(nome) = 'grama' OR LOWER(sigla) = 'g';

-- Unidades de volume
UPDATE unidades_de_medida SET quantidade = 1000.000 WHERE LOWER(nome) = 'litro' OR LOWER(sigla) = 'l';
UPDATE unidades_de_medida SET quantidade = 1.000 WHERE LOWER(nome) = 'mililitro' OR LOWER(sigla) = 'ml';

-- Unidades de embalagem (exemplos - ajustar conforme necessário)
UPDATE unidades_de_medida SET quantidade = 24.000 WHERE LOWER(nome) LIKE '%caixa%' AND quantidade = 1.000;
UPDATE unidades_de_medida SET quantidade = 12.000 WHERE LOWER(nome) LIKE '%pacote%' AND quantidade = 1.000;
UPDATE unidades_de_medida SET quantidade = 6.000 WHERE LOWER(nome) LIKE '%pack%' AND quantidade = 1.000;

-- Verificar resultado
SELECT 
    id,
    nome,
    sigla,
    quantidade,
    created_at
FROM unidades_de_medida 
ORDER BY nome;

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Campo quantidade adicionado com sucesso à tabela unidades_de_medida';
    RAISE NOTICE 'Valores padrão aplicados. Revise e ajuste conforme necessário.';
END $$;
