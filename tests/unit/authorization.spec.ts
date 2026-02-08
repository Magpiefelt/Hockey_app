import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'

// Mock the database module - use vi.hoisted to ensure mock is available before vi.mock hoisting
const { queryOneMock } = vi.hoisted(() => {
  return { queryOneMock: vi.fn() }
})

vi.mock('../../server/utils/database', () => ({
  queryOne: queryOneMock
}))

// Mock the logger
vi.mock('../../server/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}))

// Import after mocking
import {
  verifyOrderOwnership,
  verifyFileOwnership,
  assertResourceAccess,
  requireOrderAccess,
  requireFileAccess,
  requireOrderModifyAccess
} from '../../server/trpc/middleware/authorization'

beforeEach(() => {
  queryOneMock.mockReset()
})

describe('verifyOrderOwnership', () => {
  it('should return exists: false when order does not exist', async () => {
    queryOneMock.mockResolvedValue(null)
    
    const result = await verifyOrderOwnership(999, 1, 'customer')
    
    expect(result).toEqual({
      exists: false,
      isOwner: false,
      ownerId: null
    })
  })

  it('should return isOwner: true when user owns the order', async () => {
    queryOneMock.mockResolvedValue({ user_id: 1 })
    
    const result = await verifyOrderOwnership(1, 1, 'customer')
    
    expect(result).toEqual({
      exists: true,
      isOwner: true,
      ownerId: 1
    })
  })

  it('should return isOwner: false when user does not own the order', async () => {
    queryOneMock.mockResolvedValue({ user_id: 2 })
    
    const result = await verifyOrderOwnership(1, 1, 'customer')
    
    expect(result).toEqual({
      exists: true,
      isOwner: false,
      ownerId: 2
    })
  })

  it('should return isOwner: true for admin users regardless of ownership', async () => {
    queryOneMock.mockResolvedValue({ user_id: 2 })
    
    const result = await verifyOrderOwnership(1, 1, 'admin')
    
    expect(result).toEqual({
      exists: true,
      isOwner: true,
      ownerId: 2
    })
  })

  it('should handle orders with null user_id', async () => {
    queryOneMock.mockResolvedValue({ user_id: null })
    
    const result = await verifyOrderOwnership(1, 1, 'customer')
    
    expect(result).toEqual({
      exists: true,
      isOwner: false,
      ownerId: null
    })
  })
})

describe('verifyFileOwnership', () => {
  it('should return exists: false when file does not exist', async () => {
    queryOneMock.mockResolvedValue(null)
    
    const result = await verifyFileOwnership(999, 1, 'customer')
    
    expect(result).toEqual({
      exists: false,
      isOwner: false,
      ownerId: null
    })
  })

  it('should return isOwner: true when user uploaded the file', async () => {
    queryOneMock.mockResolvedValue({ uploaded_by: 1, quote_id: null })
    
    const result = await verifyFileOwnership(1, 1, 'customer')
    
    expect(result).toEqual({
      exists: true,
      isOwner: true,
      ownerId: 1
    })
  })

  it('should check order ownership when file is attached to an order', async () => {
    // First call returns file info
    queryOneMock.mockResolvedValueOnce({ uploaded_by: 2, quote_id: 5 })
    // Second call checks order ownership
    queryOneMock.mockResolvedValueOnce({ user_id: 1 })
    
    const result = await verifyFileOwnership(1, 1, 'customer')
    
    expect(result).toEqual({
      exists: true,
      isOwner: true,
      ownerId: 2
    })
    expect(queryOneMock).toHaveBeenCalledTimes(2)
  })

  it('should return isOwner: true for admin users', async () => {
    queryOneMock.mockResolvedValue({ uploaded_by: 2, quote_id: null })
    
    const result = await verifyFileOwnership(1, 1, 'admin')
    
    expect(result).toEqual({
      exists: true,
      isOwner: true,
      ownerId: 2
    })
  })
})

describe('assertResourceAccess', () => {
  it('should throw NOT_FOUND when resource does not exist', () => {
    const ownership = { exists: false, isOwner: false, ownerId: null }
    
    expect(() => {
      assertResourceAccess(ownership, 'Order', { userId: 1, resourceId: 999 })
    }).toThrow(TRPCError)
    
    try {
      assertResourceAccess(ownership, 'Order', { userId: 1, resourceId: 999 })
    } catch (error) {
      expect((error as TRPCError).code).toBe('NOT_FOUND')
      expect((error as TRPCError).message).toBe('Order not found')
    }
  })

  it('should throw FORBIDDEN when user is not owner', () => {
    const ownership = { exists: true, isOwner: false, ownerId: 2 }
    
    expect(() => {
      assertResourceAccess(ownership, 'Order', { userId: 1, resourceId: 1 })
    }).toThrow(TRPCError)
    
    try {
      assertResourceAccess(ownership, 'Order', { userId: 1, resourceId: 1 })
    } catch (error) {
      expect((error as TRPCError).code).toBe('FORBIDDEN')
    }
  })

  it('should not throw when user is owner', () => {
    const ownership = { exists: true, isOwner: true, ownerId: 1 }
    
    expect(() => {
      assertResourceAccess(ownership, 'Order', { userId: 1, resourceId: 1 })
    }).not.toThrow()
  })
})

describe('requireOrderAccess', () => {
  it('should not throw when user has access', async () => {
    queryOneMock.mockResolvedValue({ user_id: 1 })
    
    await expect(requireOrderAccess(1, 1, 'customer')).resolves.not.toThrow()
  })

  it('should throw NOT_FOUND when order does not exist', async () => {
    queryOneMock.mockResolvedValue(null)
    
    await expect(requireOrderAccess(999, 1, 'customer')).rejects.toThrow(TRPCError)
    
    try {
      await requireOrderAccess(999, 1, 'customer')
    } catch (error) {
      expect((error as TRPCError).code).toBe('NOT_FOUND')
    }
  })

  it('should throw FORBIDDEN when user does not have access', async () => {
    queryOneMock.mockResolvedValue({ user_id: 2 })
    
    await expect(requireOrderAccess(1, 1, 'customer')).rejects.toThrow(TRPCError)
    
    try {
      await requireOrderAccess(1, 1, 'customer')
    } catch (error) {
      expect((error as TRPCError).code).toBe('FORBIDDEN')
    }
  })

  it('should allow admin access to any order', async () => {
    queryOneMock.mockResolvedValue({ user_id: 2 })
    
    await expect(requireOrderAccess(1, 1, 'admin')).resolves.not.toThrow()
  })
})

describe('requireFileAccess', () => {
  it('should not throw when user has access', async () => {
    queryOneMock.mockResolvedValue({ uploaded_by: 1, quote_id: null })
    
    await expect(requireFileAccess(1, 1, 'customer')).resolves.not.toThrow()
  })

  it('should throw NOT_FOUND when file does not exist', async () => {
    queryOneMock.mockResolvedValue(null)
    
    await expect(requireFileAccess(999, 1, 'customer')).rejects.toThrow(TRPCError)
  })

  it('should throw FORBIDDEN when user does not have access', async () => {
    queryOneMock.mockResolvedValue({ uploaded_by: 2, quote_id: null })
    
    await expect(requireFileAccess(1, 1, 'customer')).rejects.toThrow(TRPCError)
  })
})

describe('requireOrderModifyAccess', () => {
  it('should not throw when user can modify', async () => {
    queryOneMock.mockResolvedValue({ user_id: 1 })
    
    await expect(requireOrderModifyAccess(1, 1, 'customer')).resolves.not.toThrow()
  })

  it('should throw NOT_FOUND when order does not exist', async () => {
    queryOneMock.mockResolvedValue(null)
    
    await expect(requireOrderModifyAccess(999, 1, 'customer')).rejects.toThrow(TRPCError)
    
    try {
      await requireOrderModifyAccess(999, 1, 'customer')
    } catch (error) {
      expect((error as TRPCError).code).toBe('NOT_FOUND')
    }
  })

  it('should throw FORBIDDEN when user cannot modify', async () => {
    queryOneMock.mockResolvedValue({ user_id: 2 })
    
    await expect(requireOrderModifyAccess(1, 1, 'customer')).rejects.toThrow(TRPCError)
    
    try {
      await requireOrderModifyAccess(1, 1, 'customer')
    } catch (error) {
      expect((error as TRPCError).code).toBe('FORBIDDEN')
    }
  })

  it('should allow admin to modify any order', async () => {
    queryOneMock.mockResolvedValue({ user_id: 2 })
    
    await expect(requireOrderModifyAccess(1, 1, 'admin')).resolves.not.toThrow()
  })
})
