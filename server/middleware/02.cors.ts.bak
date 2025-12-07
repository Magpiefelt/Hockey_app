/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const origin = getHeader(event, 'origin')
  
  // Allow credentials
  setHeader(event, 'Access-Control-Allow-Credentials', 'true')
  
  // Configure allowed origins
  const allowedOrigins = [
    config.public.appBaseUrl || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001'
  ]
  
  // In production, only allow specific origins
  if (process.env.NODE_ENV === 'production' && config.public.appBaseUrl) {
    if (origin && allowedOrigins.includes(origin)) {
      setHeader(event, 'Access-Control-Allow-Origin', origin)
    }
  } else {
    // In development, allow all origins
    setHeader(event, 'Access-Control-Allow-Origin', origin || '*')
  }
  
  // Handle preflight requests
  if (event.method === 'OPTIONS') {
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-ID')
    setHeader(event, 'Access-Control-Max-Age', '86400') // 24 hours
    
    // Respond to preflight
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }
})
