-- Rollback Migration: 003 - Add Email Webhook Columns
-- This rollback script removes the webhook-related columns

-- Drop indexes
DROP INDEX IF EXISTS idx_email_logs_webhook_event;
DROP INDEX IF EXISTS idx_email_logs_updated_at;

-- Drop columns
ALTER TABLE email_logs DROP COLUMN IF EXISTS webhook_event;
ALTER TABLE email_logs DROP COLUMN IF EXISTS webhook_data;
ALTER TABLE email_logs DROP COLUMN IF EXISTS updated_at;
