-- Script direto para inserir/atualizar imagens dos produtos
-- Este script garante que todas as imagens sejam criadas/atualizadas

BEGIN;

-- Inserir ou atualizar imagens para cada produto
-- Usando INSERT ... ON CONFLICT para upsert

-- Bebidas
INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/AGUA garrafa 500 ml.png', 'principal', 'upload', 'Imagem da Água garrafa 500 ml', true
FROM produtos p WHERE p.nome = 'AGUA garrafa 500 ml'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/AGUA COM GAS garrafa 500ml.png', 'principal', 'upload', 'Imagem da Água com Gás garrafa 500ml', true
FROM produtos p WHERE p.nome = 'AGUA COM GAS garrafa 500ml'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/CHOPP LAGER 500ML.png', 'principal', 'upload', 'Imagem do Chopp Lager 500ML', true
FROM produtos p WHERE p.nome = 'CHOPP LAGER 500ML'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/COCA COLA 350ml.png', 'principal', 'upload', 'Imagem da Coca Cola 350ml', true
FROM produtos p WHERE p.nome = 'COCA COLA 350ml'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/COCA COLA ZERO.png', 'principal', 'upload', 'Imagem da Coca Cola Zero', true
FROM produtos p WHERE p.nome = 'COCA COLA ZERO'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/GUARANA ANTARTICA.png', 'principal', 'upload', 'Imagem do Guaraná Antarctica', true
FROM produtos p WHERE p.nome = 'GUARANA ANTARTICA'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/GUARANA ANTARTICA ZERO.png', 'principal', 'upload', 'Imagem do Guaraná Antarctica Zero', true
FROM produtos p WHERE p.nome = 'GUARANA ANTARTICA ZERO'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/RED BUL AMORA ZERO.png', 'principal', 'upload', 'Imagem do Red Bull Amora Zero', true
FROM produtos p WHERE p.nome = 'RED BUL AMORA ZERO'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/RED BULL ZERO.png', 'principal', 'upload', 'Imagem do Red Bull Zero', true
FROM produtos p WHERE p.nome = 'RED BULL ZERO'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/Red label.png', 'principal', 'upload', 'Imagem do Red Label', true
FROM produtos p WHERE p.nome = 'Red label'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/REDBULL 250ml.png', 'principal', 'upload', 'Imagem do Red Bull 250ml', true
FROM produtos p WHERE p.nome = 'REDBULL 250ml'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/SPRITE.png', 'principal', 'upload', 'Imagem do Sprite', true
FROM produtos p WHERE p.nome = 'SPRITE'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/SUCO DEL VALE UVA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Uva', true
FROM produtos p WHERE p.nome = 'SUCO DEL VALE UVA'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/SUCO DEL VALLE GOIABA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Goiaba', true
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE GOIABA'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/SUCO DEL VALLE MANGA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Manga', true
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE MANGA'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/SUCO DEL VALLE MARACULA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Maracula', true
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE MARACULA'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/SUCO DEL VALLE PESSEGO.png', 'principal', 'upload', 'Imagem do Suco Del Valle Pessego', true
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE PESSEGO'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/TONICA ANTARTICA.png', 'principal', 'upload', 'Imagem da Tônica Antarctica', true
FROM produtos p WHERE p.nome = 'TONICA ANTARTICA'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/TONICA SCHWEPPES.png', 'principal', 'upload', 'Imagem da Tônica Schweppes', true
FROM produtos p WHERE p.nome = 'TONICA SCHWEPPES'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, '/images/produtos/VIBE ENERGETICO COMBO.png', 'principal', 'upload', 'Imagem do Vibe Energético Combo', true
FROM produtos p WHERE p.nome = 'VIBE ENERGETICO COMBO'
ON CONFLICT (id_produto) DO UPDATE SET
    url_imagem = EXCLUDED.url_imagem,
    tipo_imagem = EXCLUDED.tipo_imagem,
    ativo = EXCLUDED.ativo;

COMMIT;