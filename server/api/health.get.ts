/**
 * Health Check Endpoint
 * Returns comprehensive application health status
 */
import { query } from '../db/connection'
import { getRedisClient } from '../utils/redis'
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  }
  
  // Check database connection
  try {
    const dbStart = Date.now()
    const result = await query('SELECT NOW() as current_time, version() as version')
    const dbTime = Date.now() - dbStart
    
    health.checks.database = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: dbTime,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    }
  } catch (error: any) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'unhealthy',
      message: error.message
    }
    logger.error('Health check: Database connection failed', error)
  }
  
  // Check Redis connection
  try {
    const redis = getRedisClient()
    if (redis) {
      const redisStart = Date.now()
      await redis.ping()
      const redisTime = Date.now() - redisStart
      
      health.checks.redis = {
        status: 'healthy',
        message: 'Redis connection successful',
        responseTime: redisTime
      }
    } else {
      health.checks.redis = {
        status: 'degraded',
        message: 'Redis not configured (using in-memory fallback)'
      }
    }
  } catch (error: any) {
    health.status = 'degraded'
    health.checks.redis = {
      status: 'unhealthy',
      message: error.message
    }
    logger.error('Health check: Redis connection failed', error)
  }
  
  // Check environment variables
  const config = useRuntimeConfig()
  const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET']
  const missingEnvVars = requiredEnvVars.filter(key => {
    const value = key === 'DATABASE_URL' ? config.databaseUrl : config.sessionSecret
    return !value || value.trim() === ''
  })
  
  if (missingEnvVars.length > 0) {
    health.status = 'degraded'
    health.checks.environment = {
      status: 'degraded',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`
    }
  } else {
    health.checks.environment = {
      status: 'healthy',
      message: 'All required environment variables are set'
    }
  }
  
  // Response time
  health.responseTime = Date.now() - startTime
  
  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503
  setResponseStatus(event, statusCode)
  
  return health
})
