-- SCC Planning cleanup script
-- Use on PostgreSQL to clear scheduling data

-- OPTION A: HARD RESET (delete everything, including rules)
-- This removes all scheduled shifts and all schedule rules and resets sequences.
BEGIN;
  TRUNCATE TABLE scheduled_shifts RESTART IDENTITY;
  TRUNCATE TABLE schedule_rules RESTART IDENTITY;
COMMIT;

-- OPTION B: SOFT RESET RULES (keep rules history but deactivate them)
-- This deletes all scheduled shifts and marks rules inactive with end_date today.
-- Uncomment to use instead of Option A.
-- BEGIN;
--   TRUNCATE TABLE scheduled_shifts RESTART IDENTITY;
--   UPDATE schedule_rules
--     SET active = FALSE,
--         end_date = CURRENT_DATE,
--         updated_at = NOW();
-- COMMIT;

-- Verification (optional):
-- SELECT COUNT(*) AS shifts_after FROM scheduled_shifts;
-- SELECT COUNT(*) FILTER (WHERE active) AS active_rules,
--        COUNT(*) AS total_rules
-- FROM schedule_rules;