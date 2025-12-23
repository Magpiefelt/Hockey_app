-- Migration: Add availability_overrides table for calendar feature
-- Created: 2025-12-23
-- Description: Allows admins to manually block dates as unavailable

CREATE TABLE IF NOT EXISTS availability_overrides (
  id SERIAL PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false NOT NULL,
  reason VARCHAR(255) NOT NULL,
  override_type VARCHAR(50),
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_overrides_dates ON availability_overrides(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_available ON availability_overrides(is_available);
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

-- Add constraint to ensure end_date >= start_date
ALTER TABLE availability_overrides
ADD CONSTRAINT check_date_range CHECK (end_date >= start_date);

-- Comments for documentation
COMMENT ON TABLE availability_overrides IS 'Manual date blocks for calendar availability';
COMMENT ON COLUMN availability_overrides.start_date IS 'Start date of unavailable period';
COMMENT ON COLUMN availability_overrides.end_date IS 'End date of unavailable period';
COMMENT ON COLUMN availability_overrides.is_available IS 'Whether dates are available (false = blocked/unavailable)';
COMMENT ON COLUMN availability_overrides.reason IS 'Reason for blocking (e.g., vacation, holiday)';
COMMENT ON COLUMN availability_overrides.override_type IS 'Type of override (e.g., manual, automatic)';
COMMENT ON COLUMN availability_overrides.notes IS 'Optional detailed description';
COMMENT ON COLUMN availability_overrides.created_by IS 'Admin user who created the override';
