import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => {
  process.env.QUOTE_TOKEN_SECRET = 'test-quote-token-secret'
  return {
    queryMock: vi.fn()
  }
})

vi.mock('../../server/db/connection', () => ({
  query: queryMock
}))

vi.mock('../../server/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

import {
  generateQuoteToken,
  validateQuoteToken,
  validateQuoteTokenWithStore,
  markQuoteTokenUsed,
  generateQuoteViewUrl
} from '../../server/utils/quote-tokens'

describe('quote token utilities', () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it('generates and validates a token with normalized email', () => {
    const token = generateQuoteToken(42, 'USER@Example.com ')
    const validation = validateQuoteToken(token.token)

    expect(validation.valid).toBe(true)
    expect(validation.orderId).toBe(42)
    expect(validation.email).toBe('user@example.com')
  })

  it('rejects malformed token payloads', () => {
    const malformedToken = Buffer.from(JSON.stringify({ o: 'abc', e: 123, x: 'nope', s: true })).toString('base64url')
    const validation = validateQuoteToken(malformedToken)

    expect(validation.valid).toBe(false)
    expect(validation.error).toBe('Invalid token payload')
  })

  it('rejects tampered signatures', () => {
    const token = generateQuoteToken(7, 'user@example.com')
    const decoded = JSON.parse(Buffer.from(token.token, 'base64url').toString('utf8'))
    decoded.e = 'attacker@example.com'
    const tamperedToken = Buffer.from(JSON.stringify(decoded)).toString('base64url')

    const validation = validateQuoteToken(tamperedToken)
    expect(validation.valid).toBe(false)
    expect(validation.error).toBe('Invalid token signature')
  })

  it('requires DB token when configured', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    const token = generateQuoteToken(99, 'customer@example.com')

    const validation = await validateQuoteTokenWithStore(token.token, { requireStoredToken: true })

    expect(validation.valid).toBe(false)
    expect(validation.error).toContain('invalid')
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('fails closed when stored-token verification is required but tracking table is missing', async () => {
    queryMock.mockRejectedValue({ code: '42P01' })
    const token = generateQuoteToken(100, 'customer@example.com')

    const validation = await validateQuoteTokenWithStore(token.token, { requireStoredToken: true })

    expect(validation.valid).toBe(false)
    expect(validation.error).toContain('not available')
  })

  it('still allows stateless validation when stored-token verification is optional', async () => {
    queryMock.mockRejectedValue({ code: '42P01' })
    const token = generateQuoteToken(101, 'customer@example.com')

    const validation = await validateQuoteTokenWithStore(token.token, { requireStoredToken: false })

    expect(validation.valid).toBe(true)
    expect(validation.orderId).toBe(101)
  })

  it('rejects a token already marked as used for one-time actions', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 1,
          expires_at: new Date(Date.now() + 60_000),
          used_at: new Date()
        }
      ]
    })

    const token = generateQuoteToken(77, 'customer@example.com')
    const validation = await validateQuoteTokenWithStore(token.token, { rejectUsedToken: true })

    expect(validation.valid).toBe(false)
    expect(validation.error).toContain('already been used')
  })

  it('marks token as used with hashed value', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    const token = generateQuoteToken(55, 'customer@example.com')

    await markQuoteTokenUsed(55, token.token)

    expect(queryMock).toHaveBeenCalledTimes(1)
    const params = queryMock.mock.calls[0][1] as unknown[]
    expect(params[0]).toBe(55)
    expect(String(params[1])).toMatch(/^[a-f0-9]{64}$/)
  })

  it('generates quote URL without duplicate slashes', () => {
    queryMock.mockResolvedValue({ rows: [] })

    const url = generateQuoteViewUrl(123, 'customer@example.com', 'https://example.com/')

    expect(url.startsWith('https://example.com/orders/123/quote?token=')).toBe(true)
  })
})
