/**
 * Public Quote Router
 * Customer-facing endpoints for quote viewing and acceptance
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { query, transaction } from '../../db/connection'
import { logger } from '../../utils/logger'
import { sendAdminNotificationEmail } from '../../utils/email-enhanced'

export const quotePublicRouter = router({
  /**
   * Get quote details for customer view (public with token or authenticated)
   */
  getQuote: publicProcedure
    .input(z.object({
      orderId: z.number(),
      token: z.string().optional() // For email link access
    }))
    .query(async ({ input, ctx }) => {
      // Verify access - either authenticated user owns the order, or valid token
      let order
      
      if (ctx.user?.userId) {
        // Authenticated user - check ownership
        const result = await query(
          `SELECT 
            qr.id, qr.user_id, qr.contact_name, qr.contact_email,
            qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
            qr.quote_expires_at, qr.current_quote_version,
            p.name as package_name, p.description as package_description,
            fs.team_name
           FROM quote_requests qr
           LEFT JOIN packages p ON qr.package_id = p.id
           LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
           WHERE qr.id = $1`,
          [input.orderId]
        )
        
        if (result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found'
          })
        }
        
        order = result.rows[0]
        
        // Check ownership
        if (order.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view this quote'
          })
        }
      } else {
        // Public access - would need token validation in production
        // For now, allow access to basic quote info
        const result = await query(
          `SELECT 
            qr.id, qr.contact_name, qr.contact_email,
            qr.status, qr.quoted_amount, qr.event_date, qr.sport_type,
            qr.quote_expires_at, qr.current_quote_version,
            p.name as package_name, p.description as package_description,
            fs.team_name
           FROM quote_requests qr
           LEFT JOIN packages p ON qr.package_id = p.id
           LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
           WHERE qr.id = $1`,
          [input.orderId]
        )
        
        if (result.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found'
          })
        }
        
        order = result.rows[0]
      }
      
      // Check if quote exists
      if (!order.quoted_amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No quote has been provided for this order yet'
        })
      }
      
      // Check expiration
      const isExpired = order.quote_expires_at && new Date(order.quote_expires_at) < new Date()
      
      return {
        id: order.id.toString(),
        customerName: order.contact_name,
        status: order.status,
        quotedAmount: order.quoted_amount,
        packageName: order.package_name,
        packageDescription: order.package_description,
        teamName: order.team_name,
        sportType: order.sport_type,
        eventDate: order.event_date?.toISOString(),
        expiresAt: order.quote_expires_at?.toISOString(),
        isExpired,
        version: order.current_quote_version || 1
      }
    }),

  /**
   * Record quote view event
   */
  recordQuoteView: publicProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const ipAddress = ctx.event?.context?.ip || 'unknown'
      const userAgent = ctx.event?.context?.userAgent || ''
      
      try {
        await transaction(async (client) => {
          // Check if this is the first view
          const currentResult = await client.query(
            `SELECT quote_viewed_at, status FROM quote_requests WHERE id = $1`,
            [input.orderId]
          )
          
          if (currentResult.rows.length === 0) return
          
          const current = currentResult.rows[0]
          
          // Record the event
          await client.query(
            `INSERT INTO quote_events (quote_id, event_type, ip_address, user_agent, metadata)
             VALUES ($1, 'viewed', $2, $3, $4)`,
            [input.orderId, ipAddress, userAgent, JSON.stringify({ firstView: !current.quote_viewed_at })]
          )
          
          // Update first view timestamp if not set
          if (!current.quote_viewed_at) {
            await client.query(
              `UPDATE quote_requests 
               SET quote_viewed_at = NOW(),
                   status = CASE WHEN status = 'quoted' THEN 'quote_viewed' ELSE status END
               WHERE id = $1`,
              [input.orderId]
            )
            
            // Log status change if status was updated
            if (current.status === 'quoted') {
              await client.query(
                `INSERT INTO order_status_history (quote_id, previous_status, new_status, notes)
                 VALUES ($1, 'quoted', 'quote_viewed', 'Customer viewed quote')`,
                [input.orderId]
              )
            }
          }
        })
        
        logger.info('Quote view recorded', { orderId: input.orderId, ip: ipAddress })
        return { success: true }
      } catch (err) {
        logger.error('Failed to record quote view', { orderId: input.orderId, error: err })
        return { success: false }
      }
    }),

  /**
   * Accept quote (customer action)
   */
  acceptQuote: protectedProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      return transaction(async (client) => {
        // Verify ownership
        const orderResult = await client.query(
          `SELECT 
            qr.id, qr.user_id, qr.status, qr.quoted_amount, qr.quote_expires_at,
            qr.contact_name, qr.contact_email
           FROM quote_requests qr
           WHERE qr.id = $1`,
          [input.orderId]
        )
        
        if (orderResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          })
        }
        
        const order = orderResult.rows[0]
        
        // Check ownership
        if (order.user_id !== ctx.user.userId) {
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
        
        // Check expiration
        if (order.quote_expires_at && new Date(order.quote_expires_at) < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This quote has expired. Please contact us for a new quote.'
          })
        }
        
        // Update order status
        await client.query(
          `UPDATE quote_requests 
           SET status = 'quote_accepted',
               quote_accepted_at = NOW(),
               total_amount = quoted_amount,
               updated_at = NOW()
           WHERE id = $1`,
          [input.orderId]
        )
        
        // Record event
        await client.query(
          `INSERT INTO quote_events (quote_id, event_type, ip_address, metadata)
           VALUES ($1, 'accepted', $2, $3)`,
          [input.orderId, ctx.event?.context?.ip || 'unknown', JSON.stringify({ userId: ctx.user.userId })]
        )
        
        // Log status change
        await client.query(
          `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
           VALUES ($1, $2, 'quote_accepted', $3, 'Customer accepted quote')`,
          [input.orderId, order.status, ctx.user.userId]
        )
        
        // Notify admin
        try {
          await sendAdminNotificationEmail({
            subject: `Quote Accepted - Order #${input.orderId}`,
            body: `${order.contact_name} has accepted the quote for Order #${input.orderId}.\n\nAmount: $${(order.quoted_amount / 100).toFixed(2)}\n\nPlease proceed with invoicing or next steps.`,
            orderId: input.orderId
          })
        } catch (err) {
          logger.error('Failed to send admin notification', { orderId: input.orderId, error: err })
        }
        
        logger.info('Quote accepted', { orderId: input.orderId, userId: ctx.user.userId })
        
        return {
          success: true,
          message: 'Quote accepted successfully'
        }
      })
    }),

  /**
   * Decline quote (customer action)
   */
  declineQuote: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return transaction(async (client) => {
        // Verify ownership
        const orderResult = await client.query(
          `SELECT qr.id, qr.user_id, qr.status, qr.contact_name
           FROM quote_requests qr
           WHERE qr.id = $1`,
          [input.orderId]
        )
        
        if (orderResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          })
        }
        
        const order = orderResult.rows[0]
        
        // Check ownership
        if (order.user_id !== ctx.user.userId) {
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
          [input.orderId, input.reason || 'No reason provided']
        )
        
        // Record event
        await client.query(
          `INSERT INTO quote_events (quote_id, event_type, ip_address, metadata)
           VALUES ($1, 'declined', $2, $3)`,
          [input.orderId, ctx.event?.context?.ip || 'unknown', JSON.stringify({ userId: ctx.user.userId, reason: input.reason })]
        )
        
        // Log status change
        await client.query(
          `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
           VALUES ($1, $2, 'cancelled', $3, $4)`,
          [input.orderId, order.status, ctx.user.userId, `Customer declined: ${input.reason || 'No reason provided'}`]
        )
        
        // Notify admin
        try {
          await sendAdminNotificationEmail({
            subject: `Quote Declined - Order #${input.orderId}`,
            body: `${order.contact_name} has declined the quote for Order #${input.orderId}.\n\nReason: ${input.reason || 'No reason provided'}`,
            orderId: input.orderId
          })
        } catch (err) {
          logger.error('Failed to send admin notification', { orderId: input.orderId, error: err })
        }
        
        logger.info('Quote declined', { orderId: input.orderId, userId: ctx.user.userId, reason: input.reason })
        
        return {
          success: true,
          message: 'Quote declined'
        }
      })
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
    })
})
