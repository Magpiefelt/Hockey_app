import { describe, expect, it } from 'vitest'

import { hashPasswordResetToken } from '../../server/trpc/routers/auth'

describe('password reset token hashing', () => {
  it('produces deterministic sha256 hashes', () => {
    const token = 'abc123-reset-token'
    const first = hashPasswordResetToken(token)
    const second = hashPasswordResetToken(token)

    expect(first).toBe(second)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
  })

  it('does not return the raw token', () => {
    const token = 'raw-token-value'
    const hashed = hashPasswordResetToken(token)

    expect(hashed).not.toBe(token)
  })
})
