/**
 * Resilient query helpers for handling schema evolution.
 *
 * Many queries need to gracefully degrade when newer columns or tables
 * don't exist yet (e.g. form_submissions, quote_viewed_at,
 * current_quote_version, tax_province). Instead of duplicating try/catch
 * blocks in every router, use these wrappers.
 */

import { query } from '../db/connection'
import type { QueryResult } from 'pg'

/** PostgreSQL error codes for missing column / missing table */
const UNDEFINED_COLUMN = '42703'
const UNDEFINED_TABLE = '42P01'

function isSchemaError(err: any): boolean {
  return err?.code === UNDEFINED_COLUMN || err?.code === UNDEFINED_TABLE
}

interface QuerySpec {
  sql: string
  params?: any[]
}

/**
 * Execute `primary` query; if it fails with a missing-column or
 * missing-table error, transparently retry with `fallback`.
 *
 * If `fallback` is an array, each entry is tried in order until one
 * succeeds or a non-schema error is thrown.
 */
export async function queryWithFallback<T extends Record<string, any> = any>(
  primary: QuerySpec,
  fallback: QuerySpec | QuerySpec[]
): Promise<QueryResult<T>> {
  try {
    return await query<T>(primary.sql, primary.params)
  } catch (err: any) {
    if (!isSchemaError(err)) throw err

    const fallbacks = Array.isArray(fallback) ? fallback : [fallback]
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        return await query<T>(fallbacks[i].sql, fallbacks[i].params)
      } catch (innerErr: any) {
        if (i === fallbacks.length - 1 || !isSchemaError(innerErr)) {
          throw innerErr
        }
      }
    }
    throw err
  }
}

/**
 * Run a query that may fail because the target table or columns don't
 * exist yet. Returns `null` instead of throwing.
 */
export async function querySafe<T extends Record<string, any> = any>(
  sql: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  try {
    return await query<T>(sql, params)
  } catch (err: any) {
    if (isSchemaError(err)) return null
    throw err
  }
}
