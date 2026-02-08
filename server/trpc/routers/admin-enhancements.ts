/**
 * Admin Enhancements Router
 * Additional endpoints for quote process and user management improvements
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { query, transaction } from '../../db/connection'
import { logger } from '../../utils/logger'
import { 
  sendEnhancedQuoteEmail, 
  sendQuoteRevisionEmail, 
  sendQuoteReminderEmail,
  sendAdminNotificationEmail,
  sendCustomEmailEnhanced
} from '../../utils/email-enhanced'
import { generateQuoteViewUrl, generateQuoteAcceptUrl, storeQuoteToken, generateQuoteToken } from '../../utils/quote-tokens'

export const adminEnhancementsRouter = router({
  /**
   * Enhanced quote submission with payment link option and event datetime confirmation
   * Updated: Now includes event datetime for calendar booking
   */
  submitQuoteEnhanced: adminProcedure
    .input(z.object({
      orderId: z.number(),
      quoteAmount: z.number().positive(),
      adminNotes: z.string().optional(),
      includePaymentLink: z.boolean().default(false),
      // New: Event datetime for calendar booking
      eventDateTime: z.string().optional(), // ISO string
      confirmDateTime: z.boolean().default(false),
      // Tax fields (optional for now)
      taxProvince: z.string().length(2).optional(),
      taxAmount: z.number().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return transaction(async (client) => {
        // Get order details
        const orderResult = await client.query(
          `SELECT 
            qr.id, qr.contact_name, qr.contact_email, qr.status, qr.event_date,
            qr.sport_type,
            p.name as package_name,
            fs.team_name
           FROM quote_requests qr
           LEFT JOIN packages p ON qr.package_id = p.id
           LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
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
        const packageName = order.package_name || 'Service Request'
        
        // Parse event datetime if provided
        let eventDateTime: Date | null = null
        let eventDateStr: string | null = null
        let eventTimeStr: string | null = null
        
        if (input.eventDateTime) {
          eventDateTime = new Date(input.eventDateTime)
          eventDateStr = eventDateTime.toISOString().split('T')[0]
          // Format time as HH:MM:SS
          const hours = String(eventDateTime.getHours()).padStart(2, '0')
          const minutes = String(eventDateTime.getMinutes()).padStart(2, '0')
          eventTimeStr = `${hours}:${minutes}:00`
        }
        
        // Update order with quote and event datetime
        await client.query(
          `UPDATE quote_requests 
           SET quoted_amount = $1, 
               admin_notes = COALESCE($2, admin_notes),
               status = 'quoted',
               current_quote_version = COALESCE(current_quote_version, 0) + 1,
               event_datetime = COALESCE($3, event_datetime),
               event_date = COALESCE($4::date, event_date),
               event_time = COALESCE($5::time, event_time),
               admin_confirmed_datetime = $6,
               tax_province = COALESCE($7, tax_province, 'AB'),
               tax_amount = COALESCE($8, tax_amount, 0),
               updated_at = NOW()
           WHERE id = $9`,
          [
            input.quoteAmount, 
            input.adminNotes, 
            eventDateTime?.toISOString() || null,
            eventDateStr,
            eventTimeStr,
            input.confirmDateTime,
            input.taxProvince || null,
            input.taxAmount || 0,
            input.orderId
          ]
        )
        
        // Create quote revision record
        const versionResult = await client.query(
          `SELECT COALESCE(MAX(version), 0) + 1 as next_version 
           FROM quote_revisions WHERE quote_id = $1`,
          [input.orderId]
        )
        const nextVersion = versionResult.rows[0].next_version
        
        await client.query(
          `INSERT INTO quote_revisions (quote_id, version, amount_cents, notes, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [input.orderId, nextVersion, input.quoteAmount, input.adminNotes || 'Initial quote', ctx.user.userId]
        )
        
        // Log status change
        await client.query(
          `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
           VALUES ($1, $2, 'quoted', $3, 'Quote submitted to customer')`,
          [input.orderId, order.status, ctx.user.userId]
        )
        
        // Format event date for email (use confirmed datetime if available)
        let eventDateFormatted: string | null = null
        const dateToFormat = eventDateTime || (order.event_date ? new Date(order.event_date) : null)
        if (dateToFormat) {
          eventDateFormatted = dateToFormat.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          // Add time if we have it
          if (eventDateTime) {
            eventDateFormatted += ' at ' + dateToFormat.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }
        }
        
        // Generate URLs for email
        const config = useRuntimeConfig()
        const appUrl = config.public.appBaseUrl || 'https://elitesportsdj.com'
        
        // Generate secure token-based quote view URL
        const quoteViewUrl = generateQuoteViewUrl(input.orderId, order.contact_email, appUrl)
        
        // Store token for tracking
        const tokenData = generateQuoteToken(input.orderId, order.contact_email)
        await storeQuoteToken(input.orderId, tokenData.token, tokenData.expiresAt)
        
        // Generate payment URL if requested
        let paymentUrl: string | null = null
        if (input.includePaymentLink) {
          paymentUrl = generateQuoteAcceptUrl(input.orderId, order.contact_email, appUrl)
        }
        
        // Send enhanced quote email
        try {
          await sendEnhancedQuoteEmail({
            to: order.contact_email,
            name: order.contact_name,
            quoteAmount: input.quoteAmount,
            packageName,
            orderId: input.orderId,
            paymentUrl,
            quoteViewUrl,  // Include direct token-based quote view URL
            eventDate: eventDateFormatted,
            teamName: order.team_name,
            sportType: order.sport_type,
            adminNotes: input.adminNotes
          })
          logger.info('Enhanced quote email sent', { orderId: input.orderId, email: order.contact_email })
        } catch (emailError: any) {
          logger.error('Failed to send quote email', { 
            orderId: input.orderId, 
            error: emailError.message 
          })
        }
        
        return {
          success: true,
          orderId: input.orderId,
          version: nextVersion,
          paymentUrl
        }
      })
    }),

  /**
   * Revise an existing quote
   */
  reviseQuote: adminProcedure
    .input(z.object({
      orderId: z.number(),
      newAmount: z.number().positive(),
      reason: z.string().min(1, 'Please provide a reason for the revision'),
      notifyCustomer: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      return transaction(async (client) => {
        // Get current quote info
        const currentResult = await client.query(
          `SELECT 
            qr.quoted_amount,
            qr.current_quote_version,
            qr.contact_email,
            qr.contact_name,
            p.name as package_name
           FROM quote_requests qr
           LEFT JOIN packages p ON qr.package_id = p.id
           WHERE qr.id = $1`,
          [input.orderId]
        )
        
        if (currentResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found'
          })
        }
        
        const current = currentResult.rows[0]
        const previousAmount = current.quoted_amount
        const newVersion = (current.current_quote_version || 1) + 1
        
        // Create revision record
        await client.query(
          `INSERT INTO quote_revisions (quote_id, version, amount_cents, notes, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [input.orderId, newVersion, input.newAmount, input.reason, ctx.user.userId]
        )
        
        // Update order with new quote
        await client.query(
          `UPDATE quote_requests 
           SET quoted_amount = $1, current_quote_version = $2, updated_at = NOW()
           WHERE id = $3`,
          [input.newAmount, newVersion, input.orderId]
        )
        
        // Log status history
        await client.query(
          `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
           VALUES ($1, 'quoted', 'quoted', $2, $3)`,
          [input.orderId, ctx.user.userId, `Quote revised: ${input.reason}`]
        )
        
        // Send notification if requested
        if (input.notifyCustomer && previousAmount) {
          try {
            await sendQuoteRevisionEmail({
              to: current.contact_email,
              name: current.contact_name,
              orderId: input.orderId,
              previousAmount,
              newAmount: input.newAmount,
              reason: input.reason,
              packageName: current.package_name || 'Service Request'
            })
          } catch (err: any) {
            logger.error('Failed to send quote revision email', { orderId: input.orderId, error: err.message })
          }
        }
        
        return {
          success: true,
          version: newVersion,
          previousAmount,
          newAmount: input.newAmount
        }
      })
    }),

  /**
   * Get quote revision history
   */
  getQuoteRevisions: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT 
          qr.id,
          qr.version,
          qr.amount_cents,
          qr.notes,
          qr.created_at,
          u.name as created_by_name
         FROM quote_revisions qr
         LEFT JOIN users u ON qr.created_by = u.id
         WHERE qr.quote_id = $1
         ORDER BY qr.version DESC`,
        [input.orderId]
      )
      
      return result.rows.map(row => ({
        id: row.id,
        version: row.version,
        amount: row.amount_cents,
        notes: row.notes,
        createdAt: row.created_at.toISOString(),
        createdBy: row.created_by_name
      }))
    }),

  /**
   * Get customer details with order history
   */
  getCustomerDetails: adminProcedure
    .input(z.object({
      email: z.string().email()
    }))
    .query(async ({ input }) => {
      // Fetch customer info
      const customerResult = await query(
        `SELECT 
          COALESCE(MAX(u.id), 0) as id,
          COALESCE(MAX(u.name), MAX(qr.contact_name)) as name,
          $1 as email,
          MAX(qr.contact_phone) as phone,
          MAX(qr.organization) as organization,
          COUNT(qr.id) as order_count,
          COALESCE(SUM(qr.total_amount), 0) as total_spent,
          MIN(qr.created_at) as first_order_date
        FROM quote_requests qr
        LEFT JOIN users u ON qr.user_id = u.id
        WHERE COALESCE(u.email, qr.contact_email) = $1
        GROUP BY COALESCE(u.email, qr.contact_email)`,
        [input.email]
      )
      
      if (customerResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer not found'
        })
      }
      
      const customer = customerResult.rows[0]
      
      // Fetch order history
      const ordersResult = await query(
        `SELECT 
          qr.id,
          qr.status,
          qr.service_type,
          qr.event_date,
          qr.quoted_amount,
          qr.total_amount,
          qr.created_at,
          p.name as package_name
        FROM quote_requests qr
        LEFT JOIN packages p ON qr.package_id = p.id
        WHERE qr.contact_email = $1
        ORDER BY qr.created_at DESC`,
        [input.email]
      )
      
      // Fetch email history
      const emailsResult = await query(
        `SELECT 
          id,
          subject,
          template,
          status,
          sent_at
        FROM email_logs
        WHERE to_email = $1
        ORDER BY sent_at DESC
        LIMIT 20`,
        [input.email]
      )
      
      return {
        customer: {
          id: customer.id.toString(),
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          organization: customer.organization,
          orderCount: parseInt(customer.order_count),
          totalSpent: parseInt(customer.total_spent),
          firstOrderDate: customer.first_order_date?.toISOString()
        },
        orders: ordersResult.rows.map(row => ({
          id: row.id.toString(),
          status: row.status,
          serviceType: row.service_type,
          packageName: row.package_name,
          eventDate: row.event_date?.toISOString(),
          quotedAmount: row.quoted_amount,
          totalAmount: row.total_amount,
          createdAt: row.created_at.toISOString()
        })),
        emails: emailsResult.rows.map(row => ({
          id: row.id,
          subject: row.subject,
          type: row.template,
          status: row.status,
          sentAt: row.sent_at?.toISOString()
        }))
      }
    }),

  /**
   * Bulk update order status
   */
  bulkUpdateStatus: adminProcedure
    .input(z.object({
      orderIds: z.array(z.number()).min(1).max(100),
      status: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const results = {
        success: [] as number[],
        failed: [] as { id: number; error: string }[]
      }
      
      // Valid status transitions
      const validTransitions: Record<string, string[]> = {
        'submitted': ['in_progress', 'quoted', 'cancelled'],
        'quoted': ['invoiced', 'in_progress', 'cancelled', 'quote_accepted'],
        'quote_viewed': ['quote_accepted', 'cancelled'],
        'quote_accepted': ['invoiced', 'paid'],
        'invoiced': ['paid', 'cancelled'],
        'paid': ['in_progress', 'completed', 'delivered'],
        'in_progress': ['completed', 'delivered'],
        'completed': ['delivered'],
      }
      
      for (const orderId of input.orderIds) {
        try {
          await transaction(async (client) => {
            // Get current status
            const current = await client.query(
              `SELECT status FROM quote_requests WHERE id = $1`,
              [orderId]
            )
            
            if (current.rows.length === 0) {
              throw new Error('Order not found')
            }
            
            const previousStatus = current.rows[0].status
            
            // Validate transition
            const allowed = validTransitions[previousStatus] || []
            if (!allowed.includes(input.status)) {
              throw new Error(`Invalid transition from ${previousStatus} to ${input.status}`)
            }
            
            // Update status
            await client.query(
              `UPDATE quote_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
              [input.status, orderId]
            )
            
            // Log status change
            await client.query(
              `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
               VALUES ($1, $2, $3, $4, $5)`,
              [orderId, previousStatus, input.status, ctx.user.userId, input.notes || 'Bulk status update']
            )
          })
          
          results.success.push(orderId)
        } catch (err: any) {
          results.failed.push({ id: orderId, error: err.message })
        }
      }
      
      return results
    }),

  /**
   * Bulk send emails
   */
  bulkSendEmail: adminProcedure
    .input(z.object({
      orderIds: z.array(z.number()).min(1).max(50),
      emailType: z.enum(['reminder', 'status_update', 'custom']),
      subject: z.string().optional(),
      body: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const results = {
        sent: 0,
        failed: 0
      }
      
      for (const orderId of input.orderIds) {
        try {
          const orderResult = await query(
            `SELECT contact_name, contact_email, status, quoted_amount 
             FROM quote_requests WHERE id = $1`,
            [orderId]
          )
          
          if (orderResult.rows.length === 0) continue
          
          const order = orderResult.rows[0]
          
          if (input.emailType === 'reminder' && order.status === 'quoted' && order.quoted_amount) {
            // Calculate days old
            const createdResult = await query(
              `SELECT created_at FROM quote_requests WHERE id = $1`,
              [orderId]
            )
            const daysOld = Math.floor((Date.now() - new Date(createdResult.rows[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
            
            await sendQuoteReminderEmail({
              to: order.contact_email,
              name: order.contact_name,
              orderId,
              quoteAmount: order.quoted_amount,
              packageName: 'Service Request',
              daysOld
            })
          } else if (input.emailType === 'custom' && input.subject && input.body) {
            const processedBody = input.body
              .replace(/\{\{name\}\}/g, order.contact_name)
              .replace(/\{\{orderId\}\}/g, orderId.toString())
            
            await sendCustomEmailEnhanced({
              to: order.contact_email,
              name: order.contact_name,
              subject: input.subject,
              body: processedBody,
              orderId
            })
          }
          
          results.sent++
        } catch (err) {
          results.failed++
          logger.error('Bulk email failed', { orderId, error: err })
        }
      }
      
      return results
    }),

  /**
   * Export orders to CSV
   */
  exportOrders: adminProcedure
    .input(z.object({
      orderIds: z.array(z.number()).optional(),
      filters: z.object({
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      let whereClause = '1=1'
      const params: any[] = []
      let paramCount = 1
      
      if (input.orderIds && input.orderIds.length > 0) {
        whereClause += ` AND qr.id = ANY($${paramCount})`
        params.push(input.orderIds)
        paramCount++
      }
      
      if (input.filters?.status) {
        whereClause += ` AND qr.status = $${paramCount}`
        params.push(input.filters.status)
        paramCount++
      }
      
      if (input.filters?.dateFrom) {
        whereClause += ` AND qr.created_at >= $${paramCount}`
        params.push(input.filters.dateFrom)
        paramCount++
      }
      
      if (input.filters?.dateTo) {
        whereClause += ` AND qr.created_at <= $${paramCount}`
        params.push(input.filters.dateTo + ' 23:59:59')
        paramCount++
      }
      
      const result = await query(
        `SELECT 
          qr.id as "Order ID",
          qr.contact_name as "Customer Name",
          qr.contact_email as "Email",
          qr.contact_phone as "Phone",
          qr.status as "Status",
          p.name as "Package",
          qr.event_date as "Event Date",
          qr.quoted_amount / 100.0 as "Quote Amount",
          qr.total_amount / 100.0 as "Total Amount",
          qr.created_at as "Created At"
        FROM quote_requests qr
        LEFT JOIN packages p ON qr.package_id = p.id
        WHERE ${whereClause}
        ORDER BY qr.created_at DESC`,
        params
      )
      
      if (result.rows.length === 0) {
        return {
          csv: 'No orders found',
          filename: `orders_export_${new Date().toISOString().split('T')[0]}.csv`
        }
      }
      
      // Convert to CSV
      const headers = Object.keys(result.rows[0])
      const csvRows = [
        headers.join(','),
        ...result.rows.map(row => 
          headers.map(h => {
            const val = row[h]
            if (val === null || val === undefined) return ''
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
              return `"${val.replace(/"/g, '""')}"`
            }
            if (val instanceof Date) {
              return val.toISOString()
            }
            return val
          }).join(',')
        )
      ]
      
      return {
        csv: csvRows.join('\n'),
        filename: `orders_export_${new Date().toISOString().split('T')[0]}.csv`
      }
    }),

  /**
   * Get email history for an order
   */
  getEmailHistory: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT 
          id,
          to_email,
          subject,
          template,
          status,
          error_message,
          sent_at,
          created_at
         FROM email_logs
         WHERE quote_id = $1
         ORDER BY sent_at DESC`,
        [input.orderId]
      )
      
      return result.rows.map(row => ({
        id: row.id,
        recipientEmail: row.to_email,
        subject: row.subject,
        type: row.template,
        status: row.status,
        errorMessage: row.error_message,
        sentAt: row.sent_at?.toISOString(),
        createdAt: row.created_at?.toISOString()
      }))
    }),

  /**
   * Resend email by type
   */
  resendEmailByType: adminProcedure
    .input(z.object({
      orderId: z.number(),
      emailType: z.enum(['quote', 'invoice', 'confirmation', 'reminder'])
    }))
    .mutation(async ({ input }) => {
      const orderResult = await query(
        `SELECT 
          qr.contact_name,
          qr.contact_email,
          qr.quoted_amount,
          qr.status,
          qr.created_at,
          p.name as package_name,
          i.invoice_url
         FROM quote_requests qr
         LEFT JOIN packages p ON qr.package_id = p.id
         LEFT JOIN invoices i ON qr.id = i.quote_id
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
      
      switch (input.emailType) {
        case 'quote':
          if (!order.quoted_amount) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No quote exists for this order'
            })
          }
          await sendEnhancedQuoteEmail({
            to: order.contact_email,
            name: order.contact_name,
            quoteAmount: order.quoted_amount,
            packageName: order.package_name || 'Service Request',
            orderId: input.orderId
          })
          break
          
        case 'reminder':
          if (!order.quoted_amount) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No quote exists for this order'
            })
          }
          const daysOld = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))
          await sendQuoteReminderEmail({
            to: order.contact_email,
            name: order.contact_name,
            orderId: input.orderId,
            quoteAmount: order.quoted_amount,
            packageName: order.package_name || 'Service Request',
            daysOld
          })
          break
          
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Email type ${input.emailType} not supported for resend`
          })
      }
      
      return { success: true }
    }),

  /**
   * Get dashboard analytics
   */
  analytics: adminProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d')
    }).optional())
    .query(async ({ input }) => {
      const period = input?.period || '30d'
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period]
      
      // Quote conversion rate
      const conversionResult = await query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'quoted') as quoted,
          COUNT(*) FILTER (WHERE status IN ('paid', 'completed', 'delivered')) as converted
         FROM quote_requests
         WHERE created_at >= NOW() - make_interval(days => $1)`,
        [days]
      )
      
      const quoted = parseInt(conversionResult.rows[0].quoted) || 0
      const converted = parseInt(conversionResult.rows[0].converted) || 0
      const conversionRate = quoted > 0 ? ((converted / quoted) * 100).toFixed(1) : '0'
      
      // Average time to quote (in hours)
      const timeToQuoteResult = await query(
        `SELECT 
          AVG(EXTRACT(EPOCH FROM (
            (SELECT MIN(changed_at) FROM order_status_history osh 
             WHERE osh.quote_id = qr.id AND osh.new_status = 'quoted')
            - qr.created_at
          )) / 3600) as avg_hours
         FROM quote_requests qr
         WHERE qr.status IN ('quoted', 'paid', 'completed', 'delivered')
         AND qr.created_at >= NOW() - make_interval(days => $1)`,
        [days]
      )
      
      const avgTimeToQuote = parseFloat(timeToQuoteResult.rows[0]?.avg_hours) || 0
      
      // Revenue trend
      const trendResult = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue
         FROM quote_requests
         WHERE status IN ('paid', 'completed', 'delivered')
         AND created_at >= NOW() - make_interval(days => $1)
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [days]
      )
      
      // Top packages
      const topPackagesResult = await query(
        `SELECT 
          COALESCE(p.name, qr.service_type, 'Other') as package,
          COUNT(*) as orders,
          COALESCE(SUM(qr.total_amount), 0) as revenue
         FROM quote_requests qr
         LEFT JOIN packages p ON qr.package_id = p.id
         WHERE qr.status IN ('paid', 'completed', 'delivered')
         AND qr.created_at >= NOW() - make_interval(days => $1)
         GROUP BY p.name, qr.service_type
         ORDER BY revenue DESC
         LIMIT 5`,
        [days]
      )
      
      // Pending actions
      const pendingResult = await query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'submitted') as awaiting_quote,
          COUNT(*) FILTER (WHERE status = 'quoted' AND created_at < NOW() - INTERVAL '3 days') as stale_quotes,
          COUNT(*) FILTER (WHERE status = 'paid') as ready_to_start
         FROM quote_requests`
      )
      
      return {
        period,
        conversionRate: parseFloat(conversionRate),
        quotedCount: quoted,
        convertedCount: converted,
        avgTimeToQuoteHours: Math.round(avgTimeToQuote * 10) / 10,
        revenueTrend: trendResult.rows.map(row => ({
          date: row.date.toISOString().split('T')[0],
          orders: parseInt(row.orders),
          revenue: parseInt(row.revenue)
        })),
        topPackages: topPackagesResult.rows.map(row => ({
          package: row.package,
          orders: parseInt(row.orders),
          revenue: parseInt(row.revenue)
        })),
        pendingActions: {
          awaitingQuote: parseInt(pendingResult.rows[0].awaiting_quote),
          staleQuotes: parseInt(pendingResult.rows[0].stale_quotes),
          readyToStart: parseInt(pendingResult.rows[0].ready_to_start)
        }
      }
    }),

  /**
   * Get quote events for tracking
   */
  getQuoteEvents: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT 
          id,
          event_type,
          ip_address,
          metadata,
          created_at
         FROM quote_events
         WHERE quote_id = $1
         ORDER BY created_at DESC`,
        [input.orderId]
      )
      
      return result.rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        ipAddress: row.ip_address,
        metadata: row.metadata,
        createdAt: row.created_at.toISOString()
      }))
    })
})
