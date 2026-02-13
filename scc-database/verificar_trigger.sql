-- Verificar se o trigger funcionou e populou imagem_principal_url
SELECT
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN imagem_principal_url IS NOT NULL THEN 1 END) as com_imagem_principal,
    COUNT(CASE WHEN imagem_principal_url IS NULL THEN 1 END) as sem_imagem_principal
FROM produtos
WHERE ativo = true;

-- Ver produtos que ainda não têm imagem principal (se houver)
SELECT nome, imagem_principal_url
FROM produtos
WHERE ativo = true AND imagem_principal_url IS NULL
ORDER BY nome;

-- Verificar alguns produtos específicos
SELECT
    p.nome,
    p.imagem_principal_url,
    pi.url_imagem,
    pi.tipo_imagem,
    pi.ativo
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.tipo_imagem = 'principal' AND pi.ativo = true
WHERE p.nome IN ('COCA COLA 350ml', 'HEINEKEN 600ml', 'AGUA garrafa 500 ml', 'GUARANA ANTARTICA')
ORDER BY p.nome;