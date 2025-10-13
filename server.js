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
import photoRoutes from './routes/photos.js';
import turnoRoutes from './routes/turnos.js';
import contagemRoutes from './routes/contagens.js';
import alertaRoutes from './routes/alertas.js';
import analiseRoutes from './routes/analise.js';

// Importar serviços
import { qrCodeService } from './services/qrCodeService.js';
import { auditMiddleware } from './middleware/audit.js';
import { notifyAdminsOnLogin } from './services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Configuração de CORS para produção e desenvolvimento
const allowedOrigins = [
  'http://localhost:3000', // possível porta do frontend em dev
  'http://localhost:3001', // porta configurada no Vite (dev) neste projeto
  'http://localhost:5173', // porta padrão do Vite (fallback)
  'https://scc-frontend-z3un.onrender.com', // produção
  process.env.FRONTEND_URL // override via ambiente
].filter(Boolean); // Remove valores undefined/null

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auditoria básica (registra após resposta)
app.use(auditMiddleware);

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
app.use('/api/photos', photoRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/contagens', contagemRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/analise', analiseRoutes);

// Test endpoint (optional) to verify email sending; enable by setting ENABLE_TEST_ROUTES=true
if (process.env.ENABLE_TEST_ROUTES === 'true') {
  app.get('/api/_test/notify-login', async (req, res) => {
    try {
      const result = await notifyAdminsOnLogin({
        user: { nome_completo: 'Diagnóstico', email: 'diagnostico@scc.local', perfil: 'tester' },
        req,
      });
      res.json({ success: true, result });
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || String(e) });
    }
  });
}

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    allowedOrigins: allowedOrigins
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'SCC Backend API está funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins
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
      console.log(`🌍 CORS configurado para:`, allowedOrigins);
    });
    
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    console.error('❌ Falha na conexão com o banco de dados');
    process.exit(1);
  }
};

// Inicia o servidor
startServer();





