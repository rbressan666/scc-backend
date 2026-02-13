-- Script para verificar a aplicação das regras de variação
-- Mostra como ficou a distribuição final

-- Resumo das variações por produto
SELECT
    p.nome as produto,
    COUNT(vp.id) as num_variacoes,
    STRING_AGG(
        CASE
            WHEN vp.nome IS NOT NULL THEN vp.nome || ' (prioridade: ' || vp.fator_prioridade || ')'
            ELSE 'Sem variação'
        END,
        '; '
    ) as variacoes,
    CASE
        WHEN p.nome IN ('COCA COLA 350ml', 'COCA COLA ZERO', 'GUARANA ANTARTICA', 'GUARANA ANTARTICA ZERO', 'RED BUL AMORA ZERO', 'RED BULL ZERO', 'Red label', 'REDBULL 250ml', 'SPRITE', 'SUCO DEL VALE UVA', 'SUCO DEL VALLE GOIABA', 'SUCO DEL VALLE MANGA', 'SUCO DEL VALLE MARACULA', 'SUCO DEL VALLE PESSEGO', 'TONICA ANTARTICA', 'TONICA SCHWEPPES', 'VIBE ENERGETICO COMBO', 'Witber - Witamina 473ml', 'MELANINA IRISH EXTRA STOUT 473ML') THEN 'LATA (Regra 2)'
        WHEN p.nome IN ('BRUGSE ZOT BELGA ESCURA', 'HEINEKEN Long Neck', 'HEINEKEN LONG NECK ZERO', 'PATAGONIA WEISSE 740ml', 'Straffen Hendrik') THEN 'GARRAFA (Regra 2)'
        WHEN UPPER(p.nome) LIKE 'AGUA%' THEN 'AGUA (Regra 3)'
        WHEN UPPER(p.nome) LIKE '%600ML%' THEN 'GARRAFA 600ML (Regra 4)'
        ELSE 'OUTRO (Regra 5)'
    END as classificacao
FROM produtos p
LEFT JOIN variacoes_produto vp ON p.id_produto = vp.id_produto
WHERE p.ativo = true
GROUP BY p.id, p.nome
ORDER BY p.nome;

-- Estatísticas finais
SELECT
    'Total de produtos' as metrica,
    COUNT(*) as valor
FROM produtos
WHERE ativo = true

UNION ALL

SELECT
    'Produtos com variações' as metrica,
    COUNT(DISTINCT vp.id_produto) as valor
FROM variacoes_produto vp

UNION ALL

SELECT
    'Total de variações criadas' as metrica,
    COUNT(*) as valor
FROM variacoes_produto

UNION ALL

SELECT
    'Produtos sem variações' as metrica,
    (SELECT COUNT(*) FROM produtos WHERE ativo = true) - (SELECT COUNT(DISTINCT id_produto) FROM variacoes_produto) as valor;