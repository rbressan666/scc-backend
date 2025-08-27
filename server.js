const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Importar configurações e serviços
const { testConnection } = require('./config/database');
const User = require('./models/User');
const QRCodeService = require('./services/qrCodeService');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Criar aplicação Express
const app = express();
const server = createServer(app);

// Configurar Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configurar porta
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configurar CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3001",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // máximo de requests por IP
  message: {
    success: false,
    message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SCC Backend está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de informações da API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SCC API - Sistema Contagem Cadoz',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/usuarios',
      health: '/health'
    },
    documentation: 'https://github.com/scc-team/scc-backend'
  });
});

// Configurar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  
  // Não expor detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: isDevelopment ? error.message : 'Erro interno do servidor',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Inicializar serviço de QR Code
const qrCodeService = new QRCodeService(io);

// Função para inicializar o servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando SCC Backend...');
    
    // Testar conexão com o banco de dados
    console.log('🔍 Testando conexão com o banco de dados...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Falha na conexão com o banco de dados');
      process.exit(1);
    }
    
    // Inicializar usuário administrador
    console.log('👤 Verificando usuário administrador...');
    await User.initializeAdminUser();
    
    // Iniciar servidor
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📡 WebSocket habilitado para QR Code login`);
      console.log(`🔒 CORS configurado para: ${process.env.CORS_ORIGIN || 'http://localhost:3001'}`);
      
      // Log das rotas disponíveis
      console.log('\n📋 Rotas disponíveis:');
      console.log('  GET  /health - Health check');
      console.log('  GET  /api - Informações da API');
      console.log('  POST /api/auth/login - Login');
      console.log('  GET  /api/auth/verify - Verificar token');
      console.log('  POST /api/auth/logout - Logout');
      console.log('  PUT  /api/auth/change-password - Alterar senha');
      console.log('  GET  /api/usuarios - Listar usuários');
      console.log('  POST /api/usuarios - Criar usuário');
      console.log('  GET  /api/usuarios/:id - Buscar usuário');
      console.log('  PUT  /api/usuarios/:id - Atualizar usuário');
      console.log('  DELETE /api/usuarios/:id - Desativar usuário');
      console.log('  PUT  /api/usuarios/:id/reactivate - Reativar usuário');
    });
    
    // Cleanup de sessões QR expiradas a cada 5 minutos
    setInterval(() => {
      qrCodeService.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
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
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = { app, server, io };

