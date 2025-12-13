-- Migration: Add failed_submissions table for tracking submission errors
-- Purpose: Track all failed submission attempts to prevent data loss and enable follow-up
-- Date: 2025-12-12

-- Create failed_submissions table
CREATE TABLE IF NOT EXISTS failed_submissions (
  id SERIAL PRIMARY KEY,
  
  -- Contact information (for follow-up)
  contact_email VARCHAR(120),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(30),
  
  -- Package reference (if available)
  package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
  
  -- Full form data as submitted (before cleaning)
  form_data JSONB,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code VARCHAR(50),
  
  -- Request metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Retry tracking
  retry_attempted BOOLEAN DEFAULT FALSE,
  retry_successful BOOLEAN DEFAULT FALSE,
  retry_at TIMESTAMPTZ,
  retry_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_failed_submissions_email 
  ON failed_submissions(contact_email);

CREATE INDEX IF NOT EXISTS idx_failed_submissions_created_at 
  ON failed_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_submissions_retry 
  ON failed_submissions(retry_attempted, retry_successful);

CREATE INDEX IF NOT EXISTS idx_failed_submissions_package 
  ON failed_submissions(package_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_failed_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_failed_submissions_updated_at
  BEFORE UPDATE ON failed_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_failed_submissions_updated_at();

-- Add comment
COMMENT ON TABLE failed_submissions IS 'Tracks all failed submission attempts for follow-up and debugging';
COMMENT ON COLUMN failed_submissions.form_data IS 'Full form data as submitted (before cleaning) - useful for debugging';
COMMENT ON COLUMN failed_submissions.error_message IS 'User-facing error message';
COMMENT ON COLUMN failed_submissions.error_stack IS 'Full error stack trace for debugging';
COMMENT ON COLUMN failed_submissions.retry_attempted IS 'Whether admin has attempted to retry this submission';
COMMENT ON COLUMN failed_submissions.retry_successful IS 'Whether the retry was successful';
