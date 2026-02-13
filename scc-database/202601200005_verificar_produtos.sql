-- Script para verificar se os produtos existem com os nomes corretos
-- Execute este script para verificar se a renomeação funcionou

-- Verificar se os produtos foram renomeados corretamente
SELECT nome FROM produtos WHERE nome LIKE '%AGUA%' ORDER BY nome;

-- Verificar produtos que deveriam ter imagens
SELECT
    p.nome,
    COUNT(pi.id) as imagens_principais
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.tipo_imagem = 'principal' AND pi.ativo = true
WHERE p.ativo = true
GROUP BY p.id, p.nome
HAVING COUNT(pi.id) = 0
ORDER BY p.nome;