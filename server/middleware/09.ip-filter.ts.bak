/**
 * IP Filtering Middleware
 * Restricts access to admin routes based on IP whitelist
 */

import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const path = event.path
  
  // Only apply to admin routes
  if (!path.startsWith('/api/trpc/admin')) {
    return
  }
  
  const config = useRuntimeConfig()
  const ipWhitelist = process.env.ADMIN_IP_WHITELIST || config.adminIpWhitelist || ''
  
  // If no whitelist configured, allow all (development mode)
  if (!ipWhitelist || ipWhitelist.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Admin IP whitelist not configured in production')
    }
    return
  }
  
  // Get client IP
  const clientIp = event.context.ip || 
                   getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
                   getHeader(event, 'x-real-ip') ||
                   'unknown'
  
  // Parse whitelist
  const allowedIps = ipWhitelist.split(',').map(ip => ip.trim()).filter(ip => ip)
  
  // Check if IP is whitelisted
  const isAllowed = allowedIps.some(allowedIp => {
    // Support CIDR notation in the future
    // For now, exact match or wildcard
    if (allowedIp === '*') return true
    if (allowedIp === clientIp) return true
    
    // Support subnet wildcards (e.g., 192.168.1.*)
    if (allowedIp.endsWith('.*')) {
      const prefix = allowedIp.slice(0, -2)
      return clientIp.startsWith(prefix)
    }
    
    return false
  })
  
  if (!isAllowed) {
    logger.warn('Admin access denied - IP not whitelisted', { 
      clientIp, 
      path,
      whitelist: allowedIps 
    })
    
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    })
  }
  
  logger.debug('Admin access granted', { clientIp, path })
})
