import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

export const auditService = {
  async log({
    req,
    resStatus,
    action,
    entity,
    entityId,
    payload,
    success = true,
    message,
    startTime,
  }) {
    try {
      const id = uuidv4();
      const duration = startTime ? Math.max(Date.now() - startTime, 0) : null;
      const userId = req.user?.id || null;
      const method = req.method;
      const path = req.originalUrl || req.path;
      const userAgent = req.headers['user-agent'] || null;
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null;

      await pool.query(
        `INSERT INTO audit_logs (
          id, user_id, method, path, action, entity, entity_id,
          payload, status_code, ip, user_agent, success, message, duration_ms
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::jsonb, $9, $10, $11, $12, $13, $14
        )`,
        [
          id, userId, method, path, action || null, entity || null, entityId || null,
          payload ? JSON.stringify(payload) : null, resStatus ?? 200,
          ip, userAgent, success, message || null, duration,
        ]
      );
    } catch (err) {
      // Evitar que erro de log quebre a request
      console.error('Falha ao gravar audit log:', err?.message || err);
    }
  },
};
