-- Script de Ajuste: Corrige imagens principais dos produtos
-- Timestamp: 202601190003
-- Este script corrige o tipo_imagem das imagens já inseridas para 'principal'
-- Isso ativa o trigger que preenche o campo imagem_principal_url na tabela produtos

-- Atualizar imagens para tipo 'principal' para ativar o trigger
UPDATE produto_imagens
SET tipo_imagem = 'principal'
WHERE tipo_imagem = 'referencia'
  AND url_imagem IN (
    'https://www.coca-cola.com/content/dam/journey/us/en/brands/coca-cola/coca-cola-original-350ml-lata.png',
    'https://www.heineken.com/media/01hxrr2m/heineken-original-bottle-600ml.png'
  );

-- Commit
COMMIT;