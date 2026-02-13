# Como testar as imagens no Render

## 1. Testar se o backend está servindo imagens

Após fazer deploy no Render, teste estes endpoints:

### Endpoint direto da imagem:
```
GET https://SEU-BACKEND-RENDER.com/images/produtos/COCA%20COLA%20350ml.png
```

### Endpoint da API de produtos:
```
GET https://SEU-BACKEND-RENDER.com/api/produtos
```

## 2. Verificar se as imagens aparecem na resposta da API

A resposta da API deve incluir `imagem_principal_url` para cada produto:

```json
{
  "id": 1,
  "nome": "COCA COLA 350ml",
  "imagem_principal_url": "/images/produtos/COCA COLA 350ml.png",
  ...
}
```

## 3. Testar no frontend

No frontend (scc-frontend), as imagens devem aparecer na lista de produtos usando:
```javascript
<img src={`${API_BASE_URL}${produto.imagem_principal_url}`} />
```

## 4. URLs de exemplo para teste:

Substitua `SEU-BACKEND-RENDER.com` pela URL real do seu backend no Render:

- `https://SEU-BACKEND-RENDER.com/images/produtos/COCA%20COLA%20350ml.png`
- `https://SEU-BACKEND-RENDER.com/images/produtos/HEINEKEN%20600ml.png`
- `https://SEU-BACKEND-RENDER.com/api/produtos`

## 5. Verificar se o banco de dados tem as imagens

Execute esta query no banco para verificar:
```sql
SELECT p.nome, pi.url_imagem, p.imagem_principal_url
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.id_produto AND pi.tipo_imagem = 'principal'
ORDER BY p.nome;
```

Todos os produtos devem ter `url_imagem` e `imagem_principal_url` preenchidos.