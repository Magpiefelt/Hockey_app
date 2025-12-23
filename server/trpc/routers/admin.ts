import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { query, transaction } from '../../db/connection'
import { sendCustomEmail, sendQuoteEmail, sendOrderConfirmation, sendInvoiceEmail, sendPaymentReceipt } from '../../utils/email'

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
                await sendCustomEmail({
                  to: order.email,
                  subject: `${notification.subject} - Order #${orderId}`,
                  body: `Hi ${order.name},\n\n${notification.message}\n\nOrder #${orderId}\n\nBest regards,\nElite Sports DJ Team`,
                  orderId
                })
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
     */
    list: adminProcedure
      .query(async () => {
        const result = await query(
          `SELECT 
            COALESCE(u.id, 0) as id,
            COALESCE(u.name, qr.contact_name) as name,
            COALESCE(u.email, qr.contact_email) as email,
            qr.contact_phone as phone,
            qr.organization,
            COUNT(qr.id) as order_count,
            COALESCE(SUM(qr.total_amount), 0) as total_spent,
            MIN(qr.created_at) as created_at
          FROM quote_requests qr
          LEFT JOIN users u ON qr.user_id = u.id
          GROUP BY u.id, u.name, u.email, qr.contact_name, qr.contact_email, qr.contact_phone, qr.organization
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
            el.quote_request_id as order_id,
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
          LEFT JOIN quote_requests qr ON el.quote_request_id = qr.id
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
          LEFT JOIN quote_requests qr ON el.quote_request_id = qr.id
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
          orderId: row.quote_request_id,
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
              await emailUtils.sendCustomEmail({
                to: emailLog.to_email,
                subject: emailLog.subject,
                body: metadata.body || 'Email content',
                orderId: emailLog.quote_request_id
              })
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
  })
})
