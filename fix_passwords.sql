-- ============================================================================
-- CRITICAL PASSWORD FIX - SQL Update Script
-- ============================================================================
-- This script fixes the plain text passwords in the users table by replacing
-- them with properly bcrypt-hashed versions.
--
-- ISSUE: password_hash column contains plain text passwords
--        - admin@elitesportsdj.com has "admin123" (plain text)
--        - cohenmcleod@ymail.com has "Holdfast@1!" (plain text)
--
-- FIX: Update with bcrypt hashes of the same passwords
--
-- HOW TO RUN:
-- Option 1: Railway Dashboard
--   1. Go to Railway > Postgres > Data tab
--   2. Click "Connect" or open query console
--   3. Copy and paste this entire script
--   4. Execute
--
-- Option 2: Railway CLI
--   railway connect postgres
--   \i /path/to/fix_passwords.sql
--
-- ============================================================================

-- Show current state (BEFORE)
SELECT 'BEFORE UPDATE:' as status;
SELECT id, email, password_hash, updated_at
FROM users
ORDER BY id;

-- Update admin@elitesportsdj.com
-- Original password: admin123
-- Bcrypt hash generated with cost factor 10
UPDATE users 
SET password_hash = '$2b$10$crsGaWgVkvEpUX1KBfP61O7xUMexftkyNYpWOsuuAcAnxXcxbx4w6',
    updated_at = NOW()
WHERE email = 'admin@elitesportsdj.com';

-- Update cohenmcleod@ymail.com
-- Original password: Holdfast@1!
-- Bcrypt hash generated with cost factor 10
UPDATE users 
SET password_hash = '$2b$10$6x0Ej79fJTPiR1apY19I5.d59fwBIh3VhiD2GXWT1yJ0aQBhvn0vG',
    updated_at = NOW()
WHERE email = 'cohenmcleod@ymail.com';

-- Show updated state (AFTER)
SELECT 'AFTER UPDATE:' as status;
SELECT id, 
       email, 
       SUBSTRING(password_hash, 1, 10) as hash_start,
       LENGTH(password_hash) as hash_length,
       updated_at
FROM users
ORDER BY id;

-- Verification
-- Both password_hash values should:
-- 1. Start with $2b$10$
-- 2. Be exactly 60 characters long
-- 3. Look like random characters (not plain text)

SELECT 'VERIFICATION:' as status;
SELECT 
    email,
    CASE 
        WHEN password_hash ~ '^\$2[aby]\$\d{2}\$' THEN '✓ Valid bcrypt hash'
        ELSE '✗ NOT a bcrypt hash - PROBLEM!'
    END as hash_status,
    LENGTH(password_hash) as length
FROM users
ORDER BY id;
