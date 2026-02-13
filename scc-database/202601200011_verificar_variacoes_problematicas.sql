-- Script para identificar produtos com variações que não seguem as regras
-- Data: 20/01/2026

-- Produtos que têm variações com nomes IGUAIS ao nome do produto
-- Estes NÃO seguem as regras 1-5 e precisam ser ajustados

SELECT
    p.nome as produto,
    vp.nome as variacao,
    um.nome as unidade_medida,
    vp.fator_prioridade,
    CASE
        WHEN UPPER(p.nome) LIKE '%LATA%' OR UPPER(p.nome) LIKE '%GARRAFA%' OR p.id_categoria IN (SELECT id FROM categorias WHERE nome = 'Garrafas') THEN 'Lata/Garrafa - DEVE ter "Unidade" como principal'
        WHEN UPPER(p.nome) LIKE 'AGUA%' THEN 'Água - DEVE ter variação secundária "Fardo com 12 unidades"'
        WHEN UPPER(p.nome) LIKE '%600ML%' THEN 'Garrafa 600ml - DEVE ter variação secundária "Caixa com 24 unidades"'
        ELSE 'Outro - NÃO deve ter variações secundárias'
    END as regra_esperada,
    CASE
        WHEN vp.nome = p.nome THEN 'PROBLEMA: Nome da variação igual ao produto'
        ELSE 'OK'
    END as status_nome
FROM variacoes_produto vp
JOIN produtos p ON vp.id_produto = p.id
JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
WHERE p.ativo = true
  AND vp.nome = p.nome  -- Variações com nome igual ao produto
ORDER BY p.nome;