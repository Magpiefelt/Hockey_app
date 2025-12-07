import { Pool, PoolClient, QueryResult } from 'pg'
import { logger } from '../utils/logger'

let pool: Pool | null = null
let poolStats = {
  totalQueries: 0,
  activeConnections: 0,
  errors: 0
}

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    const isProd = process.env.NODE_ENV === 'production'
    
    pool = new Pool({
      connectionString: config.databaseUrl || process.env.DATABASE_URL,
      max: isProd ? 50 : 20, // More connections in production
      min: isProd ? 5 : 2, // Maintain minimum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Increased timeout
      // Enable keep-alive for long-lived connections
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      // Statement timeout (30 seconds)
      statement_timeout: 30000,
      // Query timeout (30 seconds)
      query_timeout: 30000
    })

    // Error handler
    pool.on('error', (err, client) => {
      poolStats.errors++
      logger.error('Unexpected database pool error', err, {
        totalQueries: poolStats.totalQueries,
        activeConnections: poolStats.activeConnections
      })
    })
    
    // Connect event
    pool.on('connect', (client) => {
      poolStats.activeConnections++
      logger.debug('New database connection established', {
        activeConnections: poolStats.activeConnections
      })
    })
    
    // Remove event
    pool.on('remove', (client) => {
      poolStats.activeConnections--
      logger.debug('Database connection removed', {
        activeConnections: poolStats.activeConnections
      })
    })
    
    logger.info('Database connection pool initialized', {
      max: pool.options.max,
      min: pool.options.min
    })
  }

  return pool
}

/**
 * Execute a query with parameters
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool()
  poolStats.totalQueries++
  
  const startTime = Date.now()
  
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - startTime
    
    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        sql: text.substring(0, 200),
        duration,
        params: params?.length
      })
    }
    
    return result
  } catch (error: any) {
    poolStats.errors++
    logger.error('Query execution failed', error, {
      sql: text.substring(0, 200),
      params: params?.length
    })
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return pool.connect()
}

/**
 * Execute a function within a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  const startTime = Date.now()
  
  try {
    await client.query('BEGIN')
    logger.debug('Transaction started')
    
    const result = await callback(client)
    
    await client.query('COMMIT')
    const duration = Date.now() - startTime
    
    logger.debug('Transaction committed', { duration })
    
    if (duration > 5000) {
      logger.warn('Long transaction detected', { duration })
    }
    
    return result
  } catch (error: any) {
    await client.query('ROLLBACK')
    logger.error('Transaction rolled back', error, {
      duration: Date.now() - startTime
    })
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close the database pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    logger.info('Closing database connection pool', {
      totalQueries: poolStats.totalQueries,
      errors: poolStats.errors
    })
    
    await pool.end()
    pool = null
    
    // Reset stats
    poolStats = {
      totalQueries: 0,
      activeConnections: 0,
      errors: 0
    }
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  const pool = getPool()
  return {
    ...poolStats,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}
