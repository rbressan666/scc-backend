// config/database.js
import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento de conexão
pool.on('connect', () => {
  console.log('🔗 Nova conexão estabelecida com o banco de dados');
});

// Evento de erro
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente do banco de dados:', err);
  process.exit(-1);
});

export default pool;

