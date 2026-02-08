-- Rollback: 014 - Add form_submissions table
DROP INDEX IF EXISTS idx_form_submissions_quote_id;
DROP TABLE IF EXISTS form_submissions CASCADE;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS organization;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS notes;
