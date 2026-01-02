-- Rollback: 007 - Quote Tracking Features

-- Drop quote events table
DROP TABLE IF EXISTS quote_events;

-- Drop quote revisions table
DROP TABLE IF EXISTS quote_revisions;

-- Remove added columns from quote_requests
ALTER TABLE quote_requests 
DROP COLUMN IF EXISTS quote_viewed_at,
DROP COLUMN IF EXISTS quote_accepted_at,
DROP COLUMN IF EXISTS quote_expires_at,
DROP COLUMN IF EXISTS current_quote_version,
DROP COLUMN IF EXISTS organization;

-- Restore original status constraint
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN ('pending', 'submitted', 'in_progress', 'quoted', 'invoiced', 'paid', 'completed', 'cancelled', 'delivered'));

-- Drop indexes
DROP INDEX IF EXISTS idx_quote_events_quote_id;
DROP INDEX IF EXISTS idx_quote_events_type;
DROP INDEX IF EXISTS idx_quote_events_created_at;
DROP INDEX IF EXISTS idx_quote_revisions_quote_id;
DROP INDEX IF EXISTS idx_quote_revisions_version;
DROP INDEX IF EXISTS idx_quote_requests_contact_email;
