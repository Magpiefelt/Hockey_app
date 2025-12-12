-- Migration: Add form_submissions table and migrate away from requirements_json
-- Date: 2025-12-11
-- Description: Restructure data model to use proper relational structure instead of JSON blob

-- ============================================
-- Step 1: Create the new form_submissions table
-- ============================================

CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  team_name VARCHAR(100),
  roster_method VARCHAR(20),
  roster_players JSONB,
  roster_file_id INTEGER,
  intro_song JSONB,
  warmup_songs JSONB,
  goal_horn JSONB,
  goal_song JSONB,
  win_song JSONB,
  sponsors JSONB,
  include_sample BOOLEAN DEFAULT FALSE,
  audio_files JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_quote_id ON form_submissions(quote_id);

-- ============================================
-- Step 2: Add new columns to quote_requests
-- ============================================

-- Add organization column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_requests' AND column_name = 'organization'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN organization VARCHAR(100);
  END IF;
END $$;

-- Add notes column if it doesn't exist (separate from admin_notes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_requests' AND column_name = 'notes'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN notes TEXT;
  END IF;
END $$;

-- ============================================
-- Step 3: Migrate existing data (if any)
-- ============================================

-- Migrate data from requirements_json to form_submissions table
-- This extracts structured data from the old JSON blob
INSERT INTO form_submissions (
  quote_id,
  team_name,
  roster_method,
  roster_players,
  intro_song,
  warmup_songs,
  goal_horn,
  goal_song,
  win_song,
  sponsors,
  include_sample,
  audio_files
)
SELECT 
  qr.id,
  qr.requirements_json->>'teamName',
  qr.requirements_json->'roster'->>'method',
  CASE 
    WHEN qr.requirements_json->'roster'->'players' IS NOT NULL 
    THEN qr.requirements_json->'roster'->'players'
    ELSE NULL
  END,
  CASE 
    WHEN qr.requirements_json->'introSong' IS NOT NULL 
    THEN qr.requirements_json->'introSong'
    ELSE NULL
  END,
  CASE 
    WHEN qr.requirements_json->'warmupSong1' IS NOT NULL 
       OR qr.requirements_json->'warmupSong2' IS NOT NULL
       OR qr.requirements_json->'warmupSong3' IS NOT NULL
    THEN jsonb_build_object(
      'song1', qr.requirements_json->'warmupSong1',
      'song2', qr.requirements_json->'warmupSong2',
      'song3', qr.requirements_json->'warmupSong3'
    )
    ELSE NULL
  END,
  qr.requirements_json->'goalHorn',
  qr.requirements_json->'goalSong',
  qr.requirements_json->'winSong',
  qr.requirements_json->'sponsors',
  COALESCE((qr.requirements_json->>'includeSample')::boolean, false),
  CASE 
    WHEN qr.requirements_json->'audioFiles' IS NOT NULL 
    THEN qr.requirements_json->'audioFiles'
    ELSE NULL
  END
FROM quote_requests qr
WHERE qr.requirements_json IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM form_submissions fs WHERE fs.quote_id = qr.id
  );

-- Migrate organization and notes from requirements_json to new columns
UPDATE quote_requests
SET 
  organization = requirements_json->>'organization',
  notes = requirements_json->>'message'
WHERE requirements_json IS NOT NULL
  AND (organization IS NULL OR notes IS NULL);

-- ============================================
-- Step 4: Remove requirements_json column
-- ============================================
-- Now that data is migrated, we can safely remove the old column
ALTER TABLE quote_requests DROP COLUMN IF EXISTS requirements_json;

-- ============================================
-- Rollback Instructions
-- ============================================
-- To rollback this migration, run:
-- ALTER TABLE quote_requests ADD COLUMN requirements_json JSONB;
-- DROP TABLE IF EXISTS form_submissions CASCADE;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS organization;
-- ALTER TABLE quote_requests DROP COLUMN IF EXISTS notes;
-- Then restore from backup to repopulate requirements_json
