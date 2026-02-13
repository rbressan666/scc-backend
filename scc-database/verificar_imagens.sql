-- Verificar se as imagens foram inseridas corretamente

-- 1. Contar total de imagens por produto
SELECT
    p.nome,
    COUNT(pi.id) as total_imagens,
    COUNT(CASE WHEN pi.tipo_imagem = 'principal' THEN 1 END) as imagens_principais,
    p.imagem_principal_url
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.ativo = true
WHERE p.ativo = true
GROUP BY p.id, p.nome, p.imagem_principal_url
ORDER BY p.nome;

-- 2. Verificar se todos os produtos têm imagem principal
SELECT
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN imagem_principal_url IS NOT NULL THEN 1 END) as produtos_com_imagem,
    COUNT(CASE WHEN imagem_principal_url IS NULL THEN 1 END) as produtos_sem_imagem
FROM produtos
WHERE ativo = true;

-- 3. Ver produtos sem imagem (se houver)
SELECT nome, imagem_principal_url
FROM produtos
WHERE ativo = true AND imagem_principal_url IS NULL
ORDER BY nome;

-- 4. Verificar algumas imagens específicas
SELECT
    p.nome,
    pi.url_imagem,
    pi.tipo_imagem,
    pi.ativo,
    p.imagem_principal_url
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.tipo_imagem = 'principal' AND pi.ativo = true
WHERE p.nome IN ('COCA COLA 350ml', 'HEINEKEN 600ml', 'AGUA garrafa 500 ml')
ORDER BY p.nome;