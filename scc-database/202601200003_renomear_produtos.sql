-- Script para renomear produtos para corresponder aos nomes das imagens
-- Data: 2026-01-20

BEGIN;

-- Renomear produtos para corresponder exatamente aos nomes dos arquivos de imagem
UPDATE produtos
SET nome = 'AGUA garrafa 500 ml'
WHERE nome = 'AGUA';

UPDATE produtos
SET nome = 'AGUA COM GAS garrafa 500ml'
WHERE nome = 'AGUA COM GAS';

COMMIT;