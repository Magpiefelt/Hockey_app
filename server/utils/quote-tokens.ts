/**
 * Quote Access Token Utilities
 * Generates and validates secure tokens for direct quote access from emails
 */

import crypto from 'crypto'
import { query } from '../db/connection'
import { logger } from './logger'

// Secret key for token generation (should be in environment variables)
const TOKEN_SECRET = process.env.QUOTE_TOKEN_SECRET || process.env.JWT_SECRET || ''
const TOKEN_EXPIRY_DAYS = 30
const TOKEN_SIGNATURE_LENGTH = 16
const MAX_TOKEN_LENGTH = 4096

if (!TOKEN_SECRET) {
  logger.error('QUOTE_TOKEN_SECRET (or JWT_SECRET) is not set; quote token operations are disabled')
}

export interface QuoteToken {
  orderId: number
  email: string
  expiresAt: Date
  token: string
}

export interface QuoteTokenValidationResult {
  valid: boolean
  orderId?: number
  email?: string
  error?: string
}

interface ValidateQuoteTokenWithStoreOptions {
  requireStoredToken?: boolean
  rejectUsedToken?: boolean
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function buildSignature(orderId: number, email: string, expiresAtMs: number): string {
  if (!TOKEN_SECRET) {
    throw new Error('Quote token secret is not configured')
  }
  const payload = `${orderId}:${email}:${expiresAtMs}`
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET)
  hmac.update(payload)
  return hmac.digest('hex').substring(0, TOKEN_SIGNATURE_LENGTH)
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function safeSignatureEqual(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

/**
 * Generate a secure token for quote access
 */
export function generateQuoteToken(orderId: number, email: string): QuoteToken {
  if (!TOKEN_SECRET) {
    throw new Error('Quote token secret is not configured')
  }
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('Invalid order ID for quote token generation')
  }
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail.includes('@')) {
    throw new Error('Invalid email for quote token generation')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)
  
  const signature = buildSignature(orderId, normalizedEmail, expiresAt.getTime())
  
  // Combine into a URL-safe token
  const token = Buffer.from(JSON.stringify({
    o: orderId,
    e: normalizedEmail,
    x: expiresAt.getTime(),
    s: signature // Short signature for URL
  })).toString('base64url')
  
  return {
    orderId,
    email: normalizedEmail,
    expiresAt,
    token
  }
}

/**
 * Validate and decode a quote access token
 */
export function validateQuoteToken(token: string): QuoteTokenValidationResult {
  try {
    if (!TOKEN_SECRET) {
      return { valid: false, error: 'Quote token secret is not configured' }
    }

    if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      return { valid: false, error: 'Invalid token format' }
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
    const orderId = Number(decoded?.o)
    const email = typeof decoded?.e === 'string' ? normalizeEmail(decoded.e) : ''
    const expiresAtMs = Number(decoded?.x)
    const providedSignature = typeof decoded?.s === 'string' ? decoded.s.toLowerCase() : ''

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return { valid: false, error: 'Invalid token payload' }
    }

    if (!email || !email.includes('@')) {
      return { valid: false, error: 'Invalid token payload' }
    }

    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
      return { valid: false, error: 'Invalid token payload' }
    }

    if (!/^[a-f0-9]{16}$/.test(providedSignature)) {
      return { valid: false, error: 'Invalid token signature' }
    }
    
    const expiresAt = new Date(expiresAtMs)
    
    // Check expiration
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Token has expired' }
    }
    
    // Verify signature
    const expectedSignature = buildSignature(orderId, email, expiresAt.getTime()).toLowerCase()
    
    if (!safeSignatureEqual(providedSignature, expectedSignature)) {
      return { valid: false, error: 'Invalid token signature' }
    }
    
    return { valid: true, orderId, email }
  } catch (error) {
    logger.debug('Token validation error', { error })
    return { valid: false, error: 'Invalid token format' }
  }
}

/**
 * Validate a token and (optionally) enforce DB-stored token tracking.
 * Falls back to stateless validation if the tracking table isn't available.
 */
export async function validateQuoteTokenWithStore(
  token: string,
  options: ValidateQuoteTokenWithStoreOptions = {}
): Promise<QuoteTokenValidationResult> {
  const parsed = validateQuoteToken(token)
  if (!parsed.valid || !parsed.orderId) {
    return parsed
  }

  try {
    const result = await query<{
      id: number
      expires_at: Date
      used_at: Date | null
    }>(
      `SELECT id, expires_at, used_at
       FROM quote_access_tokens
       WHERE quote_id = $1 AND token_hash = $2
       LIMIT 1`,
      [parsed.orderId, hashToken(token)]
    )

    if (result.rows.length === 0) {
      if (options.requireStoredToken) {
        return { valid: false, error: 'Access token is invalid or has been replaced' }
      }
      return parsed
    }

    const row = result.rows[0]
    if (row.expires_at < new Date()) {
      return { valid: false, error: 'Token has expired' }
    }

    if (options.rejectUsedToken && row.used_at) {
      return { valid: false, error: 'This quote link has already been used' }
    }

    return parsed
  } catch (error: any) {
    if (error?.code === '42P01') {
      // quote_access_tokens table may not exist in older deployments
      if (options.requireStoredToken) {
        return { valid: false, error: 'Quote token storage is not available' }
      }
      return parsed
    }
    logger.warn('Quote token DB verification failed', {
      errorCode: error?.code,
      message: error?.message
    })
    if (options.requireStoredToken) {
      return { valid: false, error: 'Quote token verification is currently unavailable' }
    }
    return parsed
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
        used_at = NULL,
         created_at = NOW()`,
      [orderId, hashToken(token), expiresAt]
    )
  } catch (error) {
    // Table might not exist yet, log but don't fail
    logger.warn('Could not store quote token', { orderId, error })
  }
}

/**
 * Mark a token as used (for one-time actions like accept/decline).
 */
export async function markQuoteTokenUsed(orderId: number, token: string): Promise<void> {
  try {
    await query(
      `UPDATE quote_access_tokens
       SET used_at = COALESCE(used_at, NOW())
       WHERE quote_id = $1 AND token_hash = $2`,
      [orderId, hashToken(token)]
    )
  } catch (error: any) {
    // Table might not exist yet, or DB may be temporarily unavailable.
    logger.warn('Could not mark quote token as used', {
      orderId,
      errorCode: error?.code,
      message: error?.message
    })
  }
}

/**
 * Generate a direct quote view URL with token
 * Also stores the token in the database for tracking
 */
export function generateQuoteViewUrl(orderId: number, email: string, baseUrl: string): string {
  const tokenData = generateQuoteToken(orderId, email)
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  
  // Store token asynchronously - don't block URL generation
  storeQuoteToken(orderId, tokenData.token, tokenData.expiresAt).catch(err => {
    logger.warn('Failed to store quote view token', { orderId, error: err })
  })
  
  return `${normalizedBaseUrl}/orders/${orderId}/quote?token=${tokenData.token}`
}

/**
 * Generate a direct quote accept URL with token
 * Also stores the token in the database for tracking
 */
export function generateQuoteAcceptUrl(orderId: number, email: string, baseUrl: string): string {
  const tokenData = generateQuoteToken(orderId, email)
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  
  // Store token asynchronously - don't block URL generation
  storeQuoteToken(orderId, tokenData.token, tokenData.expiresAt).catch(err => {
    logger.warn('Failed to store quote accept token', { orderId, error: err })
  })
  
  return `${normalizedBaseUrl}/orders/${orderId}/quote?token=${tokenData.token}&action=accept`
}
