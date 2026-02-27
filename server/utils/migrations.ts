/**
 * Database Migration Utility
 * Handles database schema migrations with embedded SQL
 * 
 * FIXED: Migrations are now embedded directly in code instead of reading from
 * the filesystem. This ensures they work in production where the Nuxt build
 * output (.output/server/index.mjs) does not include the database/migrations/ directory.
 */

import { query } from '../db/connection'
import { logger } from './logger'

interface EmbeddedMigration {
  id: number
  name: string
  filename: string
  sql: string
}

/**
 * All migrations embedded directly in code.
 * These match the files in database/migrations/ but are available at runtime
 * without filesystem access.
 */
const EMBEDDED_MIGRATIONS: EmbeddedMigration[] = [
  {
    id: 2,
    name: 'fix_email_logs_schema',
    filename: '002_fix_email_logs_schema.sql',
    sql: `
      -- Add new columns alongside old ones (don't rename to avoid breaking existing data)
      ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS to_email VARCHAR(120);
      ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS template VARCHAR(50);
      ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS metadata_json JSONB;
      
      -- Backfill new columns from old columns
      UPDATE email_logs SET to_email = recipient_email WHERE to_email IS NULL AND recipient_email IS NOT NULL;
      UPDATE email_logs SET template = email_type WHERE template IS NULL AND email_type IS NOT NULL;
      
      -- Create index on new column
      CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
    `
  },
  {
    id: 4,
    name: 'add_availability_overrides_extras',
    filename: '004_add_availability_overrides.sql',
    sql: `
      -- availability_overrides table already exists from initial setup
      -- Just ensure the constraint exists
      ALTER TABLE availability_overrides 
        DROP CONSTRAINT IF EXISTS availability_overrides_override_type_check;
      ALTER TABLE availability_overrides 
        ADD CONSTRAINT availability_overrides_override_type_check 
        CHECK (override_type IS NULL OR override_type IN ('manual', 'blocked', 'available', 'busy', 'vacation', 'holiday', 'booking'));
    `
  },
  {
    id: 6,
    name: 'add_package_id_index',
    filename: '006_add_package_id_index.sql',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_quote_requests_package_id ON quote_requests(package_id);
      CREATE INDEX IF NOT EXISTS idx_quote_requests_status_package ON quote_requests(status, package_id);
    `
  },
  {
    id: 7,
    name: 'quote_tracking',
    filename: '007_quote_tracking.sql',
    sql: `
      -- Add quote tracking fields to quote_requests
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS quote_viewed_at TIMESTAMPTZ;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS quote_accepted_at TIMESTAMPTZ;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS quote_expires_at TIMESTAMPTZ;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS current_quote_version INTEGER DEFAULT 1;

      -- Update status constraint to include new statuses
      ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;
      ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_status_check 
        CHECK (status IN ('pending', 'submitted', 'in_progress', 'quoted', 'quote_viewed', 'quote_accepted', 'invoiced', 'paid', 'completed', 'cancelled', 'delivered'));

      -- Create quote events table
      CREATE TABLE IF NOT EXISTS quote_events (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('viewed', 'accepted', 'declined', 'expired', 'reminder_sent', 'payment_started')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON quote_events(quote_id);
      CREATE INDEX IF NOT EXISTS idx_quote_events_type ON quote_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_quote_events_created_at ON quote_events(created_at DESC);

      -- Create quote revisions table
      CREATE TABLE IF NOT EXISTS quote_revisions (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        amount_cents INTEGER NOT NULL,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_quote_revisions_quote_id ON quote_revisions(quote_id);

      -- Create index for faster customer lookups
      CREATE INDEX IF NOT EXISTS idx_quote_requests_contact_email ON quote_requests(contact_email);
    `
  },
  {
    id: 8,
    name: 'manual_completion_support',
    filename: '008_manual_completion_support.sql',
    sql: `
      -- payment_method column already exists in production, just ensure constraint
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'payments' AND column_name = 'payment_method'
        ) THEN
          ALTER TABLE payments ADD COLUMN payment_method VARCHAR(20) DEFAULT 'stripe';
        END IF;
      END $$;

      -- completed_by and completed_at already exist in production
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
      
      CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
      CREATE INDEX IF NOT EXISTS idx_quote_requests_completed_by ON quote_requests(completed_by);
      
      -- Update manual payments
      UPDATE payments SET payment_method = 'manual' 
        WHERE stripe_payment_id LIKE 'manual_%' AND (payment_method IS NULL OR payment_method = 'stripe');
    `
  },
  {
    id: 9,
    name: 'add_event_datetime',
    filename: '009_add_event_datetime.sql',
    sql: `
      -- Add event datetime columns
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS event_time TIME;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS event_datetime TIMESTAMPTZ;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS admin_confirmed_datetime BOOLEAN DEFAULT FALSE;

      -- Add tax tracking columns
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0;
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS tax_province VARCHAR(2) DEFAULT 'AB';
      ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER;

      -- Migrate existing event_date data
      UPDATE quote_requests 
        SET event_datetime = (event_date::timestamp + TIME '12:00:00') AT TIME ZONE 'America/Edmonton'
        WHERE event_date IS NOT NULL AND event_datetime IS NULL;

      CREATE INDEX IF NOT EXISTS idx_quote_requests_event_datetime ON quote_requests(event_datetime);

      -- Ensure override_type can handle 'booking' type
      ALTER TABLE availability_overrides DROP CONSTRAINT IF EXISTS availability_overrides_override_type_check;
      ALTER TABLE availability_overrides ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES quote_requests(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_availability_overrides_order_id ON availability_overrides(order_id);
    `
  },
  {
    id: 11,
    name: 'add_settings_table',
    filename: '011_add_settings_table.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

      INSERT INTO settings (key, value, description) VALUES
        ('tax_settings', '{"defaultProvince": "AB", "autoApplyTax": true, "includeInPrice": false, "roundingMethod": "standard"}', 'Tax calculation settings'),
        ('invoice_settings', '{"companyName": "Elite Sports DJ", "companyAddress": "Calgary, Alberta, Canada", "companyPhone": "", "companyEmail": "info@elitesportsdj.com", "paymentTermsDays": 14, "invoicePrefix": "INV-", "nextInvoiceNumber": 1001, "defaultNotes": "Thank you for your business! Payment is due within 14 days.", "autoSendOnQuoteAccept": true}', 'Invoice generation settings'),
        ('reminder_settings', '{"daysBefore": [7, 3, 1], "daysAfter": [1, 3, 7, 14], "maxReminders": 6}', 'Payment reminder schedule settings'),
        ('business_info', '{"businessName": "Elite Sports DJ", "businessNumber": "", "gstNumber": "", "address": "Calgary, AB", "phone": "", "email": "info@elitesportsdj.com"}', 'Business information for invoices and reports')
      ON CONFLICT (key) DO NOTHING;
    `
  },
  {
    id: 12,
    name: 'add_password_reset',
    filename: '012_add_password_reset.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    `
  },
  {
    id: 10,
    name: 'add_contact_submissions',
    filename: '010_add_contact_submissions.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) NOT NULL,
        phone VARCHAR(30),
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        read_at TIMESTAMPTZ,
        replied_at TIMESTAMPTZ,
        admin_notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
    `
  },
  {
    id: 13,
    name: 'add_quote_access_tokens',
    filename: '013_add_quote_access_tokens.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS quote_access_tokens (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(quote_id)
      );
      CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_quote_id ON quote_access_tokens(quote_id);
      CREATE INDEX IF NOT EXISTS idx_quote_access_tokens_expires_at ON quote_access_tokens(expires_at);
    `
  },
  {
    id: 14,
    name: 'add_form_submissions',
    filename: '014_add_form_submissions.sql',
    sql: `
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

      -- Add notes column if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quote_requests' AND column_name = 'notes'
        ) THEN
          ALTER TABLE quote_requests ADD COLUMN notes TEXT;
        END IF;
      END $$;
    `
  },
  {
    id: 15,
    name: 'add_package_display_fields',
    filename: '015_add_package_display_fields.sql',
    sql: `
      -- Add display_order for controlling the order packages appear on the home page
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

      -- Add badge_text for contextual badges shown on the home page cards (e.g. "BEST VALUE")
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50);

      -- Add is_visible to allow hiding packages from the public site without deleting them
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

      -- Add price_suffix for the text shown after the price (e.g. "/game", "/event")
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_suffix VARCHAR(30) DEFAULT '/game';

      -- Backfill display_order for existing packages
      UPDATE packages SET display_order = 1 WHERE slug = 'player-intros-basic' AND display_order = 0;
      UPDATE packages SET display_order = 2 WHERE slug = 'player-intros-warmup' AND display_order = 0;
      UPDATE packages SET display_order = 3 WHERE slug = 'player-intros-ultimate' AND display_order = 0;
      UPDATE packages SET display_order = 4 WHERE slug = 'game-day-dj' AND display_order = 0;
      UPDATE packages SET display_order = 5 WHERE slug = 'event-hosting' AND display_order = 0;

      -- Backfill badge_text for existing packages
      UPDATE packages SET badge_text = 'BEST FOR SMALL TEAMS' WHERE slug = 'player-intros-basic' AND badge_text IS NULL;
      UPDATE packages SET badge_text = 'BEST VALUE' WHERE slug = 'player-intros-ultimate' AND badge_text IS NULL;

      -- Hide Game Day DJ and Event Hosting from the public packages section
      -- (they are already shown in the "Our Services" section on the home page)
      UPDATE packages SET is_visible = FALSE WHERE slug IN ('game-day-dj', 'event-hosting');

      CREATE INDEX IF NOT EXISTS idx_packages_display_order ON packages(display_order);
      CREATE INDEX IF NOT EXISTS idx_packages_visible ON packages(is_visible);
    `
  }
]

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
      checksum VARCHAR(64)
    )
  `)
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await query('SELECT name FROM schema_migrations ORDER BY id')
  return new Set(result.rows.map(row => row.name))
}

/**
 * Run pending migrations
 */
export async function runMigrations() {
  logger.info('Starting database migrations (embedded)')
  
  try {
    await ensureMigrationsTable()
    
    const appliedMigrations = await getAppliedMigrations()
    const pendingMigrations = EMBEDDED_MIGRATIONS.filter(m => !appliedMigrations.has(m.name))
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations')
      return { applied: 0, skipped: EMBEDDED_MIGRATIONS.length }
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`)
    
    let appliedCount = 0
    
    for (const migration of pendingMigrations) {
      logger.info(`Applying migration: ${migration.filename}`)
      
      try {
        await query('BEGIN')
        await query(migration.sql)
        await query(
          `INSERT INTO schema_migrations (name, filename) VALUES ($1, $2)`,
          [migration.name, migration.filename]
        )
        await query('COMMIT')
        
        logger.info(`✓ Applied migration: ${migration.filename}`)
        appliedCount++
      } catch (error: any) {
        await query('ROLLBACK')
        logger.error(`Failed to apply migration: ${migration.filename}`, error)
        // Don't throw - continue with other migrations
        logger.warn(`Skipping failed migration: ${migration.filename} - ${error.message}`)
      }
    }
    
    logger.info(`Successfully applied ${appliedCount} migrations`)
    return { applied: appliedCount, skipped: EMBEDDED_MIGRATIONS.length - appliedCount }
    
  } catch (error: any) {
    logger.error('Migration process failed', error)
    throw error
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus() {
  try {
    await ensureMigrationsTable()
    
    const appliedMigrations = await getAppliedMigrations()
    
    const status = EMBEDDED_MIGRATIONS.map(m => ({
      id: m.id,
      name: m.name,
      filename: m.filename,
      applied: appliedMigrations.has(m.name)
    }))
    
    return {
      total: EMBEDDED_MIGRATIONS.length,
      applied: appliedMigrations.size,
      pending: EMBEDDED_MIGRATIONS.length - appliedMigrations.size,
      migrations: status
    }
  } catch (error: any) {
    logger.error('Failed to get migration status', error)
    throw error
  }
}

/**
 * Rollback last migration (kept for compatibility)
 */
export async function rollbackMigration() {
  logger.warn('Rollback not supported for embedded migrations')
  return { rolledBack: false, message: 'Rollback not supported for embedded migrations' }
}
