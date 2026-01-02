-- Rollback: Remove package_id indexes from quote_requests table

DROP INDEX IF EXISTS idx_quote_requests_package_id;
DROP INDEX IF EXISTS idx_quote_requests_status_package;
