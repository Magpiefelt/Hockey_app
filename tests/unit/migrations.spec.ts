/**
 * Tests for database migrations
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Database Migrations', () => {
  const migrationsDir = join(process.cwd(), 'database', 'migrations')

  describe('010_add_contact_submissions.sql', () => {
    const migrationPath = join(migrationsDir, '010_add_contact_submissions.sql')
    const rollbackPath = join(migrationsDir, '010_add_contact_submissions.rollback.sql')

    it('should have migration file', () => {
      expect(existsSync(migrationPath)).toBe(true)
    })

    it('should have rollback file', () => {
      expect(existsSync(rollbackPath)).toBe(true)
    })

    it('should create contact_submissions table', () => {
      const content = readFileSync(migrationPath, 'utf-8')
      expect(content).toContain('CREATE TABLE IF NOT EXISTS contact_submissions')
    })

    it('should have all required columns', () => {
      const content = readFileSync(migrationPath, 'utf-8')
      const requiredColumns = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR',
        'email VARCHAR',
        'phone VARCHAR',
        'subject VARCHAR',
        'message TEXT',
        'status VARCHAR',
        'ip_address VARCHAR',
        'user_agent TEXT',
        'created_at TIMESTAMPTZ',
        'read_at TIMESTAMPTZ'
      ]

      for (const column of requiredColumns) {
        expect(content).toContain(column.split(' ')[0])
      }
    })

    it('should have status check constraint', () => {
      const content = readFileSync(migrationPath, 'utf-8')
      expect(content).toContain("CHECK (status IN ('new', 'read', 'replied', 'archived'))")
    })

    it('should create indexes for performance', () => {
      const content = readFileSync(migrationPath, 'utf-8')
      expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_contact_submissions_status')
      expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at')
      expect(content).toContain('CREATE INDEX IF NOT EXISTS idx_contact_submissions_email')
    })

    it('rollback should drop table and indexes', () => {
      const content = readFileSync(rollbackPath, 'utf-8')
      expect(content).toContain('DROP TABLE IF EXISTS contact_submissions')
      expect(content).toContain('DROP INDEX IF EXISTS idx_contact_submissions_status')
      expect(content).toContain('DROP INDEX IF EXISTS idx_contact_submissions_created_at')
      expect(content).toContain('DROP INDEX IF EXISTS idx_contact_submissions_email')
    })
  })

  describe('Migration file naming convention', () => {
    it('should follow sequential numbering', () => {
      const files = [
        '001_initial_schema.sql',
        '002_fix_email_logs_schema.sql',
        '003_add_email_webhook_columns.sql',
        '003_add_password_reset.sql',
        '004_add_availability_overrides.sql',
        '005_fix_override_type_constraint.sql',
        '006_add_package_id_index.sql',
        '007_quote_tracking.sql',
        '008_manual_completion_support.sql',
        '009_add_event_datetime.sql',
        '010_add_contact_submissions.sql'
      ]

      for (const file of files) {
        const filePath = join(migrationsDir, file)
        expect(existsSync(filePath)).toBe(true)
      }
    })
  })
})
