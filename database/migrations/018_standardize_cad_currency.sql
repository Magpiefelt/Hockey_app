-- Migration: 018 - Standardize CAD currency
-- Ensures persisted currency codes and defaults align with CAD-first pricing.

ALTER TABLE packages ALTER COLUMN currency SET DEFAULT 'cad';
ALTER TABLE invoices ALTER COLUMN currency SET DEFAULT 'cad';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'cad';

UPDATE packages SET currency = 'cad' WHERE LOWER(currency) = 'usd';
UPDATE invoices SET currency = 'cad' WHERE LOWER(currency) = 'usd';
UPDATE payments SET currency = 'cad' WHERE LOWER(currency) = 'usd';
