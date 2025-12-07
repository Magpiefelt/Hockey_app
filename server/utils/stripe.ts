/**
 * Stripe Payment Utility
 * Handles Stripe payment processing and webhook verification
 */

import { logger } from './logger'

let stripeClient: any = null
let stripeConfigured = false

/**
 * Initialize Stripe client
 */
async function initStripe() {
  if (stripeClient) return stripeClient

  const config = useRuntimeConfig()
  const secretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    logger.warn('Stripe secret key not configured, payment processing unavailable')
    return null
  }

  try {
    const Stripe = (await import('stripe')).default
    
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true
    })

    stripeConfigured = true
    logger.info('Stripe client initialized')
    
    return stripeClient
  } catch (error: any) {
    logger.error('Failed to initialize Stripe client', error)
    return null
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripeConfigured
}

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateCustomer(email: string, name: string, metadata?: Record<string, string>) {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  try {
    // Check if customer exists
    const customers = await stripe.customers.list({
      email,
      limit: 1
    })

    if (customers.data.length > 0) {
      logger.debug('Existing Stripe customer found', { email, customerId: customers.data[0].id })
      return customers.data[0]
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: metadata || {}
    })

    logger.info('New Stripe customer created', { email, customerId: customer.id })
    return customer
  } catch (error: any) {
    logger.error('Failed to get or create Stripe customer', error, { email })
    throw new Error('Failed to create customer')
  }
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(options: {
  customerId: string
  orderId: number
  amount: number
  description: string
  successUrl: string
  cancelUrl: string
}) {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: options.customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Elite Sports DJ - Order #${options.orderId}`,
              description: options.description
            },
            unit_amount: options.amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        order_id: options.orderId.toString()
      }
    })

    logger.info('Stripe checkout session created', { 
      orderId: options.orderId, 
      sessionId: session.id,
      amount: options.amount 
    })

    return session
  } catch (error: any) {
    logger.error('Failed to create Stripe checkout session', error, { orderId: options.orderId })
    throw new Error('Failed to create checkout session')
  }
}

/**
 * Create Stripe payment intent
 */
export async function createPaymentIntent(options: {
  amount: number
  currency?: string
  customerId?: string
  metadata?: Record<string, string>
}) {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: options.amount,
      currency: options.currency || 'usd',
      customer: options.customerId,
      metadata: options.metadata || {},
      automatic_payment_methods: {
        enabled: true
      }
    })

    logger.info('Stripe payment intent created', { 
      paymentIntentId: paymentIntent.id,
      amount: options.amount 
    })

    return paymentIntent
  } catch (error: any) {
    logger.error('Failed to create Stripe payment intent', error)
    throw new Error('Failed to create payment intent')
  }
}

/**
 * Retrieve payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error: any) {
    logger.error('Failed to retrieve payment intent', error, { paymentIntentId })
    throw new Error('Failed to retrieve payment intent')
  }
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<any> {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const config = useRuntimeConfig()
  const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured')
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    logger.debug('Webhook signature verified', { eventType: event.type })
    return event
  } catch (error: any) {
    logger.error('Webhook signature verification failed', error)
    throw new Error('Invalid webhook signature')
  }
}

/**
 * Refund payment
 */
export async function refundPayment(paymentIntentId: string, amount?: number) {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount // If undefined, refunds the full amount
    })

    logger.info('Payment refunded', { 
      paymentIntentId, 
      refundId: refund.id,
      amount: refund.amount 
    })

    return refund
  } catch (error: any) {
    logger.error('Failed to refund payment', error, { paymentIntentId })
    throw new Error('Failed to refund payment')
  }
}

/**
 * Cancel payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  const stripe = await initStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId)
    logger.info('Payment intent cancelled', { paymentIntentId })
    return paymentIntent
  } catch (error: any) {
    logger.error('Failed to cancel payment intent', error, { paymentIntentId })
    throw new Error('Failed to cancel payment intent')
  }
}
