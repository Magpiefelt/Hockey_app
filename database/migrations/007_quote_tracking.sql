-- Migration: 007 - Quote Tracking Features
-- Adds quote viewing, acceptance tracking, and expiration

-- Add quote tracking fields to quote_requests
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS quote_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_quote_version INTEGER DEFAULT 1;

-- Update status constraint to include new statuses
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN ('pending', 'submitted', 'in_progress', 'quoted', 'quote_viewed', 'quote_accepted', 'invoiced', 'paid', 'completed', 'cancelled', 'delivered'));

-- Create quote events table for tracking customer interactions
CREATE TABLE IF NOT EXISTS quote_events (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('viewed', 'accepted', 'declined', 'expired', 'reminder_sent', 'payment_started')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON quote_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_events_created_at ON quote_events(created_at DESC);

-- Create quote revisions table for tracking quote history
CREATE TABLE IF NOT EXISTS quote_revisions (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_revisions_quote_id ON quote_revisions(quote_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_revisions_version ON quote_revisions(quote_id, version);

-- Add organization field to quote_requests if not exists
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS organization VARCHAR(200);

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_quote_requests_contact_email ON quote_requests(contact_email);
