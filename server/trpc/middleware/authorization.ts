/**
 * Authorization Middleware
 * Provides reusable authorization checks for tRPC procedures
 * 
 * This middleware ensures authorization checks happen BEFORE data fetching
 * to prevent unauthorized data access.
 */
import { TRPCError } from '@trpc/server'
import { queryOne } from '../../utils/database'
import { logger } from '../../utils/logger'

/**
 * Resource ownership verification result
 */
interface OwnershipResult {
  exists: boolean
  isOwner: boolean
  ownerId: number | null
}

/**
 * Verify ownership of an order/quote request
 * This should be called BEFORE fetching full order details
 */
export async function verifyOrderOwnership(
  orderId: number,
  userId: number,
  userRole: string
): Promise<OwnershipResult> {
  const result = await queryOne<{ user_id: number | null }>(
    'SELECT user_id FROM quote_requests WHERE id = $1',
    [orderId]
  )

  if (!result) {
    return { exists: false, isOwner: false, ownerId: null }
  }

  const isOwner = result.user_id === userId || userRole === 'admin'
  
  return {
    exists: true,
    isOwner,
    ownerId: result.user_id
  }
}

/**
 * Verify ownership of a file upload
 */
export async function verifyFileOwnership(
  fileId: number,
  userId: number,
  userRole: string
): Promise<OwnershipResult> {
  const result = await queryOne<{ uploaded_by: number | null; quote_id: number | null }>(
    `SELECT fu.uploaded_by, fu.quote_id 
     FROM file_uploads fu
     WHERE fu.id = $1`,
    [fileId]
  )

  if (!result) {
    return { exists: false, isOwner: false, ownerId: null }
  }

  // Check if user owns the file directly or owns the associated order
  let isOwner = result.uploaded_by === userId || userRole === 'admin'
  
  if (!isOwner && result.quote_id) {
    const orderOwnership = await verifyOrderOwnership(result.quote_id, userId, userRole)
    isOwner = orderOwnership.isOwner
  }

  return {
    exists: true,
    isOwner,
    ownerId: result.uploaded_by
  }
}

/**
 * Assert that user has access to a resource
 * Throws TRPCError if not authorized
 */
export function assertResourceAccess(
  ownership: OwnershipResult,
  resourceName: string,
  context: { userId: number; resourceId: number }
): void {
  if (!ownership.exists) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${resourceName} not found`
    })
  }

  if (!ownership.isOwner) {
    logger.warn('Unauthorized resource access attempt', {
      resourceName,
      resourceId: context.resourceId,
      userId: context.userId,
      ownerId: ownership.ownerId
    })
    
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Not authorized to access this ${resourceName.toLowerCase()}`
    })
  }
}

/**
 * Combined ownership check and assertion
 * Use this as a one-liner in procedures
 */
export async function requireOrderAccess(
  orderId: number,
  userId: number,
  userRole: string
): Promise<void> {
  const ownership = await verifyOrderOwnership(orderId, userId, userRole)
  assertResourceAccess(ownership, 'Order', { userId, resourceId: orderId })
}

/**
 * Combined file ownership check and assertion
 */
export async function requireFileAccess(
  fileId: number,
  userId: number,
  userRole: string
): Promise<void> {
  const ownership = await verifyFileOwnership(fileId, userId, userRole)
  assertResourceAccess(ownership, 'File', { userId, resourceId: fileId })
}

/**
 * Check if user can modify a resource (stricter than view access)
 * Admins can always modify, but regular users can only modify their own resources
 */
export async function requireOrderModifyAccess(
  orderId: number,
  userId: number,
  userRole: string
): Promise<void> {
  const ownership = await verifyOrderOwnership(orderId, userId, userRole)
  
  if (!ownership.exists) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found'
    })
  }

  // For modifications, we might want stricter rules
  // e.g., only owner or admin can modify, not just view
  if (!ownership.isOwner) {
    logger.warn('Unauthorized order modification attempt', {
      orderId,
      userId,
      ownerId: ownership.ownerId
    })
    
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not authorized to modify this order'
    })
  }
}
