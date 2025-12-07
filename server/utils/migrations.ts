/**
 * Database Migration Utility
 * Handles database schema migrations
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { query } from '../db/connection'
import { logger } from './logger'

interface Migration {
  id: number
  name: string
  filename: string
  sql: string
  appliedAt?: Date
}

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
 * Get list of migration files
 */
async function getMigrationFiles(): Promise<Migration[]> {
  const migrationsDir = join(process.cwd(), 'database', 'migrations')
  
  try {
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort()
    
    const migrations: Migration[] = []
    
    for (const filename of sqlFiles) {
      const filePath = join(migrationsDir, filename)
      const sql = await readFile(filePath, 'utf-8')
      
      // Extract migration name from filename (e.g., "001_initial_schema.sql" -> "initial_schema")
      const match = filename.match(/^(\d+)_(.+)\.sql$/)
      if (!match) {
        logger.warn(`Skipping invalid migration filename: ${filename}`)
        continue
      }
      
      const [, idStr, name] = match
      migrations.push({
        id: parseInt(idStr),
        name,
        filename,
        sql
      })
    }
    
    return migrations
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.warn('Migrations directory not found')
      return []
    }
    throw error
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations() {
  logger.info('Starting database migrations')
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable()
    
    // Get applied and available migrations
    const appliedMigrations = await getAppliedMigrations()
    const allMigrations = await getMigrationFiles()
    
    // Filter pending migrations
    const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m.name))
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations')
      return { applied: 0, skipped: allMigrations.length }
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`)
    
    let appliedCount = 0
    
    for (const migration of pendingMigrations) {
      logger.info(`Applying migration: ${migration.filename}`)
      
      try {
        // Begin transaction
        await query('BEGIN')
        
        // Run migration SQL
        await query(migration.sql)
        
        // Record migration
        await query(
          `INSERT INTO schema_migrations (name, filename) VALUES ($1, $2)`,
          [migration.name, migration.filename]
        )
        
        // Commit transaction
        await query('COMMIT')
        
        logger.info(`✓ Applied migration: ${migration.filename}`)
        appliedCount++
      } catch (error: any) {
        // Rollback on error
        await query('ROLLBACK')
        logger.error(`Failed to apply migration: ${migration.filename}`, error)
        throw new Error(`Migration failed: ${migration.filename} - ${error.message}`)
      }
    }
    
    logger.info(`Successfully applied ${appliedCount} migrations`)
    return { applied: appliedCount, skipped: allMigrations.length - appliedCount }
    
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
    const allMigrations = await getMigrationFiles()
    
    const status = allMigrations.map(m => ({
      id: m.id,
      name: m.name,
      filename: m.filename,
      applied: appliedMigrations.has(m.name)
    }))
    
    return {
      total: allMigrations.length,
      applied: appliedMigrations.size,
      pending: allMigrations.length - appliedMigrations.size,
      migrations: status
    }
  } catch (error: any) {
    logger.error('Failed to get migration status', error)
    throw error
  }
}

/**
 * Rollback last migration
 */
export async function rollbackMigration() {
  logger.warn('Rolling back last migration')
  
  try {
    // Get last applied migration
    const result = await query(
      'SELECT name, filename FROM schema_migrations ORDER BY id DESC LIMIT 1'
    )
    
    if (result.rows.length === 0) {
      logger.info('No migrations to rollback')
      return { rolledBack: false, message: 'No migrations applied' }
    }
    
    const lastMigration = result.rows[0]
    
    // Check for rollback file
    const rollbackFilename = lastMigration.filename.replace('.sql', '.rollback.sql')
    const rollbackPath = join(process.cwd(), 'database', 'migrations', rollbackFilename)
    
    try {
      const rollbackSql = await readFile(rollbackPath, 'utf-8')
      
      // Begin transaction
      await query('BEGIN')
      
      // Run rollback SQL
      await query(rollbackSql)
      
      // Remove migration record
      await query('DELETE FROM schema_migrations WHERE name = $1', [lastMigration.name])
      
      // Commit transaction
      await query('COMMIT')
      
      logger.info(`✓ Rolled back migration: ${lastMigration.filename}`)
      return { rolledBack: true, migration: lastMigration.filename }
      
    } catch (error: any) {
      await query('ROLLBACK')
      
      if (error.code === 'ENOENT') {
        throw new Error(`Rollback file not found: ${rollbackFilename}`)
      }
      
      throw error
    }
  } catch (error: any) {
    logger.error('Rollback failed', error)
    throw error
  }
}
