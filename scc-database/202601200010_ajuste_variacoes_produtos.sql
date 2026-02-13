-- Script para ajustar variações dos produtos conforme regras específicas
-- Data: 20/01/2026

BEGIN;

-- Primeiro, limpar todas as variações existentes para recriar conforme regras
DELETE FROM variacoes_produto;

-- Regra 1: Toda Lata e Garrafa DEVE ter a unidade de medida "Unidade" como principal (fator_prioridade = 1)
-- Identificar produtos que são latas ou garrafas
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT
    p.id,
    'Unidade', -- Nome da variação é sempre "Unidade" para latas/garrafas
    0.000,
    0.000,
    0.00,
    1, -- Prioridade principal
    u.id
FROM produtos p
JOIN unidades_de_medida u ON u.sigla = 'UN'
WHERE p.ativo = true
  AND (
      -- Latas: produtos que contêm "LATA" ou "Lata" no nome
      UPPER(p.nome) LIKE '%LATA%' OR
      -- Garrafas: produtos na categoria "Garrafas" ou que contêm "GARRAFA" no nome
      p.id_categoria IN (SELECT id FROM categorias WHERE nome = 'Garrafas') OR
      UPPER(p.nome) LIKE '%GARRAFA%'
  );

-- Regra 2: As águas devem ter uma variação de unidade de medida secundária de fardo de 12 unidades (fator_prioridade = 2)
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT
    p.id,
    'Fardo com 12 unidades',
    0.000,
    0.000,
    0.00,
    2, -- Prioridade secundária
    u.id
FROM produtos p
JOIN unidades_de_medida u ON u.nome = 'Fardo'
WHERE p.ativo = true
  AND UPPER(p.nome) LIKE 'AGUA%';

-- Regra 3: As garrafas de 600ml devem ter uma variação de unidade de medida secundária de caixa com 24 Unidades (fator_prioridade = 2)
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT
    p.id,
    'Caixa com 24 unidades',
    0.000,
    0.000,
    0.00,
    2, -- Prioridade secundária
    u.id
FROM produtos p
JOIN unidades_de_medida u ON u.nome = 'Caixa com 24 unidades'
WHERE p.ativo = true
  AND UPPER(p.nome) LIKE '%600ML%';

-- Regra 4: Todos os outros itens não devem ter variações secundárias - apenas a principal "Unidade"
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT
    p.id,
    'Unidade', -- Nome da variação
    0.000,
    0.000,
    0.00,
    1, -- Prioridade principal
    u.id
FROM produtos p
JOIN unidades_de_medida u ON u.sigla = 'UN'
WHERE p.ativo = true
  AND p.id NOT IN (
      -- Excluir produtos que já têm variações (latas, garrafas, águas, garrafas 600ml)
      SELECT DISTINCT vp.id_produto
      FROM variacoes_produto vp
  );

-- Verificar se há produtos sem variações (não deveriam existir)
DO $$
DECLARE
    produto_sem_variacao RECORD;
BEGIN
    FOR produto_sem_variacao IN
        SELECT p.nome
        FROM produtos p
        WHERE p.ativo = true
          AND p.id NOT IN (SELECT DISTINCT vp.id_produto FROM variacoes_produto vp)
    LOOP
        RAISE NOTICE 'Produto sem variação encontrada: %', produto_sem_variacao.nome;
    END LOOP;
END $$;

COMMIT;