const { v4: uuidv4 } = require('uuid');

class QRCodeService {
  constructor(io) {
    this.io = io;
    this.sessions = new Map(); // Armazenar sessões ativas
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Gerar QR Code para login
      socket.on('generate-qr', (data) => {
        try {
          const sessionId = uuidv4();
          const qrData = {
            sessionId,
            timestamp: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutos
            status: 'pending'
          };

          // Armazenar sessão
          this.sessions.set(sessionId, {
            ...qrData,
            desktopSocketId: socket.id
          });

          // Enviar dados do QR Code para o cliente desktop
          socket.emit('qr-generated', {
            sessionId,
            qrCodeData: JSON.stringify({
              sessionId,
              serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
              timestamp: qrData.timestamp
            })
          });

          console.log(`📱 QR Code gerado: ${sessionId} para socket ${socket.id}`);

          // Limpar sessão após expiração
          setTimeout(() => {
            if (this.sessions.has(sessionId)) {
              this.sessions.delete(sessionId);
              socket.emit('qr-expired', { sessionId });
              console.log(`⏰ QR Code expirado: ${sessionId}`);
            }
          }, 5 * 60 * 1000);

        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
          socket.emit('qr-error', { message: 'Erro ao gerar QR Code' });
        }
      });

      // Validar QR Code escaneado pelo mobile
      socket.on('validate-qr', (data) => {
        try {
          const { sessionId } = data;
          const session = this.sessions.get(sessionId);

          if (!session) {
            socket.emit('qr-validation-result', {
              success: false,
              message: 'Sessão não encontrada ou expirada'
            });
            return;
          }

          if (session.status !== 'pending') {
            socket.emit('qr-validation-result', {
              success: false,
              message: 'QR Code já foi utilizado'
            });
            return;
          }

          if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            socket.emit('qr-validation-result', {
              success: false,
              message: 'QR Code expirado'
            });
            return;
          }

          // Atualizar status da sessão
          session.status = 'validated';
          session.mobileSocketId = socket.id;
          this.sessions.set(sessionId, session);

          // Notificar cliente mobile que QR é válido
          socket.emit('qr-validation-result', {
            success: true,
            message: 'QR Code válido. Faça login para continuar.',
            sessionId
          });

          // Notificar cliente desktop que QR foi escaneado
          const desktopSocket = this.io.sockets.sockets.get(session.desktopSocketId);
          if (desktopSocket) {
            desktopSocket.emit('qr-scanned', { sessionId });
          }

          console.log(`✅ QR Code validado: ${sessionId}`);

        } catch (error) {
          console.error('Erro ao validar QR Code:', error);
          socket.emit('qr-validation-result', {
            success: false,
            message: 'Erro interno do servidor'
          });
        }
      });

      // Confirmar login via mobile
      socket.on('confirm-login', (data) => {
        try {
          const { sessionId, token, user } = data;
          const session = this.sessions.get(sessionId);

          if (!session || session.status !== 'validated') {
            socket.emit('login-confirmation-result', {
              success: false,
              message: 'Sessão inválida'
            });
            return;
          }

          // Atualizar status da sessão
          session.status = 'completed';
          this.sessions.set(sessionId, session);

          // Notificar cliente desktop com dados de login
          const desktopSocket = this.io.sockets.sockets.get(session.desktopSocketId);
          if (desktopSocket) {
            desktopSocket.emit('login-success', {
              sessionId,
              token,
              user
            });
          }

          // Confirmar para o mobile
          socket.emit('login-confirmation-result', {
            success: true,
            message: 'Login confirmado com sucesso'
          });

          // Limpar sessão após 30 segundos
          setTimeout(() => {
            this.sessions.delete(sessionId);
          }, 30000);

          console.log(`🎉 Login confirmado via QR: ${sessionId}`);

        } catch (error) {
          console.error('Erro ao confirmar login:', error);
          socket.emit('login-confirmation-result', {
            success: false,
            message: 'Erro interno do servidor'
          });
        }
      });

      // Cancelar sessão QR
      socket.on('cancel-qr', (data) => {
        try {
          const { sessionId } = data;
          const session = this.sessions.get(sessionId);

          if (session) {
            // Notificar ambos os clientes
            const desktopSocket = this.io.sockets.sockets.get(session.desktopSocketId);
            const mobileSocket = session.mobileSocketId ? 
              this.io.sockets.sockets.get(session.mobileSocketId) : null;

            if (desktopSocket) {
              desktopSocket.emit('qr-cancelled', { sessionId });
            }

            if (mobileSocket) {
              mobileSocket.emit('qr-cancelled', { sessionId });
            }

            this.sessions.delete(sessionId);
            console.log(`❌ Sessão QR cancelada: ${sessionId}`);
          }
        } catch (error) {
          console.error('Erro ao cancelar QR:', error);
        }
      });

      // Cleanup quando cliente desconecta
      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
        
        // Limpar sessões relacionadas a este socket
        for (const [sessionId, session] of this.sessions.entries()) {
          if (session.desktopSocketId === socket.id || session.mobileSocketId === socket.id) {
            this.sessions.delete(sessionId);
            console.log(`🧹 Sessão limpa por desconexão: ${sessionId}`);
          }
        }
      });
    });
  }

  // Método para obter estatísticas das sessões
  getSessionStats() {
    const now = Date.now();
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => session.expiresAt > now
    );

    return {
      total: this.sessions.size,
      active: activeSessions.length,
      expired: this.sessions.size - activeSessions.length
    };
  }

  // Método para limpar sessões expiradas
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} sessões expiradas foram limpas`);
    }

    return cleaned;
  }
}

module.exports = QRCodeService;

