/**
 * Quote Access Token Utilities
 * Generates and validates secure tokens for direct quote access from emails
 */

import crypto from 'crypto'
import { query } from '../db/connection'
import { logger } from './logger'

// Secret key for token generation (should be in environment variables)
const TOKEN_SECRET = process.env.QUOTE_TOKEN_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production'
const TOKEN_EXPIRY_DAYS = 30

export interface QuoteToken {
  orderId: number
  email: string
  expiresAt: Date
  token: string
}

/**
 * Generate a secure token for quote access
 */
export function generateQuoteToken(orderId: number, email: string): QuoteToken {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)
  
  // Create a hash-based token
  const payload = `${orderId}:${email}:${expiresAt.getTime()}`
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET)
  hmac.update(payload)
  const signature = hmac.digest('hex')
  
  // Combine into a URL-safe token
  const token = Buffer.from(JSON.stringify({
    o: orderId,
    e: email,
    x: expiresAt.getTime(),
    s: signature.substring(0, 16) // Short signature for URL
  })).toString('base64url')
  
  return {
    orderId,
    email,
    expiresAt,
    token
  }
}

/**
 * Validate and decode a quote access token
 */
export function validateQuoteToken(token: string): { valid: boolean; orderId?: number; email?: string; error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    
    const orderId = decoded.o
    const email = decoded.e
    const expiresAt = new Date(decoded.x)
    const providedSignature = decoded.s
    
    // Check expiration
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Token has expired' }
    }
    
    // Verify signature
    const payload = `${orderId}:${email}:${expiresAt.getTime()}`
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex').substring(0, 16)
    
    if (providedSignature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' }
    }
    
    return { valid: true, orderId, email }
  } catch (error) {
    logger.error('Token validation error', { error })
    return { valid: false, error: 'Invalid token format' }
  }
}

/**
 * Store token in database for additional security tracking
 */
export async function storeQuoteToken(orderId: number, token: string, expiresAt: Date): Promise<void> {
  try {
    await query(
      `INSERT INTO quote_access_tokens (quote_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (quote_id) DO UPDATE SET
         token_hash = $2,
         expires_at = $3,
         created_at = NOW()`,
      [orderId, crypto.createHash('sha256').update(token).digest('hex'), expiresAt]
    )
  } catch (error) {
    // Table might not exist yet, log but don't fail
    logger.warn('Could not store quote token', { orderId, error })
  }
}

/**
 * Generate a direct quote view URL with token
 * Also stores the token in the database for tracking
 */
export function generateQuoteViewUrl(orderId: number, email: string, baseUrl: string): string {
  const tokenData = generateQuoteToken(orderId, email)
  
  // Store token asynchronously - don't block URL generation
  storeQuoteToken(orderId, tokenData.token, tokenData.expiresAt).catch(err => {
    logger.warn('Failed to store quote view token', { orderId, error: err })
  })
  
  return `${baseUrl}/orders/${orderId}/quote?token=${tokenData.token}`
}

/**
 * Generate a direct quote accept URL with token
 * Also stores the token in the database for tracking
 */
export function generateQuoteAcceptUrl(orderId: number, email: string, baseUrl: string): string {
  const tokenData = generateQuoteToken(orderId, email)
  
  // Store token asynchronously - don't block URL generation
  storeQuoteToken(orderId, tokenData.token, tokenData.expiresAt).catch(err => {
    logger.warn('Failed to store quote accept token', { orderId, error: err })
  })
  
  return `${baseUrl}/orders/${orderId}/quote?token=${tokenData.token}&action=accept`
}
