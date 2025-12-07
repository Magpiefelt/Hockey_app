/**
 * Database Helper Utilities
 * Enhanced query execution with logging and error handling
 */
import { query as rawQuery, transaction as rawTransaction } from '../db/connection'
import { DatabaseError } from './errors'
import { logger } from './logger'

/**
 * Execute query with logging and error handling
 */
export async function executeQuery<T = any>(
  sql: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const startTime = Date.now()
  
  try {
    const result = await rawQuery(sql, params)
    const duration = Date.now() - startTime
    
    logger.query(sql, params, duration)
    
    if (duration > 1000) {
      logger.warn('Slow query detected', { sql, duration })
    }
    
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0
    }
  } catch (error: any) {
    logger.error('Database query failed', error, { sql, params })
    throw new DatabaseError('Database query failed', error)
  }
}

/**
 * Execute query and return single row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const result = await executeQuery<T>(sql, params)
  return result.rows[0] || null
}

/**
 * Execute query and return all rows
 */
export async function queryMany<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const result = await executeQuery<T>(sql, params)
  return result.rows
}

/**
 * Execute query and return first row or throw if not found
 */
export async function queryOneOrFail<T = any>(
  sql: string,
  params?: any[],
  errorMessage: string = 'Record not found'
): Promise<T> {
  const result = await queryOne<T>(sql, params)
  
  if (!result) {
    throw new DatabaseError(errorMessage)
  }
  
  return result
}

/**
 * Execute transaction with error handling
 */
export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await rawTransaction(callback)
    const duration = Date.now() - startTime
    
    logger.debug('Transaction completed', { duration })
    
    return result
  } catch (error: any) {
    logger.error('Transaction failed', error)
    throw new DatabaseError('Transaction failed', error)
  }
}

/**
 * Build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  startParamIndex: number = 1
): { clause: string; params: any[]; nextIndex: number } {
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = startParamIndex
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // IN clause
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ')
        conditions.push(`${key} IN (${placeholders})`)
        params.push(...value)
      } else if (typeof value === 'string' && value.includes('%')) {
        // LIKE clause
        conditions.push(`${key} LIKE $${paramIndex++}`)
        params.push(value)
      } else {
        // Equality
        conditions.push(`${key} = $${paramIndex++}`)
        params.push(value)
      }
    }
  }
  
  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  
  return { clause, params, nextIndex: paramIndex }
}

/**
 * Build pagination clause
 */
export function buildPaginationClause(
  page: number = 1,
  pageSize: number = 50
): { limit: number; offset: number; clause: string } {
  const validPage = Math.max(1, Math.floor(page))
  const validPageSize = Math.min(Math.max(1, Math.floor(pageSize)), 100)
  const offset = (validPage - 1) * validPageSize
  
  return {
    limit: validPageSize,
    offset,
    clause: `LIMIT ${validPageSize} OFFSET ${offset}`
  }
}

/**
 * Build ORDER BY clause
 */
export function buildOrderByClause(
  orderBy?: string,
  direction: 'ASC' | 'DESC' = 'DESC'
): string {
  if (!orderBy) return ''
  
  // Sanitize column name (allow only alphanumeric and underscore)
  const sanitized = orderBy.replace(/[^a-zA-Z0-9_.]/g, '')
  if (!sanitized) return ''
  
  return `ORDER BY ${sanitized} ${direction}`
}

/**
 * Count total records for pagination
 */
export async function countRecords(
  table: string,
  whereClause: string = '',
  params: any[] = []
): Promise<number> {
  const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`
  const result = await queryOne<{ count: string }>(sql, params)
  return parseInt(result?.count || '0', 10)
}

/**
 * Check if record exists
 */
export async function recordExists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  const sql = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${column} = $1) as exists`
  const result = await queryOne<{ exists: boolean }>(sql, [value])
  return result?.exists || false
}

/**
 * Batch insert helper
 */
export async function batchInsert<T extends Record<string, any>>(
  table: string,
  records: T[]
): Promise<void> {
  if (records.length === 0) return
  
  const columns = Object.keys(records[0])
  const values: any[] = []
  const valuePlaceholders: string[] = []
  
  let paramIndex = 1
  for (const record of records) {
    const rowPlaceholders = columns.map(() => `$${paramIndex++}`).join(', ')
    valuePlaceholders.push(`(${rowPlaceholders})`)
    values.push(...columns.map(col => record[col]))
  }
  
  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${valuePlaceholders.join(', ')}
  `
  
  await executeQuery(sql, values)
}
