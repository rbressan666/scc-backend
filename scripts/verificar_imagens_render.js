#!/usr/bin/env node

// Script para testar se as imagens estão funcionando no Render APÓS inserir no banco
// Uso: node verificar_imagens_render.js https://SEU-BACKEND-RENDER.com

import fetch from 'node:fetch';

const API_BASE_URL = process.argv[2];

if (!API_BASE_URL) {
  console.log('❌ Uso: node verificar_imagens_render.js https://SEU-BACKEND-RENDER.com');
  process.exit(1);
}

console.log(`🧪 Verificando imagens no Render: ${API_BASE_URL}\n`);

async function testarAPIProdutos() {
  try {
    console.log('📡 Testando API de produtos...');
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

    if (semImagem > 0) {
      console.log('\n⚠️  Produtos sem imagem:');
      produtos.filter(p => !p.imagem_principal_url).slice(0, 5).forEach(p => {
        console.log(`   - ${p.nome}`);
      });
      if (semImagem > 5) console.log(`   ... e mais ${semImagem - 5} produtos`);
    }

    return produtos;
  } catch (error) {
    console.log(`❌ API Produtos: Erro - ${error.message}`);
    return [];
  }
}

async function testarImagens(produtos) {
  console.log('\n🖼️  Testando imagens específicas...');

  const produtosComImagem = produtos.filter(p => p.imagem_principal_url);
  let sucesso = 0;
  let falha = 0;

  // Testar primeiras 10 imagens
  for (const produto of produtosComImagem.slice(0, 10)) {
    const url = `${API_BASE_URL}${produto.imagem_principal_url}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${produto.nome}`);
        sucesso++;
      } else {
        console.log(`❌ ${produto.nome}: ${response.status}`);
        falha++;
      }
    } catch (error) {
      console.log(`❌ ${produto.nome}: Erro - ${error.message}`);
      falha++;
    }
  }

  console.log(`\n📊 Resultado imagens: ${sucesso} OK, ${falha} falhas`);

  if (produtosComImagem.length > 10) {
    console.log(`ℹ️  Testadas 10 de ${produtosComImagem.length} imagens com URL`);
  }
}

async function testarImagensDiretas() {
  console.log('\n🎯 Testando URLs diretas de imagem...');

  const imagensTeste = [
    'COCA COLA 350ml.png',
    'HEINEKEN 600ml.png',
    'AGUA garrafa 500 ml.png'
  ];

  for (const imagem of imagensTeste) {
    const url = `${API_BASE_URL}/images/produtos/${encodeURIComponent(imagem)}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${imagem}`);
      } else {
        console.log(`❌ ${imagem}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${imagem}: Erro - ${error.message}`);
    }
  }
}

async function main() {
  const produtos = await testarAPIProdutos();

  if (produtos.length > 0) {
    await testarImagens(produtos);
    await testarImagensDiretas();
  }

  console.log('\n✨ Verificação concluída!');
  console.log('\n💡 Se tudo estiver OK, as imagens devem aparecer no frontend automaticamente.');
}

main().catch(console.error);