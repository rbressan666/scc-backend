const { Client } = require('pg');
const fs = require('fs');

async function applyVariationRules() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/scc_db'
  });

  try {
    await client.connect();
    console.log('🔄 Conectado ao banco de dados...');

    // 1. Verificar unidades de medida
    console.log('\n📋 Verificando unidades de medida necessárias...');
    const unidadesScript = fs.readFileSync('./scc-database/202601200013_verificar_unidades_medida.sql', 'utf8');
    await client.query(unidadesScript);
    console.log('✅ Unidades de medida verificadas/criadas');

    // 2. Aplicar regras de variação
    console.log('\n🔧 Aplicando regras de variação dos produtos...');
    const regrasScript = fs.readFileSync('./scc-database/202601200012_aplicar_regras_variacoes.sql', 'utf8');
    await client.query(regrasScript);
    console.log('✅ Regras aplicadas com sucesso!');

    // 3. Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const verificacaoScript = fs.readFileSync('./scc-database/202601200014_verificacao_final_variacoes.sql', 'utf8');
    const result = await client.query(verificacaoScript);

    console.log('\n🎯 RESULTADO FINAL DA APLICAÇÃO DAS REGRAS:');
    console.log('=' .repeat(60));

    // Estatísticas
    const stats = result.slice(-4); // Últimas 4 linhas são estatísticas
    stats.forEach(row => {
      console.log(`${row.metrica}: ${row.valor}`);
    });

    console.log('\n📋 DISTRIBUIÇÃO POR CLASSIFICAÇÃO:');
    console.log('-'.repeat(60));

    // Distribuição por classificação
    const classificacaoStats = await client.query(`
      SELECT
        CASE
          WHEN p.nome IN ('COCA COLA 350ml', 'COCA COLA ZERO', 'GUARANA ANTARTICA', 'GUARANA ANTARTICA ZERO', 'RED BUL AMORA ZERO', 'RED BULL ZERO', 'Red label', 'REDBULL 250ml', 'SPRITE', 'SUCO DEL VALE UVA', 'SUCO DEL VALLE GOIABA', 'SUCO DEL VALLE MANGA', 'SUCO DEL VALLE MARACULA', 'SUCO DEL VALLE PESSEGO', 'TONICA ANTARTICA', 'TONICA SCHWEPPES', 'VIBE ENERGETICO COMBO', 'Witber - Witamina 473ml', 'MELANINA IRISH EXTRA STOUT 473ML') THEN 'LATA (Regra 2)'
          WHEN p.nome IN ('BRUGSE ZOT BELGA ESCURA', 'HEINEKEN Long Neck', 'HEINEKEN LONG NECK ZERO', 'PATAGONIA WEISSE 740ml', 'Straffen Hendrik') THEN 'GARRAFA (Regra 2)'
          WHEN UPPER(p.nome) LIKE 'AGUA%' THEN 'AGUA (Regra 3)'
          WHEN UPPER(p.nome) LIKE '%600ML%' THEN 'GARRAFA 600ML (Regra 4)'
          ELSE 'OUTRO (Regra 5)'
        END as classificacao,
        COUNT(*) as quantidade
      FROM produtos p
      WHERE p.ativo = true
      GROUP BY
        CASE
          WHEN p.nome IN ('COCA COLA 350ml', 'COCA COLA ZERO', 'GUARANA ANTARTICA', 'GUARANA ANTARTICA ZERO', 'RED BUL AMORA ZERO', 'RED BULL ZERO', 'Red label', 'REDBULL 250ml', 'SPRITE', 'SUCO DEL VALE UVA', 'SUCO DEL VALLE GOIABA', 'SUCO DEL VALLE MANGA', 'SUCO DEL VALLE MARACULA', 'SUCO DEL VALLE PESSEGO', 'TONICA ANTARTICA', 'TONICA SCHWEPPES', 'VIBE ENERGETICO COMBO', 'Witber - Witamina 473ml', 'MELANINA IRISH EXTRA STOUT 473ML') THEN 'LATA (Regra 2)'
          WHEN p.nome IN ('BRUGSE ZOT BELGA ESCURA', 'HEINEKEN Long Neck', 'HEINEKEN LONG NECK ZERO', 'PATAGONIA WEISSE 740ml', 'Straffen Hendrik') THEN 'GARRAFA (Regra 2)'
          WHEN UPPER(p.nome) LIKE 'AGUA%' THEN 'AGUA (Regra 3)'
          WHEN UPPER(p.nome) LIKE '%600ML%' THEN 'GARRAFA 600ML (Regra 4)'
          ELSE 'OUTRO (Regra 5)'
        END
      ORDER BY quantidade DESC
    `);

    classificacaoStats.rows.forEach(row => {
      console.log(`${row.classificacao}: ${row.quantidade} produtos`);
    });

    console.log('\n✅ Aplicação das regras concluída com sucesso!');
    console.log('🎉 Todas as variações foram criadas conforme as especificações.');

  } catch (err) {
    console.error('❌ Erro durante a aplicação das regras:', err);
  } finally {
    await client.end();
  }
}

applyVariationRules();