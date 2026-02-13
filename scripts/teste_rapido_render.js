#!/usr/bin/env node

// Script rápido para testar se as imagens estão funcionando no Render
// Uso: node teste_rapido_render.js https://SEU-BACKEND-RENDER.com
// Versão compatível com Node.js mais antigo

import https from 'https';

const API_BASE_URL = process.argv[2];

if (!API_BASE_URL) {
  console.log('❌ Uso: node teste_rapido_render.js https://SEU-BACKEND-RENDER.com');
  process.exit(1);
}

console.log(`🚀 Teste rápido - Render: ${API_BASE_URL}\n`);

// Função auxiliar para fazer requests HTTPS
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

async function testarTudo() {
  try {
    // 1. Testar API de produtos
    console.log('📡 Testando API de produtos...');
    const apiResponse = await makeRequest(`${API_BASE_URL}/api/produtos`);

    if (apiResponse.status !== 200) {
      console.log(`❌ API falhou: ${apiResponse.status}`);
      return;
    }

    const produtos = apiResponse.data;
    console.log(`✅ API OK: ${produtos.length} produtos`);

    // 2. Verificar quantos têm imagem
    const comImagem = produtos.filter(p => p.imagem_principal_url).length;
    console.log(`📊 Com imagem: ${comImagem}/${produtos.length}`);

    if (comImagem === 0) {
      console.log('❌ Nenhum produto tem imagem_principal_url!');
      return;
    }

    // 3. Testar algumas imagens
    console.log('\n🖼️  Testando imagens...');
    const testes = produtos.filter(p => p.imagem_principal_url).slice(0, 5);

    for (const produto of testes) {
      try {
        const imgUrl = `${API_BASE_URL}${produto.imagem_principal_url}`;
        const imgResponse = await makeRequest(imgUrl);
        const status = imgResponse.status === 200 ? '✅' : '❌';
        console.log(`${status} ${produto.nome}`);
      } catch (error) {
        console.log(`❌ ${produto.nome}: erro`);
      }
    }

    console.log('\n🎉 Se tudo estiver OK, as imagens devem aparecer no frontend!');

  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
  }
}

testarTudo();