-- Script para atualizar URLs das imagens dos produtos
-- Atualizado com base nas imagens encontradas na pasta public/images/produtos/
-- Data: 2026-01-20

BEGIN;

-- Bebidas
UPDATE produto_imagens
SET url_imagem = '/images/produtos/AGUA garrafa 500 ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'AGUA garrafa 500 ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/AGUA COM GAS garrafa 500ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'AGUA COM GAS garrafa 500ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/CHOPP LAGER 500ML.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'CHOPP LAGER 500ML');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/COCA COLA 350ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'COCA COLA 350ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/COCA COLA ZERO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'COCA COLA ZERO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/GUARANA ANTARTICA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'GUARANA ANTARTICA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/GUARANA ANTARTICA ZERO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'GUARANA ANTARTICA ZERO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/RED BUL AMORA ZERO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'RED BUL AMORA ZERO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/RED BULL ZERO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'RED BULL ZERO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Red label.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Red label');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/REDBULL 250ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'REDBULL 250ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SPRITE.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SPRITE');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SUCO DEL VALE UVA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SUCO DEL VALE UVA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SUCO DEL VALLE GOIABA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SUCO DEL VALLE GOIABA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SUCO DEL VALLE MANGA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SUCO DEL VALLE MANGA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SUCO DEL VALLE MARACULA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SUCO DEL VALLE MARACULA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SUCO DEL VALLE PESSEGO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SUCO DEL VALLE PESSEGO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/TONICA ANTARTICA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'TONICA ANTARTICA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/TONICA SCHWEPPES.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'TONICA SCHWEPPES');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/VIBE ENERGETICO COMBO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'VIBE ENERGETICO COMBO');

-- Cervejas
UPDATE produto_imagens
SET url_imagem = '/images/produtos/Amstel 269 Lata.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Amstel 269 Lata');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Amstel 350 Lata.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Amstel 350 Lata');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Amstel 600ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Amstel 600ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/BRUGSE ZOT BELGA ESCURA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'BRUGSE ZOT BELGA ESCURA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/HEINEKEN 600ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'HEINEKEN 600ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/HEINEKEN LATA ZERO 350ML.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'HEINEKEN LATA ZERO 350ML');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/HEINEKEN Long Neck.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'HEINEKEN Long Neck');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/HEINEKEN LONG NECK ZERO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'HEINEKEN LONG NECK ZERO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Heinken LATA 269.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Heinken LATA 269');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/MELANINA IRISH EXTRA STOUT 473ML.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'MELANINA IRISH EXTRA STOUT 473ML');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/ORIGINAL 600ML.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'ORIGINAL 600ML');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/PATAGONIA IPA LATA 350.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'PATAGONIA IPA LATA 350');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/PATAGONIA WEISSE 740ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'PATAGONIA WEISSE 740ml');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/PATAGONIA Weisse LATA 350.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'PATAGONIA Weisse LATA 350');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/SKOL BEATS LATA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'SKOL BEATS LATA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Straffen Hendrik.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Straffen Hendrik');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Witber - Witamina 473ml.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Witber - Witamina 473ml');

-- Cigarro
UPDATE produto_imagens
SET url_imagem = '/images/produtos/CIGARRO AVULSO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'CIGARRO AVULSO');

-- Garrafas
UPDATE produto_imagens
SET url_imagem = '/images/produtos/APOGEE GIM.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'APOGEE GIM');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/BACARDI CARTA BLANCA.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'BACARDI CARTA BLANCA');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/CAMPARI.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'CAMPARI');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Cavalo branco.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Cavalo branco');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/DOMEC.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'DOMEC');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/GIN APOGEE.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'GIN APOGEE');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/HIDROMEL.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'HIDROMEL');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/JIM BEAN.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'JIM BEAN');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/MARTINI ROSSO.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'MARTINI ROSSO');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/TEKILOKA SILVER.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'TEKILOKA SILVER');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/TEKILOKA NIGHT.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'TEKILOKA NIGHT');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Velho Barreiro.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Velho Barreiro');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Black Label Garrafa.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Black Label Garrafa');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Canelinha Garrafa.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Canelinha Garrafa');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Don Nogueira Garrafa.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Don Nogueira Garrafa');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Jack Daniels N7.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Jack Daniels N7');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/jagermeister garrafa.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'jagermeister garrafa');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Sagatiba.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Sagatiba');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Sake Garrafa.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Sake Garrafa');

UPDATE produto_imagens
SET url_imagem = '/images/produtos/Smirnoff.png',
    tipo_imagem = 'principal'
WHERE id_produto = (SELECT id FROM produtos WHERE nome = 'Smirnoff');

COMMIT;