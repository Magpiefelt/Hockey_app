-- Rollback Migration: Remove contact_submissions table
-- Description: Drops the contact_submissions table and its indexes
-- Date: 2026-01-12

-- Drop indexes first
DROP INDEX IF EXISTS idx_contact_submissions_status;
DROP INDEX IF EXISTS idx_contact_submissions_created_at;
DROP INDEX IF EXISTS idx_contact_submissions_email;

-- Drop the table
DROP TABLE IF EXISTS contact_submissions;
