-- Truncate planning-related tables and reset identity sequences
-- WARNING: This is destructive. Rows will be removed and IDs reset.
-- Run in a safe environment (dev/staging) or with explicit confirmation.

BEGIN;
  TRUNCATE TABLE notifications_queue RESTART IDENTITY;
  TRUNCATE TABLE scheduled_shifts RESTART IDENTITY;
  TRUNCATE TABLE schedule_rules RESTART IDENTITY;
COMMIT;
