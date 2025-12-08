-- Rollback Migration: 002 - Fix Email Logs Schema
-- This rollback script reverts the email_logs table changes

-- Rename to_email back to recipient_email
ALTER TABLE email_logs RENAME COLUMN to_email TO recipient_email;

-- Rename template back to email_type
ALTER TABLE email_logs RENAME COLUMN template TO email_type;

-- Drop metadata_json column
ALTER TABLE email_logs DROP COLUMN metadata_json;

-- Restore original index
DROP INDEX IF EXISTS idx_email_logs_to_email;
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
