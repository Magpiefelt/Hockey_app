/**
 * Public Quote Router
 * Customer-facing endpoints for quote viewing and acceptance
 * Supports both authenticated access and token-based access from email links
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { query, transaction } from '../../db/connection'
import { logger } from '../../utils/logger'
import { sendAdminNotificationEmail } from '../../utils/email-enhanced'
import { validateQuoteToken } from '../../utils/quote-tokens'

export const quotePublicRouter = router({
  /**
   * Get quote details for customer view (authenticated)
   */
  getQuote: protectedProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      // Use a safe query that handles missing columns
      let result
      try {
        result = await query(
          `SELECT 
            qr.id, qr.user_id, qr.contact_name, qr.contact_email,
            qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
            qr.quote_expires_at, qr.current_quote_version, qr.admin_notes,
            qr.event_datetime, qr.event_time,
            p.name as package_name, p.description as package_description,
            fs.team_name
           FROM quote_requests qr
           LEFT JOIN packages p ON qr.package_id = p.id
           LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
           WHERE qr.id = $1`,
          [input.orderId]
        )
      } catch {
        // Fallback if new columns or tables don't exist yet
        try {
          result = await query(
            `SELECT 
              qr.id, qr.user_id, qr.contact_name, qr.contact_email,
              qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
              qr.admin_notes,
              NULL as quote_expires_at, 1 as current_quote_version,
              NULL as event_datetime, NULL as event_time,
              p.name as package_name, p.description as package_description,
              NULL as team_name
             FROM quote_requests qr
             LEFT JOIN packages p ON qr.package_id = p.id
             WHERE qr.id = $1`,
            [input.orderId]
          )
        } catch {
          // Final fallback without organization/notes columns
          result = await query(
            `SELECT 
              qr.id, qr.user_id, qr.contact_name, qr.contact_email,
              qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
              qr.admin_notes,
              NULL as quote_expires_at, 1 as current_quote_version,
              NULL as event_datetime, NULL as event_time,
              p.name as package_name, p.description as package_description,
              NULL as team_name
             FROM quote_requests qr
             LEFT JOIN packages p ON qr.package_id = p.id
             WHERE qr.id = $1`,
            [input.orderId]
          )
        }
      }
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found'
        })
      }
      
      const order = result.rows[0]
      
      // Check ownership
      if (order.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to view this quote'
        })
      }
      
      // Check if quote exists
      if (!order.quoted_amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No quote has been provided for this order yet'
        })
      }
      
      // Note: Quote expiration is no longer enforced
      const isExpired = false
      
      // Get latest quote notes from revisions if available
      let quoteNotes = null
      try {
        const notesResult = await query(
          `SELECT notes FROM quote_revisions 
           WHERE quote_id = $1 
           ORDER BY version DESC LIMIT 1`,
          [input.orderId]
        )
        if (notesResult.rows.length > 0) {
          quoteNotes = notesResult.rows[0].notes
        }
      } catch (err) {
        // Table might not exist
      }
      
      return {
        id: order.id.toString(),
        customerName: order.contact_name,
        customerEmail: order.contact_email,
        status: order.status,
        quotedAmount: order.quoted_amount,
        packageName: order.package_name,
        packageDescription: order.package_description,
        teamName: order.team_name,
        sportType: order.sport_type,
        eventDate: order.event_date?.toISOString(),
        eventDateTime: order.event_datetime?.toISOString() || null,
        eventTime: order.event_time || null,
        expiresAt: order.quote_expires_at?.toISOString() || null,
        isExpired,
        version: order.current_quote_version || 1,
        notes: quoteNotes
      }
    }),

  /**
   * Get quote details using token (for email link access - no auth required)
   */
  getQuoteWithToken: publicProcedure
    .input(z.object({
      orderId: z.number(),
      token: z.string()
    }))
    .query(async ({ input }) => {
      // Validate token
      const tokenValidation = validateQuoteToken(input.token)
      
      if (!tokenValidation.valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: tokenValidation.error || 'Invalid or expired access token'
        })
      }
      
      // Verify token matches the requested order
      if (tokenValidation.orderId !== input.orderId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Token does not match the requested order'
        })
      }
      
      let result
      try {
        result = await query(
          `SELECT 
            qr.id, qr.contact_name, qr.contact_email,
            qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
            qr.quote_expires_at, qr.current_quote_version,
            qr.event_datetime, qr.event_time,
            p.name as package_name, p.description as package_description,
            fs.team_name
           FROM quote_requests qr
           LEFT JOIN packages p ON qr.package_id = p.id
           LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
           WHERE qr.id = $1`,
          [input.orderId]
        )
      } catch {
        // Fallback if new columns or tables don't exist yet
        try {
          result = await query(
            `SELECT 
              qr.id, qr.contact_name, qr.contact_email,
              qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
              NULL as quote_expires_at, 1 as current_quote_version,
              NULL as event_datetime, NULL as event_time,
              p.name as package_name, p.description as package_description,
              NULL as team_name
             FROM quote_requests qr
             LEFT JOIN packages p ON qr.package_id = p.id
             WHERE qr.id = $1`,
            [input.orderId]
          )
        } catch {
          result = await query(
            `SELECT 
              qr.id, qr.contact_name, qr.contact_email,
              qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
              NULL as quote_expires_at, 1 as current_quote_version,
              NULL as event_datetime, NULL as event_time,
              p.name as package_name, p.description as package_description,
              NULL as team_name
             FROM quote_requests qr
             LEFT JOIN packages p ON qr.package_id = p.id
             WHERE qr.id = $1`,
            [input.orderId]
          )
        }
      }
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found'
        })
      }
      
      const order = result.rows[0]
      
      // Verify email matches
      if (order.contact_email.toLowerCase() !== tokenValidation.email?.toLowerCase()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Token does not match the order email'
        })
      }
      
      // Check if quote exists
      if (!order.quoted_amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No quote has been provided for this order yet'
        })
      }
      
      // Note: Quote expiration is no longer enforced
      const isExpired = false
      
      // Get latest quote notes from revisions if available
      let quoteNotes = null
      try {
        const notesResult = await query(
          `SELECT notes FROM quote_revisions 
           WHERE quote_id = $1 
           ORDER BY version DESC LIMIT 1`,
          [input.orderId]
        )
        if (notesResult.rows.length > 0) {
          quoteNotes = notesResult.rows[0].notes
        }
      } catch (err) {
        // Table might not exist
      }
      
      logger.info('Quote accessed via email token', { orderId: input.orderId })
      
      return {
        id: order.id.toString(),
        customerName: order.contact_name,
        customerEmail: order.contact_email,
        status: order.status,
        quotedAmount: order.quoted_amount,
        packageName: order.package_name,
        packageDescription: order.package_description,
        teamName: order.team_name,
        sportType: order.sport_type,
        eventDate: order.event_date?.toISOString(),
        eventDateTime: order.event_datetime?.toISOString() || null,
        eventTime: order.event_time || null,
        expiresAt: order.quote_expires_at?.toISOString() || null,
        isExpired,
        version: order.current_quote_version || 1,
        notes: quoteNotes
      }
    }),

  /**
   * Record quote view event (authenticated)
   */
  recordQuoteView: protectedProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      return recordQuoteViewInternal(input.orderId, ctx.event?.context?.ip, ctx.event?.context?.userAgent, ctx.user?.userId)
    }),

  /**
   * Record quote view event with token (for email link access)
   */
  recordQuoteViewWithToken: publicProcedure
    .input(z.object({
      orderId: z.number(),
      token: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate token
      const tokenValidation = validateQuoteToken(input.token)
      
      if (!tokenValidation.valid || tokenValidation.orderId !== input.orderId) {
        return { success: false }
      }
      
      return recordQuoteViewInternal(input.orderId, ctx.event?.context?.ip, ctx.event?.context?.userAgent, undefined, 'email_link')
    }),

  /**
   * Accept quote (authenticated customer action)
   */
  acceptQuote: protectedProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      return acceptQuoteInternal(input.orderId, ctx.user.userId, ctx.event?.context?.ip, true)
    }),

  /**
   * Accept quote with token (for email link access)
   */
  acceptQuoteWithToken: publicProcedure
    .input(z.object({
      orderId: z.number(),
      token: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate token
      const tokenValidation = validateQuoteToken(input.token)
      
      if (!tokenValidation.valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: tokenValidation.error || 'Invalid or expired access token'
        })
      }
      
      if (tokenValidation.orderId !== input.orderId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Token does not match the requested order'
        })
      }
      
      // Verify email matches
      const orderResult = await query(
        `SELECT contact_email, user_id FROM quote_requests WHERE id = $1`,
        [input.orderId]
      )
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      if (orderResult.rows[0].contact_email.toLowerCase() !== tokenValidation.email?.toLowerCase()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Token does not match the order email'
        })
      }
      
      return acceptQuoteInternal(input.orderId, orderResult.rows[0].user_id, ctx.event?.context?.ip, false)
    }),

  /**
   * Decline quote (authenticated customer action)
   */
  declineQuote: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return declineQuoteInternal(input.orderId, ctx.user.userId, input.reason, ctx.event?.context?.ip, true)
    }),

  /**
   * Decline quote with token (for email link access)
   */
  declineQuoteWithToken: publicProcedure
    .input(z.object({
      orderId: z.number(),
      token: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate token
      const tokenValidation = validateQuoteToken(input.token)
      
      if (!tokenValidation.valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: tokenValidation.error || 'Invalid or expired access token'
        })
      }
      
      if (tokenValidation.orderId !== input.orderId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Token does not match the requested order'
        })
      }
      
      // Verify email matches
      const orderResult = await query(
        `SELECT contact_email, user_id FROM quote_requests WHERE id = $1`,
        [input.orderId]
      )
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      if (orderResult.rows[0].contact_email.toLowerCase() !== tokenValidation.email?.toLowerCase()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Token does not match the order email'
        })
      }
      
      return declineQuoteInternal(input.orderId, orderResult.rows[0].user_id, input.reason, ctx.event?.context?.ip, false)
    }),

  /**
   * Get quote revision history (customer view)
   */
  getRevisionHistory: protectedProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      // Verify ownership
      const orderResult = await query(
        `SELECT user_id FROM quote_requests WHERE id = $1`,
        [input.orderId]
      )
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      if (orderResult.rows[0].user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to view this order'
        })
      }
      
      try {
        const result = await query(
          `SELECT 
            version,
            amount_cents,
            notes,
            created_at
           FROM quote_revisions
           WHERE quote_id = $1
           ORDER BY version DESC`,
          [input.orderId]
        )
        
        return result.rows.map(row => ({
          version: row.version,
          amount: row.amount_cents,
          notes: row.notes,
          createdAt: row.created_at.toISOString()
        }))
      } catch {
        // quote_revisions table may not exist yet
        return []
      }
    })
})

