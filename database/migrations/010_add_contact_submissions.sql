-- Migration: Add contact_submissions table
-- Description: Creates the contact_submissions table for storing contact form submissions
-- Date: 2026-01-12

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);

-- Add comment for documentation
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the public website';
COMMENT ON COLUMN contact_submissions.status IS 'Status of the submission: new, read, replied, or archived';
COMMENT ON COLUMN contact_submissions.ip_address IS 'IP address of the submitter for rate limiting and spam prevention';
