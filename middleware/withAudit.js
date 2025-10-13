// Helper para controllers setarem metadados de auditoria
export const withAudit = (req, meta) => {
  req.audit = Object.assign({}, req.audit, meta);
};
