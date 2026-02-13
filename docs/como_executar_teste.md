# Como executar o teste das imagens

## ❌ NÃO EXECUTE NO RENDER!

O comando `npm run quick-test` deve ser executado **LOCALMENTE** no seu computador, não no Render.

## ✅ Como executar:

### Passo 1: Abra o terminal/cmd no seu computador
- No Windows: Pressione `Win + R`, digite `cmd` e Enter
- No Linux/Mac: Abra o Terminal

### Passo 2: Navegue até a pasta do backend
```bash
cd "d:\_WORKSPACE_\SCC\MVP3\scc-backend"
```

### Passo 3: Execute o comando
```bash
npm run quick-test https://SEU-BACKEND-RENDER.com
```

**Substitua `https://SEU-BACKEND-RENDER.com` pela URL real do seu backend no Render!**

## 📝 Exemplo real:
```bash
npm run quick-test https://scc-backend-xyz123.onrender.com
```

## 🔍 O que o script faz:
1. Faz uma requisição para `https://SEU-BACKEND/api/produtos`
2. Verifica se os produtos têm `imagem_principal_url`
3. Testa se as imagens estão sendo servidas (5 primeiras)
4. Mostra o resultado no terminal

## 🎯 Resultado esperado:
```
🚀 Teste rápido - Render: https://scc-backend-xyz123.onrender.com

📡 Testando API de produtos...
✅ API OK: 60 produtos
📊 Com imagem: 60/60

🖼️  Testando imagens...
✅ COCA COLA 350ml
✅ HEINEKEN 600ml
✅ AGUA garrafa 500 ml
✅ GUARANA ANTARTICA
✅ SPRITE

🎉 Se tudo estiver OK, as imagens devem aparecer no frontend!
```

Execute localmente e me diga o resultado! 🚀