// Internal helper functions

async function recordQuoteViewInternal(
  orderId: number, 
  ipAddress?: string, 
  userAgent?: string, 
  userId?: number,
  source: string = 'authenticated'
): Promise<{ success: boolean }> {
  const ip = ipAddress || 'unknown'
  const ua = userAgent || ''
  
  try {
    await transaction(async (client) => {
      // Check current status
      const currentResult = await client.query(
        `SELECT status FROM quote_requests WHERE id = $1`,
        [orderId]
      )
      
      if (currentResult.rows.length === 0) return
      
      const current = currentResult.rows[0]
      
      // Try to record the event in quote_events table
      try {
        await client.query(
          `INSERT INTO quote_events (quote_id, event_type, ip_address, user_agent, metadata)
           VALUES ($1, 'viewed', $2, $3, $4)`,
          [orderId, ip, ua, JSON.stringify({ source, userId })]
        )
      } catch {
        // quote_events table may not exist yet - that's ok
      }
      
      // Try to update quote_viewed_at if column exists
      try {
        await client.query(
          `UPDATE quote_requests 
           SET quote_viewed_at = COALESCE(quote_viewed_at, NOW()),
               status = CASE WHEN status = 'quoted' THEN 'quote_viewed' ELSE status END
           WHERE id = $1`,
          [orderId]
        )
        
        // Log status change if status was updated
        if (current.status === 'quoted') {
          await client.query(
            `INSERT INTO order_status_history (quote_id, previous_status, new_status, notes)
             VALUES ($1, 'quoted', 'quote_viewed', $2)`,
            [orderId, `Customer viewed quote via ${source}`]
          )
        }
      } catch {
        // quote_viewed_at column may not exist yet - that's ok
      }
    })
    
    logger.info('Quote view recorded', { orderId, ip, source })
    return { success: true }
  } catch (err) {
    logger.error('Failed to record quote view', { orderId, error: err })
    return { success: false }
  }
}

