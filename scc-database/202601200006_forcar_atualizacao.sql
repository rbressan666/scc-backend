-- Script para forçar atualização das imagens existentes
-- Este script garante que todas as imagens sejam marcadas como 'principal'

BEGIN;

-- Primeiro, verificar imagens existentes
SELECT
    p.nome as produto,
    pi.url_imagem,
    pi.tipo_imagem
FROM produtos p
JOIN produto_imagens pi ON p.id = pi.id_produto
WHERE pi.ativo = true
ORDER BY p.nome;

-- Forçar atualização de todas as imagens para 'principal'
UPDATE produto_imagens
SET tipo_imagem = 'principal'
WHERE ativo = true;

-- Verificar se o trigger funcionou
SELECT
    p.nome,
    p.imagem_principal_url
FROM produtos p
WHERE p.imagem_principal_url IS NOT NULL
ORDER BY p.nome;

COMMIT;