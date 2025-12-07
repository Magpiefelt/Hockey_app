/**
 * Query Optimization Utility
 * Provides utilities for optimizing database queries
 */

import { query } from '../db/connection'
import { logger } from './logger'

/**
 * Analyze query performance
 */
export async function analyzeQuery(sql: string, params?: any[]) {
  try {
    const explainResult = await query(`EXPLAIN ANALYZE ${sql}`, params)
    
    const plan = explainResult.rows.map(row => row['QUERY PLAN']).join('\n')
    
    logger.info('Query analysis', {
      query: sql.substring(0, 100),
      plan: plan.substring(0, 500)
    })
    
    return plan
  } catch (error: any) {
    logger.error('Query analysis failed', error)
    throw error
  }
}

/**
 * Get slow queries from PostgreSQL logs
 */
export async function getSlowQueries(limit: number = 10) {
  try {
    const result = await query(`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT $1
    `, [limit])
    
    return result.rows
  } catch (error: any) {
    // pg_stat_statements extension might not be installed
    logger.warn('Could not retrieve slow queries - pg_stat_statements may not be enabled')
    return []
  }
}

/**
 * Get table statistics
 */
export async function getTableStats(tableName?: string) {
  try {
    const whereClause = tableName ? `WHERE schemaname = 'public' AND relname = $1` : `WHERE schemaname = 'public'`
    const params = tableName ? [tableName] : []
    
    const result = await query(`
      SELECT 
        schemaname,
        relname as table_name,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ${whereClause}
      ORDER BY n_live_tup DESC
    `, params)
    
    return result.rows
  } catch (error: any) {
    logger.error('Failed to get table stats', error)
    return []
  }
}

/**
 * Get index usage statistics
 */
export async function getIndexStats(tableName?: string) {
  try {
    const whereClause = tableName ? `WHERE schemaname = 'public' AND tablename = $1` : `WHERE schemaname = 'public'`
    const params = tableName ? [tableName] : []
    
    const result = await query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ${whereClause}
      ORDER BY idx_scan DESC
    `, params)
    
    return result.rows
  } catch (error: any) {
    logger.error('Failed to get index stats', error)
    return []
  }
}

/**
 * Find missing indexes
 */
export async function findMissingIndexes() {
  try {
    const result = await query(`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.1
      ORDER BY n_distinct DESC
      LIMIT 20
    `)
    
    return result.rows
  } catch (error: any) {
    logger.error('Failed to find missing indexes', error)
    return []
  }
}

/**
 * Get database size information
 */
export async function getDatabaseSize() {
  try {
    const result = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT pg_size_pretty(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint)
         FROM pg_tables
         WHERE schemaname = 'public') as tables_size,
        (SELECT pg_size_pretty(SUM(pg_indexes_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint)
         FROM pg_tables
         WHERE schemaname = 'public') as indexes_size
    `)
    
    return result.rows[0]
  } catch (error: any) {
    logger.error('Failed to get database size', error)
    return null
  }
}

/**
 * Vacuum analyze table
 */
export async function vacuumAnalyze(tableName?: string) {
  try {
    const sql = tableName ? `VACUUM ANALYZE ${tableName}` : 'VACUUM ANALYZE'
    await query(sql)
    
    logger.info('Vacuum analyze completed', { tableName: tableName || 'all tables' })
    return true
  } catch (error: any) {
    logger.error('Vacuum analyze failed', error, { tableName })
    return false
  }
}

/**
 * Get connection statistics
 */
export async function getConnectionStats() {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        MAX(EXTRACT(EPOCH FROM (now() - query_start))) as longest_query_seconds
      FROM pg_stat_activity
      WHERE datname = current_database()
    `)
    
    return result.rows[0]
  } catch (error: any) {
    logger.error('Failed to get connection stats', error)
    return null
  }
}

/**
 * Generate performance report
 */
export async function generatePerformanceReport() {
  logger.info('Generating performance report...')
  
  const report: any = {
    timestamp: new Date().toISOString(),
    database: {},
    tables: [],
    indexes: [],
    slowQueries: [],
    connections: {}
  }
  
  try {
    // Database size
    report.database = await getDatabaseSize()
    
    // Table statistics
    report.tables = await getTableStats()
    
    // Index statistics
    report.indexes = await getIndexStats()
    
    // Slow queries
    report.slowQueries = await getSlowQueries(10)
    
    // Connection stats
    report.connections = await getConnectionStats()
    
    logger.info('Performance report generated successfully')
    return report
  } catch (error: any) {
    logger.error('Failed to generate performance report', error)
    throw error
  }
}
