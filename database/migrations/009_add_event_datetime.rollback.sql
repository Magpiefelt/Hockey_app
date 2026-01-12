-- Rollback Migration: 009 - Add Event DateTime Support
-- This will undo all changes from 009_add_event_datetime.sql

-- Remove indexes first
DROP INDEX IF EXISTS idx_quote_requests_event_datetime;
DROP INDEX IF EXISTS idx_availability_overrides_order_id;

-- Remove columns from quote_requests
ALTER TABLE quote_requests DROP COLUMN IF EXISTS event_time;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS event_datetime;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS admin_confirmed_datetime;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS tax_province;
ALTER TABLE quote_requests DROP COLUMN IF EXISTS subtotal_amount;

-- Remove order_id from availability_overrides
ALTER TABLE availability_overrides DROP COLUMN IF EXISTS order_id;
