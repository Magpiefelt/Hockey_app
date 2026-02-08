-- Migration: Add quote_access_tokens table
-- This table stores tokens for secure email-based quote access

CREATE TABLE IF NOT EXISTS quote_access_tokens (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quote_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_quote_id ON quote_access_tokens(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_expires_at ON quote_access_tokens(expires_at);
