-- ============================================================================
-- Migration 015: Add Package Display Fields
-- ============================================================================
-- Purpose: Adds columns to the packages table that control how packages
--          appear on the public-facing home page. This migration enables
--          the admin "Edit Packages" feature to fully control the customer
--          experience.
--
-- Run this in PG Admin against your production database.
-- All statements use IF NOT EXISTS / IF EXISTS guards, so it is safe to
-- run more than once.
-- ============================================================================

BEGIN;

-- 0. Ensure the schema_migrations table exists (the app creates it automatically,
--    but if you're running this manually before the app has ever started, it may not exist yet).
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  checksum VARCHAR(64)
);

-- 1. display_order — controls the order cards appear on the home page
--    Lower numbers appear first. Default 0 so existing rows sort together.
ALTER TABLE packages ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. badge_text — admin-editable label shown on non-popular cards
--    Examples: "BEST VALUE", "BEST FOR SMALL TEAMS", "NEW"
--    NULL means no badge is shown.
ALTER TABLE packages ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50);

-- 3. is_visible — allows hiding packages from the public site without deleting
--    Hidden packages remain in the database and can be re-enabled at any time.
ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. price_suffix — the text shown after the price on cards
--    Examples: "/game", "/event", "/season"
ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_suffix VARCHAR(30) DEFAULT '/game';

-- 5. Backfill display_order for known packages so they appear in the
--    correct order immediately after migration.
UPDATE packages SET display_order = 1 WHERE slug = 'player-intros-basic'    AND (display_order IS NULL OR display_order = 0);
UPDATE packages SET display_order = 2 WHERE slug = 'player-intros-warmup'   AND (display_order IS NULL OR display_order = 0);
UPDATE packages SET display_order = 3 WHERE slug = 'player-intros-ultimate' AND (display_order IS NULL OR display_order = 0);
UPDATE packages SET display_order = 4 WHERE slug = 'game-day-dj'            AND (display_order IS NULL OR display_order = 0);
UPDATE packages SET display_order = 5 WHERE slug = 'event-hosting'          AND (display_order IS NULL OR display_order = 0);

-- 6. Backfill badge_text for packages that had hardcoded badges on the
--    home page prior to this change.
UPDATE packages SET badge_text = 'BEST FOR SMALL TEAMS' WHERE slug = 'player-intros-basic'    AND badge_text IS NULL;
UPDATE packages SET badge_text = 'BEST VALUE'           WHERE slug = 'player-intros-ultimate' AND badge_text IS NULL;

-- 7. Hide Game Day DJ and Event Hosting from the public packages section.
--    These are already shown in the "Our Services" section above on the home page.
--    They remain in the database and can be re-enabled by the admin at any time.
UPDATE packages SET is_visible = FALSE WHERE slug IN ('game-day-dj', 'event-hosting');

-- 8. Indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_packages_display_order ON packages(display_order);
CREATE INDEX IF NOT EXISTS idx_packages_visible       ON packages(is_visible);

-- 9. Record this migration in the schema_migrations table so the app's
--    embedded migration runner does not attempt to re-run it.
INSERT INTO schema_migrations (name, filename)
VALUES ('add_package_display_fields', '015_add_package_display_fields.sql')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ============================================================================
-- Verification query — run this after the migration to confirm it worked:
--
--   SELECT slug, name, display_order, badge_text, is_visible, price_suffix
--   FROM packages
--   ORDER BY display_order ASC;
--
-- Expected output:
--   player-intros-basic    | Package #1 - Basic Package    | 1 | BEST FOR SMALL TEAMS | t | /game
--   player-intros-warmup   | Package #2 - Warmup Package   | 2 | NULL                 | t | /game
--   player-intros-ultimate | Package #3 - Ultimate Package | 3 | BEST VALUE           | t | /game
--   game-day-dj            | Game Day DJ Service           | 4 | NULL                 | f | /game
--   event-hosting          | Event Hosting & MC Services   | 5 | NULL                 | f | /game
-- ============================================================================
