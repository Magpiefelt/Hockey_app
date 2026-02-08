/**
 * Emails Router (standalone)
 * 
 * NOTE: The admin emails page primarily uses admin.emails routes (admin.ts).
 * This router provides additional email endpoints.
 * 
 * IMPROVED:
 * - Resend now properly reconstructs emails from stored metadata_json
 * - Better error handling and logging
 * - Input validation
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { query } from '../../db/connection'
import { sendCustomEmail, sendOrderConfirmation, sendQuoteEmail, sendInvoiceEmail, sendPaymentReceipt } from '../../utils/email'
import { sendEnhancedQuoteEmail, sendQuoteReminderEmail, sendManualCompletionEmail } from '../../utils/email-enhanced'
import { escapeHtml } from '../../utils/sanitize'
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
          id, quote_id, to_email, subject, template,
          status, error_message, sent_at, created_at
        FROM email_logs
        ORDER BY COALESCE(sent_at, created_at) DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
      
      return result.rows.map(row => ({
        id: row.id,
        quoteId: row.quote_id,
        to: row.to_email,
        subject: row.subject,
        emailType: row.template,
        status: row.status,
        errorMessage: row.error_message,
        sentAt: row.sent_at?.toISOString() || row.created_at?.toISOString()
      }))
    }),

  /**
   * Send custom email
   */
  sendCustom: adminProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string().min(1, 'Subject is required').max(200),
      message: z.string().min(1, 'Message is required'),
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
                ${escapeHtml(input.message).replace(/\n/g, '<br>')}
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
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
        logger.error('Failed to send custom email', { error: error.message, to: input.to })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email: ' + (error.message || 'Unknown error')
        })
      }
    }),

  /**
   * Resend a failed email
   * 
   * IMPROVED: Now properly reconstructs the email from stored metadata_json
   * instead of sending a placeholder message. Falls back to the admin.emails.resend
   * approach if metadata is available.
   */
  resend: adminProcedure
    .input(z.object({
      logId: z.number()
    }))
    .mutation(async ({ input }) => {
      // Get the original email details including metadata
      let hasMetadata = true
      let result
      
      try {
        result = await query(
          'SELECT to_email, subject, template, quote_id, metadata_json FROM email_logs WHERE id = $1',
          [input.logId]
        )
      } catch (err: any) {
        // metadata_json column might not exist
        if (err.code === '42703') {
          hasMetadata = false
          result = await query(
            'SELECT to_email, subject, template, quote_id FROM email_logs WHERE id = $1',
            [input.logId]
          )
        } else {
          throw err
        }
      }
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email log not found'
        })
      }
      
      const original = result.rows[0]
      const metadata = hasMetadata && original.metadata_json ? original.metadata_json : null
      
      try {
        let sent = false
        
        // IMPROVED: Reconstruct the actual email based on template type and stored metadata
        if (metadata) {
          switch (original.template) {
            case 'order_confirmation':
              sent = await sendOrderConfirmation({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                serviceType: metadata.serviceType || 'Service Request',
                orderId: metadata.orderId || original.quote_id
              })
              break
              
            case 'quote':
              sent = await sendQuoteEmail({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                quoteAmount: metadata.quoteAmount || 0,
                packageName: metadata.packageName || 'Service Request',
                orderId: metadata.orderId || original.quote_id
              })
              break
              
            case 'quote_enhanced':
              sent = await sendEnhancedQuoteEmail({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                quoteAmount: metadata.quoteAmount || 0,
                packageName: metadata.packageName || 'Service Request',
                orderId: metadata.orderId || original.quote_id,
                eventDate: metadata.eventDate,
                teamName: metadata.teamName,
                sportType: metadata.sportType,
                adminNotes: metadata.adminNotes
              })
              break
              
            case 'quote_reminder':
              sent = await sendQuoteReminderEmail({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                orderId: metadata.orderId || original.quote_id,
                quoteAmount: metadata.quoteAmount || 0,
                packageName: metadata.packageName || 'Service Request',
                daysOld: metadata.daysOld || 0
              })
              break
              
            case 'invoice':
              sent = await sendInvoiceEmail({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                amount: metadata.amount || 0,
                invoiceUrl: metadata.invoiceUrl || '',
                orderId: metadata.orderId || original.quote_id
              })
              break
              
            case 'receipt':
            case 'payment_receipt':
              sent = await sendPaymentReceipt({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                amount: metadata.amount || 0,
                orderId: metadata.orderId || original.quote_id
              })
              break
              
            case 'manual_completion':
              sent = await sendManualCompletionEmail({
                to: metadata.to || original.to_email,
                name: metadata.name || 'Customer',
                amount: metadata.amount || 0,
                orderId: metadata.orderId || original.quote_id,
                serviceType: metadata.serviceType || 'Service Request',
                adminMessage: metadata.adminMessage
              })
              break
              
            case 'custom':
              sent = await sendCustomEmail(
                original.to_email,
                original.subject,
                metadata.body || metadata.htmlContent || '<p>Email content unavailable</p>',
                original.quote_id
              )
              break
              
            default:
              // Unknown template - send as custom with original subject
              sent = await sendCustomEmail(
                original.to_email,
                original.subject,
                metadata.body || `<p>Resent email (original type: ${original.template})</p>`,
                original.quote_id
              )
          }
        } else {
          // No metadata available - try to reconstruct from order data if we have a quote_id
          if (original.quote_id && (original.template === 'quote' || original.template === 'quote_enhanced')) {
            const orderResult = await query(
              `SELECT contact_name, contact_email, quoted_amount, status FROM quote_requests WHERE id = $1`,
              [original.quote_id]
            )
            
            if (orderResult.rows.length > 0) {
              const order = orderResult.rows[0]
              sent = await sendEnhancedQuoteEmail({
                to: order.contact_email,
                name: order.contact_name,
                quoteAmount: order.quoted_amount || 0,
                packageName: 'Service Request',
                orderId: original.quote_id
              })
            }
          }
          
          // Final fallback: send a basic notification
          if (!sent) {
            sent = await sendCustomEmail(
              original.to_email,
              original.subject,
              `<p>This is a resent notification for your order. Please contact us if you need assistance.</p>`,
              original.quote_id
            )
          }
        }
        
        if (!sent) {
          throw new Error('Email sending returned false')
        }
        
        logger.info('Email resent successfully', { 
          logId: input.logId, 
          recipient: original.to_email,
          template: original.template
        })
        
        return {
          success: true,
          message: 'Email resent successfully'
        }
      } catch (error: any) {
        logger.error('Failed to resend email', { logId: input.logId, error: error.message })
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend email: ' + (error.message || 'Unknown error')
        })
      }
    })
})
