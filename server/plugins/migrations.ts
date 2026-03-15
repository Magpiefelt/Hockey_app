/**
 * Server Plugin: Auto-run migrations on startup
 * This ensures database schema is always up to date
 */

import { runMigrations } from '../utils/migrations'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('[Migrations Plugin] Starting automatic migrations...')
  
  try {
    const result = await runMigrations()
    console.log(`[Migrations Plugin] Migrations complete: ${result.applied} applied, ${result.skipped} skipped`)
  } catch (error: any) {
    console.error('[Migrations Plugin] Migration failed:', error.message)
    // Fail fast in production to avoid running against a partially migrated schema.
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
})
