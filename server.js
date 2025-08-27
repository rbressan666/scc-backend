// server.js (VERSÃO CORRIGIDA)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database.js'); // <-- IMPORTANTE: Importa a conexão correta
const userRoutes = require('./routes/users.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de Teste
app.get('/', (req, res) => {
  res.send('<h1>API do SCC Backend está no ar!</h1>');
});

// Rotas da Aplicação
app.use('/api/users', userRoutes);

// Função para testar a conexão com o banco de dados
const testConnection = async () => {
  console.log('🔄 Testando conexão com o banco de dados...');
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com o banco de dados bem-sucedida!');
    client.release(); // Libera o cliente de volta para o pool
    return true;
  } catch (error) {
    console.error('❌ Falha no teste de conexão:', error);
    return false;
  }
};

// Função para iniciar o servidor
const startServer = async () => {
  console.log('🚀 Iniciando SCC Backend...');
  
  if (await testConnection()) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando com sucesso na porta ${PORT}`);
    });
  } else {
    console.error('❌ Falha na conexão com o banco de dados. O servidor não será iniciado.');
    process.exit(1); // Encerra o processo com código de erro
  }
};

// Inicia o servidor
startServer();
