/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment status updates
 */

import { verifyWebhookSignature } from '../../utils/stripe'
import { logger } from '../../utils/logger'
import { query, transaction } from '../../db/connection'
import { sendPaymentReceipt } from '../../utils/email'

interface OrderDetailsRow {
  contact_name: string
  contact_email: string
  total_amount: number
  event_datetime: Date | null
  event_date: Date | null
  admin_confirmed_datetime: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!body || !signature) {
    logger.warn('Webhook missing body or signature')
    throw createError({
      statusCode: 400,
      message: 'Missing webhook body or signature'
    })
  }

  try {
    // Verify webhook signature
    const stripeEvent = await verifyWebhookSignature(body, signature)

    logger.info('Stripe webhook received', { 
      eventType: stripeEvent.type,
      eventId: stripeEvent.id 
    })

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object)
        break

      case 'charge.refunded':
        await handleChargeRefunded(stripeEvent.data.object)
        break

      default:
        logger.debug('Unhandled webhook event type', { eventType: stripeEvent.type })
    }

    return {
      received: true,
      eventType: stripeEvent.type
    }
  } catch (error: any) {
    logger.error('Webhook processing failed', error)
    throw createError({
      statusCode: 400,
      message: 'Webhook processing failed'
    })
  }
})

/**
 * Handle checkout session completed
 * Uses a database transaction to ensure all updates succeed or fail together
 */
async function handleCheckoutCompleted(session: any) {
  const orderId = parseInt(session.metadata.order_id)

  logger.info('Checkout session completed', { 
    orderId, 
    sessionId: session.id,
    amountTotal: session.amount_total 
  })

  try {
    // Use transaction to ensure all database updates succeed or fail together
    // This prevents inconsistent state where payment is recorded but order status isn't updated
    const paymentProcessingResult = await transaction(async (client) => {
      // Update invoice status
      await client.query(
        `UPDATE invoices 
         SET status = 'paid', paid_at = NOW(), updated_at = NOW()
         WHERE stripe_invoice_id = $1`,
        [session.id]
      )

      // Create payment record
      const paymentInsertResult = await client.query(
        `INSERT INTO payments (invoice_id, stripe_payment_id, amount_cents, currency, status, paid_at)
         SELECT id, $1, $2, $3, $4, NOW()
         FROM invoices
         WHERE stripe_invoice_id = $5
         ON CONFLICT (stripe_payment_id) DO NOTHING
         RETURNING id`,
        [
          session.payment_intent,
          session.amount_total,
          session.currency,
          'succeeded',
          session.id
        ]
      )
      const isNewPayment = paymentInsertResult.rows.length > 0

      // Update order status to paid
      await client.query(
        `UPDATE quote_requests 
         SET status = 'paid', updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      )

      // Get order details for email and calendar blocking (inside transaction to ensure consistency)
      let orderResult
      try {
        orderResult = await client.query<OrderDetailsRow>(
          `SELECT contact_name, contact_email, total_amount, event_datetime, event_date, admin_confirmed_datetime
           FROM quote_requests
           WHERE id = $1`,
          [orderId]
        )
      } catch {
        // Fallback if new columns don't exist yet
        orderResult = await client.query<OrderDetailsRow>(
          `SELECT contact_name, contact_email, total_amount, event_date, NULL as event_datetime, FALSE as admin_confirmed_datetime
           FROM quote_requests
           WHERE id = $1`,
          [orderId]
        )
      }

      let currentOrderDetails: OrderDetailsRow | null = null
      if (orderResult.rows.length > 0) {
        currentOrderDetails = orderResult.rows[0]
      }
      
      // Auto-block calendar date when payment is successful
      // Only block if admin confirmed the datetime when submitting quote
      if (currentOrderDetails?.admin_confirmed_datetime && (currentOrderDetails.event_datetime || currentOrderDetails.event_date)) {
        const eventDate = currentOrderDetails.event_datetime || currentOrderDetails.event_date
        if (!eventDate) {
          return {
            orderDetails: currentOrderDetails,
            isNewPayment
          }
        }
        const dateStr = eventDate instanceof Date
          ? eventDate.toISOString().split('T')[0]
          : new Date(String(eventDate)).toISOString().split('T')[0]
        
        // Check if a booking override already exists for this order
        try {
          const existingOverride = await client.query(
            `SELECT id FROM availability_overrides WHERE order_id = $1`,
            [orderId]
          )
          
          if (existingOverride.rows.length === 0) {
            // Create availability override to block this date
            try {
              await client.query(
                `INSERT INTO availability_overrides 
                 (start_date, end_date, is_available, reason, override_type, order_id, notes, created_at, updated_at)
                 VALUES ($1, $2, false, $3, 'booking', $4, $5, NOW(), NOW())`,
                [
                  dateStr,
                  dateStr,
                  `Booked: Order #${orderId}`,
                  orderId,
                  `Auto-blocked after payment for ${currentOrderDetails.contact_name}`
                ]
              )
            } catch {
              // Fallback without order_id column
              await client.query(
                `INSERT INTO availability_overrides 
                 (start_date, end_date, is_available, reason, override_type, notes, created_at, updated_at)
                 VALUES ($1, $2, false, $3, 'booking', $4, NOW(), NOW())`,
                [
                  dateStr,
                  dateStr,
                  `Booked: Order #${orderId}`,
                  `Auto-blocked after payment for ${currentOrderDetails.contact_name}`
                ]
              )
            }
            
            logger.info('Calendar date auto-blocked after payment', { 
              orderId, 
              date: dateStr,
              customerName: currentOrderDetails.contact_name
            })
          }
        } catch {
          // order_id column may not exist, create override without it
          await client.query(
            `INSERT INTO availability_overrides 
             (start_date, end_date, is_available, reason, override_type, notes, created_at, updated_at)
             VALUES ($1, $2, false, $3, 'booking', $4, NOW(), NOW())`,
            [
              dateStr,
              dateStr,
              `Booked: Order #${orderId}`,
              `Auto-blocked after payment for ${currentOrderDetails.contact_name}`
            ]
          )
        }
      }

      return {
        orderDetails: currentOrderDetails,
        isNewPayment
      }
    })

    // Send payment receipt email AFTER transaction commits successfully
    // This ensures we only send emails for successfully processed payments
    if (paymentProcessingResult.isNewPayment && paymentProcessingResult.orderDetails) {
      await sendPaymentReceipt({
        to: paymentProcessingResult.orderDetails.contact_email,
        name: paymentProcessingResult.orderDetails.contact_name,
        amount: paymentProcessingResult.orderDetails.total_amount,
        orderId
      })
    }

    if (!paymentProcessingResult.isNewPayment) {
      logger.info('Duplicate checkout completion webhook processed idempotently', {
        orderId,
        sessionId: session.id,
        paymentIntent: session.payment_intent
      })
    }

    logger.info('Payment processed successfully', { orderId })
  } catch (error: any) {
    logger.error('Failed to process checkout completion', error, { orderId })
    throw error
  }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  logger.info('Payment intent succeeded', { 
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount 
  })

  // Additional payment success handling if needed
}

