-- Notifications queue
CREATE TABLE IF NOT EXISTS notifications_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  occurrence_id BIGINT NULL,
  type TEXT NOT NULL,
  scheduled_at_utc TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed | canceled
  payload JSONB,
  unique_key TEXT UNIQUE,
  last_error TEXT,
  last_result JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_queue_status_schedule
  ON notifications_queue (status, scheduled_at_utc);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
  ON push_subscriptions (user_id, active);
