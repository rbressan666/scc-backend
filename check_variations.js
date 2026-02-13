const { Client } = require('pg');

async function checkVariations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/scc_db'
  });

  try {
    await client.connect();

    console.log('=== UNIDADES DE MEDIDA ===');
    const unidadesRes = await client.query('SELECT id, nome, sigla FROM unidades_de_medida ORDER BY nome');
    console.table(unidadesRes.rows);

    console.log('\n=== VARIAÇÕES DE PRODUTOS ===');
    const variacoesRes = await client.query(`
      SELECT p.nome as produto, vp.nome as variacao, um.nome as unidade, vp.fator_prioridade
      FROM variacoes_produto vp
      JOIN produtos p ON vp.id_produto = p.id
      JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
      ORDER BY p.nome, vp.fator_prioridade
    `);
    console.table(variacoesRes.rows);

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}

checkVariations();