// services/qrCodeService.js
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

class QRCodeService {
  constructor() {
    this.sessions = new Map(); // sessionId -> { qrData, userId, expiresAt, status }
    this.io = null;
    
    // Cleanup de sessões expiradas a cada 5 minutos
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  initialize(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);
      
      // Gerar QR Code
      socket.on('generate-qr', (callback) => {
        try {
          const sessionData = this.generateQRSession();
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              qrCodeData: sessionData.qrData,
              sessionId: sessionData.sessionId,
              expiresIn: 5 * 60 * 1000 // 5 minutos em ms
            });
          }
          
          console.log(`📱 QR Code gerado para sessão: ${sessionData.sessionId}`);
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              message: 'Erro ao gerar QR Code'
            });
          }
        }
      });
      
      // Validar QR Code escaneado
      socket.on('validate-qr', async (data, callback) => {
        try {
          const { qrData, userCredentials } = data;
          const result = await this.validateQRCode(qrData, userCredentials);
          
          if (callback && typeof callback === 'function') {
            callback(result);
          }
          
          if (result.success) {
            // Notificar desktop que QR foi escaneado
            socket.broadcast.emit('qr-scanned', {
              sessionId: result.sessionId
            });
            
            console.log(`✅ QR Code validado para sessão: ${result.sessionId}`);
          }
        } catch (error) {
          console.error('Erro ao validar QR Code:', error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              message: 'Erro ao validar QR Code'
            });
          }
        }
      });
      
      // Confirmar login via mobile
      socket.on('confirm-login', async (data, callback) => {
        try {
          const { sessionId } = data;
          const result = await this.confirmLogin(sessionId);
          
          if (callback && typeof callback === 'function') {
            callback(result);
          }
          
          if (result.success) {
            // Notificar desktop sobre login bem-sucedido
            socket.broadcast.emit('login-success', {
              sessionId,
              token: result.token,
              user: result.user
            });
            
            console.log(`🎉 Login confirmado para sessão: ${sessionId}`);
          }
        } catch (error) {
          console.error('Erro ao confirmar login:', error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              message: 'Erro ao confirmar login'
            });
          }
        }
      });
      
      // Cancelar sessão QR
      socket.on('cancel-qr', (data) => {
        try {
          const { sessionId } = data;
          this.cancelSession(sessionId);
          
          // Notificar outros clientes
          socket.broadcast.emit('qr-cancelled', { sessionId });
          
          console.log(`❌ Sessão QR cancelada: ${sessionId}`);
        } catch (error) {
          console.error('Erro ao cancelar sessão QR:', error);
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });
  }

  generateQRSession() {
    const sessionId = uuidv4();
    const qrData = `scc-login:${sessionId}:${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    
    this.sessions.set(sessionId, {
      qrData,
      userId: null,
      expiresAt,
      status: 'pending'
    });
    
    return { sessionId, qrData };
  }

  async validateQRCode(qrData, userCredentials) {
    try {
      // Extrair sessionId do QR data
      const parts = qrData.split(':');
      if (parts.length !== 3 || parts[0] !== 'scc-login') {
        return {
          success: false,
          message: 'QR Code inválido'
        };
      }
      
      const sessionId = parts[1];
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          message: 'Sessão não encontrada'
        };
      }
      
      if (session.expiresAt < new Date()) {
        this.sessions.delete(sessionId);
        return {
          success: false,
          message: 'QR Code expirado'
        };
      }
      
      if (session.status !== 'pending') {
        return {
          success: false,
          message: 'QR Code já foi usado'
        };
      }
      
      // Validar credenciais do usuário
      const { email, senha } = userCredentials;
      const userResult = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'Credenciais inválidas'
        };
      }
      
      const user = userResult.rows[0];
      const bcrypt = await import('bcrypt');
      const validPassword = await bcrypt.compare(senha, user.senha);
      
      if (!validPassword) {
        return {
          success: false,
          message: 'Credenciais inválidas'
        };
      }
      
      // Atualizar sessão
      session.userId = user.id;
      session.status = 'validated';
      this.sessions.set(sessionId, session);
      
      return {
        success: true,
        sessionId,
        message: 'QR Code validado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro na validação do QR Code:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  async confirmLogin(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          success: false,
          message: 'Sessão não encontrada'
        };
      }
      
      if (session.expiresAt < new Date()) {
        this.sessions.delete(sessionId);
        return {
          success: false,
          message: 'Sessão expirada'
        };
      }
      
      if (session.status !== 'validated') {
        return {
          success: false,
          message: 'Sessão não validada'
        };
      }
      
      // Buscar dados do usuário
      const userResult = await pool.query(
        'SELECT id, nome_completo, email, perfil, ativo FROM usuarios WHERE id = $1 AND ativo = true',
        [session.userId]
      );
      
      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }
      
      const user = userResult.rows[0];
      
      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          perfil: user.perfil 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Atualizar último login
      await pool.query(
        'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
        [user.id]
      );
      
      // Marcar sessão como concluída
      session.status = 'completed';
      this.sessions.set(sessionId, session);
      
      // Remover sessão após 1 minuto
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 60 * 1000);
      
      return {
        success: true,
        token,
        user,
        message: 'Login confirmado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao confirmar login:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  cancelSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Limpeza: ${cleanedCount} sessões QR expiradas removidas`);
    }
  }

  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { exists: false };
    }
    
    return {
      exists: true,
      status: session.status,
      expiresAt: session.expiresAt,
      expired: session.expiresAt < new Date()
    };
  }
}

export const qrCodeService = new QRCodeService();
export default qrCodeService;

