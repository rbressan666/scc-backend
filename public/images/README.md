# Sistema de Imagens dos Produtos

## Status Atual ✅

**Imagens verificadas e scripts atualizados!**

- ✅ **60 imagens** encontradas na pasta `produtos/`
- ✅ **60 produtos** mapeados corretamente nos scripts SQL
- ✅ **Produtos renomeados** para corresponder às imagens (AGUA → AGUA garrafa 500 ml)

## Scripts SQL Disponíveis

### 1. Script de Renomeação (Executar Primeiro)
Arquivo: `scc-database/202601200003_renomear_produtos.sql`
- Renomeia "AGUA" → "AGUA garrafa 500 ml"
- Renomeia "AGUA COM GAS" → "AGUA COM GAS garrafa 500ml"
- Execute este primeiro

### 2. Script de Atualização de Imagens (Executar Depois)
Arquivo: `scc-database/202601200001_atualizar_urls_imagens.sql`
- Mapeia todas as 60 imagens para os produtos
- Execute este depois da renomeação

## Como Executar

1. **Execute o script de renomeação:**
   ```sql
   -- No PostgreSQL
   \i scc-database/202601200003_renomear_produtos.sql
   ```

2. **Execute o script de imagens:**
   ```sql
   \i scc-database/202601200001_atualizar_urls_imagens.sql
   ```

3. **Verifique no frontend:**
   - Todas as 60 imagens aparecerão na lista de produtos
   - Incluindo Coca Cola, Heineken, águas, etc.

## Produtos Sem Imagens

Os seguintes produtos não têm imagens correspondentes:
- `AMENDOIN`
- `PF/COSTELA`
- `PF/LINGUICA`

Você pode adicionar imagens para estes produtos posteriormente se desejar.

## Formatos Suportados
- PNG (atual)
- JPG/JPEG
- WebP

## URLs de Acesso
- Backend: `http://localhost:3001/images/produtos/nome.png`
- Frontend: `/images/produtos/nome.png`