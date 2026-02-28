/**
 * Contact Router
 * Handles contact form submissions
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { query } from '../../db/connection'
import { logger } from '../../utils/logger'
import { sanitizeEmail, sanitizeString, sanitizePhone } from '../../utils/sanitize'
import { isValidEmail } from '../../utils/validation'
import { rateLimit } from '../middleware/rateLimit'
import { sendContactNotificationEmail } from '../../utils/email-enhanced'

export const contactRouter = router({
  /**
   * Submit contact form
   */
  submit: publicProcedure
    .use(rateLimit({
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier: (ctx) => ctx.event?.context?.ip || 'unknown',
      message: 'Too many contact form submissions. Please try again later.'
    }))
    .input(z.object({
      name: z.string().min(1, 'Name is required').max(100),
      email: z.string().email('Invalid email address'),
      phone: z.string().optional(),
      subject: z.string().min(1, 'Subject is required').max(200),
      message: z.string().min(10, 'Message must be at least 10 characters').max(5000)
    }))
    .mutation(async ({ input, ctx }) => {
      // Sanitize inputs
      const name = sanitizeString(input.name)
      const email = sanitizeEmail(input.email)
      const phone = input.phone ? sanitizePhone(input.phone) : null
      const subject = sanitizeString(input.subject)
      const message = sanitizeString(input.message)
      
      // Validate email format
      if (!isValidEmail(email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email format'
        })
      }
      
      logger.info('Contact form submission', { email, subject })
      
      try {
        // Store submission in database - handle missing table
        let submissionId = 0
        try {
          const result = await query(
            `INSERT INTO contact_submissions (name, email, phone, subject, message, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, created_at`,
            [
              name,
              email,
              phone,
              subject,
              message,
              ctx.event?.context?.ip || null,
              ctx.event?.context?.userAgent || null
            ]
          )
          submissionId = result.rows[0]?.id || 0
        } catch (dbErr: any) {
          // If table doesn't exist, just log and continue (email will still be sent)
          logger.warn('contact_submissions table may not exist yet', { error: dbErr.message })
        }
        
        // Send notification email to admin using centralized Mailgun utility (non-blocking)
        sendContactNotificationEmail({
          name,
          email,
          phone: phone || undefined,
          subject,
          message,
          submissionId
        }).catch((err) => {
          logger.error('Failed to send contact notification', { error: err.message })
        })
        
        logger.info('Contact form submitted successfully', { 
          submissionId,
          email 
        })
        
        return {
          success: true,
          message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
          submissionId
        }
      } catch (error: any) {
        logger.error('Contact form submission error', { error: error.message, email })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit contact form. Please try again or email us directly.'
        })
      }
    }),

  /**
   * List contact submissions (admin only)
   */
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.enum(['new', 'read', 'replied', 'archived']).optional()
    }).optional())
    .query(async ({ input, ctx }) => {
      // Check admin authorization
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required'
        })
      }
      
      const limit = input?.limit || 50
      const offset = input?.offset || 0
      const status = input?.status
      
      // Build parameterized query — status filter uses $3 when present
      const hasStatusFilter = !!status
      const whereClause = hasStatusFilter ? 'WHERE status = $3' : ''
      const listParams: any[] = hasStatusFilter ? [limit, offset, status] : [limit, offset]
      
      try {
        const result = await query(
          `SELECT id, name, email, phone, subject, message, status, created_at, read_at
           FROM contact_submissions
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
          listParams
        )
        
        // Count query also uses parameterized status filter
        const countParams: any[] = hasStatusFilter ? [status] : []
        const countWhere = hasStatusFilter ? 'WHERE status = $1' : ''
        const countResult = await query(
          `SELECT COUNT(*) as total FROM contact_submissions ${countWhere}`,
          countParams
        )
        
        const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0
        
        return {
          submissions: result.rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            subject: row.subject,
            message: row.message,
            status: row.status,
            createdAt: row.created_at?.toISOString() || null,
            readAt: row.read_at?.toISOString() || null
          })),
          total,
          limit,
          offset
        }
      } catch (err: any) {
        // Table may not exist yet — return empty rather than crashing
        logger.warn('Failed to list contact submissions', { error: err.message })
        return {
          submissions: [],
          total: 0,
          limit,
          offset
        }
      }
    }),

  /**
   * Mark submission as read (admin only)
   */
  markAsRead: publicProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Check admin authorization
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required'
        })
      }
      
      try {
        await query(
          `UPDATE contact_submissions 
           SET status = 'read', read_at = NOW()
           WHERE id = $1 AND status = 'new'`,
          [input.id]
        )
      } catch (err: any) {
        logger.warn('Failed to mark contact submission as read', { error: err.message })
      }
      
      return { success: true }
    }),

  /**
   * Mark submission as replied (admin only)
   */
  markAsReplied: publicProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required'
        })
      }
      
      try {
        await query(
          `UPDATE contact_submissions 
           SET status = 'replied'
           WHERE id = $1 AND status IN ('new', 'read')`,
          [input.id]
        )
      } catch (err: any) {
        logger.warn('Failed to mark contact submission as replied', { error: err.message })
      }
      
      return { success: true }
    }),

  /**
   * Archive a submission (admin only)
   */
  archive: publicProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required'
        })
      }
      
      try {
        await query(
          `UPDATE contact_submissions 
           SET status = 'archived'
           WHERE id = $1`,
          [input.id]
        )
      } catch (err: any) {
        logger.warn('Failed to archive contact submission', { error: err.message })
      }
      
      return { success: true }
    })
})
