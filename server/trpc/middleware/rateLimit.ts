/**
 * Rate Limiting Middleware for tRPC
 * 
 * Purpose: Prevent spam and DOS attacks by limiting request frequency
 */

import { TRPCError } from '@trpc/server'
import { logger } from '../../utils/logger'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
    firstRequestAt: number
    maxRequests: number
  }
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const store: RateLimitStore = {}
const MAX_STORE_ENTRIES = 10000

// Clean up old entries every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  }
}, 5 * 60 * 1000)

// Prevent timers from keeping the process alive in tests/short-lived workers.
cleanupInterval.unref?.()

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the time window
   */
  maxRequests: number
  
  /**
   * Time window in milliseconds
   */
  windowMs: number
  
  /**
   * Function to generate a unique identifier for the client
   * Typically uses IP address, but can also include user ID
   */
  identifier: (ctx: any) => string
  
  /**
   * Optional message to show when rate limit is exceeded
   */
  message?: string

  /**
   * Optional prefix to isolate keys per endpoint family
   */
  keyPrefix?: string
}

function normalizeClientIdentifier(value: string): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return 'anonymous'
  // Keep keys compact and avoid accidental key explosions.
  return trimmed.replace(/\s+/g, '_').slice(0, 256)
}

function pruneExpiredEntries(now: number): void {
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  }
}

/**
 * Create a rate limiting middleware
 * 
 * @param options - Rate limiting configuration
 * @returns tRPC middleware function
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    maxRequests,
    windowMs,
    identifier,
    message = 'Too many requests. Please try again later.',
    keyPrefix = 'global'
  } = options

  if (!Number.isFinite(maxRequests) || maxRequests <= 0) {
    throw new Error('rateLimit requires maxRequests > 0')
  }

  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('rateLimit requires windowMs > 0')
  }
  
  return async ({ ctx, next }: any) => {
    const rawIdentifier = identifier(ctx)
    const clientId = `${keyPrefix}:${normalizeClientIdentifier(rawIdentifier)}`
    const now = Date.now()
    const resetAt = now + windowMs

    // Opportunistic pruning to avoid unbounded in-memory growth.
    if (Object.keys(store).length > MAX_STORE_ENTRIES) {
      pruneExpiredEntries(now)
    }
    
    if (!store[clientId]) {
      // First request from this client
      store[clientId] = {
        count: 1,
        resetAt,
        firstRequestAt: now,
        maxRequests
      }
    } else {
      if (store[clientId].resetAt < now) {
        // Window expired, reset
        store[clientId] = {
          count: 1,
          resetAt,
          firstRequestAt: now,
          maxRequests
        }
      } else {
        // Within window, increment
        store[clientId].count++
        
        if (store[clientId].count > maxRequests) {
          const retryAfter = Math.ceil((store[clientId].resetAt - now) / 1000)
          const timeElapsed = Math.ceil((now - store[clientId].firstRequestAt) / 1000)
          
          logger.warn('Rate limit exceeded', {
            clientId,
            count: store[clientId].count,
            maxRequests,
            windowMs,
            timeElapsed,
            retryAfter
          })
          
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `${message} Please try again in ${retryAfter} seconds.`
          })
        }
      }
    }
    
    return next()
  }
}

/**
 * Get current rate limit status for a client
 * Useful for debugging and monitoring
 * 
 * @param clientId - The client identifier
 * @returns Rate limit status or null if not found
 */
export function getRateLimitStatus(clientId: string): {
  count: number
  remaining: number
  resetAt: number
  resetIn: number
} | null {
  const entry = store[clientId]
  if (!entry) {
    return null
  }
  
  const now = Date.now()
  const resetIn = Math.max(0, Math.ceil((entry.resetAt - now) / 1000))
  
  return {
    count: entry.count,
    remaining: Math.max(0, entry.maxRequests - entry.count),
    resetAt: entry.resetAt,
    resetIn
  }
}

/**
 * Clear rate limit for a specific client
 * Useful for testing or manual intervention
 * 
 * @param clientId - The client identifier
 */
export function clearRateLimit(clientId: string): void {
  delete store[clientId]
  logger.info('Rate limit cleared', { clientId })
}

/**
 * Get all rate limit entries
 * Useful for monitoring and debugging
 * 
 * @returns All rate limit entries
 */
export function getAllRateLimits(): RateLimitStore {
  return { ...store }
}

/**
 * Clear all rate limits
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  for (const key in store) {
    delete store[key]
  }
  logger.info('All rate limits cleared')
}
