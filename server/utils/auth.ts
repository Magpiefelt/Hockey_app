import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { logger } from './logger'
import { AuthenticationError } from './errors'

const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new AuthenticationError('Password must be at least 8 characters')
  }
  
  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (error) {
    logger.error('Password hashing failed', error as Error)
    throw new AuthenticationError('Failed to hash password')
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false
  }
  
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    logger.error('Password verification failed', error as Error)
    return false
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: number, role: string): string {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret || process.env.SESSION_SECRET
  
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured. Please set SESSION_SECRET environment variable.')
  }
  
  try {
    return jwt.sign(
      { 
        userId, 
        role,
        iat: Math.floor(Date.now() / 1000)
      },
      secret,
      { expiresIn: '7d' }
    )
  } catch (error) {
    logger.error('Token generation failed', error as Error)
    throw new AuthenticationError('Failed to generate authentication token')
  }
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const config = useRuntimeConfig()
    const secret = config.sessionSecret || process.env.SESSION_SECRET
    
    if (!secret) {
      throw new Error('SESSION_SECRET is not configured. Please set SESSION_SECRET environment variable.')
    }
    
    const decoded = jwt.verify(token, secret) as { userId: number; role: string }
    return decoded
  } catch (error: any) {
    // Don't log every invalid token (could be spam)
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      logger.error('Token verification error', error)
    }
    return null
  }
}

/**
 * Get the current user from the session cookie
 */
export function getUserFromEvent(event: H3Event): { userId: number; role: string } | null {
  const token = getCookie(event, 'auth-token')
  
  if (!token) {
    return null
  }
  
  const user = verifyToken(token)
  
  if (user) {
    // Attach user to event context for logging
    event.context.user = user
  }
  
  return user
}

/**
 * Set the auth cookie
 */
export function setAuthCookie(event: H3Event, token: string) {
  const config = useRuntimeConfig()
  
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? config.public.cookieDomain : undefined
  })
  
  logger.debug('Auth cookie set')
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'auth-token', {
    path: '/'
  })
  
  logger.debug('Auth cookie cleared')
}

/**
 * Refresh token if it's close to expiration
 */
export function refreshTokenIfNeeded(event: H3Event): void {
  const token = getCookie(event, 'auth-token')
  
  if (!token) return
  
  try {
    const decoded = jwt.decode(token) as any
    
    if (!decoded || !decoded.exp) return
    
    const expiresAt = decoded.exp * 1000
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now
    const oneDayInMs = 24 * 60 * 60 * 1000
    
    // Refresh if less than 1 day until expiry
    if (timeUntilExpiry < oneDayInMs && timeUntilExpiry > 0) {
      const newToken = generateToken(decoded.userId, decoded.role)
      setAuthCookie(event, newToken)
      logger.info('Token refreshed', { userId: decoded.userId })
    }
  } catch (error) {
    // Ignore refresh errors
  }
}

/**
 * Validate session and get user
 */
export function requireAuth(event: H3Event): { userId: number; role: string } {
  const user = getUserFromEvent(event)
  
  if (!user) {
    throw new AuthenticationError('Authentication required')
  }
  
  // Refresh token if needed
  refreshTokenIfNeeded(event)
  
  return user
}

/**
 * Validate admin access
 */
export function requireAdmin(event: H3Event): { userId: number; role: string } {
  const user = requireAuth(event)
  
  if (user.role !== 'admin') {
    logger.warn('Admin access denied', { userId: user.userId, role: user.role })
    throw new AuthenticationError('Admin access required')
  }
  
  return user
}
