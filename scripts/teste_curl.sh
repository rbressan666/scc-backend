#!/bin/bash

# Script simples usando curl para testar as imagens no Render
# Uso: ./teste_curl.sh https://SEU-BACKEND-RENDER.com

API_BASE_URL=$1

if [ -z "$API_BASE_URL" ]; then
  echo "❌ Uso: ./teste_curl.sh https://SEU-BACKEND-RENDER.com"
  exit 1
fi

echo "🚀 Teste com curl - Render: $API_BASE_URL"
echo ""

# 1. Testar API de produtos
echo "📡 Testando API de produtos..."
API_RESPONSE=$(curl -s -w "\nHTTPSTATUS:%{http_code}" "$API_BASE_URL/api/produtos")
HTTP_STATUS=$(echo "$API_RESPONSE" | tail -1 | sed 's/HTTPSTATUS://')
PRODUTOS_DATA=$(echo "$API_RESPONSE" | head -n -1)

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ API falhou: $HTTP_STATUS"
  exit 1
fi

# Contar produtos
PRODUTOS_COUNT=$(echo "$PRODUTOS_DATA" | jq '. | length' 2>/dev/null || echo "0")
echo "✅ API OK: $PRODUTOS_COUNT produtos"

# Verificar quantos têm imagem
COM_IMAGEM=$(echo "$PRODUTOS_DATA" | jq '[.[] | select(.imagem_principal_url != null)] | length' 2>/dev/null || echo "0")
echo "📊 Com imagem: $COM_IMAGEM/$PRODUTOS_COUNT"

if [ "$COM_IMAGEM" = "0" ]; then
  echo "❌ Nenhum produto tem imagem_principal_url!"
  exit 1
fi

# 3. Testar algumas imagens
echo ""
echo "🖼️  Testando imagens..."

# Pegar primeiros 5 produtos com imagem
echo "$PRODUTOS_DATA" | jq -r '.[] | select(.imagem_principal_url != null) | .nome + "|" + .imagem_principal_url' 2>/dev/null | head -5 | while IFS='|' read -r nome url; do
  IMG_URL="$API_BASE_URL$url"
  IMG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$IMG_URL")
  if [ "$IMG_STATUS" = "200" ]; then
    echo "✅ $nome"
  else
    echo "❌ $nome: $IMG_STATUS"
  fi
done

echo ""
echo "🎉 Se tudo estiver OK, as imagens devem aparecer no frontend!"