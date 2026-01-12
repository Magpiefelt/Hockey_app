-- Migration: 003 - Add Email Webhook Columns
-- This migration adds columns to track Mailgun webhook events

-- Add webhook_event column to store the event type from Mailgun
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS webhook_event VARCHAR(50);

-- Add webhook_data column to store additional webhook payload data
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS webhook_data JSONB;

-- Add updated_at column if it doesn't exist
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add delivered status option (update status check constraint if exists)
-- First check current status values and update if needed
DO $$
BEGIN
  -- Try to drop existing constraint if it exists
  ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create index on webhook_event for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_webhook_event ON email_logs(webhook_event);

-- Create index on updated_at for tracking recent updates
CREATE INDEX IF NOT EXISTS idx_email_logs_updated_at ON email_logs(updated_at DESC);

COMMENT ON COLUMN email_logs.webhook_event IS 'Event type from Mailgun webhook (delivered, bounced, complained, etc.)';
COMMENT ON COLUMN email_logs.webhook_data IS 'JSON payload from Mailgun webhook containing delivery details';
