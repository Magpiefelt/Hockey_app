-- Migration: Fix override_type CHECK constraint
-- This migration drops the CHECK constraint on override_type column
-- that was preventing date overrides from being added

-- Drop the existing CHECK constraint
ALTER TABLE availability_overrides 
DROP CONSTRAINT IF EXISTS availability_overrides_override_type_check;

-- Add a new, more permissive CHECK constraint that allows common values
ALTER TABLE availability_overrides 
ADD CONSTRAINT availability_overrides_override_type_check 
CHECK (override_type IS NULL OR override_type IN ('manual', 'blocked', 'available', 'busy', 'vacation', 'holiday', 'booking'));
