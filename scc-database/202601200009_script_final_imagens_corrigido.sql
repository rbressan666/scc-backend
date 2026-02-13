-- Script CORRIGIDO - Insere ou atualiza TODAS as imagens dos produtos
-- Usa abordagem UPDATE primeiro, depois INSERT se necessário
-- Evita problemas com constraints ON CONFLICT

BEGIN;

-- Função auxiliar para upsert de imagem
CREATE OR REPLACE FUNCTION upsert_produto_imagem(
    p_id_produto UUID,
    p_url_imagem TEXT,
    p_tipo_imagem VARCHAR(20),
    p_origem VARCHAR(50),
    p_descricao TEXT
) RETURNS VOID AS $$
BEGIN
    -- Primeiro tenta atualizar imagem existente do mesmo tipo
    UPDATE produto_imagens
    SET url_imagem = p_url_imagem,
        origem = p_origem,
        descricao = p_descricao,
        ativo = true,
        updated_at = NOW()
    WHERE id_produto = p_id_produto AND tipo_imagem = p_tipo_imagem;

    -- Se não atualizou nenhuma linha, insere nova
    IF NOT FOUND THEN
        INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
        VALUES (p_id_produto, p_url_imagem, p_tipo_imagem, p_origem, p_descricao, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Bebidas
SELECT upsert_produto_imagem(p.id, '/images/produtos/AGUA garrafa 500 ml.png', 'principal', 'upload', 'Imagem da Água garrafa 500 ml')
FROM produtos p WHERE p.nome = 'AGUA garrafa 500 ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/AGUA COM GAS garrafa 500ml.png', 'principal', 'upload', 'Imagem da Água com Gás garrafa 500ml')
FROM produtos p WHERE p.nome = 'AGUA COM GAS garrafa 500ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/CHOPP LAGER 500ML.png', 'principal', 'upload', 'Imagem do Chopp Lager 500ML')
FROM produtos p WHERE p.nome = 'CHOPP LAGER 500ML';

SELECT upsert_produto_imagem(p.id, '/images/produtos/COCA COLA 350ml.png', 'principal', 'upload', 'Imagem da Coca Cola 350ml')
FROM produtos p WHERE p.nome = 'COCA COLA 350ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/COCA COLA ZERO.png', 'principal', 'upload', 'Imagem da Coca Cola Zero')
FROM produtos p WHERE p.nome = 'COCA COLA ZERO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/GUARANA ANTARTICA.png', 'principal', 'upload', 'Imagem do Guaraná Antarctica')
FROM produtos p WHERE p.nome = 'GUARANA ANTARTICA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/GUARANA ANTARTICA ZERO.png', 'principal', 'upload', 'Imagem do Guaraná Antarctica Zero')
FROM produtos p WHERE p.nome = 'GUARANA ANTARTICA ZERO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/RED BUL AMORA ZERO.png', 'principal', 'upload', 'Imagem do Red Bull Amora Zero')
FROM produtos p WHERE p.nome = 'RED BUL AMORA ZERO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/RED BULL ZERO.png', 'principal', 'upload', 'Imagem do Red Bull Zero')
FROM produtos p WHERE p.nome = 'RED BULL ZERO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Red label.png', 'principal', 'upload', 'Imagem do Red Label')
FROM produtos p WHERE p.nome = 'Red label';

SELECT upsert_produto_imagem(p.id, '/images/produtos/REDBULL 250ml.png', 'principal', 'upload', 'Imagem do Red Bull 250ml')
FROM produtos p WHERE p.nome = 'REDBULL 250ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SPRITE.png', 'principal', 'upload', 'Imagem do Sprite')
FROM produtos p WHERE p.nome = 'SPRITE';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SUCO DEL VALE UVA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Uva')
FROM produtos p WHERE p.nome = 'SUCO DEL VALE UVA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SUCO DEL VALLE GOIABA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Goiaba')
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE GOIABA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SUCO DEL VALLE MANGA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Manga')
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE MANGA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SUCO DEL VALLE MARACULA.png', 'principal', 'upload', 'Imagem do Suco Del Valle Maracula')
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE MARACULA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SUCO DEL VALLE PESSEGO.png', 'principal', 'upload', 'Imagem do Suco Del Valle Pessego')
FROM produtos p WHERE p.nome = 'SUCO DEL VALLE PESSEGO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/TONICA ANTARTICA.png', 'principal', 'upload', 'Imagem da Tônica Antarctica')
FROM produtos p WHERE p.nome = 'TONICA ANTARTICA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/TONICA SCHWEPPES.png', 'principal', 'upload', 'Imagem da Tônica Schweppes')
FROM produtos p WHERE p.nome = 'TONICA SCHWEPPES';

