// server.js (CORRIGIDO PARA QR CODE)
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
const PORT = process.env.PORT || 10000; // Render.com usa a porta 10000 por padrão

// Criar servidor HTTP
const server = createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // Render.com define CORS_ORIGIN
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
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

// Rota principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API do SCC Backend está no ar!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/usuarios'
    }
  });
});

// Rotas da aplicação
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

// Função para testar conexão com banco
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error.message);
    return false;
  }
}

// Inicializar servidor
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    // Inicializar serviço de QR Code com Socket.IO
    qrCodeService.initialize(io);
    console.log('🔗 Serviço de QR Code inicializado');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando com sucesso na porta ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket habilitado para QR Code`);
      console.log(`📱 Endpoints disponíveis:`);
      console.log(`   - GET  /health`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - POST /api/auth/logout`);
      console.log(`   - GET  /api/auth/verify`);
      console.log(`   - GET  /api/usuarios`);
      console.log(`   - POST /api/usuarios`);
    });
  } else {
    console.error('❌ Falha na conexão com o banco de dados. O servidor não será iniciado.');
    process.exit(1);
  }
}

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Inicia o servidor
startServer();

