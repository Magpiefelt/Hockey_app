-- Rollback: 013 - Add quote_access_tokens table
DROP INDEX IF EXISTS idx_quote_access_tokens_expires_at;
DROP INDEX IF EXISTS idx_quote_access_tokens_quote_id;
DROP TABLE IF EXISTS quote_access_tokens CASCADE;
