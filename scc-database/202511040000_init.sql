-- Script de Inicialização do Banco de Dados SCC MVP1
-- Sistema Contagem Cadoz - Gestão de Usuários e Autenticação

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar ENUM para perfis de usuário
CREATE TYPE perfil_usuario AS ENUM ('admin', 'operador');

-- Criar tabela Usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL DEFAULT 'operador',
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para otimização
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao
CREATE TRIGGER trigger_update_data_atualizacao
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_data_atualizacao();

-- Inserir usuário administrador inicial
-- Senha: Cadoz@001 (hash bcrypt será gerado no backend)
INSERT INTO usuarios (nome_completo, email, senha_hash, perfil, ativo) 
VALUES (
    'Roberto Bressan',
    'roberto.fujiy@gmail.com',
    '$2b$10$placeholder_hash_will_be_replaced_by_backend',
    'admin',
    true
);

-- Comentários sobre a estrutura
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema SCC';
COMMENT ON COLUMN usuarios.id IS 'Identificador único universal (UUID)';
COMMENT ON COLUMN usuarios.nome_completo IS 'Nome completo do colaborador';
COMMENT ON COLUMN usuarios.email IS 'E-mail para login (único, em lowercase)';
COMMENT ON COLUMN usuarios.senha_hash IS 'Senha criptografada com bcrypt';
COMMENT ON COLUMN usuarios.perfil IS 'Nível de permissão: admin ou operador';
COMMENT ON COLUMN usuarios.ativo IS 'Status do usuário (ativo/inativo)';
COMMENT ON COLUMN usuarios.data_criacao IS 'Data e hora de criação do registro';
COMMENT ON COLUMN usuarios.data_atualizacao IS 'Data e hora da última atualização';
