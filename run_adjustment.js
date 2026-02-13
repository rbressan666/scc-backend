const { Client } = require('pg');
const fs = require('fs');

async function runAdjustmentScript() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/scc_db'
  });

  try {
    await client.connect();
    console.log('Conectado ao banco...');

    // Executar script de ajuste
    const scriptPath = './scc-database/202601200010_ajuste_variacoes_produtos.sql';
    const script = fs.readFileSync(scriptPath, 'utf8');
    await client.query(script);
    console.log('Script de ajuste executado com sucesso!');

    // Verificar resultado
    const result = await client.query(`
      SELECT
        p.nome as produto,
        COUNT(vp.id) as num_variacoes,
        STRING_AGG(
          CASE
            WHEN vp.nome IS NOT NULL THEN vp.nome || ' (' || um.nome || ', prioridade: ' || vp.fator_prioridade || ')'
            ELSE 'Sem variação'
          END,
          '; '
        ) as variacoes
      FROM produtos p
      LEFT JOIN variacoes_produto vp ON p.id_produto = vp.id_produto
      LEFT JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
      WHERE p.ativo = true
      GROUP BY p.id, p.nome
      ORDER BY p.nome
    `);

    console.log('\n=== RESULTADO DAS VARIAÇÕES AJUSTADAS ===');
    result.rows.forEach(row => {
      console.log(`${row.produto}: ${row.num_variacoes} variação(ões) - ${row.variacoes}`);
    });

    // Verificar produtos problemáticos (com nomes iguais)
    console.log('\n=== PRODUTOS COM VARIAÇÕES PROBLEMÁTICAS (nome igual ao produto) ===');
    const problematicResult = await client.query(`
      SELECT
        p.nome as produto,
        vp.nome as variacao,
        um.nome as unidade_medida,
        vp.fator_prioridade
      FROM variacoes_produto vp
      JOIN produtos p ON vp.id_produto = p.id
      JOIN unidades_de_medida um ON vp.id_unidade_controle = um.id
      WHERE p.ativo = true
        AND vp.nome = p.nome
      ORDER BY p.nome
    `);

    if (problematicResult.rows.length === 0) {
      console.log('Nenhum produto com variações problemáticas encontrado!');
    } else {
      problematicResult.rows.forEach(row => {
        console.log(`${row.produto}: ${row.variacao} (${row.unidade_medida}, prioridade: ${row.fator_prioridade})`);
      });
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}

runAdjustmentScript();