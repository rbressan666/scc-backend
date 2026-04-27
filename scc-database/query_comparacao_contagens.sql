-- Query: Buscar contagem atual do turno
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
--     COALESCE(SUM(ic.quantidade_convertida), 0) AS contagem_atual,
--     MAX(rc.data_inicio) AS data_atual,
--     MAX(rc.status) AS status_contagem_atual
--     COUNT(CASE WHEN rc.rn = 2 THEN ic.id END) > 0 AS tem_anterior
--   FROM ranked_contagens rc
--   LEFT JOIN itens_contagem ic ON ic.contagem_id = rc.id
--   LEFT JOIN variacoes_produto vp ON vp.id = ic.variacao_id
--   LEFT JOIN produtos p ON p.id = vp.id_produto
--   WHERE rc.rn = 1
--   GROUP BY p.id, p.nome, vp.id, vp.nome
--   ORDER BY p.nome ASC
-- ) AS contagem_result;

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
  COALESCE(SUM(ic.quantidade_convertida), 0) AS contagem_atual,
  MAX(rc.data_inicio) AS data_atual,
  MAX(rc.status) AS status_contagem_atual
FROM ranked_contagens rc
LEFT JOIN itens_contagem ic ON ic.contagem_id = rc.id
LEFT JOIN variacoes_produto vp ON vp.id = ic.variacao_id
LEFT JOIN produtos p ON p.id = vp.id_produto
WHERE rc.rn = 1
GROUP BY p.id, p.nome, vp.id, vp.nome
ORDER BY p.nome ASC;