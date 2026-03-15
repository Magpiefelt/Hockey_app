/**
 * Admin Router
 *
 * Composed from domain-specific sub-routers for maintainability.
 * Large sections (orders, emails) live in their own files.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../../trpc'
import { query, transaction } from '../../../db/connection'
import { logger } from '../../../utils/logger'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  MANUAL_COMPLETION_BLOCKED_STATUSES,
  PAID_STATUS_SQL,
  PENDING_PAYMENT_SQL,
  getAllowedOrderTransitions,
  isTerminalOrderStatus
} from '../../../utils/order-status'

import { adminOrdersRouter } from './orders'
import { adminEmailsRouter } from './emails'

export const adminRouter = router({
  /**
   * Get dashboard statistics
   */
  dashboard: adminProcedure
    .query(async () => {
      const totalResult = await query('SELECT COUNT(*) as count FROM quote_requests')
      const totalOrders = parseInt(totalResult.rows[0].count)
      
      const pendingResult = await query(
        `SELECT COUNT(*) as count FROM quote_requests 
         WHERE status IN ('pending', 'submitted', 'in_progress')`
      )
      const pendingOrders = parseInt(pendingResult.rows[0].count)
      
      const revenueResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue 
         FROM quote_requests 
         WHERE ${PAID_STATUS_SQL}`
      )
      const totalRevenue = parseInt(revenueResult.rows[0].revenue)
      
      const customersResult = await query(
        `SELECT COUNT(DISTINCT COALESCE(user_id, contact_email)) as count 
         FROM quote_requests`
      )
      const activeCustomers = parseInt(customersResult.rows[0].count)
      
      return { totalOrders, pendingOrders, totalRevenue, activeCustomers }
    }),

  orders: adminOrdersRouter,

  customers: router({
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

  finance: router({
    stats: adminProcedure
      .query(async () => {
        const totalResult = await query(
          `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM quote_requests WHERE ${PAID_STATUS_SQL}`
        )
        const totalRevenue = parseInt(totalResult.rows[0].revenue)
        
        const monthlyResult = await query(
          `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM quote_requests 
           WHERE ${PAID_STATUS_SQL}
           AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
        )
        const monthlyRevenue = parseInt(monthlyResult.rows[0].revenue)
        
        const pendingResult = await query(
          `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM quote_requests WHERE ${PENDING_PAYMENT_SQL}`
        )
        const pendingPayments = parseInt(pendingResult.rows[0].revenue)
        
        const orderCountResult = await query(
          `SELECT COUNT(*) as count FROM quote_requests WHERE ${PAID_STATUS_SQL}`
        )
        const paidOrderCount = parseInt(orderCountResult.rows[0].count)
        
        const serviceResult = await query(
          `SELECT 
            COALESCE(p.name, qr.service_type, 'Other') as service,
            COALESCE(SUM(qr.total_amount), 0) as revenue
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          WHERE qr.${PAID_STATUS_SQL}
          GROUP BY p.name, qr.service_type
          ORDER BY revenue DESC`
        )
        
        const transactionsResult = await query(
          `SELECT 
            p.id, p.paid_at as date, qr.contact_name as customer_name,
            COALESCE(pkg.name, qr.service_type, 'Other') as package_name,
            p.amount_cents as amount, p.status, qr.id as order_id
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

  getOrderStatusHistory: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT 
          osh.id, osh.quote_id, osh.previous_status as old_status,
          osh.new_status, osh.notes, osh.changed_by,
          osh.changed_at as created_at, u.name as changed_by_name
        FROM order_status_history osh
        LEFT JOIN users u ON osh.changed_by = u.id
        WHERE osh.quote_id = $1
        ORDER BY osh.changed_at DESC`,
        [input.orderId]
      )
      return result.rows
    }),

  emails: adminEmailsRouter,

  getAllowedTransitions: adminProcedure
    .input(z.object({ currentStatus: z.string() }))
    .query(async ({ input }) => {
      const allowedStatuses = getAllowedOrderTransitions(input.currentStatus)
      return {
        currentStatus: input.currentStatus,
        currentStatusLabel: ORDER_STATUS_LABELS[input.currentStatus as keyof typeof ORDER_STATUS_LABELS] || input.currentStatus,
        allowedTransitions: allowedStatuses.map(status => ({
          status,
          label: ORDER_STATUS_LABELS[status] || status
        })),
        isTerminal: isTerminalOrderStatus(input.currentStatus)
      }
    }),

  getAllStatuses: adminProcedure
    .query(async () => {
      const statuses = ORDER_STATUS_VALUES.map(status => ({
        status,
        label: ORDER_STATUS_LABELS[status],
        color: ORDER_STATUS_COLORS[status]
      }))
      return { statuses }
    }),

  manualComplete: adminProcedure
    .input(z.object({
      orderId: z.number().int().positive('Order ID must be a positive integer'),
      completionAmount: z.number()
        .positive('Completion amount must be positive')
        .max(5000000, 'Amount cannot exceed $50,000'),
      paymentMethod: z.enum(['cash', 'check', 'wire', 'other']).default('other'),
      adminNotes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
      sendEmail: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const { orderId, completionAmount, paymentMethod, adminNotes, sendEmail } = input
      const adminUserId = ctx.user.userId
      
      logger.info('Manual completion initiated', { orderId, amount: completionAmount, paymentMethod, adminUserId, sendEmail })
      
      let result: {
        success: boolean; orderId: number; previousStatus: string; newStatus: string
        amount: number; invoiceId: string; paymentId: string
        orderDetailsForEmail: { contactEmail: string; contactName: string; serviceType: string } | null
      }
      
      try {
        result = await transaction(async (client) => {
          const orderResult = await client.query(
            `SELECT id, status, contact_name, contact_email, service_type, quoted_amount
             FROM quote_requests WHERE id = $1 FOR UPDATE`,
            [orderId]
          )
          
          if (orderResult.rows.length === 0) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
          }
          
          const order = orderResult.rows[0]
          const previousStatus = order.status
          const orderDetailsForEmail = {
            contactEmail: order.contact_email,
            contactName: order.contact_name,
            serviceType: order.service_type || 'DJ Services'
          }
          
          if (MANUAL_COMPLETION_BLOCKED_STATUSES.has(previousStatus as any)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Cannot manually complete an order that is already ${previousStatus}`
            })
          }
          
          const existingManualResult = await client.query(
            `SELECT id FROM invoices WHERE quote_id = $1 AND stripe_invoice_id LIKE 'manual_inv_%'`,
            [orderId]
          )
          
          if (existingManualResult.rows.length > 0) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This order has already been manually completed. Please refresh the page.'
            })
          }
          
          const timestamp = Date.now()
          const manualInvoiceId = `manual_inv_${orderId}_${timestamp}`
          const manualPaymentId = `manual_pay_${orderId}_${timestamp}`
          
          const invoiceResult = await client.query(
            `INSERT INTO invoices (
              quote_id, stripe_invoice_id, stripe_customer_id, amount_cents,
              currency, status, customer_snapshot, created_at, paid_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id`,
            [
              orderId, manualInvoiceId, `manual_customer_${orderId}`,
              completionAmount, 'cad', 'paid',
              JSON.stringify({
                name: order.contact_name, email: order.contact_email,
                manual_completion: true, completed_by: adminUserId,
                payment_method: paymentMethod, completed_at: new Date().toISOString()
              })
            ]
          )
          
          const invoiceId = invoiceResult.rows[0].id
          
          await client.query(
            `INSERT INTO payments (invoice_id, stripe_payment_id, amount_cents, currency, status, paid_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [invoiceId, manualPaymentId, completionAmount, 'cad', 'succeeded']
          )
          
          const notesPrefix = `[Manual Completion - ${paymentMethod.toUpperCase()}]`
          const fullNotes = adminNotes ? `${notesPrefix} ${adminNotes}` : `${notesPrefix} Order completed offline by admin`
          
          await client.query(
            `UPDATE quote_requests 
             SET status = 'completed', quoted_amount = COALESCE(quoted_amount, $2),
                 total_amount = $2,
                 admin_notes = CASE WHEN admin_notes IS NULL OR admin_notes = '' THEN $3
                   ELSE admin_notes || E'\n\n' || $3 END,
                 updated_at = NOW()
             WHERE id = $1`,
            [orderId, completionAmount, fullNotes]
          )
          
          await client.query(
            `INSERT INTO order_status_history (quote_id, previous_status, new_status, changed_by, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, previousStatus, 'completed', adminUserId,
             `Manual completion by admin. Amount: $${(completionAmount / 100).toFixed(2)}. Payment method: ${paymentMethod}. ${adminNotes || 'No additional notes.'}`]
          )
          
          return {
            success: true, orderId, previousStatus, newStatus: 'completed',
            amount: completionAmount, invoiceId: manualInvoiceId,
            paymentId: manualPaymentId, orderDetailsForEmail
          }
        })
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        logger.error('Manual completion failed with unexpected error', error, { orderId, adminUserId })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete order. Please try again or contact support.'
        })
      }
      
      let emailSent = false
      const orderDetailsForEmail = result.orderDetailsForEmail
      if (sendEmail && orderDetailsForEmail?.contactEmail) {
        try {
          const { sendManualCompletionEmail } = await import('../../../utils/email-enhanced')
          emailSent = await sendManualCompletionEmail({
            to: orderDetailsForEmail.contactEmail,
            name: orderDetailsForEmail.contactName,
            amount: completionAmount,
            orderId,
            serviceType: orderDetailsForEmail.serviceType
          })
        } catch (emailError: any) {
          logger.error('Failed to send manual completion email', emailError, {
            orderId, email: orderDetailsForEmail.contactEmail
          })
        }
      }
      
      return { ...result, emailSent }
    })
})
