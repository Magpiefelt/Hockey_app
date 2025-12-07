/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 * Uses Redis for distributed rate limiting in production
 */
import { checkRateLimit } from '../utils/redis'
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV !== 'production') {
    return
  }
  
  // Skip rate limiting for certain paths
  const skipPaths = ['/api/health', '/api/_nuxt', '/_nuxt', '/', '/assets', '.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff']
  if (skipPaths.some(path => event.path.startsWith(path) || event.path.includes(path))) {
    return
  }
  
  // Get client IP
  const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() 
    || getHeader(event, 'x-real-ip') 
    || event.node.req.socket.remoteAddress 
    || 'unknown'
  
  // Different limits for different endpoints
  const limits: Record<string, { requests: number; window: number }> = {
    '/api/trpc/auth.login': { requests: 5, window: 15 * 60 }, // 5 per 15 min
    '/api/trpc/auth.register': { requests: 3, window: 60 * 60 }, // 3 per hour
    '/api/upload': { requests: 10, window: 60 }, // 10 per minute
    'default': { requests: 100, window: 60 } // 100 per minute
  }
  
  // Find matching limit
  let limit = limits.default
  for (const [path, pathLimit] of Object.entries(limits)) {
    if (path !== 'default' && event.path.includes(path)) {
      limit = pathLimit
      break
    }
  }
  
  const key = `ratelimit:${ip}:${event.path}`
  
  try {
    // Check rate limit using Redis
    const result = await checkRateLimit(key, limit.requests, limit.window)
    
    // Set rate limit headers
    setHeader(event, 'X-RateLimit-Limit', limit.requests.toString())
    setHeader(event, 'X-RateLimit-Remaining', result.remaining.toString())
    setHeader(event, 'X-RateLimit-Reset', result.resetIn.toString())
    
    // Check if limit exceeded
    if (!result.allowed) {
      setHeader(event, 'Retry-After', result.resetIn.toString())
      logger.warn('Rate limit exceeded', { ip, path: event.path, limit: limit.requests })
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`
      })
    }
  } catch (error: any) {
    // If rate limiting fails, log but don't block the request
    if (error.statusCode !== 429) {
      logger.error('Rate limiting error', error)
    } else {
      throw error
    }
  }
})
