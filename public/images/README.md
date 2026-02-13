# Sistema de Imagens dos Produtos

## Status Atual ⚠️

**Scripts executados, mas imagens não aparecem no frontend**

- ✅ **Scripts SQL** executados sem erros
- ✅ **60 imagens** na pasta `produtos/`
- ❌ **Imagens não aparecem** na lista de produtos
- ❌ **Campo URL vazio** no detalhe dos produtos

## 🔍 Diagnóstico

### Scripts de Verificação
1. **`202601200004_diagnostico_imagens.sql`** - Verifica estado das imagens
2. **`202601200005_verificar_produtos.sql`** - Verifica nomes dos produtos
3. **`202601200006_forcar_atualizacao.sql`** - Força atualização das imagens

### Possíveis Problemas
- Trigger não está ativando
- Nomes dos produtos não correspondem
- Imagens ainda marcadas como 'referencia'
- Backend não está rodando

## 🛠️ Solução de Problemas

### 1. Execute os Scripts de Diagnóstico
```sql
-- Verificar estado atual
\i scc-database/202601200004_diagnostico_imagens.sql

-- Verificar nomes dos produtos
\i scc-database/202601200005_verificar_produtos.sql
```

### 2. Se as Imagens Não Aparecem
```sql
-- Forçar atualização
\i scc-database/202601200006_forcar_atualizacao.sql
```

### 3. Verificar Backend
- Certifique-se que o backend está rodando: `npm start`
- Teste URL: `http://localhost:3001/images/produtos/COCA%20COLA%20350ml.png`

## Scripts SQL Disponíveis

### 1. Renomeação (Já executado)
`202601200003_renomear_produtos.sql`

### 2. Atualização de Imagens (Já executado)
`202601200001_atualizar_urls_imagens.sql`

### 3. Diagnóstico
`202601200004_diagnostico_imagens.sql`
`202601200005_verificar_produtos.sql`

### 4. Solução de Emergência
`202601200006_forcar_atualizacao.sql`

## Resultado Esperado
Após executar os scripts corretos, **60 produtos** terão imagens visíveis no frontend.