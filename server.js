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
import setorRoutes from './routes/setores.js';
import categoriaRoutes from './routes/categorias.js';
import unidadeMedidaRoutes from './routes/unidades-medida.js';
import produtoRoutes from './routes/produtos.js';
import variacaoRoutes from './routes/variacoes.js';
import conversaoRoutes from './routes/conversoes.js';
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
      users: '/api/users'  // ← CORRIGIDO: Documentação atualizada
    }
  });
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);  // ← CORRIGIDO: Mudado de /api/usuarios para /api/users
app.use('/api/setores', setorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/unidades-medida', unidadeMedidaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/variacoes', variacaoRoutes);
app.use('/api/conversoes', conversaoRoutes);

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
const testDatabaseConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com banco de dados:', error.message);
    return false;
  }
};

// Configurar WebSocket para QR Code
qrCodeService.setupWebSocket(io);

// Função para iniciar o servidor
const startServer = async () => {
  console.log('🚀 Iniciando SCC Backend...');
  
  // Testar conexão com banco
  console.log('🔍 Testando conexão com o banco de dados...');
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.log('❌ Falha na conexão com o banco de dados');
    process.exit(1);
  }
  
  // Iniciar servidor
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Servidor acessível em: http://0.0.0.0:${PORT}`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`📡 WebSocket habilitado para QR Code`);
    console.log(`🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests por ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutos`);
  });
};

// Iniciar o servidor
startServer();

