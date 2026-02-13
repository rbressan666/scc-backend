-- Script de diagnóstico para verificar o estado das imagens
-- Execute este script para ver se as imagens foram associadas corretamente

-- Verificar produtos com imagens principais
SELECT
    p.nome as produto_nome,
    p.imagem_principal_url,
    pi.url_imagem,
    pi.tipo_imagem,
    pi.ativo
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.tipo_imagem = 'principal' AND pi.ativo = true
WHERE p.ativo = true
ORDER BY p.nome;

-- Verificar se existem imagens sem produto correspondente
SELECT
    pi.url_imagem,
    pi.tipo_imagem,
    p.nome as produto_encontrado
FROM produto_imagens pi
LEFT JOIN produtos p ON pi.id_produto = p.id
WHERE pi.tipo_imagem = 'principal' AND pi.ativo = true
ORDER BY pi.url_imagem;

-- Contar produtos com e sem imagens
SELECT
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN imagem_principal_url IS NOT NULL THEN 1 END) as produtos_com_imagem,
    COUNT(CASE WHEN imagem_principal_url IS NULL THEN 1 END) as produtos_sem_imagem
FROM produtos
WHERE ativo = true;