-- Query: Buscar detalhe do turno com comparação de duas últimas contagens
-- Para executar diretamente no banco, substitua 'SEU_TURNO_ID_AQUI' pelo UUID do turno:
-- SELECT * FROM (
--   WITH ranked_contagens AS (
--     SELECT
--       c.id,
--       c.turno_id,
--       c.data_inicio,
--       c.tipo_contagem,
--       c.status,
--       ROW_NUMBER() OVER (PARTITION BY c.turno_id ORDER BY c.data_inicio DESC) AS rn
--     FROM contagens c
--     WHERE c.turno_id = 'SEU_TURNO_ID_AQUI'
--       AND c.status IN ('pre_fechada', 'fechada', 'aberta')
--   )
--   SELECT
--     p.id AS produto_id,
--     p.nome AS produto_nome,
--     vp.id AS variacao_id,
--     vp.nome AS variacao_nome,
--     MAX(CASE WHEN rc.rn = 2 THEN ic.quantidade_convertida ELSE 0 END) AS contagem_anterior,
--     MAX(CASE WHEN rc.rn = 1 THEN ic.quantidade_convertida ELSE 0 END) AS contagem_atual,
--     (MAX(CASE WHEN rc.rn = 1 THEN ic.quantidade_convertida ELSE 0 END) -
--      MAX(CASE WHEN rc.rn = 2 THEN ic.quantidade_convertida ELSE 0 END)) AS saldo,
--     MAX(CASE WHEN rc.rn = 2 THEN rc.data_inicio END) AS data_anterior,
--     MAX(CASE WHEN rc.rn = 1 THEN rc.data_inicio END) AS data_atual,
--     MAX(CASE WHEN rc.rn = 1 THEN rc.status END) AS status_contagem_atual,
    COUNT(CASE WHEN rc.rn = 2 THEN ic.id END) > 0 AS tem_anterior
--   FROM ranked_contagens rc
--   LEFT JOIN itens_contagem ic ON ic.contagem_id = rc.id
--   LEFT JOIN variacoes_produto vp ON vp.id = ic.variacao_id
--   LEFT JOIN produtos p ON p.id = vp.id_produto
--   WHERE rc.rn <= 2
--   GROUP BY p.id, p.nome, vp.id, vp.nome
--   ORDER BY p.nome ASC
-- ) AS comparison_result;

WITH ranked_contagens AS (
  SELECT
    c.id,
    c.turno_id,
    c.data_inicio,
    c.tipo_contagem,
    c.status,
    ROW_NUMBER() OVER (PARTITION BY c.turno_id ORDER BY c.data_inicio DESC) AS rn
  FROM contagens c
  WHERE c.turno_id = $1
    AND c.status IN ('pre_fechada', 'fechada', 'aberta')
)
SELECT
  p.id AS produto_id,
  p.nome AS produto_nome,
  vp.id AS variacao_id,
  vp.nome AS variacao_nome,
  MAX(CASE WHEN rc.rn = 2 THEN ic.quantidade_convertida ELSE 0 END) AS contagem_anterior,
  MAX(CASE WHEN rc.rn = 1 THEN ic.quantidade_convertida ELSE 0 END) AS contagem_atual,
  (MAX(CASE WHEN rc.rn = 1 THEN ic.quantidade_convertida ELSE 0 END) -
   MAX(CASE WHEN rc.rn = 2 THEN ic.quantidade_convertida ELSE 0 END)) AS saldo,
  MAX(CASE WHEN rc.rn = 2 THEN rc.data_inicio END) AS data_anterior,
  MAX(CASE WHEN rc.rn = 1 THEN rc.data_inicio END) AS data_atual,
  MAX(CASE WHEN rc.rn = 1 THEN rc.status END) AS status_contagem_atual,
  COUNT(CASE WHEN rc.rn = 2 THEN ic.id END) > 0 AS tem_anterior
FROM ranked_contagens rc
LEFT JOIN itens_contagem ic ON ic.contagem_id = rc.id
LEFT JOIN variacoes_produto vp ON vp.id = ic.variacao_id
LEFT JOIN produtos p ON p.id = vp.id_produto
WHERE rc.rn <= 2
GROUP BY p.id, p.nome, vp.id, vp.nome
ORDER BY p.nome ASC;