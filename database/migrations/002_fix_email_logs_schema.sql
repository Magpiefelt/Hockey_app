-- Migration: 002 - Fix Email Logs Schema
-- This migration fixes the email_logs table to match the application code expectations

-- Rename recipient_email to to_email
ALTER TABLE email_logs RENAME COLUMN recipient_email TO to_email;

-- Rename email_type to template
ALTER TABLE email_logs RENAME COLUMN email_type TO template;

-- Add metadata_json column for storing email metadata
ALTER TABLE email_logs ADD COLUMN metadata_json JSONB;

-- Update index to use the new column name
DROP INDEX IF EXISTS idx_email_logs_recipient;
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
