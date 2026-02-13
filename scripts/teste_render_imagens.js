#!/usr/bin/env node

// Script para testar se as imagens estão funcionando no Render
// Uso: node teste_render_imagens.js https://SEU-BACKEND-RENDER.com

import fetch from 'node:fetch';

const API_BASE_URL = process.argv[2];

if (!API_BASE_URL) {
  console.log('❌ Uso: node teste_render_imagens.js https://SEU-BACKEND-RENDER.com');
  process.exit(1);
}

console.log(`🧪 Testando imagens no Render: ${API_BASE_URL}\n`);

async function testarImagem(url, nome) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`✅ ${nome}: OK`);
      return true;
    } else {
      console.log(`❌ ${nome}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${nome}: Erro - ${error.message}`);
    return false;
  }
}

async function testarAPIProdutos() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/produtos`);
    if (!response.ok) {
      console.log(`❌ API Produtos: ${response.status} ${response.statusText}`);
      return [];
    }

    const produtos = await response.json();
    console.log(`✅ API Produtos: ${produtos.length} produtos encontrados`);

    // Verificar se produtos têm imagem_principal_url
    const comImagem = produtos.filter(p => p.imagem_principal_url).length;
    const semImagem = produtos.length - comImagem;

    console.log(`📊 Produtos com imagem: ${comImagem}`);
    console.log(`📊 Produtos sem imagem: ${semImagem}`);

    return produtos;
  } catch (error) {
    console.log(`❌ API Produtos: Erro - ${error.message}`);
    return [];
  }
}

async function main() {
  // Testar algumas imagens específicas
  const imagensParaTestar = [
    'COCA COLA 350ml.png',
    'HEINEKEN 600ml.png',
    'AGUA garrafa 500 ml.png',
    'GUARANA ANTARTICA.png'
  ];

  console.log('🖼️  Testando imagens específicas:');
  for (const imagem of imagensParaTestar) {
    const url = `${API_BASE_URL}/images/produtos/${encodeURIComponent(imagem)}`;
    await testarImagem(url, imagem);
  }

  console.log('\n📡 Testando API de produtos:');
  const produtos = await testarAPIProdutos();

  if (produtos.length > 0) {
    console.log('\n🔍 Verificando primeiras imagens dos produtos:');
    const primeirosProdutos = produtos.slice(0, 5);
    for (const produto of primeirosProdutos) {
      if (produto.imagem_principal_url) {
        const url = `${API_BASE_URL}${produto.imagem_principal_url}`;
        await testarImagem(url, `${produto.nome} (via API)`);
      } else {
        console.log(`⚠️  ${produto.nome}: sem imagem_principal_url`);
      }
    }
  }

  console.log('\n✨ Teste concluído!');
}

main().catch(console.error);