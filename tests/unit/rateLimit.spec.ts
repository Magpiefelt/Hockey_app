import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TRPCError } from '@trpc/server'

vi.mock('../../server/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}))

import { clearAllRateLimits, getRateLimitStatus, rateLimit } from '../../server/trpc/middleware/rateLimit'

describe('rateLimit middleware', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  it('allows requests within limit', async () => {
    const middleware = rateLimit({
      maxRequests: 2,
      windowMs: 1000,
      keyPrefix: 'test-allow',
      identifier: () => 'client-a'
    })
    const next = vi.fn(async () => ({ ok: true }))

    const first = await middleware({ ctx: {}, next })
    const second = await middleware({ ctx: {}, next })

    expect(first).toEqual({ ok: true })
    expect(second).toEqual({ ok: true })
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('blocks requests over the limit', async () => {
    const middleware = rateLimit({
      maxRequests: 1,
      windowMs: 5000,
      keyPrefix: 'test-block',
      identifier: () => 'client-b'
    })

    await middleware({ ctx: {}, next: async () => ({ ok: true }) })

    await expect(
      middleware({ ctx: {}, next: async () => ({ ok: true }) })
    ).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS'
    } as Partial<TRPCError>)
  })

  it('normalizes blank identifiers to anonymous', async () => {
    const middleware = rateLimit({
      maxRequests: 2,
      windowMs: 5000,
      keyPrefix: 'test-anon',
      identifier: () => '   '
    })

    await middleware({ ctx: {}, next: async () => ({ ok: true }) })
    const status = getRateLimitStatus('test-anon:anonymous')

    expect(status).not.toBeNull()
    expect(status?.count).toBe(1)
  })

  it('throws for invalid configuration', () => {
    expect(() =>
      rateLimit({
        maxRequests: 0,
        windowMs: 1000,
        identifier: () => 'client'
      })
    ).toThrow('maxRequests > 0')

    expect(() =>
      rateLimit({
        maxRequests: 1,
        windowMs: 0,
        identifier: () => 'client'
      })
    ).toThrow('windowMs > 0')
  })
})