async function acceptQuoteInternal(
  orderId: number, 
  userId: number, 
  ipAddress?: string,
  isAuthenticated: boolean = true
): Promise<{ success: boolean; message: string }> {
  return transaction(async (client) => {
    // Get order details
    const orderResult = await client.query(
      `SELECT 
        qr.id, qr.user_id, qr.status, qr.quoted_amount, qr.quote_expires_at,
        qr.contact_name, qr.contact_email
       FROM quote_requests qr
       WHERE qr.id = $1`,
      [orderId]
    )
    
    if (orderResult.rows.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found'
      })
    }
    
    const order = orderResult.rows[0]
    
    // Check ownership if authenticated
    if (isAuthenticated && order.user_id !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to accept this quote'
      })
    }
    
    // Check if quote exists
    if (!order.quoted_amount) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No quote exists for this order'
      })
    }
    
    // Check if already accepted or in later status
    const acceptedStatuses = ['quote_accepted', 'invoiced', 'paid', 'in_progress', 'completed', 'delivered']
    if (acceptedStatuses.includes(order.status)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This quote has already been accepted'
      })
    }
    
    // Note: Quote expiration check removed - quotes no longer expire
    // The quote_expires_at field is kept for historical data but not enforced
    
    // Update order status - handle missing columns
    try {
      await client.query(
        `UPDATE quote_requests 
         SET status = 'quote_accepted',
             quote_accepted_at = NOW(),
             total_amount = quoted_amount,
             updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      )
    } catch {
      // quote_accepted_at may not exist yet
      await client.query(
        `UPDATE quote_requests 
         SET status = 'quote_accepted',
             total_amount = quoted_amount,
             updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      )
    }
    
    // Record event - handle missing table
    try {
      await client.query(
        `INSERT INTO quote_events (quote_id, event_type, ip_address, metadata)
         VALUES ($1, 'accepted', $2, $3)`,
        [orderId, ipAddress || 'unknown', JSON.stringify({ userId, authenticated: isAuthenticated })]
      )
    } catch {
      // quote_events table may not exist yet
    }
    
    // Log status change
    await client.query(
      `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
       VALUES ($1, $2, 'quote_accepted', $3, $4)`,
      [orderId, order.status, userId, `Customer accepted quote${isAuthenticated ? '' : ' via email link'}`]
    )
    
    // Notify admin
    try {
      await sendAdminNotificationEmail({
        subject: `Quote Accepted - Order #${orderId}`,
        body: `${order.contact_name} has accepted the quote for Order #${orderId}.\n\nAmount: $${(order.quoted_amount / 100).toFixed(2)}\n\nPlease proceed with invoicing or next steps.`,
        orderId: orderId
      })
    } catch (err) {
      logger.error('Failed to send admin notification', { orderId, error: err })
    }
    
    logger.info('Quote accepted', { orderId, userId, authenticated: isAuthenticated })
    
    return {
      success: true,
      message: 'Quote accepted successfully'
    }
  })
}

