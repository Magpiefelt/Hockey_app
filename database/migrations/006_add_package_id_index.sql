-- Migration: Add missing index on package_id column in quote_requests table
-- This index improves query performance when filtering or joining by package
-- 
-- FIX: The quote_requests table has indexes on user_id, status, contact_email, 
-- and created_at, but NOT on package_id despite frequent joins and filters on this column.

-- Add index for package_id lookups and joins
CREATE INDEX IF NOT EXISTS idx_quote_requests_package_id ON quote_requests(package_id);

-- Also add a composite index for common admin queries that filter by status and package
CREATE INDEX IF NOT EXISTS idx_quote_requests_status_package ON quote_requests(status, package_id);
