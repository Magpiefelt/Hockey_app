/**
 * tRPC Middleware Utilities
 * Reusable middleware for tRPC procedures
 * 
 * Note: These are example middleware patterns.
 * To use them, import and apply via t.procedure.use() in your routers.
 */
import { logAudit } from './audit'
import { logger } from './logger'

/**
 * Audit logging middleware
 * Automatically logs all mutations to the audit trail
 * 
 * Usage:
 * const myProcedure = t.procedure.use(auditMiddleware).mutation(...)
 */
export const auditMiddleware = async ({ ctx, next, path, type }: any) => {
  const startTime = Date.now()
  
  // Only log mutations
  if (type === 'mutation') {
    const userId = ctx.user?.userId
    const action = `trpc.${path}`
    
    logger.debug('Mutation started', { action, userId })
    
    try {
      const result = await next()
      const duration = Date.now() - startTime
      
      // Log successful mutation
      await logAudit({
        action,
        userId,
        metadata: {
          success: true,
          duration,
          ip: ctx.event?.context?.ip,
          userAgent: ctx.event?.context?.userAgent
        }
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Log failed mutation
      await logAudit({
        action,
        userId,
        metadata: {
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: ctx.event?.context?.ip
        }
      })
      
      throw error
    }
  }
  
  return next()
}

/**
 * Input sanitization middleware
 * Automatically sanitizes string inputs
 * 
 * Note: This is a basic example. For production, integrate with your sanitization utilities.
 */
export const sanitizeInputMiddleware = async ({ ctx, next, rawInput }: any) => {
  // Recursively sanitize string inputs
  function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Basic sanitization - remove script tags and trim
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim()
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue)
    } else if (value && typeof value === 'object') {
      const sanitized: any = {}
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val)
      }
      return sanitized
    }
    return value
  }
  
  // Sanitize input if it exists
  if (rawInput) {
    const sanitized = sanitizeValue(rawInput)
    // Note: This doesn't actually modify the input, just demonstrates the pattern
    // In practice, you'd need to integrate this earlier in the chain
  }
  
  return next()
}

/**
 * Performance tracking middleware
 * Logs slow procedures
 */
export const performanceMiddleware = async ({ ctx, next, path, type }: any) => {
  const startTime = Date.now()
  
  try {
    const result = await next()
    const duration = Date.now() - startTime
    
    // Log slow procedures (>2 seconds)
    if (duration > 2000) {
      logger.warn('Slow tRPC procedure', {
        path,
        type,
        duration,
        userId: ctx.user?.userId
      })
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('tRPC procedure failed', error as Error, {
      path,
      type,
      duration,
      userId: ctx.user?.userId
    })
    
    throw error
  }
}

/**
 * Request context middleware
 * Enriches context with request metadata
 */
export const contextMiddleware = async ({ ctx, next }: any) => {
  // Context is already enriched by server middleware
  // This is a placeholder for any additional context enrichment
  
  return next({
    ctx: {
      ...ctx,
      // Add any additional context here
      requestTime: new Date()
    }
  })
}
