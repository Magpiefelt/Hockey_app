-- Rollback: 018 - Standardize CAD currency

ALTER TABLE packages ALTER COLUMN currency SET DEFAULT 'usd';
ALTER TABLE invoices ALTER COLUMN currency SET DEFAULT 'usd';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'usd';

UPDATE packages SET currency = 'usd' WHERE LOWER(currency) = 'cad';
UPDATE invoices SET currency = 'usd' WHERE LOWER(currency) = 'cad';
UPDATE payments SET currency = 'usd' WHERE LOWER(currency) = 'cad';
