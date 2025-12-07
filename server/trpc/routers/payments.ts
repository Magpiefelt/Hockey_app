import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { query } from '../../db/connection'

/**
 * Stripe Payment Integration
 * Handles payment processing via Stripe
 */
import { getOrCreateCustomer, createCheckoutSession, isStripeConfigured } from '../../utils/stripe'
import { logger } from '../../utils/logger'

export const paymentsRouter = router({
  /**
   * Create Stripe checkout session
   */
  createCheckout: adminProcedure
    .input(z.object({
      orderId: z.union([z.string(), z.number()])
    }))
    .mutation(async ({ input }) => {
      const orderId = typeof input.orderId === 'string' ? parseInt(input.orderId) : input.orderId
      const config = useRuntimeConfig()
      
      // Get order details
      const result = await query(
        `SELECT id, contact_name, contact_email, total_amount, status
         FROM quote_requests
         WHERE id = $1`,
        [orderId]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      const order = result.rows[0]
      
      if (!order.total_amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order does not have a total amount set'
        })
      }
      
      // Check if already invoiced
      if (order.status === 'paid' || order.status === 'completed' || order.status === 'delivered') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order has already been paid'
        })
      }
      
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        logger.warn('Stripe not configured, creating mock invoice')
        
        const checkoutUrl = `${config.public.appBaseUrl}/checkout/${orderId}`
        
        // Create mock invoice record
        await query(
          `INSERT INTO invoices (quote_id, stripe_invoice_id, stripe_customer_id, amount_cents, status, invoice_url, customer_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (stripe_invoice_id) DO NOTHING`,
          [
            orderId,
            `mock_session_${orderId}_${Date.now()}`,
            `mock_customer_${order.contact_email}`,
            order.total_amount,
            'draft',
            checkoutUrl,
            JSON.stringify({ name: order.contact_name, email: order.contact_email })
          ]
        )
        
        return {
          url: checkoutUrl,
          warning: 'Development mode - Stripe not configured'
        }
      }
      
      try {
        // Create or retrieve Stripe customer
        const customer = await getOrCreateCustomer(
          order.contact_email,
          order.contact_name,
          { order_id: orderId.toString() }
        )
        
        // Create checkout session
        const session = await createCheckoutSession({
          customerId: customer.id,
          orderId,
          amount: order.total_amount,
          description: 'Professional DJ services',
          successUrl: `${config.public.appBaseUrl}/orders/${orderId}?payment=success`,
          cancelUrl: `${config.public.appBaseUrl}/orders/${orderId}?payment=cancelled`
        })
        
        // Save invoice record
        await query(
          `INSERT INTO invoices (quote_id, stripe_invoice_id, stripe_customer_id, amount_cents, status, invoice_url, customer_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            session.id,
            customer.id,
            order.total_amount,
            'sent',
            session.url,
            JSON.stringify({ name: order.contact_name, email: order.contact_email })
          ]
        )
        
        // Update order status to invoiced
        await query(
          `UPDATE quote_requests 
           SET status = 'invoiced', updated_at = NOW()
           WHERE id = $1`,
          [orderId]
        )
        
        logger.info('Checkout session created', { orderId, sessionId: session.id })
        
        return {
          url: session.url!
        }
      } catch (error: any) {
        logger.error('Payment creation error', error, { orderId })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create checkout session'
        })
      }
    }),
  
  /**
   * Get payment status for an order
   */
  getStatus: adminProcedure
    .input(z.object({
      orderId: z.union([z.string(), z.number()])
    }))
    .query(async ({ input }) => {
      const orderId = typeof input.orderId === 'string' ? parseInt(input.orderId) : input.orderId
      
      const result = await query(
        `SELECT i.*, p.status as payment_status, p.paid_at
         FROM invoices i
         LEFT JOIN payments p ON i.id = p.invoice_id
         WHERE i.quote_id = $1
         ORDER BY i.created_at DESC
         LIMIT 1`,
        [orderId]
      )
      
      if (result.rows.length === 0) {
        return {
          hasInvoice: false,
          status: 'no_invoice'
        }
      }
      
      const invoice = result.rows[0]
      
      return {
        hasInvoice: true,
        invoiceId: invoice.id,
        stripeInvoiceId: invoice.stripe_invoice_id,
        amount: invoice.amount_cents,
        status: invoice.status,
        invoiceUrl: invoice.invoice_url,
        paymentStatus: invoice.payment_status,
        paidAt: invoice.paid_at?.toISOString()
      }
    })
})