/**
 * Handle payment intent failed
 */
async function handlePaymentFailed(paymentIntent: any) {
  logger.warn('Payment intent failed', { 
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    failureMessage: paymentIntent.last_payment_error?.message 
  })

  try {
    // Mark payment failed if a payment record already exists.
    await query(
      `UPDATE payments
       SET status = 'failed'
       WHERE stripe_payment_id = $1`,
      [paymentIntent.id]
    )

    // Primary path: map payment intent to invoice through payments table.
    const invoiceResult = await query(
      `UPDATE invoices i
       SET status = 'failed', updated_at = NOW()
       FROM payments p
       WHERE p.stripe_payment_id = $1
         AND p.invoice_id = i.id
       RETURNING i.id, i.quote_id`,
      [paymentIntent.id]
    )

    // Fallback: use order_id metadata populated when checkout sessions are created.
    if (invoiceResult.rows.length === 0) {
      const metadataOrderId = Number.parseInt(paymentIntent?.metadata?.order_id || '', 10)
      if (Number.isFinite(metadataOrderId)) {
        await query(
          `UPDATE invoices
           SET status = 'failed', updated_at = NOW()
           WHERE quote_id = $1 AND status IN ('draft', 'sent')`,
          [metadataOrderId]
        )
      }
    }
  } catch (error: any) {
    logger.error('Failed to update payment failure', error)
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: any) {
  logger.info('Charge refunded', { 
    chargeId: charge.id,
    amount: charge.amount_refunded 
  })

  try {
    // Update payment status to refunded
    await query(
      `UPDATE payments 
       SET status = 'refunded'
       WHERE stripe_payment_id = $1`,
      [charge.payment_intent]
    )

    // Prefer explicit refunded status for consistency with admin/customer flows.
    try {
      await query(
        `UPDATE quote_requests 
         SET status = 'refunded', updated_at = NOW()
         WHERE id IN (
           SELECT quote_id FROM invoices i
           JOIN payments p ON i.id = p.invoice_id
           WHERE p.stripe_payment_id = $1
         )`,
        [charge.payment_intent]
      )
    } catch (statusError: any) {
      logger.warn('Refunded status unavailable, falling back to cancelled', {
        paymentIntent: charge.payment_intent,
        error: statusError?.message
      })
      await query(
        `UPDATE quote_requests 
         SET status = 'cancelled', updated_at = NOW()
         WHERE id IN (
           SELECT quote_id FROM invoices i
           JOIN payments p ON i.id = p.invoice_id
           WHERE p.stripe_payment_id = $1
         )`,
        [charge.payment_intent]
      )
    }
  } catch (error: any) {
    logger.error('Failed to process refund', error)
  }
}
