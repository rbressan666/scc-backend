// services/qrCodeService.js (CORRIGIDO)
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import QRCode from 'qrcode';

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
      socket.on('generate-qr', async (callback) => {
        try {
          console.log('📱 Solicitação de geração de QR Code recebida');
          const sessionData = this.generateQRSession();
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              qrCodeData: sessionData.qrCodeData,
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

      // Listener para QR expirado
      socket.on('qr-expired', (data) => {
        try {
          const { sessionId } = data;
          this.sessions.delete(sessionId);
          setShowQRCode(false);
          setQrStatus('');
          setError('QR Code expirado. Gere um novo código.');
        } catch (error) {
          console.error('Erro ao processar QR expirado:', error);
        }
      });

      // Cancelar sessão QR
      socket.on('cancel-qr', (data) => {
        try {
          const { sessionId } = data;
          if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId);
            setShowQRCode(false);
            setQrStatus('');
          }
        } catch (error) {
          console.error('Erro ao cancelar QR:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });
  }

  generateQRSession() {
    const sessionId = uuidv4();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutos
    
    const sessionData = {
      sessionId,
      expiresAt,
      status: 'waiting' // 'waiting', 'scanned', 'confirmed', 'expired'
    };
    
    this.sessions.set(sessionId, sessionData);
    
    // Gerar URL do QR Code com dados da sessão
    const qrData = JSON.stringify({
      sessionId,
      timestamp: Date.now(),
      action: 'scc-login'
    });
    
    return {
      sessionId,
      qrCodeData: qrData,
      expiresAt
    };
  }

  async validateQRCode(qrData, userCredentials) {
    try {
      const parsedData = JSON.parse(qrData);
      const { sessionId } = parsedData;
      
      if (!this.sessions.has(sessionId)) {
        return {
          success: false,
          message: 'Sessão não encontrada ou expirada'
        };
      }
      
      const session = this.sessions.get(sessionId);
      
      if (Date.now() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return {
          success: false,
          message: 'QR Code expirado'
        };
      }
      
      if (session.status !== 'waiting') {
        return {
          success: false,
          message: 'QR Code já foi utilizado'
        };
      }
      
      // Validar credenciais do usuário
      const { email, senha } = userCredentials;
      
      const result = await pool.query(`
        SELECT 
          id,
          nome_completo,
          email,
          senha_hash,
          perfil,
          ativo,
          data_criacao,
          data_atualizacao
        FROM usuarios 
        WHERE email = $1 AND ativo = true
      `, [email]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }
      
      const user = result.rows[0];
      
      // Verificar senha (assumindo que você tem bcrypt importado)
      const bcrypt = await import('bcrypt');
      const validPassword = await bcrypt.compare(senha, user.senha_hash);
      
      if (!validPassword) {
        return {
          success: false,
          message: 'Credenciais inválidas'
        };
      }
      
      // Atualizar status da sessão
      session.status = 'scanned';
      session.userId = user.id;
      session.user = {
        id: user.id,
        nome_completo: user.nome_completo,
        email: user.email,
        perfil: user.perfil,
        ativo: user.ativo,
        created_at: user.data_criacao,
        updated_at: user.data_atualizacao
      };
      
      this.sessions.set(sessionId, session);
      
      return {
        success: true,
        sessionId,
        message: 'QR Code validado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao validar QR Code:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  async confirmLogin(sessionId) {
    try {
      if (!this.sessions.has(sessionId)) {
        return {
          success: false,
          message: 'Sessão não encontrada'
        };
      }
      
      const session = this.sessions.get(sessionId);
      
      if (session.status !== 'scanned') {
        return {
          success: false,
          message: 'QR Code não foi escaneado ou já foi confirmado'
        };
      }
      
      if (Date.now() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return {
          success: false,
          message: 'Sessão expirada'
        };
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: session.user.id, 
          email: session.user.email, 
          perfil: session.user.perfil 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Atualizar status da sessão
      session.status = 'confirmed';
      this.sessions.set(sessionId, session);
      
      // Limpar sessão após 1 minuto
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 60000);
      
      return {
        success: true,
        token,
        user: session.user,
        sessionId
      };
      
    } catch (error) {
      console.error('Erro ao confirmar login:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        console.log(`🧹 Sessão expirada removida: ${sessionId}`);
      }
    }
  }

  getSessionStatus(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return { exists: false };
    }
    
    const session = this.sessions.get(sessionId);
    return {
      exists: true,
      status: session.status,
      expiresAt: session.expiresAt,
      expired: Date.now() > session.expiresAt
    };
  }
}

// Exportar instância única
export const qrCodeService = new QRCodeService();

