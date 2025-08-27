// server.js (VERSÃO CORRIGIDA PARA ES6)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { qrCodeService } from './services/qrCodeService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use(limiter);

app.use(express.json());

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SCC Backend está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de Teste
app.get('/', (req, res) => {
  res.send('<h1>API do SCC Backend está no ar!</h1>');
});

// Informações da API
app.get('/api', (req, res) => {
  res.json({
    name: 'SCC Backend API',
    version: '1.0.0',
    description: 'Sistema Contagem Cadoz - Backend MVP1',
    endpoints: {
      auth: '/api/auth',
      users: '/api/usuarios',
      health: '/health'
    }
  });
});

// Rotas da Aplicação
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Função para testar a conexão com o banco de dados
const testConnection = async () => {
  console.log('🔄 Testando conexão com o banco de dados...');
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com o banco de dados bem-sucedida!');
    client.release();
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
    const server = createServer(app);
    
    // Configurar Socket.IO para QR Code
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });
    
    // Inicializar serviço de QR Code
    qrCodeService.initialize(io);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando com sucesso na porta ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    });
  } else {
    console.error('❌ Falha na conexão com o banco de dados. O servidor não será iniciado.');
    process.exit(1);
  }
};

// Inicia o servidor
startServer();

