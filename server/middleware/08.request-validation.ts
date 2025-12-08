/**
 * Request Validation Middleware
 * Validates and sanitizes incoming requests
 */

import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const method = event.method
  const path = event.path
  
  // Skip validation for health checks and static assets
  if (path.startsWith('/api/health') || path.startsWith('/api/live') || path.startsWith('/api/ready')) {
    return
  }
  
  // Validate Content-Type for POST/PUT requests
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const contentType = getHeader(event, 'content-type')
    
    if (!contentType) {
      logger.warn('Request missing Content-Type header', { path, method })
      throw createError({
        statusCode: 400,
        message: 'Content-Type header is required'
      })
    }
    
    // Validate JSON content type for API endpoints
    if (path.startsWith('/api/') && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      logger.warn('Invalid Content-Type for API request', { path, method, contentType })
      throw createError({
        statusCode: 415,
        message: 'Content-Type must be application/json or multipart/form-data'
      })
    }
  }
  
  // Validate request size (prevent large payload attacks)
  const contentLength = getHeader(event, 'content-length')
  if (contentLength) {
    const size = parseInt(contentLength)
    const maxSize = 10 * 1024 * 1024 // 10MB for regular requests
    
    if (size > maxSize) {
      logger.warn('Request payload too large', { path, method, size })
      throw createError({
        statusCode: 413,
        message: 'Request payload too large'
      })
    }
  }
  
  // Validate User-Agent (block suspicious bots)
  const userAgent = getHeader(event, 'user-agent')
  if (!userAgent || userAgent.trim() === '') {
    logger.debug('Request without User-Agent', { path, method })
  }
  
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS attempt
    /union.*select/i, // SQL injection
    /exec\(/i,        // Code injection
    /eval\(/i         // Code injection
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path)) {
      logger.warn('Suspicious request pattern detected', { path, method, pattern: pattern.toString() })
      throw createError({
        statusCode: 400,
        message: 'Invalid request'
      })
    }
  }
})
