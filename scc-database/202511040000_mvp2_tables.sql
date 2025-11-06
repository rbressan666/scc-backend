-- Script SQL para criação das tabelas do MVP2
-- Sistema Contagem Cadoz (SCC)
-- Data: 03/09/2025

-- Tabela: Setores
-- Armazena os centros de custo (Bar, Cozinha, etc.)
CREATE TABLE IF NOT EXISTS setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Categorias
-- Armazena as categorias e subcategorias de produtos
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    id_categoria_pai UUID REFERENCES categorias(id) ON DELETE SET NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: UnidadesDeMedida
-- Armazena as unidades de medida (UN, CX, L, Kg, etc.)
CREATE TABLE IF NOT EXISTS unidades_de_medida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    sigla VARCHAR(10) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Produtos
-- Armazena o "Produto Pai" (a entidade conceitual)
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    id_categoria UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    id_setor UUID NOT NULL REFERENCES setores(id) ON DELETE RESTRICT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: VariacoesProduto
-- O item real que é estocado e contado. A tabela mais importante deste módulo
CREATE TABLE IF NOT EXISTS variacoes_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    estoque_atual DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    estoque_minimo DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    preco_custo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fator_prioridade INTEGER NOT NULL DEFAULT 3,
    id_unidade_controle UUID NOT NULL REFERENCES unidades_de_medida(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: FatoresConversao
-- Tabela de associação para as regras de conversão de unidades
CREATE TABLE IF NOT EXISTS fatores_conversao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_variacao_produto UUID NOT NULL REFERENCES variacoes_produto(id) ON DELETE CASCADE,
    id_unidade_medida UUID NOT NULL REFERENCES unidades_de_medida(id) ON DELETE CASCADE,
    fator DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_variacao_produto, id_unidade_medida)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categorias_pai ON categorias(id_categoria_pai);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_setor ON produtos(id_setor);
CREATE INDEX IF NOT EXISTS idx_variacoes_produto ON variacoes_produto(id_produto);
CREATE INDEX IF NOT EXISTS idx_variacoes_unidade ON variacoes_produto(id_unidade_controle);
CREATE INDEX IF NOT EXISTS idx_fatores_variacao ON fatores_conversao(id_variacao_produto);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_setores_updated_at BEFORE UPDATE ON setores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON unidades_de_medida FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variacoes_updated_at BEFORE UPDATE ON variacoes_produto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fatores_updated_at BEFORE UPDATE ON fatores_conversao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais para teste
INSERT INTO setores (nome) VALUES 
    ('Bar'),
    ('Cozinha'),
    ('Estoque Geral'),
    ('Limpeza')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO unidades_de_medida (nome, sigla) VALUES 
    ('Unidade', 'UN'),
    ('Caixa com 12 unidades', 'CX-12'),
    ('Caixa com 24 unidades', 'CX-24'),
    ('Litro', 'L'),
    ('Quilograma', 'KG'),
    ('Pacote', 'PCT'),
    ('Fardo', 'FD')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO categorias (nome) VALUES 
    ('Bebidas'),
    ('Alimentos'),
    ('Limpeza'),
    ('Descartáveis')
ON CONFLICT DO NOTHING;

-- Subcategorias de Bebidas
INSERT INTO categorias (nome, id_categoria_pai) 
SELECT 'Cervejas', id FROM categorias WHERE nome = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nome, id_categoria_pai) 
SELECT 'Destilados', id FROM categorias WHERE nome = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nome, id_categoria_pai) 
SELECT 'Refrigerantes', id FROM categorias WHERE nome = 'Bebidas'
ON CONFLICT DO NOTHING;

-- Subcategorias de Alimentos
INSERT INTO categorias (nome, id_categoria_pai) 
SELECT 'Carnes', id FROM categorias WHERE nome = 'Alimentos'
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nome, id_categoria_pai) 
SELECT 'Temperos', id FROM categorias WHERE nome = 'Alimentos'
ON CONFLICT DO NOTHING;

COMMIT;