SELECT upsert_produto_imagem(p.id, '/images/produtos/VIBE ENERGETICO COMBO.png', 'principal', 'upload', 'Imagem do Vibe Energético Combo')
FROM produtos p WHERE p.nome = 'VIBE ENERGETICO COMBO';

-- Cervejas
SELECT upsert_produto_imagem(p.id, '/images/produtos/Amstel 269 Lata.png', 'principal', 'upload', 'Imagem do Amstel 269 Lata')
FROM produtos p WHERE p.nome = 'Amstel 269 Lata';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Amstel 350 Lata.png', 'principal', 'upload', 'Imagem do Amstel 350 Lata')
FROM produtos p WHERE p.nome = 'Amstel 350 Lata';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Amstel 600ml.png', 'principal', 'upload', 'Imagem do Amstel 600ml')
FROM produtos p WHERE p.nome = 'Amstel 600ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/BRUGSE ZOT BELGA ESCURA.png', 'principal', 'upload', 'Imagem do Brugse Zot Belga Escura')
FROM produtos p WHERE p.nome = 'BRUGSE ZOT BELGA ESCURA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/HEINEKEN 600ml.png', 'principal', 'upload', 'Imagem do Heineken 600ml')
FROM produtos p WHERE p.nome = 'HEINEKEN 600ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/HEINEKEN LATA ZERO 350ML.png', 'principal', 'upload', 'Imagem do Heineken Lata Zero 350ML')
FROM produtos p WHERE p.nome = 'HEINEKEN LATA ZERO 350ML';

SELECT upsert_produto_imagem(p.id, '/images/produtos/HEINEKEN Long Neck.png', 'principal', 'upload', 'Imagem do Heineken Long Neck')
FROM produtos p WHERE p.nome = 'HEINEKEN Long Neck';

SELECT upsert_produto_imagem(p.id, '/images/produtos/HEINEKEN LONG NECK ZERO.png', 'principal', 'upload', 'Imagem do Heineken Long Neck Zero')
FROM produtos p WHERE p.nome = 'HEINEKEN LONG NECK ZERO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Heinken LATA 269.png', 'principal', 'upload', 'Imagem do Heinken Lata 269')
FROM produtos p WHERE p.nome = 'Heinken LATA 269';

SELECT upsert_produto_imagem(p.id, '/images/produtos/MELANINA IRISH EXTRA STOUT 473ML.png', 'principal', 'upload', 'Imagem da Melanina Irish Extra Stout 473ML')
FROM produtos p WHERE p.nome = 'MELANINA IRISH EXTRA STOUT 473ML';

SELECT upsert_produto_imagem(p.id, '/images/produtos/ORIGINAL 600ML.png', 'principal', 'upload', 'Imagem do Original 600ML')
FROM produtos p WHERE p.nome = 'ORIGINAL 600ML';

SELECT upsert_produto_imagem(p.id, '/images/produtos/PATAGONIA IPA LATA 350.png', 'principal', 'upload', 'Imagem da Patagonia IPA Lata 350')
FROM produtos p WHERE p.nome = 'PATAGONIA IPA LATA 350';

SELECT upsert_produto_imagem(p.id, '/images/produtos/PATAGONIA WEISSE 740ml.png', 'principal', 'upload', 'Imagem da Patagonia Weisse 740ml')
FROM produtos p WHERE p.nome = 'PATAGONIA WEISSE 740ml';

SELECT upsert_produto_imagem(p.id, '/images/produtos/PATAGONIA Weisse LATA 350.png', 'principal', 'upload', 'Imagem da Patagonia Weisse Lata 350')
FROM produtos p WHERE p.nome = 'PATAGONIA Weisse LATA 350';

SELECT upsert_produto_imagem(p.id, '/images/produtos/SKOL BEATS LATA.png', 'principal', 'upload', 'Imagem do Skol Beats Lata')
FROM produtos p WHERE p.nome = 'SKOL BEATS LATA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Straffen Hendrik.png', 'principal', 'upload', 'Imagem do Straffen Hendrik')
FROM produtos p WHERE p.nome = 'Straffen Hendrik';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Witber - Witamina 473ml.png', 'principal', 'upload', 'Imagem do Witber - Witamina 473ml')
FROM produtos p WHERE p.nome = 'Witber - Witamina 473ml';

