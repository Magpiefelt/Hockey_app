/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment status updates
 */

import { verifyWebhookSignature } from '../../utils/stripe'
import { logger } from '../../utils/logger'
import { query, transaction } from '../../db/connection'
import { sendPaymentReceipt } from '../../utils/email'

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

  // Store order details for email (fetched inside transaction)
  let orderDetails: { contact_name: string; contact_email: string; total_amount: number } | null = null

  try {
    // Use transaction to ensure all database updates succeed or fail together
    // This prevents inconsistent state where payment is recorded but order status isn't updated
    await transaction(async (client) => {
      // Update invoice status
      await client.query(
        `UPDATE invoices 
         SET status = 'paid', paid_at = NOW(), updated_at = NOW()
         WHERE stripe_invoice_id = $1`,
        [session.id]
      )

      // Create payment record
      await client.query(
        `INSERT INTO payments (invoice_id, stripe_payment_id, amount_cents, currency, status, paid_at)
         SELECT id, $1, $2, $3, $4, NOW()
         FROM invoices
         WHERE stripe_invoice_id = $5`,
        [
          session.payment_intent,
          session.amount_total,
          session.currency,
          'succeeded',
          session.id
        ]
      )

      // Update order status to paid
      await client.query(
        `UPDATE quote_requests 
         SET status = 'paid', updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      )

      // Get order details for email (inside transaction to ensure consistency)
      const orderResult = await client.query(
        `SELECT contact_name, contact_email, total_amount
         FROM quote_requests
         WHERE id = $1`,
        [orderId]
      )

      if (orderResult.rows.length > 0) {
        orderDetails = orderResult.rows[0]
      }
    })

    // Send payment receipt email AFTER transaction commits successfully
    // This ensures we only send emails for successfully processed payments
    if (orderDetails) {
      await sendPaymentReceipt({
        to: orderDetails.contact_email,
        name: orderDetails.contact_name,
        amount: orderDetails.total_amount,
        orderId
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
    // Update invoice status to failed
    await query(
      `UPDATE invoices 
       SET status = 'failed', updated_at = NOW()
       WHERE stripe_invoice_id IN (
         SELECT id FROM checkout_sessions WHERE payment_intent = $1
       )`,
      [paymentIntent.id]
    )
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

    // Update order status
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
  } catch (error: any) {
    logger.error('Failed to process refund', error)
  }
}