async function declineQuoteInternal(
  orderId: number, 
  userId: number, 
  reason?: string,
  ipAddress?: string,
  isAuthenticated: boolean = true
): Promise<{ success: boolean; message: string }> {
  return transaction(async (client) => {
    // Get order details
    const orderResult = await client.query(
      `SELECT qr.id, qr.user_id, qr.status, qr.contact_name
       FROM quote_requests qr
       WHERE qr.id = $1`,
      [orderId]
    )
    
    if (orderResult.rows.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found'
      })
    }
    
    const order = orderResult.rows[0]
    
    // Check ownership if authenticated
    if (isAuthenticated && order.user_id !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to decline this quote'
      })
    }
    
    // Update order status
    await client.query(
      `UPDATE quote_requests 
       SET status = 'cancelled',
           admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n\nCustomer declined quote: ', $2),
           updated_at = NOW()
       WHERE id = $1`,
      [orderId, reason || 'No reason provided']
    )
    
    // Record event - handle missing table
    try {
      await client.query(
        `INSERT INTO quote_events (quote_id, event_type, ip_address, metadata)
         VALUES ($1, 'declined', $2, $3)`,
        [orderId, ipAddress || 'unknown', JSON.stringify({ userId, reason, authenticated: isAuthenticated })]
      )
    } catch {
      // quote_events table may not exist yet
    }
    
    // Log status change
    await client.query(
      `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
       VALUES ($1, $2, 'cancelled', $3, $4)`,
      [orderId, order.status, userId, `Customer declined${isAuthenticated ? '' : ' via email link'}: ${reason || 'No reason provided'}`]
    )
    
    // Notify admin
    try {
      await sendAdminNotificationEmail({
        subject: `Quote Declined - Order #${orderId}`,
        body: `${order.contact_name} has declined the quote for Order #${orderId}.\n\nReason: ${reason || 'No reason provided'}`,
        orderId: orderId
      })
    } catch (err) {
      logger.error('Failed to send admin notification', { orderId, error: err })
    }
    
    logger.info('Quote declined', { orderId, userId, reason, authenticated: isAuthenticated })
    
    return {
      success: true,
      message: 'Quote declined'
    }
  })
}
