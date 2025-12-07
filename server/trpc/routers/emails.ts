import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { query } from '../../db/connection'
import { sendCustomEmail } from '../../utils/email'
import { logger } from '../../utils/logger'

export const emailsRouter = router({
  /**
   * Get email statistics
   */
  stats: adminProcedure
    .query(async () => {
      // Total sent
      const totalResult = await query(
        'SELECT COUNT(*) as count FROM email_logs'
      )
      const totalSent = parseInt(totalResult.rows[0].count)
      
      // Delivered (sent status)
      const deliveredResult = await query(
        `SELECT COUNT(*) as count FROM email_logs WHERE status = 'sent'`
      )
      const delivered = parseInt(deliveredResult.rows[0].count)
      
      // Failed
      const failedResult = await query(
        `SELECT COUNT(*) as count FROM email_logs WHERE status IN ('failed', 'bounced')`
      )
      const failed = parseInt(failedResult.rows[0].count)
      
      // Calculate delivery rate
      const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0
      
      return {
        totalSent,
        delivered,
        failed,
        deliveryRate
      }
    }),

  /**
   * List email logs
   */
  list: adminProcedure
    .input(z.object({
      page: z.number().optional(),
      pageSize: z.number().optional()
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.pageSize ? Math.min(Math.max(1, input.pageSize), 100) : 50
      const offset = input?.page ? (Math.max(1, input.page) - 1) * limit : 0
      
      const result = await query(
        `SELECT 
          id, quote_id, recipient_email as to, subject, email_type,
          status, error_message, sent_at, created_at
        FROM email_logs
        ORDER BY sent_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
      
      return result.rows.map(row => ({
        id: row.id,
        quoteId: row.quote_id,
        to: row.to,
        subject: row.subject,
        emailType: row.email_type,
        status: row.status,
        errorMessage: row.error_message,
        sentAt: row.sent_at?.toISOString() || row.created_at.toISOString()
      }))
    }),

  /**
   * Send custom email
   * Note: This is a placeholder implementation
   * In production, integrate with SendGrid, Postmark, or similar service
   */
  sendCustom: adminProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string(),
      message: z.string(),
      orderId: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // Create HTML email from message
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; white-space: pre-wrap; }
              .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Message from Elite Sports DJ</h1>
              </div>
              <div class="content">
                ${input.message.replace(/\n/g, '<br>')}
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
        
        // Send email using email utility
        const sent = await sendCustomEmail(
          input.to,
          input.subject,
          htmlContent,
          input.orderId
        )
        
        if (sent) {
          logger.info('Custom email sent', { to: input.to, subject: input.subject })
          return {
            success: true,
            message: 'Email sent successfully'
          }
        } else {
          throw new Error('Email service returned false')
        }
      } catch (error: any) {
        logger.error('Failed to send custom email', error, { to: input.to })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email'
        })
      }
    }),

  /**
   * Resend a failed email
   */
  resend: adminProcedure
    .input(z.object({
      logId: z.number()
    }))
    .mutation(async ({ input }) => {
      // Get the original email details
      const result = await query(
        'SELECT recipient_email, subject, email_type FROM email_logs WHERE id = $1',
        [input.logId]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email log not found'
        })
      }
      
      const original = result.rows[0]
      
      try {
        // TODO: Integrate with actual email service
        // For now, just create a new log entry
        
        await query(
          `INSERT INTO email_logs (recipient_email, subject, email_type, status, sent_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [original.recipient_email, original.subject, original.email_type, 'sent']
        )
        
        return {
          success: true,
          message: 'Email resent successfully'
        }
      } catch (error: any) {
        await query(
          `INSERT INTO email_logs (recipient_email, subject, email_type, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [original.recipient_email, original.subject, original.email_type, 'failed', error.message]
        )
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend email'
        })
      }
    })
})
