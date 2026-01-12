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

// Email sending utility
async function sendContactNotificationEmail(data: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  submissionId: number
}): Promise<boolean> {
  try {
    const config = useRuntimeConfig()
    const nodemailer = await import('nodemailer')
    
    // Check if SMTP is configured
    if (!config.smtpHost || !config.smtpUser) {
      logger.warn('SMTP not configured, skipping contact notification email')
      return false
    }
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort || '587'),
      secure: config.smtpPort === '465',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    })
    
    const adminEmail = config.adminEmail || config.smtpUser
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
          .value { margin-top: 5px; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Contact Form Submission</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">Submission #${data.submissionId}</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From</div>
              <div class="value">${data.name} &lt;${data.email}&gt;</div>
            </div>
            ${data.phone ? `
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${data.phone}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${data.subject}</div>
            </div>
            <div class="message-box">
              <div class="label">Message</div>
              <div class="value" style="white-space: pre-wrap;">${data.message}</div>
            </div>
            <p style="margin-top: 20px; text-align: center;">
              <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" 
                 style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reply to ${data.name}
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This message was sent via the Elite Sports DJ contact form.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    await transporter.sendMail({
      from: `"Elite Sports DJ" <${config.smtpUser}>`,
      to: adminEmail,
      replyTo: data.email,
      subject: `[Contact Form] ${data.subject}`,
      html
    })
    
    logger.info('Contact notification email sent', { submissionId: data.submissionId })
    return true
  } catch (error: any) {
    logger.error('Failed to send contact notification email', { error: error.message })
    return false
  }
}

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
        // Store submission in database
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
        
        const submission = result.rows[0]
        
        // Send notification email to admin (non-blocking)
        sendContactNotificationEmail({
          name,
          email,
          phone: phone || undefined,
          subject,
          message,
          submissionId: submission.id
        }).catch((err) => {
          logger.error('Failed to send contact notification', { error: err.message })
        })
        
        logger.info('Contact form submitted successfully', { 
          submissionId: submission.id,
          email 
        })
        
        return {
          success: true,
          message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
          submissionId: submission.id
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
      
      let whereClause = ''
      const params: any[] = [limit, offset]
      
      if (input?.status) {
        whereClause = 'WHERE status = $3'
        params.push(input.status)
      }
      
      const result = await query(
        `SELECT id, name, email, phone, subject, message, status, created_at, read_at
         FROM contact_submissions
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      )
      
      const countResult = await query(
        `SELECT COUNT(*) as total FROM contact_submissions ${whereClause}`,
        input?.status ? [input.status] : []
      )
      
      return {
        submissions: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          subject: row.subject,
          message: row.message,
          status: row.status,
          createdAt: row.created_at.toISOString(),
          readAt: row.read_at?.toISOString()
        })),
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
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
      
      await query(
        `UPDATE contact_submissions 
         SET status = 'read', read_at = NOW()
         WHERE id = $1 AND status = 'new'`,
        [input.id]
      )
      
      return { success: true }
    })
})
