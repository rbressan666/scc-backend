-- Script de Limpeza: Remove todos os produtos e categorias existentes
-- ATENÇÃO: Este script apaga TODOS os dados de produtos e categorias. Faça backup antes!

-- Ordem de deleção respeitando foreign keys
DELETE FROM itens_contagem;
DELETE FROM analise_variacao;
DELETE FROM fatores_conversao;
DELETE FROM variacoes_produto;
DELETE FROM produtos;
DELETE FROM contagens;
DELETE FROM turnos;
DELETE FROM categorias;

-- Commit para confirmar as mudanças
COMMIT;