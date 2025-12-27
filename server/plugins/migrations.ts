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
    // Don't crash the app, just log the error
    // The app might still work if the migration is not critical
  }
})
