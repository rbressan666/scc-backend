-- Audit logging table for SCC Backend
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NULL,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  action VARCHAR(50) NULL,
  entity VARCHAR(50) NULL,
  entity_id TEXT NULL,
  payload JSONB NULL,
  status_code INT NOT NULL,
  ip INET NULL,
  user_agent TEXT NULL,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  message TEXT NULL,
  duration_ms INT NULL
);

-- Helpful index for querying by time and entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
