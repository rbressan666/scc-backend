-- Script para verificar se as unidades de medida necessárias existem
-- E criar se necessário

-- Verificar unidades existentes
SELECT nome, sigla FROM unidades_de_medida ORDER BY nome;

-- Garantir que as unidades necessárias existem
INSERT INTO unidades_de_medida (nome, sigla) VALUES
    ('Fardo', 'FD'),
    ('Caixa com 24 unidades', 'CX-24')
ON CONFLICT (nome) DO NOTHING;

-- Verificar novamente
SELECT nome, sigla FROM unidades_de_medida ORDER BY nome;