-- Cigarro
SELECT upsert_produto_imagem(p.id, '/images/produtos/CIGARRO AVULSO.png', 'principal', 'upload', 'Imagem do Cigarro Avulso')
FROM produtos p WHERE p.nome = 'CIGARRO AVULSO';

-- Garrafas
SELECT upsert_produto_imagem(p.id, '/images/produtos/APOGEE GIM.png', 'principal', 'upload', 'Imagem do Apogee Gim')
FROM produtos p WHERE p.nome = 'APOGEE GIM';

SELECT upsert_produto_imagem(p.id, '/images/produtos/BACARDI CARTA BLANCA.png', 'principal', 'upload', 'Imagem do Bacardi Carta Blanca')
FROM produtos p WHERE p.nome = 'BACARDI CARTA BLANCA';

SELECT upsert_produto_imagem(p.id, '/images/produtos/CAMPARI.png', 'principal', 'upload', 'Imagem do Campari')
FROM produtos p WHERE p.nome = 'CAMPARI';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Cavalo branco.png', 'principal', 'upload', 'Imagem do Cavalo Branco')
FROM produtos p WHERE p.nome = 'Cavalo branco';

SELECT upsert_produto_imagem(p.id, '/images/produtos/DOMEC.png', 'principal', 'upload', 'Imagem do Domec')
FROM produtos p WHERE p.nome = 'DOMEC';

SELECT upsert_produto_imagem(p.id, '/images/produtos/GIN APOGEE.png', 'principal', 'upload', 'Imagem do Gin Apogee')
FROM produtos p WHERE p.nome = 'GIN APOGEE';

SELECT upsert_produto_imagem(p.id, '/images/produtos/HIDROMEL.png', 'principal', 'upload', 'Imagem do Hidromel')
FROM produtos p WHERE p.nome = 'HIDROMEL';

SELECT upsert_produto_imagem(p.id, '/images/produtos/JIM BEAN.png', 'principal', 'upload', 'Imagem do Jim Bean')
FROM produtos p WHERE p.nome = 'JIM BEAN';

SELECT upsert_produto_imagem(p.id, '/images/produtos/MARTINI ROSSO.png', 'principal', 'upload', 'Imagem do Martini Rosso')
FROM produtos p WHERE p.nome = 'MARTINI ROSSO';

SELECT upsert_produto_imagem(p.id, '/images/produtos/TEKILOKA SILVER.png', 'principal', 'upload', 'Imagem do Tekiloka Silver')
FROM produtos p WHERE p.nome = 'TEKILOKA SILVER';

SELECT upsert_produto_imagem(p.id, '/images/produtos/TEKILOKA NIGHT.png', 'principal', 'upload', 'Imagem do Tekiloka Night')
FROM produtos p WHERE p.nome = 'TEKILOKA NIGHT';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Velho Barreiro.png', 'principal', 'upload', 'Imagem do Velho Barreiro')
FROM produtos p WHERE p.nome = 'Velho Barreiro';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Black Label Garrafa.png', 'principal', 'upload', 'Imagem do Black Label Garrafa')
FROM produtos p WHERE p.nome = 'Black Label Garrafa';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Canelinha Garrafa.png', 'principal', 'upload', 'Imagem da Canelinha Garrafa')
FROM produtos p WHERE p.nome = 'Canelinha Garrafa';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Don Nogueira Garrafa.png', 'principal', 'upload', 'Imagem da Don Nogueira Garrafa')
FROM produtos p WHERE p.nome = 'Don Nogueira Garrafa';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Jack Daniels N7.png', 'principal', 'upload', 'Imagem do Jack Daniels N7')
FROM produtos p WHERE p.nome = 'Jack Daniels N7';

SELECT upsert_produto_imagem(p.id, '/images/produtos/jagermeister garrafa.png', 'principal', 'upload', 'Imagem da Jagermeister Garrafa')
FROM produtos p WHERE p.nome = 'jagermeister garrafa';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Sagatiba.png', 'principal', 'upload', 'Imagem da Sagatiba')
FROM produtos p WHERE p.nome = 'Sagatiba';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Sake Garrafa.png', 'principal', 'upload', 'Imagem da Sake Garrafa')
FROM produtos p WHERE p.nome = 'Sake Garrafa';

SELECT upsert_produto_imagem(p.id, '/images/produtos/Smirnoff.png', 'principal', 'upload', 'Imagem da Smirnoff')
FROM produtos p WHERE p.nome = 'Smirnoff';

-- Limpar função auxiliar
DROP FUNCTION upsert_produto_imagem(UUID, TEXT, VARCHAR(20), VARCHAR(50), TEXT);

COMMIT;