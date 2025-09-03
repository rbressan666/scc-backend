# Configuração do Banco de Dados - SCC MVP1

## Supabase PostgreSQL Setup

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha um nome para o projeto (ex: "scc-mvp1")
5. Defina uma senha segura para o banco
6. Selecione a região mais próxima
7. Aguarde a criação do projeto

### 2. Executar Script de Inicialização
1. No painel do Supabase, vá para "SQL Editor"
2. Copie e cole o conteúdo do arquivo `init.sql`
3. Execute o script clicando em "Run"
4. Verifique se a tabela `usuarios` foi criada com sucesso

### 3. Obter String de Conexão
1. Vá para "Settings" > "Database"
2. Copie a "Connection string" no formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres
   ```
3. Substitua `[YOUR-PASSWORD]` pela senha definida na criação

### 4. Configurar Variáveis de Ambiente
No backend, configure as seguintes variáveis:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[ANON-KEY]
JWT_SECRET=[RANDOM-SECRET-KEY]
```

### 5. Usuário Administrador Inicial
- **Email:** roberto.fujiy@gmail.com
- **Senha:** Cadoz@001
- **Perfil:** admin

**Nota:** A senha será hasheada automaticamente pelo backend na primeira execução.

## Estrutura da Tabela Usuarios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| nome_completo | VARCHAR(255) | Nome completo do usuário |
| email | VARCHAR(255) | Email único para login |
| senha_hash | VARCHAR(255) | Senha criptografada (bcrypt) |
| perfil | ENUM | 'admin' ou 'operador' |
| ativo | BOOLEAN | Status ativo/inativo |
| data_criacao | TIMESTAMPTZ | Data de criação |
| data_atualizacao | TIMESTAMPTZ | Data da última atualização |

## Funcionalidades Implementadas
- ✅ Geração automática de UUID para novos usuários
- ✅ Trigger para atualização automática de `data_atualizacao`
- ✅ Índices para otimização de consultas
- ✅ Validação de email único
- ✅ Enum para perfis de usuário
- ✅ Usuário administrador inicial

