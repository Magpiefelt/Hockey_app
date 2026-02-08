import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { query, transaction } from '../../db/connection'
import { sendCustomEmail, sendQuoteEmail, sendOrderConfirmation, sendInvoiceEmail, sendPaymentReceipt } from '../../utils/email'
import { logger } from '../../utils/logger'

export const adminRouter = router({
  /**
   * Get dashboard statistics
   */
  dashboard: adminProcedure
    .query(async () => {
      // Total orders
      const totalResult = await query(
        'SELECT COUNT(*) as count FROM quote_requests'
      )
      const totalOrders = parseInt(totalResult.rows[0].count)
      
      // Pending orders
      const pendingResult = await query(
        `SELECT COUNT(*) as count FROM quote_requests 
         WHERE status IN ('pending', 'submitted', 'in_progress')`
      )
      const pendingOrders = parseInt(pendingResult.rows[0].count)
      
      // Total revenue (paid orders)
      const revenueResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue 
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')`
      )
      const totalRevenue = parseInt(revenueResult.rows[0].revenue)
      
      // Active customers (users with at least one order)
      const customersResult = await query(
        `SELECT COUNT(DISTINCT COALESCE(user_id, contact_email)) as count 
         FROM quote_requests`
      )
      const activeCustomers = parseInt(customersResult.rows[0].count)
      
      return {
        totalOrders,
        pendingOrders,
        totalRevenue,
        activeCustomers
      }
    }),

  /**
   * Admin orders management
   */
  orders: router({
    /**
     * Get order statistics
     */
    stats: adminProcedure
      .query(async () => {
        // Total orders
        const totalResult = await query(
          'SELECT COUNT(*) as count FROM quote_requests'
        )
        const totalOrders = parseInt(totalResult.rows[0].count)
        
        // Pending orders (submitted, awaiting quote)
        const pendingResult = await query(
          `SELECT COUNT(*) as count FROM quote_requests 
           WHERE status IN ('submitted')`
        )
        const pendingOrders = parseInt(pendingResult.rows[0].count)
        
        // In progress orders
        const inProgressResult = await query(
          `SELECT COUNT(*) as count FROM quote_requests 
           WHERE status IN ('quoted', 'in_progress')`
        )
        const inProgressOrders = parseInt(inProgressResult.rows[0].count)
        
        // Completed this month
        const completedResult = await query(
          `SELECT COUNT(*) as count FROM quote_requests 
           WHERE status IN ('delivered', 'completed')
           AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
        )
        const completedOrders = parseInt(completedResult.rows[0].count)
        
        return {
          totalOrders,
          pendingOrders,
          inProgressOrders,
          completedOrders
        }
      }),

    /**
     * List all orders with optional filters
     */
    list: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional()
      }).optional())
      .query(async ({ input }) => {
        let sql = `
          SELECT 
            qr.id, qr.contact_name as name, qr.contact_email as email,
            qr.contact_phone as phone, qr.organization, qr.status, qr.event_date,
            qr.service_type, qr.sport_type, qr.quoted_amount, qr.total_amount,
            qr.notes, qr.created_at, qr.updated_at,
            p.slug as package_id, COALESCE(p.name, qr.service_type) as service_name,
            fs.team_name,
            COALESCE(file_counts.total_files, 0) as file_count,
            COALESCE(file_counts.upload_count, 0) as upload_count,
            COALESCE(file_counts.deliverable_count, 0) as deliverable_count
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
          LEFT JOIN (
            SELECT 
              quote_id,
              COUNT(*) as total_files,
              COUNT(*) FILTER (WHERE kind = 'upload') as upload_count,
              COUNT(*) FILTER (WHERE kind = 'deliverable') as deliverable_count
            FROM file_uploads
            GROUP BY quote_id
          ) file_counts ON qr.id = file_counts.quote_id
          WHERE 1=1
        `
        
        const params: any[] = []
        let paramCount = 1
        
        if (input?.status) {
          sql += ` AND qr.status = $${paramCount}`
          params.push(input.status)
          paramCount++
        }
        
        if (input?.search) {
          sql += ` AND (
            qr.contact_name ILIKE $${paramCount} OR 
            qr.contact_email ILIKE $${paramCount} OR 
            qr.contact_phone ILIKE $${paramCount} OR
            qr.service_type ILIKE $${paramCount} OR
            qr.id::text = $${paramCount + 1}
          )`
          params.push(`%${input.search}%`)
          params.push(input.search) // Exact match for ID
          paramCount += 2
        }
        
        sql += ' ORDER BY qr.created_at DESC'
        
        // Handle pagination
        let limit = 50 // Default page size
        let offset = 0
        
        if (input?.pageSize) {
          limit = Math.min(Math.max(1, Math.floor(input.pageSize)), 100)
        } else if (input?.limit) {
          limit = Math.min(Math.max(1, Math.floor(input.limit)), 1000)
        }
        
        if (input?.page) {
          offset = (Math.max(1, input.page) - 1) * limit
        } else if (input?.offset) {
          offset = Math.max(0, input.offset)
        }
        
        sql += ` LIMIT ${limit} OFFSET ${offset}`
        
        const result = await query(sql, params)
        
        return result.rows.map(row => ({
          id: row.id.toString(),
          name: row.name,
          email: row.email,
          phone: row.phone,
          organization: row.organization,
          packageId: row.package_id,
          serviceType: row.service_name,
          sportType: row.sport_type,
          status: row.status,
          quotedAmount: row.quoted_amount,
          totalAmount: row.total_amount,
          notes: row.notes,
          teamName: row.team_name,
          eventDate: row.event_date?.toISOString(),
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at?.toISOString(),
          fileCount: parseInt(row.file_count) || 0,
          uploadCount: parseInt(row.upload_count) || 0,
          deliverableCount: parseInt(row.deliverable_count) || 0
        }))
      }),

    /**
     * Get order details
     */
    get: adminProcedure
      .input(z.object({
        id: z.union([z.string(), z.number()])
      }))
      .query(async ({ input }) => {
        const orderId = typeof input.id === 'string' ? parseInt(input.id) : input.id
        
        // Get order with form submission data
        const orderResult = await query(
          `SELECT 
            qr.id, qr.user_id, qr.contact_name as name, qr.contact_email as email,
            qr.contact_phone as phone, qr.organization, qr.status, qr.event_date, qr.service_type,
            qr.sport_type, qr.notes, qr.admin_notes,
            qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
            p.slug as package_id, p.name as package_name,
            fs.team_name, fs.roster_method, fs.roster_players, fs.intro_song,
            fs.warmup_songs, fs.goal_horn, fs.goal_song, fs.win_song,
            fs.sponsors, fs.include_sample, fs.audio_files
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
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
        
        // Get files
        const filesResult = await query(
          `SELECT id, field_name, file_name, storage_url, mime_type, file_size, kind, created_at
           FROM file_uploads
           WHERE quote_id = $1
           ORDER BY created_at ASC`,
          [orderId]
        )
        
        // Get payment information
        const paymentResult = await query(
          `SELECT 
            pay.id,
            pay.stripe_payment_id,
            pay.amount_cents,
            pay.status,
            pay.paid_at,
            pay.created_at,
            inv.invoice_url,
            inv.status as invoice_status
           FROM invoices inv
           LEFT JOIN payments pay ON inv.id = pay.invoice_id
           WHERE inv.quote_id = $1
           ORDER BY inv.created_at DESC
           LIMIT 1`,
          [orderId]
        )
        
        const paymentData = paymentResult.rows.length > 0 && paymentResult.rows[0].id ? {
          id: paymentResult.rows[0].id,
          stripePaymentId: paymentResult.rows[0].stripe_payment_id,
          amount: paymentResult.rows[0].amount_cents,
          status: paymentResult.rows[0].status,
          paidAt: paymentResult.rows[0].paid_at?.toISOString(),
          createdAt: paymentResult.rows[0].created_at?.toISOString(),
          invoiceUrl: paymentResult.rows[0].invoice_url,
          invoiceStatus: paymentResult.rows[0].invoice_status
        } : null
        
        return {
          order: {
            id: order.id.toString(),
            name: order.name,
            email: order.email,
            emailSnapshot: order.email,
            phone: order.phone,
            organization: order.organization,
            packageId: order.package_id,
            serviceType: order.service_type || order.package_name,
            sportType: order.sport_type,
            status: order.status,
            quotedAmount: order.quoted_amount,
            totalAmount: order.total_amount,
            notes: order.notes,
            adminNotes: order.admin_notes,
            createdAt: order.created_at.toISOString(),
            updatedAt: order.updated_at?.toISOString(),
            // Form submission data
            formData: order.team_name ? {
              teamName: order.team_name,
              rosterMethod: order.roster_method,
              rosterPlayers: order.roster_players,
              introSong: order.intro_song,
              warmupSongs: order.warmup_songs,
              goalHorn: order.goal_horn,
              goalSong: order.goal_song,
              winSong: order.win_song,
              sponsors: order.sponsors,
              includeSample: order.include_sample || false,
              audioFiles: order.audio_files
            } : null
          },
          payment: paymentData,
          files: filesResult.rows.map(file => ({
            id: file.id.toString(),
            filename: file.file_name,
            fileSize: file.file_size,
            kind: file.kind,
            url: file.storage_url,
            createdAt: file.created_at.toISOString()
          }))
        }
      }),

    /**
     * Update order
     */
    update: adminProcedure
      .input(z.object({
        id: z.union([z.string(), z.number()]),
        status: z.string().optional(),
        totalAmount: z.number().optional(),
        quotedAmount: z.number().optional(),
        adminNotes: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const orderId = typeof input.id === 'string' ? parseInt(input.id) : input.id
        
        return transaction(async (client) => {
          // Get current order
          const currentResult = await client.query(
            'SELECT status FROM quote_requests WHERE id = $1',
            [orderId]
          )
          
          if (currentResult.rows.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Order not found'
            })
          }
          
          const previousStatus = currentResult.rows[0].status
          
          // Validate status transitions
          if (input.status && input.status !== previousStatus) {
            const validTransitions: Record<string, string[]> = {
              'pending': ['submitted', 'cancelled'],
              'submitted': ['in_progress', 'quoted', 'cancelled'],
              'in_progress': ['quoted', 'cancelled'],
              'quoted': ['invoiced', 'in_progress', 'cancelled'],
              'invoiced': ['paid', 'cancelled'],
              'paid': ['completed', 'delivered'],
              'completed': ['delivered'],
              'delivered': [], // Terminal state
              'cancelled': [] // Terminal state
            }
            
            const allowedNext = validTransitions[previousStatus] || []
            if (!allowedNext.includes(input.status)) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Invalid status transition from '${previousStatus}' to '${input.status}'`
              })
            }
          }
          
          // Build update query
          const updates: string[] = []
          const params: any[] = []
          let paramCount = 1
          
          if (input.status) {
            updates.push(`status = $${paramCount}`)
            params.push(input.status)
            paramCount++
          }
          
          if (input.totalAmount !== undefined) {
            updates.push(`total_amount = $${paramCount}`)
            params.push(input.totalAmount)
            paramCount++
          }
          
          if (input.quotedAmount !== undefined) {
            updates.push(`quoted_amount = $${paramCount}`)
            params.push(input.quotedAmount)
            paramCount++
          }
          
          if (input.adminNotes !== undefined) {
            updates.push(`admin_notes = $${paramCount}`)
            params.push(input.adminNotes)
            paramCount++
          }
          
          if (updates.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No updates provided'
            })
          }
          
          // Update order
          params.push(orderId)
          const result = await client.query(
            `UPDATE quote_requests 
             SET ${updates.join(', ')}, updated_at = NOW()
             WHERE id = $${paramCount}
             RETURNING id, contact_name as name, contact_email as email, status`,
            params
          )
          
          const order = result.rows[0]
          
          // Log status change if status was updated
          if (input.status && input.status !== previousStatus) {
            await client.query(
              `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
               VALUES ($1, $2, $3, $4, $5)`,
              [orderId, previousStatus, input.status, ctx.user.userId, input.adminNotes || 'Status updated by admin']
            )
            
            // Send status change notification email
            try {
              // Using static import from top of file
              const statusMessages: Record<string, { subject: string; message: string }> = {
                'quoted': {
                  subject: 'Quote Ready',
                  message: 'Great news! We\'ve prepared a custom quote for your request. Please check your email for details.'
                },
                'invoiced': {
                  subject: 'Invoice Ready',
                  message: 'Your invoice is ready. Please proceed with payment to continue.'
                },
                'paid': {
                  subject: 'Payment Received',
                  message: 'Thank you! We\'ve received your payment and will begin working on your order.'
                },
                'in_progress': {
                  subject: 'Order In Progress',
                  message: 'Your order is now being processed. We\'ll notify you once it\'s ready.'
                },
                'completed': {
                  subject: 'Order Completed',
                  message: 'Your order is complete! We\'re preparing your deliverables.'
                },
                'delivered': {
                  subject: 'Order Delivered',
                  message: 'Your order has been delivered! You can now download your files.'
                }
              }
              
              const notification = statusMessages[input.status]
              if (notification && order.email) {
                const notificationHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>${notification.subject}</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
                      <p>Hi ${order.name},</p>
                      <p>${notification.message}</p>
                      <p><strong>Order #${orderId}</strong></p>
                      <p>Best regards,<br>Elite Sports DJ Team</p>
                    </div>
                  </div>
                `
                await sendCustomEmail(
                  order.email,
                  `${notification.subject} - Order #${orderId}`,
                  notificationHtml,
                  orderId
                )
                logger.info('Status change notification sent', { orderId, status: input.status })
              }
            } catch (emailError: any) {
              logger.error('Failed to send status change notification', { 
                orderId, 
                error: emailError.message 
              })
            }
          }
          
          return {
            id: order.id.toString(),
            name: order.name,
            email: order.email,
            status: order.status
          }
        })
      }),

    /**
     * Submit quote for an order
     */
    submitQuote: adminProcedure
      .input(z.object({
        orderId: z.number(),
        quoteAmount: z.number(),
        adminNotes: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return transaction(async (client) => {
          // Update order with quote
          const result = await client.query(
            `UPDATE quote_requests 
             SET quoted_amount = $1, 
                 admin_notes = COALESCE($2, admin_notes),
                 status = CASE WHEN status = 'submitted' THEN 'quoted' ELSE status END,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING id, contact_name, contact_email, status`,
            [input.quoteAmount, input.adminNotes, input.orderId]
          )
          
          if (result.rows.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Order not found'
            })
          }
          
          const order = result.rows[0]
          
          // Get package name
          let packageName = 'Service Request'
          const packageResult = await client.query(
            `SELECT p.name FROM packages p 
             JOIN quote_requests qr ON qr.package_id = p.id 
             WHERE qr.id = $1`,
            [input.orderId]
          )
          if (packageResult.rows.length > 0) {
            packageName = packageResult.rows[0].name
          }
          
          // Log status change
          await client.query(
            `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [input.orderId, 'submitted', 'quoted', ctx.user.userId, 'Quote submitted to customer']
          )
          
          // Send quote email to customer
          try {
            // Using static import from top of file
            await sendQuoteEmail({
              to: order.contact_email,
              name: order.contact_name,
              quoteAmount: input.quoteAmount,
              packageName,
              orderId: input.orderId
            })
            logger.info('Quote email sent', { orderId: input.orderId, email: order.contact_email })
          } catch (emailError: any) {
            // Don't fail the quote submission if email fails
            logger.error('Failed to send quote email', { 
              orderId: input.orderId, 
              error: emailError.message 
            })
          }
          
          return {
            success: true,
            orderId: order.id,
            status: order.status
          }
        })
      })
  }),

  /**
   * Customer management
   */
  customers: router({
    /**
     * List all customers
     * FIX: Group by email (unique identifier) to prevent duplicate customer entries
     * when the same customer has orders with slightly different contact info
     */
    list: adminProcedure
      .query(async () => {
        const result = await query(
          `SELECT 
            COALESCE(MAX(u.id), 0) as id,
            COALESCE(MAX(u.name), MAX(qr.contact_name)) as name,
            COALESCE(u.email, qr.contact_email) as email,
            MAX(qr.contact_phone) as phone,
            MAX(qr.organization) as organization,
            COUNT(qr.id) as order_count,
            COALESCE(SUM(qr.total_amount), 0) as total_spent,
            MIN(qr.created_at) as created_at
          FROM quote_requests qr
          LEFT JOIN users u ON qr.user_id = u.id
          GROUP BY COALESCE(u.email, qr.contact_email)
          ORDER BY total_spent DESC`
        )
        
        return result.rows.map(row => ({
          id: row.id.toString(),
          name: row.name,
          email: row.email,
          phone: row.phone,
          organization: row.organization || '',
          orderCount: parseInt(row.order_count),
          totalOrders: parseInt(row.order_count),
          totalSpent: parseInt(row.total_spent),
          createdAt: row.created_at.toISOString()
        }))
      })
  }),

  /**
   * Finance statistics
   */
  finance: router({
    /**
     * Get finance statistics
     */
    stats: adminProcedure
      .query(async () => {
        // Total revenue
        const totalResult = await query(
          `SELECT COALESCE(SUM(total_amount), 0) as revenue 
           FROM quote_requests 
           WHERE status IN ('paid', 'completed', 'delivered')`
        )
        const totalRevenue = parseInt(totalResult.rows[0].revenue)
        
        // Monthly revenue (current month)
        const monthlyResult = await query(
          `SELECT COALESCE(SUM(total_amount), 0) as revenue 
           FROM quote_requests 
           WHERE status IN ('paid', 'completed', 'delivered')
           AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
        )
        const monthlyRevenue = parseInt(monthlyResult.rows[0].revenue)
        
        // Pending payments
        const pendingResult = await query(
          `SELECT COALESCE(SUM(total_amount), 0) as revenue 
           FROM quote_requests 
           WHERE status IN ('invoiced', 'quoted')`
        )
        const pendingPayments = parseInt(pendingResult.rows[0].revenue)
        
        // Paid order count (for average order value calculation)
        const orderCountResult = await query(
          `SELECT COUNT(*) as count 
           FROM quote_requests 
           WHERE status IN ('paid', 'completed', 'delivered')`
        )
        const paidOrderCount = parseInt(orderCountResult.rows[0].count)
        
        // Revenue by service
        const serviceResult = await query(
          `SELECT 
            COALESCE(p.name, qr.service_type, 'Other') as service,
            COALESCE(SUM(qr.total_amount), 0) as revenue
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          WHERE qr.status IN ('paid', 'completed', 'delivered')
          GROUP BY p.name, qr.service_type
          ORDER BY revenue DESC`
        )
        
        // Recent transactions (last 10 successful payments)
        const transactionsResult = await query(
          `SELECT 
            p.id,
            p.paid_at as date,
            qr.contact_name as customer_name,
            COALESCE(pkg.name, qr.service_type, 'Other') as package_name,
            p.amount_cents as amount,
            p.status,
            qr.id as order_id
          FROM payments p
          INNER JOIN invoices i ON p.invoice_id = i.id
          INNER JOIN quote_requests qr ON i.quote_id = qr.id
          LEFT JOIN packages pkg ON qr.package_id = pkg.id
          WHERE p.status = 'succeeded'
          ORDER BY p.paid_at DESC
          LIMIT 10`
        )
        
        return {
          totalRevenue,
          monthlyRevenue,
          pendingPayments,
          paidOrderCount,
          revenueByService: serviceResult.rows.map(row => ({
            service: row.service,
            revenue: parseInt(row.revenue)
          })),
          recentTransactions: transactionsResult.rows.map(row => ({
            id: row.id,
            date: row.date,
            customerName: row.customer_name,
            packageName: row.package_name,
            amount: row.amount,
            status: row.status,
            orderId: row.order_id
          }))
        }
      })
  }),

  /**
   * Get order status history
   */
  getOrderStatusHistory: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT 
          osh.id,
          osh.quote_id,
          osh.previous_status as old_status,
          osh.new_status,
          osh.notes,
          osh.changed_by,
          osh.changed_at as created_at,
          u.name as changed_by_name
        FROM order_status_history osh
        LEFT JOIN users u ON osh.changed_by = u.id
        WHERE osh.quote_id = $1
        ORDER BY osh.changed_at DESC`,
        [input.orderId]
      )
      
      return result.rows
    }),

  /**
   * Email management
   */
  emails: router({
    /**
     * List all email logs with filtering
     */
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
            el.to_email,
            el.subject,
            el.template,
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
        
        // Filter by status
        if (input.status && input.status !== 'all') {
          sql += ` AND el.status = $${paramCount}`
          params.push(input.status)
          paramCount++
        }
        
        // Filter by template
        if (input.template) {
          sql += ` AND el.template = $${paramCount}`
          params.push(input.template)
          paramCount++
        }
        
        // Search by email or subject
        if (input.search) {
          sql += ` AND (el.to_email ILIKE $${paramCount} OR el.subject ILIKE $${paramCount})`
          params.push(`%${input.search}%`)
          paramCount++
        }
        
        sql += ` ORDER BY el.created_at DESC`
        sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
        params.push(input.limit, input.offset)
        
        const result = await query(sql, params)
        
        // Get total count
        let countSql = `SELECT COUNT(*) as count FROM email_logs el WHERE 1=1`
        const countParams: any[] = []
        let countParamCount = 1
        
        if (input.status && input.status !== 'all') {
          countSql += ` AND el.status = $${countParamCount}`
          countParams.push(input.status)
          countParamCount++
        }
        
        if (input.template) {
          countSql += ` AND el.template = $${countParamCount}`
          countParams.push(input.template)
          countParamCount++
        }
        
        if (input.search) {
          countSql += ` AND (el.to_email ILIKE $${countParamCount} OR el.subject ILIKE $${countParamCount})`
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

    /**
     * Get email details
     */
    get: adminProcedure
      .input(z.object({
        id: z.number()
      }))
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
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Email log not found'
          })
        }
        
        const row = result.rows[0]
        return {
          id: row.id,
          orderId: row.quote_id,
          toEmail: row.to_email,
          subject: row.subject,
          template: row.template,
          metadataJson: row.metadata_json,
          status: row.status,
          errorMessage: row.error_message,
          createdAt: row.created_at?.toISOString(),
          sentAt: row.sent_at?.toISOString(),
          contactName: row.contact_name,
          contactEmail: row.contact_email,
          orderStatus: row.order_status
        }
      }),

    /**
     * Resend failed email
     */
    resend: adminProcedure
      .input(z.object({
        id: z.number()
      }))
      .mutation(async ({ input }) => {
        // Get email details
        const emailResult = await query(
          `SELECT * FROM email_logs WHERE id = $1`,
          [input.id]
        )
        
        if (emailResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Email log not found'
          })
        }
        
        const emailLog = emailResult.rows[0]
        const metadata = emailLog.metadata_json
        
        // Determine which email function to use based on template
        try {
          // Using static imports from top of file
          
          switch (emailLog.template) {
            case 'order_confirmation':
              await sendOrderConfirmation({
                to: emailLog.to_email,
                name: metadata.name,
                serviceType: metadata.serviceType,
                orderId: metadata.orderId
              })
              break
              
            case 'quote':
              await sendQuoteEmail({
                to: emailLog.to_email,
                name: metadata.name,
                quoteAmount: metadata.quoteAmount,
                packageName: metadata.packageName,
                orderId: metadata.orderId
              })
              break
              
            case 'invoice':
              await sendInvoiceEmail({
                to: emailLog.to_email,
                name: metadata.name,
                amount: metadata.amount,
                invoiceUrl: metadata.invoiceUrl,
                orderId: metadata.orderId
              })
              break
              
            case 'payment_receipt':
              await sendPaymentReceipt({
                to: emailLog.to_email,
                name: metadata.name,
                amount: metadata.amount,
                orderId: metadata.orderId
              })
              break
              
            default:
              await sendCustomEmail(
                emailLog.to_email,
                emailLog.subject,
                metadata?.body || '<p>Email content</p>',
                emailLog.quote_id
              )
          }
          
          logger.info('Email resent successfully', { emailId: input.id, template: emailLog.template })
          
          return {
            success: true,
            message: 'Email resent successfully'
          }
        } catch (error: any) {
          logger.error('Failed to resend email', { emailId: input.id, error: error.message })
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to resend email: ${error.message}`
          })
        }
      }),

    /**
     * Get email statistics
     */
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
  }),

  /**
   * Get allowed status transitions for a given status
   * This endpoint provides the frontend with valid status transitions
   * to ensure synchronization between frontend and backend state machines
   */
  getAllowedTransitions: adminProcedure
    .input(z.object({
      currentStatus: z.string()
    }))
    .query(async ({ input }) => {
      // Status transition rules - single source of truth
      // These must match the validTransitions in orders.update
      const validTransitions: Record<string, string[]> = {
        'pending': ['submitted', 'cancelled'],
        'submitted': ['in_progress', 'quoted', 'cancelled'],
        'in_progress': ['quoted', 'cancelled'],
        'quoted': ['invoiced', 'in_progress', 'cancelled'],
        'quote_viewed': ['invoiced', 'in_progress', 'cancelled'],
        'quote_accepted': ['invoiced', 'in_progress', 'cancelled'],
        'invoiced': ['paid', 'cancelled'],
        'paid': ['completed', 'delivered'],
        'completed': ['delivered'],
        'delivered': [], // Terminal state
        'cancelled': [] // Terminal state
      }

      // Status display labels
      const statusLabels: Record<string, string> = {
        'pending': 'Pending',
        'submitted': 'Submitted',
        'in_progress': 'In Progress',
        'quoted': 'Quoted',
        'quote_viewed': 'Quote Viewed',
        'quote_accepted': 'Quote Accepted',
        'invoiced': 'Invoiced',
        'paid': 'Paid',
        'completed': 'Completed',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
      }

      const allowedStatuses = validTransitions[input.currentStatus] || []
      
      return {
        currentStatus: input.currentStatus,
        currentStatusLabel: statusLabels[input.currentStatus] || input.currentStatus,
        allowedTransitions: allowedStatuses.map(status => ({
          status,
          label: statusLabels[status] || status
        })),
        isTerminal: allowedStatuses.length === 0
      }
    }),

  /**
   * Get all possible statuses with their labels
   */
  getAllStatuses: adminProcedure
    .query(async () => {
      const statuses = [
        { status: 'pending', label: 'Pending', color: 'gray' },
        { status: 'submitted', label: 'Submitted', color: 'blue' },
        { status: 'in_progress', label: 'In Progress', color: 'yellow' },
        { status: 'quoted', label: 'Quoted', color: 'purple' },
        { status: 'quote_viewed', label: 'Quote Viewed', color: 'purple' },
        { status: 'quote_accepted', label: 'Quote Accepted', color: 'green' },
        { status: 'invoiced', label: 'Invoiced', color: 'orange' },
        { status: 'paid', label: 'Paid', color: 'green' },
        { status: 'completed', label: 'Completed', color: 'green' },
        { status: 'delivered', label: 'Delivered', color: 'green' },
        { status: 'cancelled', label: 'Cancelled', color: 'red' }
      ]
      
      return { statuses }
    }),

  /**
   * Manually complete an order that was handled offline
   * Creates invoice and payment records for consistency with Stripe-processed orders
   * 
   * Security: Admin-only endpoint
   * Validation: Prevents duplicate completions, validates amount range
   * Audit: Full logging and status history tracking
   */
  manualComplete: adminProcedure
    .input(z.object({
      orderId: z.number().int().positive('Order ID must be a positive integer'),
      completionAmount: z.number()
        .positive('Completion amount must be positive')
        .max(5000000, 'Amount cannot exceed $50,000'), // Max $50,000 in cents
      paymentMethod: z.enum(['cash', 'check', 'wire', 'other']).default('other'),
      adminNotes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
      sendEmail: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const { orderId, completionAmount, paymentMethod, adminNotes, sendEmail } = input
      const adminUserId = ctx.user.userId
      
      logger.info('Manual completion initiated', {
        orderId,
        amount: completionAmount,
        paymentMethod,
        adminUserId,
        sendEmail
      })
      
      // Store order details for email (sent outside transaction)
      let orderDetailsForEmail: {
        contactEmail: string
        contactName: string
        serviceType: string
      } | null = null
      
      let result: {
        success: boolean
        orderId: number
        previousStatus: string
        newStatus: string
        amount: number
        invoiceId: string
        paymentId: string
      }
      
      try {
        result = await transaction(async (client) => {
          // Get current order details with FOR UPDATE to prevent race conditions
          const orderResult = await client.query(
            `SELECT id, status, contact_name, contact_email, service_type, quoted_amount
             FROM quote_requests 
             WHERE id = $1
             FOR UPDATE`,
            [orderId]
          )
          
          if (orderResult.rows.length === 0) {
            logger.warn('Manual completion failed: Order not found', { orderId, adminUserId })
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Order not found'
            })
          }
          
          const order = orderResult.rows[0]
          const previousStatus = order.status
          
          // Store for email (outside transaction)
          orderDetailsForEmail = {
            contactEmail: order.contact_email,
            contactName: order.contact_name,
            serviceType: order.service_type || 'DJ Services'
          }
          
          // Validate order is not already in a terminal state
          const terminalStatuses = ['completed', 'delivered', 'cancelled']
          if (terminalStatuses.includes(previousStatus)) {
            logger.warn('Manual completion failed: Terminal status', { 
              orderId, 
              previousStatus, 
              adminUserId 
            })
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Cannot manually complete an order that is already ${previousStatus}`
            })
          }
          
          // Check for existing manual completion (prevent duplicates)
          const existingManualResult = await client.query(
            `SELECT id FROM invoices 
             WHERE quote_id = $1 
             AND stripe_invoice_id LIKE 'manual_inv_%'`,
            [orderId]
          )
          
          if (existingManualResult.rows.length > 0) {
            logger.warn('Manual completion failed: Duplicate attempt', { orderId, adminUserId })
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This order has already been manually completed. Please refresh the page.'
            })
          }
          
          // Generate unique identifiers for manual records
          const timestamp = Date.now()
          const manualInvoiceId = `manual_inv_${orderId}_${timestamp}`
          const manualPaymentId = `manual_pay_${orderId}_${timestamp}`
          
          // Create invoice record for consistency
          const invoiceResult = await client.query(
            `INSERT INTO invoices (
              quote_id, stripe_invoice_id, stripe_customer_id, amount_cents, 
              currency, status, customer_snapshot, created_at, paid_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id`,
            [
              orderId,
              manualInvoiceId,
              `manual_customer_${orderId}`,
              completionAmount,
              'usd',
              'paid',
              JSON.stringify({ 
                name: order.contact_name, 
                email: order.contact_email,
                manual_completion: true,
                completed_by: adminUserId,
                payment_method: paymentMethod,
                completed_at: new Date().toISOString()
              })
            ]
          )
          
          const invoiceId = invoiceResult.rows[0].id
          
          // Create payment record with payment method
          await client.query(
            `INSERT INTO payments (
              invoice_id, stripe_payment_id, amount_cents, currency, status, paid_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              invoiceId,
              manualPaymentId,
              completionAmount,
              'usd',
              'succeeded'
            ]
          )
          
          // Build admin notes with payment method
          const notesPrefix = `[Manual Completion - ${paymentMethod.toUpperCase()}]`
          const fullNotes = adminNotes 
            ? `${notesPrefix} ${adminNotes}` 
            : `${notesPrefix} Order completed offline by admin`
          
          // Update order status and amounts
          await client.query(
            `UPDATE quote_requests 
             SET status = 'completed',
                 quoted_amount = COALESCE(quoted_amount, $2),
                 total_amount = $2,
                 admin_notes = CASE 
                   WHEN admin_notes IS NULL OR admin_notes = '' THEN $3
                   ELSE admin_notes || E'\n\n' || $3
                 END,
                 updated_at = NOW()
             WHERE id = $1`,
            [orderId, completionAmount, fullNotes]
          )
          
          // Log status change in history with detailed information
          await client.query(
            `INSERT INTO order_status_history (
              quote_id, previous_status, new_status, changed_by, notes
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              orderId,
              previousStatus,
              'completed',
              adminUserId,
              `Manual completion by admin. Amount: $${(completionAmount / 100).toFixed(2)}. Payment method: ${paymentMethod}. ${adminNotes || 'No additional notes.'}`
            ]
          )
          
          logger.info('Manual completion database updates successful', {
            orderId,
            invoiceId: manualInvoiceId,
            paymentId: manualPaymentId,
            previousStatus,
            adminUserId
          })
          
          return {
            success: true,
            orderId,
            previousStatus,
            newStatus: 'completed',
            amount: completionAmount,
            invoiceId: manualInvoiceId,
            paymentId: manualPaymentId
          }
        })
      } catch (error: any) {
        // Re-throw TRPCErrors as-is
        if (error instanceof TRPCError) {
          throw error
        }
        // Log and wrap unexpected errors
        logger.error('Manual completion failed with unexpected error', error, {
          orderId,
          adminUserId
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete order. Please try again or contact support.'
        })
      }
      
      // Send email AFTER transaction commits successfully (outside transaction)
      let emailSent = false
      if (sendEmail && orderDetailsForEmail?.contactEmail) {
        try {
          const { sendManualCompletionEmail } = await import('../../utils/email-enhanced')
          emailSent = await sendManualCompletionEmail({
            to: orderDetailsForEmail.contactEmail,
            name: orderDetailsForEmail.contactName,
            amount: completionAmount,
            orderId,
            serviceType: orderDetailsForEmail.serviceType
          })
          
          if (emailSent) {
            logger.info('Manual completion email sent', { orderId, email: orderDetailsForEmail.contactEmail })
          } else {
            logger.warn('Manual completion email failed to send', { orderId, email: orderDetailsForEmail.contactEmail })
          }
        } catch (emailError: any) {
          // Log but don't fail - transaction already committed
          logger.error('Failed to send manual completion email', emailError, {
            orderId,
            email: orderDetailsForEmail.contactEmail
          })
        }
      }
      
      return {
        ...result,
        emailSent
      }
    })
})
