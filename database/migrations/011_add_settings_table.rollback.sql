-- Rollback Migration: Remove settings table
-- Description: Drops the settings table and its indexes
-- Date: 2026-01-12

-- Drop index
DROP INDEX IF EXISTS idx_settings_key;

-- Drop table
DROP TABLE IF EXISTS settings;
