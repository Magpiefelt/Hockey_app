import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../../trpc'
import { query } from '../../../db/connection'
import { sendCustomEmail, sendEmail, sendOrderConfirmation, sendInvoiceEmail, sendPaymentReceipt } from '../../../utils/email'
import { sendEnhancedQuoteEmail } from '../../../utils/email-enhanced'
import { logger } from '../../../utils/logger'
import {
  analyzeManagedEmailTemplateDraft,
  getManagedEmailTemplateDefinitions,
  getManagedEmailGlobalVariables,
  listManagedEmailTemplates,
  previewManagedEmailTemplate,
  resetManagedEmailTemplate,
  saveManagedEmailTemplate
} from '../../../services/emailTemplateService'

export const adminEmailsRouter = router({
  list: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'queued', 'sent', 'failed']).optional(),
      template: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0)
    }).optional())
    .query(async ({ input = {} }) => {
      let sql = `
        SELECT 
          el.id,
          el.quote_id as order_id,
          COALESCE(el.to_email, el.recipient_email) as to_email,
          el.subject,
          COALESCE(el.template, el.email_type) as template,
          el.status,
          el.error_message,
          el.created_at,
          el.sent_at,
          qr.contact_name,
          qr.status as order_status
        FROM email_logs el
        LEFT JOIN quote_requests qr ON el.quote_id = qr.id
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramCount = 1
      
      if (input.status && input.status !== 'all') {
        sql += ` AND el.status = $${paramCount}`
        params.push(input.status)
        paramCount++
      }
      
      if (input.template) {
        sql += ` AND COALESCE(el.template, el.email_type) = $${paramCount}`
        params.push(input.template)
        paramCount++
      }
      
      if (input.search) {
        sql += ` AND (COALESCE(el.to_email, el.recipient_email) ILIKE $${paramCount} OR el.subject ILIKE $${paramCount})`
        params.push(`%${input.search}%`)
        paramCount++
      }
      
      sql += ` ORDER BY el.created_at DESC`
      sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
      params.push(input.limit, input.offset)
      
      const result = await query(sql, params)
      
      let countSql = `SELECT COUNT(*) as count FROM email_logs el WHERE 1=1`
      const countParams: any[] = []
      let countParamCount = 1
      
      if (input.status && input.status !== 'all') {
        countSql += ` AND el.status = $${countParamCount}`
        countParams.push(input.status)
        countParamCount++
      }
      
      if (input.template) {
        countSql += ` AND COALESCE(el.template, el.email_type) = $${countParamCount}`
        countParams.push(input.template)
        countParamCount++
      }
      
      if (input.search) {
        countSql += ` AND (COALESCE(el.to_email, el.recipient_email) ILIKE $${countParamCount} OR el.subject ILIKE $${countParamCount})`
        countParams.push(`%${input.search}%`)
      }
      
      const countResult = await query(countSql, countParams)
      const total = parseInt(countResult.rows[0].count)
      
      return {
        emails: result.rows.map((row: any) => ({
          id: row.id,
          orderId: row.order_id,
          toEmail: row.to_email,
          subject: row.subject,
          template: row.template,
          status: row.status,
          errorMessage: row.error_message,
          createdAt: row.created_at?.toISOString(),
          sentAt: row.sent_at?.toISOString(),
          contactName: row.contact_name,
          orderStatus: row.order_status
        })),
        total
      }
    }),

  templates: router({
    list: adminProcedure
      .query(async () => {
        const templates = await listManagedEmailTemplates()
        let templateStats: Array<{ template: string; sent: number; failed: number; total: number; lastSentAt: string | null }> = []

        try {
          const statsResult = await query(
            `SELECT
               COALESCE(template, email_type) as template,
               COUNT(*)::int as total,
               COUNT(*) FILTER (WHERE status = 'sent')::int as sent,
               COUNT(*) FILTER (WHERE status IN ('failed', 'bounced'))::int as failed,
               MAX(COALESCE(sent_at, created_at)) as last_sent_at
             FROM email_logs
             GROUP BY COALESCE(template, email_type)`
          )

          templateStats = statsResult.rows.map((row: any) => ({
            template: row.template,
            sent: Number(row.sent) || 0,
            failed: Number(row.failed) || 0,
            total: Number(row.total) || 0,
            lastSentAt: row.last_sent_at?.toISOString?.() || null
          }))
        } catch (statsError: any) {
          logger.warn('Failed to load template stats for admin template manager', {
            error: statsError?.message
          })
        }

        return {
          templates,
          managedTemplateKeys: getManagedEmailTemplateDefinitions().map((t) => t.key),
          globalVariables: getManagedEmailGlobalVariables(),
          templateStats
        }
      }),

    save: adminProcedure
      .input(z.object({
        templateKey: z.string().min(1),
        enabled: z.boolean(),
        subject: z.string().max(200),
        body: z.string().max(20000)
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const template = await saveManagedEmailTemplate({ ...input, updatedBy: ctx.user.userId })
          return { success: true, template }
        } catch (error: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error?.message || 'Failed to save email template' })
        }
      }),

    reset: adminProcedure
      .input(z.object({ templateKey: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          await resetManagedEmailTemplate(input.templateKey)
          return { success: true }
        } catch (error: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error?.message || 'Failed to reset template' })
        }
      }),

    preview: adminProcedure
      .input(z.object({
        templateKey: z.string().min(1),
        subject: z.string().max(200).optional(),
        body: z.string().max(20000).optional(),
        context: z.record(z.string(), z.any()).optional()
      }))
      .query(async ({ input }) => {
        try {
          return await previewManagedEmailTemplate(input)
        } catch (error: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error?.message || 'Failed to render template preview' })
        }
      }),

    analyze: adminProcedure
      .input(z.object({
        templateKey: z.string().min(1),
        subject: z.string().max(200),
        body: z.string().max(20000)
      }))
      .query(async ({ input }) => {
        try {
          return analyzeManagedEmailTemplateDraft(input)
        } catch (error: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error?.message || 'Failed to analyze template' })
        }
      }),

    sendTest: adminProcedure
      .input(z.object({
        templateKey: z.string().min(1),
        to: z.string().email(),
        subject: z.string().max(200).optional(),
        body: z.string().max(20000).optional(),
        orderId: z.number().optional(),
        context: z.record(z.string(), z.any()).optional()
      }))
      .mutation(async ({ input }) => {
        try {
          const rendered = await previewManagedEmailTemplate({
            templateKey: input.templateKey,
            subject: input.subject,
            body: input.body,
            context: input.context
          })

          const sent = await sendEmail(
            { to: input.to, subject: rendered.subject, html: rendered.html },
            input.templateKey,
            { ...(input.context || {}), orderId: input.orderId },
            input.orderId,
            { skipTemplateOverride: true }
          )

          if (!sent) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email service returned false' })
          }

          return { success: true, preview: rendered }
        } catch (error: any) {
          if (error instanceof TRPCError) throw error
          throw new TRPCError({ code: 'BAD_REQUEST', message: error?.message || 'Failed to send test email' })
        }
      })
  }),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT 
          el.*,
          qr.contact_name,
          qr.contact_email,
          qr.status as order_status
        FROM email_logs el
        LEFT JOIN quote_requests qr ON el.quote_id = qr.id
        WHERE el.id = $1`,
        [input.id]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Email log not found' })
      }
      
      const row = result.rows[0]
      return {
        id: row.id,
        orderId: row.quote_id,
        toEmail: row.to_email || row.recipient_email,
        subject: row.subject,
        template: row.template || row.email_type,
        metadataJson: row.metadata_json || null,
        status: row.status,
        errorMessage: row.error_message,
        createdAt: row.created_at?.toISOString(),
        sentAt: row.sent_at?.toISOString(),
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        orderStatus: row.order_status
      }
    }),

  resend: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      let emailResult
      let hasMetadataColumn = true
      
      try {
        emailResult = await query(
          `SELECT id, quote_id, to_email, subject, template, status, error_message, metadata_json FROM email_logs WHERE id = $1`,
          [input.id]
        )
      } catch (err: any) {
        if (err.code === '42703') {
          hasMetadataColumn = false
          try {
            emailResult = await query(
              `SELECT id, quote_id, to_email, subject, template, status, error_message FROM email_logs WHERE id = $1`,
              [input.id]
            )
          } catch {
            emailResult = await query(
              `SELECT id, quote_id, recipient_email as to_email, subject, email_type as template, status, error_message FROM email_logs WHERE id = $1`,
              [input.id]
            )
          }
        } else {
          throw err
        }
      }
      
      if (emailResult.rows.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Email log not found' })
      }
      
      const emailLog = emailResult.rows[0]
      const metadata = hasMetadataColumn ? (emailLog.metadata_json || {}) : {}
      
      try {
        switch (emailLog.template) {
          case 'order_confirmation':
            await sendOrderConfirmation({
              to: metadata.to || emailLog.to_email,
              name: metadata.name || 'Customer',
              serviceType: metadata.serviceType || 'Service Request',
              orderId: metadata.orderId || emailLog.quote_id
            })
            break
            
          case 'quote':
          case 'quote_enhanced':
            await sendEnhancedQuoteEmail({
              to: metadata.to || emailLog.to_email,
              name: metadata.name || 'Customer',
              quoteAmount: metadata.quoteAmount || 0,
              packageName: metadata.packageName || 'Service Request',
              orderId: metadata.orderId || emailLog.quote_id,
              eventDate: metadata.eventDate,
              teamName: metadata.teamName,
              sportType: metadata.sportType,
              adminNotes: metadata.adminNotes
            })
            break
            
          case 'invoice':
            await sendInvoiceEmail({
              to: metadata.to || emailLog.to_email,
              name: metadata.name || 'Customer',
              amount: metadata.amount || 0,
              invoiceUrl: metadata.invoiceUrl || '',
              orderId: metadata.orderId || emailLog.quote_id
            })
            break
            
          case 'payment_receipt':
          case 'receipt':
            await sendPaymentReceipt({
              to: metadata.to || emailLog.to_email,
              name: metadata.name || 'Customer',
              amount: metadata.amount || 0,
              orderId: metadata.orderId || emailLog.quote_id
            })
            break
            
          default:
            await sendCustomEmail(
              emailLog.to_email,
              emailLog.subject,
              metadata?.body || '<p>This is a resent notification. Please contact us if you need assistance.</p>',
              emailLog.quote_id
            )
        }
        
        logger.info('Email resent successfully', { emailId: input.id, template: emailLog.template })
        return { success: true, message: 'Email resent successfully' }
      } catch (error: any) {
        logger.error('Failed to resend email', { emailId: input.id, error: error.message })
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to resend email: ${error.message}` })
      }
    }),

  stats: adminProcedure
    .query(async () => {
      const result = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued
        FROM email_logs
      `)
      
      const row = result.rows[0]
      return {
        total: parseInt(row.total),
        sent: parseInt(row.sent),
        failed: parseInt(row.failed),
        queued: parseInt(row.queued),
        successRate: row.total > 0 ? (parseInt(row.sent) / parseInt(row.total) * 100).toFixed(1) : '0'
      }
    })
})
