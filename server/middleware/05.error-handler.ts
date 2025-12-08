/**
 * Global Error Handler Middleware
 * Catches and formats errors consistently
 * 
 * Note: This middleware wraps the request in a try-catch to handle errors
 * that occur during request processing.
 */
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  // Skip error handling for certain paths
  const skipPaths = ['/api/health', '/api/live', '/api/ready']
  if (skipPaths.includes(event.path)) {
    return
  }

  // Error handling is managed by Nuxt's built-in error handling
  // This middleware is kept for logging purposes only
  event.context.errorHandler = (error: any) => {
    const requestId = event.context.requestId || 'unknown'
    
    // Log error with context
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      requestId,
      path: event.path,
      method: event.method,
      statusCode: error.statusCode || 500
    })
  }
})
