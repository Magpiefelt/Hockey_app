-- Migration: 008 - Manual Completion Support
-- Adds support for tracking manual (offline) order completions
-- This migration adds metadata to distinguish manual payments from Stripe payments
--
-- Run this migration with: psql -d your_database -f 008_manual_completion_support.sql
-- Or through your migration tool

-- Add payment_method column to payments table to distinguish payment sources
-- This allows filtering and reporting on manual vs automated payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_method VARCHAR(20) DEFAULT 'stripe';
    ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
      CHECK (payment_method IN ('stripe', 'manual', 'cash', 'check', 'wire', 'other'));
  END IF;
END $$;

-- Add completed_by column to track which admin completed the order manually
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add completed_at timestamp for manual completions
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for payment method queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- Create index for completed orders by admin
CREATE INDEX IF NOT EXISTS idx_quote_requests_completed_by ON quote_requests(completed_by);

-- Update existing Stripe payments to have explicit payment_method
UPDATE payments 
SET payment_method = 'stripe' 
WHERE payment_method IS NULL 
  AND stripe_payment_id IS NOT NULL 
  AND stripe_payment_id NOT LIKE 'manual_%';

-- Update manual payments (those with manual_ prefix) to have manual payment_method
UPDATE payments 
SET payment_method = 'manual' 
WHERE stripe_payment_id LIKE 'manual_%';

-- Add comment for documentation
COMMENT ON COLUMN payments.payment_method IS 'Payment source: stripe (online), manual (admin-recorded offline), cash, check, wire, other';
COMMENT ON COLUMN quote_requests.completed_by IS 'User ID of admin who manually completed the order (NULL for automated completions)';
COMMENT ON COLUMN quote_requests.completed_at IS 'Timestamp when order was marked as completed (manual or automated)';
