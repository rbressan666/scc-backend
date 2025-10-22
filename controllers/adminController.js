import pool from '../config/database.js';

export async function getDbUsage(req, res) {
  try {
    const sizeResult = await pool.query(`SELECT pg_database_size(current_database()) AS bytes`);
    const bytes = Number(sizeResult.rows?.[0]?.bytes || 0);
    const prettyRes = await pool.query(`SELECT pg_size_pretty($1::bigint) AS pretty`, [bytes]);
    const pretty = prettyRes.rows?.[0]?.pretty || null;
    const tablesRes = await pool.query(`SELECT COUNT(*)::int AS tables FROM information_schema.tables WHERE table_schema = 'public'`);
    const tables = tablesRes.rows?.[0]?.tables || null;
    return res.json({ ok: true, bytes, pretty, tables });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'internal-error' });
  }
}
