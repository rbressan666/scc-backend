# 🔍 Verificar URL do Backend no Render

## 1. **Acesse o painel do Render**
- Vá para https://dashboard.render.com
- Encontre seu projeto **scc-backend-mvp3**
- Clique nele para ver os detalhes

## 2. **Verifique a URL correta**
Na página do serviço, procure por:
- **Service URL** ou **Public URL**
- Deve ser algo como: `https://scc-backend-mvp3-XXXXXX.onrender.com`

## 3. **Teste manual no navegador**
Abra estas URLs no navegador:

### URL Base (teste se o backend responde):
```
https://SEU-BACKEND-RENDER.com/
```

### API de Produtos:
```
https://SEU-BACKEND-RENDER.com/api/produtos
```

### Imagem direta:
```
https://SEU-BACKEND-RENDER.com/images/produtos/COCA%20COLA%20350ml.png
```

## 4. **Possíveis problemas:**

### ❌ **404 na API**
- Backend não está rodando
- URL errada
- Endpoint não existe

### ❌ **500 Internal Server Error**
- Erro no código do backend
- Problema de conexão com banco

### ❌ **Imagens não carregam**
- Pasta `public/images` não foi enviada para o Render
- Backend não está servindo arquivos estáticos

## 5. **Verificar se o backend está rodando**
No painel do Render, verifique:
- **Status**: Deve ser "Live" (verde)
- **Logs**: Procure por erros de inicialização
- **Build**: Deve ter sido bem-sucedido

## 6. **Se o backend não estiver rodando:**
- Vá para **Settings** > **Environment**
- Verifique se as variáveis de ambiente estão corretas
- Clique em **Manual Deploy** para forçar um novo deploy

## 7. **Teste novamente com a URL correta:**
```bash
npm run quick-test https://URL-CORRETA-AQUI.onrender.com
```

**Qual é a URL exata que aparece no painel do Render?** 📋