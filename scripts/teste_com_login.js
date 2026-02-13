#!/usr/bin/env node

// Script que faz login e testa as imagens no Render
// Uso: node scripts/teste_com_login.js https://SEU-BACKEND-RENDER.com

import https from 'https';

const API_BASE_URL = process.argv[2];

if (!API_BASE_URL) {
  console.log('❌ Uso: node scripts/teste_com_login.js https://SEU-BACKEND-RENDER.com');
  process.exit(1);
}

console.log(`🚀 Teste com login - Render: ${API_BASE_URL}\n`);

// Credenciais para login (ajuste conforme necessário)
const LOGIN_CREDENTIALS = {
  email: 'admin@scc.com', // Ajuste para um usuário admin válido
  password: 'admin123'    // Ajuste para a senha correta
};

// Função auxiliar para fazer requests HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function fazerLogin() {
  console.log('🔐 Fazendo login...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: LOGIN_CREDENTIALS
    });

    if (response.status === 200 && response.data.token) {
      console.log('✅ Login realizado com sucesso!');
      return response.data.token;
    } else {
      console.log(`❌ Falha no login: ${response.status}`);
      console.log('Resposta:', response.data);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro no login: ${error.message}`);
    return null;
  }
}

async function testarAPIProdutos(token) {
  console.log('\n📡 Testando API de produtos...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/produtos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status !== 200) {
      console.log(`❌ API falhou: ${response.status}`);
      return [];
    }

    const produtos = response.data;
    console.log(`✅ API OK: ${produtos.length} produtos`);

    // Verificar quantos têm imagem
    const comImagem = produtos.filter(p => p.imagem_principal_url).length;
    console.log(`📊 Com imagem: ${comImagem}/${produtos.length}`);

    if (comImagem === 0) {
      console.log('❌ Nenhum produto tem imagem_principal_url!');
      return [];
    }

    return produtos;
  } catch (error) {
    console.log(`❌ Erro na API: ${error.message}`);
    return [];
  }
}

async function testarImagens(produtos) {
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
}

async function main() {
  const token = await fazerLogin();

  if (!token) {
    console.log('\n❌ Não foi possível fazer login. Verifique as credenciais.');
    console.log('💡 Você pode ajustar as credenciais no arquivo scripts/teste_com_login.js');
    process.exit(1);
  }

  const produtos = await testarAPIProdutos(token);

  if (produtos.length > 0) {
    await testarImagens(produtos);
  }

  console.log('\n🎉 Teste concluído!');
  console.log('\n💡 Se tudo estiver OK, as imagens devem aparecer no frontend automaticamente.');
}

main().catch(console.error);