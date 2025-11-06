-- 202511051200 - MVP3 - Estatutos (termos de conduta e operação)
-- Tabelas: statutes, statute_items, user_statute_acks, user_sectors, user_signup_tokens
-- Nota: usa convenção de nomes já presentes (pt-BR) em 'usuarios'

BEGIN;

-- Relação N:N usuário-setor (onde o usuário pode trabalhar)
CREATE TABLE IF NOT EXISTS user_sectors (
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, setor_id)
);

-- Estatutos (geral ou por setor)
CREATE TABLE IF NOT EXISTS statutes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  setor_id UUID NULL REFERENCES setores(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens de cada estatuto
CREATE TABLE IF NOT EXISTS statute_items (
  id SERIAL PRIMARY KEY,
  statute_id INTEGER NOT NULL REFERENCES statutes(id) ON DELETE CASCADE,
  code VARCHAR(120) UNIQUE NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_statute_items_statute ON statute_items(statute_id);

-- Ciência dos itens por usuário
CREATE TABLE IF NOT EXISTS user_statute_acks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  statute_id INTEGER NOT NULL REFERENCES statutes(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES statute_items(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_user_statute_acks_user ON user_statute_acks(user_id);

-- Tokens de convite/primeiro acesso
CREATE TABLE IF NOT EXISTS user_signup_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  purpose VARCHAR(40) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_signup_tokens_user ON user_signup_tokens(user_id);

-- Campos opcionais no usuário
DO $$ BEGIN
  BEGIN
    ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(32);
  EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN
    ALTER TABLE usuarios ADD COLUMN email_confirmado_em TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN
    ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN NULL; END;
END $$;

-- Seeds básicos: Estatuto Geral e Cozinha
-- Observação: ajuste o id do setor da Cozinha conforme tabela 'setores'
WITH upsert_geral AS (
  INSERT INTO statutes(code, title, description, setor_id)
  VALUES ('geral', 'Termos de Conduta – Geral', 'Conduta no ambiente do bar', NULL)
  ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW()
  RETURNING id
), upsert_cozinha AS (
  SELECT id FROM setores WHERE LOWER(nome) LIKE '%cozinha%' LIMIT 1
), ins_cozinha AS (
  INSERT INTO statutes(code, title, description, setor_id)
  SELECT 'cozinha', 'Procedimentos – Cozinha', 'Regras específicas da cozinha', upsert_cozinha.id
  FROM upsert_cozinha
  ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, setor_id = EXCLUDED.setor_id, updated_at = NOW()
  RETURNING id
)
SELECT 1;

-- Inserção de itens (idempotente por code)
-- Geral
INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.relacionamento.profissional', 10, 'Manter relacionamentos sempre profissionais, respeitando as diferenças individuais de colaboradores e clientes;'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.relacionamento.nao-sentar-com-cliente', 20, 'Não sentar na mesma mesa que cliente.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.fumantes.nao-fumar-com-cliente', 30, 'Fumar junto com cliente não é permitido. Use os espaços indicados (garagem ou calçada).'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.pontualidade.horarios', 40, 'Cumprir os horários pré-determinados para todas as atividades.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.entrada.uma-hora-antes', 50, 'Horário normal de entrada: 1 hora antes da abertura da casa (salvo arrumações adiantadas).'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.proibido-bebida-alcoolica', 60, 'O consumo de bebidas alcoólicas é PROIBIDO EM HORÁRIO DE TRABALHO.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.sem-recepcao', 70, 'Não trabalhamos com recepção, apenas portaria para couvert em dias específicos.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.acomodacao-cardapio', 80, 'Acomodar o cliente, oferecer o cardápio e explicar o funcionamento (autoatendimento no caixa/bar).'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.nao-cobramos-10', 90, 'Não cobramos 10%.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.atendimento-agil', 100, 'Prestar atendimento ágil e eficiente.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.sorrir', 110, 'Sorrir ao conversar com o cliente.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.presenca-importante', 120, 'Demonstrar ao cliente que a presença dele é importante.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'geral.regras.recolha-cardapios', 130, 'Recolher cardápios e copos/louça sempre que possível.'
FROM statutes s WHERE s.code = 'geral'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='geral'), updated_at = NOW();

-- Cozinha
INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'cozinha.economia.evitar-desperdicio', 10, 'Evitar o desperdício de energia elétrica e água.'
FROM statutes s WHERE s.code = 'cozinha'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='cozinha'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'cozinha.economia.nao-jogar-oleo', 20, 'Não jogar gorduras ou óleo pelo ralo.'
FROM statutes s WHERE s.code = 'cozinha'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='cozinha'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'cozinha.economia.nao-misturar-loucas', 30, 'Louças do bar NÃO DEVEM ser misturadas com louças da cozinha e vice-versa.'
FROM statutes s WHERE s.code = 'cozinha'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='cozinha'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'cozinha.economia.apagar-luzes', 40, 'Ao fechar o estabelecimento, apagar todas as luzes.'
FROM statutes s WHERE s.code = 'cozinha'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='cozinha'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'cozinha.lixos.descartar-antes-da-pia', 50, 'Toda a recolha deve ser descartada adequadamente antes de chegar à pia da cozinha.'
FROM statutes s WHERE s.code = 'cozinha'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='cozinha'), updated_at = NOW();

INSERT INTO statute_items(statute_id, code, sequence, text)
SELECT s.id, 'cozinha.lixos.rotas-descartaveis', 60, 'Descartáveis sujos: lixo orgânico; descartáveis limpos: lixo descartável; restos de alimentos: orgânico.'
FROM statutes s WHERE s.code = 'cozinha'
ON CONFLICT (code) DO UPDATE SET text = EXCLUDED.text, statute_id = (SELECT id FROM statutes WHERE code='cozinha'), updated_at = NOW();

COMMIT;
