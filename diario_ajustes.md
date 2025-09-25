# Diário de Ajustes - SCC Backend

## 25/09/2025 - Correção do Erro 404 em /api/users

### Problema Identificado:
A página de usuários no frontend não conseguia carregar a lista de usuários, apresentando erro 404 na requisição para `/api/users?includeInactive=false`.

### Análise Realizada:
Investigação completa da arquitetura backend-frontend:

1. **Frontend**: Fazendo requisição correta para `/api/users`
2. **Backend routes/users.js**: Rotas definidas corretamente
3. **Backend server.js**: Problema encontrado no registro das rotas

### Causa Raiz Identificada:
**Incompatibilidade de nomenclatura** entre backend e frontend:

- **Backend** (server.js linha 81): `app.use('/api/usuarios', userRoutes);` (português)
- **Frontend**: Requisição para `/api/users` (inglês)

### Ação Realizada:
Correção no arquivo `server.js`:

**ANTES:**
```javascript
app.use('/api/usuarios', userRoutes);  // ← Português
```

**DEPOIS:**
```javascript
app.use('/api/users', userRoutes);     // ← Inglês (padrão internacional)
```

### Justificativa da Escolha:
Optou-se por alterar o backend (ao invés do frontend) porque:
1. `/api/users` é mais padrão internacional para APIs REST
2. O frontend já estava configurado corretamente
3. Mantém consistência com convenções de nomenclatura de APIs

### Outras Correções Incluídas:
- Atualização da documentação da API na rota principal (`/`)
- Comentários explicativos adicionados

### Resultado Esperado:
Após o deploy desta correção, a página de usuários deve carregar normalmente, exibindo a lista de usuários cadastrados no sistema.

### Teste de Validação:
1. Fazer deploy da correção
2. Acessar a página "Gestão de Usuários" no frontend
3. Verificar se a lista de usuários é carregada corretamente
4. Confirmar que não há mais erros 404 no console do browser

### Impacto:
- **Funcionalidade**: Restaura completamente a gestão de usuários
- **Compatibilidade**: Não afeta outras funcionalidades
- **Padrões**: Alinha a API com convenções internacionais

