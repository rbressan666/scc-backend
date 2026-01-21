# SCC Backend - Sistema Contagem Cadoz

Backend do MVP1 do Sistema Contagem Cadoz (SCC) desenvolvido em Node.js com Express.js.

## 🚀 Funcionalidades

- ✅ Autenticação JWT com login/logout
- ✅ CRUD completo de usuários
- ✅ Middleware de autorização (admin/operador)
- ✅ Validação de dados com express-validator
- ✅ Rate limiting para segurança
- ✅ WebSocket para login via QR Code
- ✅ Conexão com PostgreSQL (Supabase)
- ✅ Logs detalhados e monitoramento
- ✅ Tratamento de erros robusto

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL (recomendado: Supabase)
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório e navegue para o backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o banco de dados:**
   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute o script `../database/init.sql` no SQL Editor do Supabase
   - Copie a connection string do banco

4. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=http://localhost:3001
   ```

5. **Inicie o servidor:**
   ```bash
   # Desenvolvimento (com nodemon)
   npm run dev
   
   # Produção
   npm start
   ```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento com nodemon
- `npm test` - Executa os testes (a implementar)

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/verify` - Verificar token JWT
- `POST /api/auth/logout` - Logout do usuário
- `PUT /api/auth/change-password` - Alterar senha

### Usuários (Requer autenticação)
- `GET /api/usuarios` - Listar usuários (Admin)
- `POST /api/usuarios` - Criar usuário (Admin)
- `GET /api/usuarios/:id` - Buscar usuário (Admin ou próprio)
- `PUT /api/usuarios/:id` - Atualizar usuário (Admin)
- `DELETE /api/usuarios/:id` - Desativar usuário (Admin)
- `PUT /api/usuarios/:id/reactivate` - Reativar usuário (Admin)
- `GET /api/usuarios/profile` - Perfil do usuário logado

### Utilitários
- `GET /health` - Health check do servidor
- `GET /api` - Informações da API
 
### Web Push (PWA)
- `GET /api/push/public-key` - Retorna a VAPID public key
- `POST /api/push/subscribe` - Registra a subscription do usuário logado
- `POST /api/push/unsubscribe` - Remove/desativa a subscription do usuário

## �️ Sistema de Imagens

O backend serve arquivos estáticos de imagens através do endpoint `/images/*`.

### Scripts de Configuração
1. **Renomeação:** `scc-database/202601200003_renomear_produtos.sql`
2. **Imagens:** `scc-database/202601200001_atualizar_urls_imagens.sql`

### Estrutura de Pastas
```
public/
  images/
    produtos/     # 60 imagens de produtos
      AGUA garrafa 500 ml.png
      COCA COLA 350ml.png
      ...
```

### Como Adicionar Imagens
1. Coloque suas imagens em `public/images/produtos/`
2. Execute os scripts SQL na ordem indicada
3. As imagens aparecerão automaticamente na lista de produtos

### Scripts de Ajuda
- `scripts/copy_images.bat` - Copia imagens automaticamente (Windows)
- `scripts/copy_images.ps1` - Copia imagens automaticamente (PowerShell)

### Scripts de Ajuda
- `scripts/copy_images.bat` - Copia imagens automaticamente (Windows)
- `scripts/copy_images.ps1` - Copia imagens automaticamente (PowerShell)

### URLs de Acesso
- Local: `http://localhost:3001/images/produtos/nome.jpg`
- Frontend: `/images/produtos/nome.jpg`

## �🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-jwt-token>
```

### Usuário Administrador Padrão
- **Email:** roberto.fujiy@gmail.com
- **Senha:** Cadoz@001
- **Perfil:** admin

## 📱 WebSocket (QR Code Login)

O servidor suporta login via QR Code através de WebSocket na mesma porta do HTTP.

### Eventos WebSocket:
- `generate-qr` - Gerar QR Code para login
- `validate-qr` - Validar QR Code escaneado
- `confirm-login` - Confirmar login via mobile
- `cancel-qr` - Cancelar sessão QR

## 🛡️ Segurança

- **Helmet.js** - Headers de segurança
- **Rate Limiting** - Proteção contra ataques de força bruta
- **CORS** - Controle de origem cruzada
- **Validação** - Sanitização e validação de dados
- **Bcrypt** - Hash seguro de senhas
- **JWT** - Tokens seguros com expiração

## 📊 Estrutura do Projeto

```
backend/
├── config/          # Configurações (database)
├── controllers/     # Controladores da API
├── middleware/      # Middlewares (auth, validators)
├── models/          # Modelos de dados
├── routes/          # Definição de rotas
├── services/        # Serviços (QR Code, etc.)
├── utils/           # Utilitários
├── .env             # Variáveis de ambiente
├── .env.example     # Exemplo de configuração
├── package.json     # Dependências e scripts
└── server.js        # Arquivo principal
```

## 🐛 Logs e Debugging

O servidor gera logs detalhados incluindo:
- Conexões de banco de dados
- Requisições HTTP
- Autenticação de usuários
- Erros e exceções
- Sessões WebSocket

### Auditoria (Audit Log)

Foi adicionada auditoria básica para registrar ações no banco de dados:

- Tabela: `audit_logs`
- Middleware: `middleware/audit.js` (registra após a resposta)
- Serviço: `services/auditService.js`
- Exemplo de metadados em controllers: `controllers/authController.js`

Campos registrados: usuário (quando autenticado), método, path, ação, entidade, ID da entidade, payload (JSON), status HTTP, IP, user agent, sucesso/erro, mensagem e duração.

Como habilitar a tabela no Supabase/Postgres:

1. Execute o script SQL: `scc-database/mvp3_audit_logs.sql` no seu banco.
2. Reinicie a API ou faça uma requisição autenticada para gerar registros.
3. Consulte: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;`

