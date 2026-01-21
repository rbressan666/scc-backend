-- Script de Inserção de Produtos: Insere produtos do CSV filtrado
-- Timestamp: 202601190002
-- Assume que as categorias e setores já foram inseridos

-- Inserir produtos
-- Bebidas
INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'AGUA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'AGUA COM GAS', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'CHOPP LAGER 500ML', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'COCA COLA 350ml', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'COCA COLA ZERO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'GUARANA ANTARTICA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'GUARANA ANTARTICA ZERO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'RED BUL AMORA ZERO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'RED BULL ZERO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Red label', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'REDBULL 250ml', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SPRITE', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SUCO DEL VALE UVA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SUCO DEL VALLE GOIABA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SUCO DEL VALLE MANGA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SUCO DEL VALLE MARACULA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SUCO DEL VALLE PESSEGO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'TONICA ANTARTICA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'TONICA SCHWEPPES', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'VIBE ENERGETICO COMBO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Bebidas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

-- Cervejas
INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Amstel 269 Lata', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Amstel 350 Lata', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Amstel 600ml', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'BRUGSE ZOT BELGA ESCURA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'HEINEKEN 600ml', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'HEINEKEN LATA ZERO 350ML', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'HEINEKEN Long Neck', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'HEINEKEN LONG NECK ZERO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Heinken LATA 269', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'MELANINA IRISH EXTRA STOUT 473ML', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'ORIGINAL 600ML', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'PATAGONIA IPA LATA 350', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'PATAGONIA WEISSE 740ml', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'PATAGONIA Weisse LATA 350', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'SKOL BEATS LATA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Straffen Hendrik', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Witber - Witamina 473ml', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cervejas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

-- Cigarro
INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'CIGARRO AVULSO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Cigarro' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

-- Garrafas
INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'APOGEE GIM', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'BACARDI CARTA BLANCA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'CAMPARI', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Cavalo branco', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'DOMEC', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'GIN APOGEE', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'HIDROMEL', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'JIM BEAN', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'MARTINI ROSSO', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'TEKILOKA SILVER', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'TEKILOKA NIGHT', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Velho Barreiro', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Black Label Garrafa', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Canelinha Garrafa', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Don Nogueira Garrafa', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Jack Daniels N7', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'jagermeister garrafa', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Sagatiba', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Sake Garrafa', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'Smirnoff', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'Garrafas' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

-- SNACKS/LARICA
INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'AMENDOIN', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'SNACKS/LARICA' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'PF/COSTELA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'SNACKS/LARICA' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

INSERT INTO produtos (nome, id_categoria, id_setor)
SELECT 'PF/LINGUICA', c.id, s.id FROM categorias c, setores s WHERE c.nome = 'SNACKS/LARICA' AND c.id_categoria_pai = (SELECT id FROM categorias WHERE nome = 'Bar') AND s.nome = 'Bar';

-- Inserir imagens para alguns produtos (exemplos)
INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, 'https://www.coca-cola.com/content/dam/journey/us/en/brands/coca-cola/coca-cola-original-350ml-lata.png', 'referencia', 'upload', 'Imagem da Coca Cola 350ml', true
FROM produtos p WHERE p.nome = 'COCA COLA 350ml';

INSERT INTO produto_imagens (id_produto, url_imagem, tipo_imagem, origem, descricao, ativo)
SELECT p.id, 'https://www.heineken.com/media/01hxrr2m/heineken-original-bottle-600ml.png', 'referencia', 'upload', 'Imagem da Heineken 600ml', true
FROM produtos p WHERE p.nome = 'HEINEKEN 600ml';

-- Sugestões de Variações: Criar uma variação básica por produto com unidade apropriada
-- Para bebidas em lata (350ml), usar 'L' com quantidade 0.35
-- Para garrafas (600ml), usar 'L' com quantidade 0.6
-- Para snacks, usar 'KG' com quantidade 1.0
-- Para outros, 'UN'

INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT p.id, p.nome, 0.000, 0.000, 0.00, 3, u.id
FROM produtos p, unidades_de_medida u
WHERE u.sigla = CASE 
  WHEN p.nome LIKE '%AMENDOIN%' OR p.nome LIKE '%PF/%' THEN 'KG'
  ELSE 'L'
END;

-- Para produtos sem volume específico, usar 'UN'
INSERT INTO variacoes_produto (id_produto, nome, estoque_atual, estoque_minimo, preco_custo, fator_prioridade, id_unidade_controle)
SELECT p.id, p.nome, 0.000, 0.000, 0.00, 3, u.id
FROM produtos p, unidades_de_medida u
WHERE u.sigla = 'UN' AND p.id NOT IN (
  SELECT vp.id_produto FROM variacoes_produto vp
);

-- Commit
COMMIT;