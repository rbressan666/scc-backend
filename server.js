// server.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from './config/database.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import setorRoutes from './routes/setores.js';
import categoriaRoutes from './routes/categorias.js';
import unidadeMedidaRoutes from './routes/unidades-medida.js';
import produtoRoutes from './routes/produtos.js';
import variacaoRoutes from './routes/variacoes.js';
import fatorConversaoRoutes from './routes/conversoes.js';
import photoRoutes from './routes/photo.js';

// Importar serviços
import { qrCodeService } from './services/qrCodeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Função para testar conexão com o banco
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com o banco de dados bem-sucedida');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Falha no teste de conexão:', error);
    throw error;
  }
};

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/setores', setorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/unidades-medida', unidadeMedidaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/variacoes', variacaoRoutes);
app.use('/api/conversoes', fatorConversaoRoutes);
app.use('/api/photo', photoRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'SCC Backend API está funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Configurar WebSocket para QR Code
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Inicializar serviço de QR Code
qrCodeService.initialize(io);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Rota ${req.method} ${req.originalUrl} não encontrada` 
  });
});

// Função para iniciar o servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando SCC Backend...');
    
    // Testar conexão com o banco
    console.log('🔍 Testando conexão com o banco de dados...');
    await testConnection();
    
    // Iniciar servidor
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 WebSocket habilitado para QR Code`);
    });
    
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    console.error('❌ Falha na conexão com o banco de dados');
    process.exit(1);
  }
};

// Inicia o servidor
startServer();

