-- Migration: Add availability_overrides table for calendar feature
-- Created: 2025-12-23
-- Description: Allows admins to manually block dates as unavailable

CREATE TABLE IF NOT EXISTS availability_overrides (
  id SERIAL PRIMARY KEY,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_overrides_dates ON availability_overrides(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_active ON availability_overrides(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_created_by ON availability_overrides(created_by);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_availability_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_availability_overrides_updated_at
BEFORE UPDATE ON availability_overrides
FOR EACH ROW
EXECUTE FUNCTION update_availability_overrides_updated_at();

-- Add constraint to ensure date_to >= date_from
ALTER TABLE availability_overrides
ADD CONSTRAINT check_date_range CHECK (date_to >= date_from);

-- Comments for documentation
COMMENT ON TABLE availability_overrides IS 'Manual date blocks for calendar availability';
COMMENT ON COLUMN availability_overrides.date_from IS 'Start date of unavailable period';
COMMENT ON COLUMN availability_overrides.date_to IS 'End date of unavailable period';
COMMENT ON COLUMN availability_overrides.reason IS 'Reason for blocking (e.g., vacation, holiday)';
COMMENT ON COLUMN availability_overrides.description IS 'Optional detailed description';
COMMENT ON COLUMN availability_overrides.created_by IS 'Admin user who created the override';
COMMENT ON COLUMN availability_overrides.is_active IS 'Whether the override is currently active';
