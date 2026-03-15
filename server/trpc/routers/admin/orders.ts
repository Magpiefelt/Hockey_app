import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../../trpc'
import { query, transaction } from '../../../db/connection'
import { sendCustomEmail } from '../../../utils/email'
import { sendEnhancedQuoteEmail } from '../../../utils/email-enhanced'
import { generateQuoteViewUrl } from '../../../utils/quote-tokens'
import { logger } from '../../../utils/logger'
import { getAppBaseUrl } from '../../../utils/config'
import { isValidOrderStatusTransition } from '../../../utils/order-status'

export const adminOrdersRouter = router({
  /**
   * Get order statistics
   */
  stats: adminProcedure
    .query(async () => {
      const totalResult = await query(
        'SELECT COUNT(*) as count FROM quote_requests'
      )
      const totalOrders = parseInt(totalResult.rows[0].count)
      
      const pendingResult = await query(
        `SELECT COUNT(*) as count FROM quote_requests 
         WHERE status IN ('submitted')`
      )
      const pendingOrders = parseInt(pendingResult.rows[0].count)
      
      const inProgressResult = await query(
        `SELECT COUNT(*) as count FROM quote_requests 
         WHERE status IN ('quoted', 'in_progress')`
      )
      const inProgressOrders = parseInt(inProgressResult.rows[0].count)
      
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
      packageId: z.coerce.number().int().positive().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      page: z.number().optional(),
      pageSize: z.number().optional()
    }).optional())
    .query(async ({ input }) => {
      const fsCheck = await query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_submissions') as exists`
      )
      const hasFormSubmissions = fsCheck.rows[0]?.exists === true
      
      let sql = hasFormSubmissions ? `
        SELECT 
          qr.id, qr.contact_name as name, qr.contact_email as email,
          qr.contact_phone as phone, qr.organization, qr.status, qr.event_date,
          qr.service_type, qr.sport_type, qr.quoted_amount, qr.total_amount,
          qr.notes, qr.created_at, qr.updated_at,
          p.id as package_id, p.name as package_name, COALESCE(p.name, qr.service_type) as service_name,
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
      ` : `
        SELECT 
          qr.id, qr.contact_name as name, qr.contact_email as email,
          qr.contact_phone as phone, NULL as organization, qr.status, qr.event_date,
          qr.service_type, qr.sport_type, qr.quoted_amount, qr.total_amount,
          NULL as notes, qr.created_at, qr.updated_at,
          p.id as package_id, p.name as package_name, COALESCE(p.name, qr.service_type) as service_name,
          NULL as team_name,
          COALESCE(file_counts.total_files, 0) as file_count,
          COALESCE(file_counts.upload_count, 0) as upload_count,
          COALESCE(file_counts.deliverable_count, 0) as deliverable_count
        FROM quote_requests qr
        LEFT JOIN packages p ON qr.package_id = p.id
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

      if (input?.packageId) {
        sql += ` AND qr.package_id = $${paramCount}`
        params.push(input.packageId)
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
        params.push(input.search)
        paramCount += 2
      }
      
      sql += ' ORDER BY qr.created_at DESC'
      
      let limit = 50
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
      
      let countSql = 'SELECT COUNT(*) as total FROM quote_requests qr WHERE 1=1'
      const countParams: any[] = []
      let countIdx = 1
      if (input?.status) {
        countSql += ` AND qr.status = $${countIdx}`
        countParams.push(input.status)
        countIdx++
      }
      if (input?.packageId) {
        countSql += ` AND qr.package_id = $${countIdx}`
        countParams.push(input.packageId)
        countIdx++
      }
      if (input?.search) {
        countSql += ` AND (qr.contact_name ILIKE $${countIdx} OR qr.contact_email ILIKE $${countIdx} OR qr.contact_phone ILIKE $${countIdx} OR qr.service_type ILIKE $${countIdx} OR qr.id::text = $${countIdx + 1})`
        countParams.push(`%${input.search}%`)
        countParams.push(input.search)
        countIdx += 2
      }

      sql += ` LIMIT ${limit} OFFSET ${offset}`
      
      const [result, countResult] = await Promise.all([
        query(sql, params),
        query(countSql, countParams)
      ])

      const total = parseInt(countResult.rows[0]?.total ?? '0') || 0
      
      const orders = result.rows.map(row => ({
        id: Number(row.id),
        name: row.name,
        email: row.email,
        phone: row.phone,
        organization: row.organization,
        packageId: row.package_id !== null ? Number(row.package_id) : null,
        packageName: row.package_name || null,
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

      return { orders, total }
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
      
      let orderResult
      try {
        orderResult = await query(
          `SELECT 
            qr.id, qr.user_id, qr.contact_name as name, qr.contact_email as email,
            qr.contact_phone as phone, qr.organization, qr.status, qr.event_date,
            qr.event_datetime, qr.event_time,
            qr.service_type,
            qr.sport_type, qr.notes, qr.admin_notes,
            qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
            p.id as package_id, p.name as package_name,
            fs.team_name, fs.roster_method, fs.roster_players, fs.intro_song,
            fs.warmup_songs, fs.goal_horn, fs.goal_song, fs.win_song,
            fs.sponsors, fs.include_sample, fs.audio_files
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
          WHERE qr.id = $1`,
          [orderId]
        )
      } catch {
        orderResult = await query(
          `SELECT 
            qr.id, qr.user_id, qr.contact_name as name, qr.contact_email as email,
            qr.contact_phone as phone, NULL as organization, qr.status, qr.event_date,
            qr.event_datetime, qr.event_time,
            qr.service_type,
            qr.sport_type, NULL as notes, qr.admin_notes,
            qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
            p.id as package_id, p.name as package_name,
            NULL as team_name, NULL as roster_method, NULL as roster_players, NULL as intro_song,
            NULL as warmup_songs, NULL as goal_horn, NULL as goal_song, NULL as win_song,
            NULL as sponsors, NULL as include_sample, NULL as audio_files
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          WHERE qr.id = $1`,
          [orderId]
        )
      }
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
      }
      
      const order = orderResult.rows[0]
      
      const filesResult = await query(
        `SELECT id, field_name, file_name, storage_url, mime_type, file_size, kind, created_at
         FROM file_uploads
         WHERE quote_id = $1
         ORDER BY created_at ASC`,
        [orderId]
      )
      
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
          id: Number(order.id),
          name: order.name,
          email: order.email,
          emailSnapshot: order.email,
          phone: order.phone,
          organization: order.organization,
          packageId: order.package_id !== null ? Number(order.package_id) : null,
          serviceType: order.service_type || order.package_name,
          sportType: order.sport_type,
          status: order.status,
          quotedAmount: order.quoted_amount,
          totalAmount: order.total_amount,
          eventDate: order.event_date ? new Date(order.event_date).toISOString().split('T')[0] : null,
          eventDateTime: order.event_datetime?.toISOString() || null,
          eventTime: order.event_time ? String(order.event_time).substring(0, 5) : null,
          notes: order.notes,
          adminNotes: order.admin_notes,
          createdAt: order.created_at.toISOString(),
          updatedAt: order.updated_at?.toISOString(),
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
   * Update admin notes only
   */
  updateNotes: adminProcedure
    .input(z.object({
      id: z.union([z.string(), z.number()]),
      adminNotes: z.string().max(5000).default('')
    }))
    .mutation(async ({ input }) => {
      const orderId = typeof input.id === 'string' ? parseInt(input.id) : input.id
      await query(
        'UPDATE quote_requests SET admin_notes = $1, updated_at = NOW() WHERE id = $2',
        [input.adminNotes, orderId]
      )
      return { success: true }
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
        const currentResult = await client.query(
          'SELECT status FROM quote_requests WHERE id = $1',
          [orderId]
        )
        
        if (currentResult.rows.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
        }
        
        const previousStatus = currentResult.rows[0].status
        
        if (input.status && input.status !== previousStatus) {
          if (!isValidOrderStatusTransition(previousStatus, input.status)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Invalid status transition from '${previousStatus}' to '${input.status}'`
            })
          }
        }
        
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No updates provided' })
        }
        
        params.push(orderId)
        const result = await client.query(
          `UPDATE quote_requests 
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = $${paramCount}
           RETURNING id, contact_name as name, contact_email as email, status`,
          params
        )
        
        const order = result.rows[0]
        
        if (input.status && input.status !== previousStatus) {
          await client.query(
            `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, previousStatus, input.status, ctx.user.userId, input.adminNotes || 'Status updated by admin']
          )
          
          try {
            const statusMessages: Record<string, { subject: string; message: string }> = {
              'quoted': { subject: 'Quote Ready', message: 'Great news! We\'ve prepared a custom quote for your request. Please check your email for details.' },
              'invoiced': { subject: 'Invoice Ready', message: 'Your invoice is ready. Please proceed with payment to continue.' },
              'paid': { subject: 'Payment Received', message: 'Thank you! We\'ve received your payment and will begin working on your order.' },
              'in_progress': { subject: 'Order In Progress', message: 'Your order is now being processed. We\'ll notify you once it\'s ready.' },
              'completed': { subject: 'Order Completed', message: 'Your order is complete! We\'re preparing your deliverables.' },
              'delivered': { subject: 'Order Delivered', message: 'Your order has been delivered! You can now download your files.' },
              'refunded': { subject: 'Refund Processed', message: 'Your refund has been processed. Please allow 5-10 business days for the refund to appear on your statement.' },
              'cancelled': { subject: 'Order Cancelled', message: 'Your order has been cancelled. If you have any questions, please don\'t hesitate to contact us.' }
            }
            
            const notification = statusMessages[input.status]
            if (notification && order.email) {
              const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
              const safeName = escapeHtml(order.name || 'Customer')
              const safeOrderId = escapeHtml(String(orderId))
              const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1>${notification.subject}</h1>
                  </div>
                  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hi ${safeName},</p>
                    <p>${notification.message}</p>
                    <p><strong>Order #${safeOrderId}</strong></p>
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
            logger.error('Failed to send status change notification', { orderId, error: emailError.message })
          }
        }
        
        return {
          id: Number(order.id),
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
        }
        
        const order = result.rows[0]
        
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
        
        await client.query(
          `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [input.orderId, 'submitted', 'quoted', ctx.user.userId, 'Quote submitted to customer']
        )
        
        try {
          const appBaseUrl = getAppBaseUrl()
          const quoteViewUrl = generateQuoteViewUrl(input.orderId, order.contact_email, appBaseUrl)
          
          await sendEnhancedQuoteEmail({
            to: order.contact_email,
            name: order.contact_name,
            quoteAmount: input.quoteAmount,
            packageName,
            orderId: input.orderId,
            quoteViewUrl,
            adminNotes: input.adminNotes
          })
          logger.info('Quote email sent', { orderId: input.orderId, email: order.contact_email })
        } catch (emailError: any) {
          logger.error('Failed to send quote email', { orderId: input.orderId, error: emailError.message })
        }
        
        return {
          success: true,
          orderId: order.id,
          status: order.status
        }
      })
    })
})