### Notificações por Email (Admins)

O backend pode enviar emails aos administradores em eventos-chave (ex.: login):

- Serviço: `services/emailService.js` (usa Nodemailer e fallback via SendGrid API)
- Evento implementado: Notificação de login (`authController.login`)

Configuração SMTP (variáveis de ambiente):

```env
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_USER=seu_usuario
SMTP_PASS=sua_senha
SMTP_SECURE=false          # true se usar porta 465
MAIL_FROM_NAME=SCC Notificações
MAIL_FROM_EMAIL=nao-responder@suaempresa.com
```

Observações:
- Emails são enviados para todos os usuários com `perfil='admin'` e `ativo=true`.
- Se SMTP não estiver configurado ou falhar, será tentado envio via SendGrid se `SENDGRID_API_KEY` estiver definido.

### Web Push (PWA) - Notificações gratuitas

Para habilitar push notifications no navegador/celular:

```env
VAPID_PUBLIC_KEY=<sua-chave>
VAPID_PRIVATE_KEY=<sua-chave>
VAPID_SUBJECT=mailto:seu-email@empresa.com
```

O frontend deve registrar um Service Worker e solicitar permissão ao usuário. No backend, as inscrições são salvas em `push_subscriptions` e os envios usam VAPID (biblioteca `web-push`).

### Fila de Notificações e Agendador

Tabela: `notifications_queue` (ver `scc-database/mvp3_notifications.sql`).

Worker/Dispatcher:
- Script: `npm run dispatch-notifications`
- Lógica: busca notificações `queued` com `scheduled_at_utc <= NOW()` e envia por email e push.

Render (Cron Job):
- Crie um Cron Job no Render com schedule `* * * * *`
- Build command: igual ao serviço web
- Run command: `npm run dispatch-notifications`
- Configure as mesmas variáveis de ambiente (DB, SendGrid, VAPID)

Alternativa gratuita (HTTP Trigger):
- Configure uma variável `CRON_DISPATCH_KEY` no backend (valor secreto aleatório)
- Use um agendador externo gratuito (ex.: cron-job.org ou GitHub Actions) para chamar:
   - POST `https://<seu-backend>/api/notifications/dispatch`
   - Header: `x-cron-key: <CRON_DISPATCH_KEY>`
- O endpoint processa um lote limitado por execução, com locking via banco, evitando duplicidades.

Rotas de teste (somente com ENABLE_TEST_ROUTES=true):
- `POST /api/notifications/_test/enqueue` body: `{ userId, subject, message, scheduleInSeconds }`
   - Enfileira uma notificação simples (email + push) para testar o fluxo fim a fim.

Alternativa via SendGrid (recomendada em PaaS que bloqueiam SMTP):

```env
SENDGRID_API_KEY=SG.xxxxx
# Opcional: remetente amigável
MAIL_FROM_NAME=SCC Notificações
MAIL_FROM_EMAIL=nao-responder@suaempresa.com
```

Passos no SendGrid:
- Crie e copie uma API Key com permissões de envio
- Verifique um remetente (Single Sender) ou autentique seu domínio
- Use o email verificado em `MAIL_FROM_EMAIL`

Fuso horário dos horários enviados por email:

Por padrão, os horários nos emails são formatados usando a timezone configurada em `APP_TZ` (fallback para `America/Sao_Paulo`). Configure conforme sua localidade:

```env
# Timezone da aplicação para formatação de datas/horas em emails
APP_TZ=America/Sao_Paulo
```

## 🚀 Deploy

### Render.com (Recomendado)

1. Conecte seu repositório ao Render
2. Configure as variáveis de ambiente
3. O deploy será automático

### Variáveis de Ambiente para Produção:
```env
NODE_ENV=production
DATABASE_URL=<sua-connection-string-supabase>
JWT_SECRET=<chave-secreta-forte>
CORS_ORIGIN=<url-do-frontend>
```

## 📝 Notas de Desenvolvimento

- O servidor escuta em `0.0.0.0` para permitir acesso externo
- CORS configurado para permitir requisições do frontend
- Rate limiting configurado para 100 requests por 15 minutos
- Sessões QR Code expiram em 5 minutos
- Cleanup automático de sessões expiradas a cada 5 minutos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

