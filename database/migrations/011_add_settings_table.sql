-- Migration: Add settings table for system configuration
-- Description: Creates a key-value settings table for storing tax, invoice, and reminder settings
-- Date: 2026-01-12

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('tax_settings', '{"defaultProvince": "AB", "autoApplyTax": true, "includeInPrice": false, "roundingMethod": "standard"}', 'Tax calculation settings'),
  ('invoice_settings', '{"companyName": "Elite Sports DJ", "companyAddress": "Calgary, Alberta, Canada", "companyPhone": "", "companyEmail": "info@elitesportsdj.com", "paymentTermsDays": 14, "invoicePrefix": "INV-", "nextInvoiceNumber": 1001, "defaultNotes": "Thank you for your business! Payment is due within 14 days.", "autoSendOnQuoteAccept": true}', 'Invoice generation settings'),
  ('reminder_settings', '{"daysBefore": [7, 3, 1], "daysAfter": [1, 3, 7, 14], "maxReminders": 6}', 'Payment reminder schedule settings'),
  ('business_info', '{"businessName": "Elite Sports DJ", "businessNumber": "", "gstNumber": "", "address": "Calgary, AB", "phone": "", "email": "info@elitesportsdj.com"}', 'Business information for invoices and reports')
ON CONFLICT (key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE settings IS 'System configuration settings stored as key-value pairs with JSON values';
COMMENT ON COLUMN settings.key IS 'Unique identifier for the setting';
COMMENT ON COLUMN settings.value IS 'JSON value containing the setting data';
