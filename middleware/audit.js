import { auditService } from '../services/auditService.js';

export const auditMiddleware = (req, res, next) => {
  const start = Date.now();

  // Excluir health e raiz para evitar ruído
  const skip = req.path === '/health' || req.path === '/';
  if (skip) return next();

  // Hook para após resposta
  const originalEnd = res.end;
  res.end = function (...args) {
    try {
      const status = res.statusCode;
      auditService.log({
        req,
        resStatus: status,
        startTime: start,
        // action/entity poderão ser setados nos controllers via req.audit
        action: req.audit?.action,
        entity: req.audit?.entity,
        entityId: req.audit?.entityId,
        payload: req.audit?.payload,
        success: status < 400,
        message: req.audit?.message,
      });
    } catch (_) {
      // ignore
    }
    return originalEnd.apply(this, args);
  };

  next();
};
