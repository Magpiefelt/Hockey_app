/**
 * Security Headers Middleware
 * Sets security-related HTTP headers
 */
export default defineEventHandler((event) => {
  // Prevent clickjacking
  setHeader(event, 'X-Frame-Options', 'SAMEORIGIN')
  
  // Prevent MIME type sniffing
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  setHeader(event, 'X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (adjusted for production)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  setHeader(event, 'Content-Security-Policy', csp)
  
  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Permissions Policy
  setHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
})
