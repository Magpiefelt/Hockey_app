-- Migration: 009 - Add Event DateTime Support
-- Created: 2026-01-12
-- Description: Adds event time and datetime columns for proper booking management
--              Also adds tax tracking columns for finance reporting

-- ============================================
-- Step 1: Add event datetime columns to quote_requests
-- ============================================

-- Add event_time column for storing just the time component
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS event_time TIME;

-- Add combined event_datetime for full timestamp
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS event_datetime TIMESTAMPTZ;

-- Add flag to indicate admin has confirmed the datetime
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS admin_confirmed_datetime BOOLEAN DEFAULT FALSE;

-- ============================================
-- Step 2: Add tax tracking columns
-- ============================================

-- Tax amount collected (in cents)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0;

-- Province for tax calculation (2-letter code)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS tax_province VARCHAR(2) DEFAULT 'AB';

-- Subtotal before tax (in cents)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER;

-- ============================================
-- Step 3: Migrate existing event_date data to event_datetime
-- ============================================

-- Set event_datetime from existing event_date (default to noon)
UPDATE quote_requests 
SET event_datetime = (event_date::timestamp + TIME '12:00:00') AT TIME ZONE 'America/Edmonton'
WHERE event_date IS NOT NULL 
  AND event_datetime IS NULL;

-- ============================================
-- Step 4: Add index for event_datetime queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quote_requests_event_datetime 
ON quote_requests(event_datetime);

-- ============================================
-- Step 5: Update availability_overrides for booking type
-- ============================================

-- Ensure override_type can handle 'booking' type
-- This is for auto-created blocks when orders are paid
ALTER TABLE availability_overrides 
DROP CONSTRAINT IF EXISTS availability_overrides_override_type_check;

-- Add order_id reference for booking-type overrides
ALTER TABLE availability_overrides 
ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES quote_requests(id) ON DELETE CASCADE;

-- Create index for order_id lookups
CREATE INDEX IF NOT EXISTS idx_availability_overrides_order_id 
ON availability_overrides(order_id);

-- ============================================
-- Rollback Instructions
-- ============================================
-- To rollback this migration, run:
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS event_time;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS event_datetime;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS admin_confirmed_datetime;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS tax_amount;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS tax_province;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS subtotal_amount;
-- ALTER TABLE availability_overrides DROP COLUMN IF EXISTS order_id;
-- DROP INDEX IF EXISTS idx_quote_requests_event_datetime;
-- DROP INDEX IF EXISTS idx_availability_overrides_order_id;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON COLUMN quote_requests.event_time IS 'Time of the event (separate from date for flexibility)';
COMMENT ON COLUMN quote_requests.event_datetime IS 'Combined date and time of the event';
COMMENT ON COLUMN quote_requests.admin_confirmed_datetime IS 'Whether admin has confirmed the event datetime when submitting quote';
COMMENT ON COLUMN quote_requests.tax_amount IS 'Tax amount collected in cents';
COMMENT ON COLUMN quote_requests.tax_province IS 'Province code for tax calculation (e.g., AB, BC, ON)';
COMMENT ON COLUMN quote_requests.subtotal_amount IS 'Subtotal before tax in cents';
COMMENT ON COLUMN availability_overrides.order_id IS 'Reference to order that created this booking block';
