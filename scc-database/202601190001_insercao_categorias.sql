-- Script de Inserção de Categorias: Cria a categoria "Bar" e suas subcategorias
-- Baseado nas categorias do CSV filtrado

-- 1. Inserir categoria pai "Bar"
INSERT INTO categorias (nome) VALUES ('Bar');

-- 2. Inserir subcategorias dentro de "Bar"
INSERT INTO categorias (nome, id_categoria_pai)
SELECT 'Bebidas', id FROM categorias WHERE nome = 'Bar';

INSERT INTO categorias (nome, id_categoria_pai)
SELECT 'Cervejas', id FROM categorias WHERE nome = 'Bar';

INSERT INTO categorias (nome, id_categoria_pai)
SELECT 'Cigarro', id FROM categorias WHERE nome = 'Bar';

INSERT INTO categorias (nome, id_categoria_pai)
SELECT 'Garrafas', id FROM categorias WHERE nome = 'Bar';

INSERT INTO categorias (nome, id_categoria_pai)
SELECT 'SNACKS/LARICA', id FROM categorias WHERE nome = 'Bar';

-- Commit para confirmar as mudanças
COMMIT;