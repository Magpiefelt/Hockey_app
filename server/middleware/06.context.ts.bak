/**
 * Request Context Enrichment Middleware
 * Adds useful metadata to request context for downstream use
 */
export default defineEventHandler((event) => {
  // Get client IP address
  const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() 
    || getHeader(event, 'x-real-ip') 
    || event.node.req.socket.remoteAddress 
    || 'unknown'
  
  // Get user agent
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  
  // Get request timestamp
  const timestamp = new Date().toISOString()
  
  // Attach to context
  event.context.ip = ip
  event.context.userAgent = userAgent
  event.context.timestamp = timestamp
  
  // Request ID should already be set by logging middleware
  // but ensure it exists
  if (!event.context.requestId) {
    event.context.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
})
