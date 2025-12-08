/**
 * Request Logging Middleware
 * Logs all incoming requests with timing and response status
 */
import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const startTime = Date.now()
  const method = event.method
  const url = event.path
  
  // Get request ID from headers or generate one
  const requestId = getHeader(event, 'x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Set request ID in event context for use in other handlers
  event.context.requestId = requestId
  
  // Log request start
  logger.request(method, url)
  
  // Hook into response to log completion
  event.node.res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = event.node.res.statusCode
    const statusEmoji = statusCode < 400 ? '✓' : statusCode < 500 ? '⚠' : '✗'
    
    logger.response(method, url, statusCode, duration)
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', { requestId, method, url, duration })
    }
  })
})
