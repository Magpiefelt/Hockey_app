/**
 * Global Error Handler Middleware
 * Catches and formats errors consistently
 */
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  // This middleware is not needed - error handling is done by Nuxt automatically
  // Removing the blocking Promise that waits for response to finish
  try {
    // Just continue without blocking
    return
  } catch (error: any) {
    const requestId = event.context.requestId || 'unknown'
    
    // Log error with context
    logger.error('Request error', error, {
      requestId,
      path: event.path,
      method: event.method,
      statusCode: error.statusCode
    })
    
    // Determine status code
    let statusCode = error.statusCode || 500
    let message = error.message || 'Internal Server Error'
    
    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred'
    }
    
    // Format error response
    const errorResponse = {
      error: {
        message,
        statusCode,
        requestId,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: error.stack,
          details: error.data
        })
      }
    }
    
    // Set response
    setResponseStatus(event, statusCode)
    return errorResponse
  }
})
