-- Script para aplicar as regras de variação dos produtos
-- Data: 20/01/2026

BEGIN;

-- Primeiro, limpar todas as variações existentes para recriar conforme regras
DELETE FROM variacoes_produto;

-- =====================================================
-- REGRA 2: Toda Lata e Garrafa DEVE ter a unidade de medida "Unidade" como principal
-- =====================================================

-- Inserir variações para LATAS (fator_prioridade = 1)
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT
    p.id,
    'Unidade', -- Nome da variação é sempre "Unidade" para latas
    0.000,
    0.000,
    0.00,
    1, -- Prioridade principal
    u.id
FROM produtos p
JOIN unidades_de_medida u ON u.sigla = 'UN'
WHERE p.ativo = true
  AND p.nome IN (
      'COCA COLA 350ml',
      'COCA COLA ZERO',
      'GUARANA ANTARTICA',
      'GUARANA ANTARTICA ZERO',
      'RED BUL AMORA ZERO',
      'RED BULL ZERO',
      'Red label',
      'REDBULL 250ml',
      'SPRITE',
      'SUCO DEL VALE UVA',
      'SUCO DEL VALLE GOIABA',
      'SUCO DEL VALLE MANGA',
      'SUCO DEL VALLE MARACULA',
      'SUCO DEL VALLE PESSEGO',
      'TONICA ANTARTICA',
      'TONICA SCHWEPPES',
      'VIBE ENERGETICO COMBO',
      'Witber - Witamina 473ml',
      'MELANINA IRISH EXTRA STOUT 473ML'
  );

-- Inserir variações para GARRAFAS (fator_prioridade = 1)
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT
    p.id,
    'Unidade', -- Nome da variação é sempre "Unidade" para garrafas
    0.000,
    0.000,
    0.00,
    1, -- Prioridade principal
    u.id
FROM produtos p
JOIN unidades_de_medida u ON u.sigla = 'UN'
WHERE p.ativo = true
  AND p.nome IN (
      'BRUGSE ZOT BELGA ESCURA',
      'HEINEKEN Long Neck',
      'HEINEKEN LONG NECK ZERO',
      'PATAGONIA WEISSE 740ml',
      'Straffen Hendrik'
  );

-- =====================================================
-- REGRA 3: As águas devem ter uma variação de unidade de medida secundaria de fardo de 12 unidades
-- =====================================================

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

-- =====================================================
-- REGRA 4: As garrafas de 600ml devem ter uma variação de unidade de medida secundaria de caixa com 24 Unidades
-- =====================================================

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

-- =====================================================
-- REGRA 5: Todos os outros itens não devem ter variações secundárias (apenas principal "Unidade")
-- =====================================================

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
      -- Excluir produtos que já têm variações (regras 2, 3 e 4)
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
        RAISE NOTICE 'ALERTA: Produto sem variação encontrada: %', produto_sem_variacao.nome;
    END LOOP;
END $$;

COMMIT;