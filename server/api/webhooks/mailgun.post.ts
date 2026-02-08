/**
 * Mailgun Webhook Handler
 * Handles email events from Mailgun (delivered, bounced, complained, etc.)
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/mailgun
 * Configure in Mailgun Dashboard: Sending > Webhooks
 */

import { createHmac } from 'crypto'
import { defineEventHandler, readBody, getHeader } from 'h3'
import { executeQuery } from '../../utils/database'
import { logger } from '../../utils/logger'

interface MailgunWebhookEvent {
  signature: {
    timestamp: string
    token: string
    signature: string
  }
  'event-data': {
    event: string
    timestamp: number
    id: string
    recipient: string
    'message': {
      headers: {
        'message-id': string
        subject?: string
        from?: string
        to?: string
      }
    }
    'delivery-status'?: {
      code?: number
      message?: string
      description?: string
    }
    reason?: string
    severity?: string
    tags?: string[]
    'user-variables'?: Record<string, string>
  }
}

/**
 * Verify Mailgun webhook signature
 */
function verifyWebhookSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): boolean {
  const encodedToken = createHmac('sha256', signingKey)
    .update(timestamp.concat(token))
    .digest('hex')
  
  return encodedToken === signature
}

/**
 * Map Mailgun event type to our email status
 */
function mapEventToStatus(event: string): 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained' | 'opened' | 'clicked' {
  switch (event) {
    case 'delivered':
      return 'delivered'
    case 'failed':
    case 'rejected':
      return 'failed'
    case 'bounced':
    case 'permanent_fail':
    case 'temporary_fail':
      return 'bounced'
    case 'complained':
    case 'unsubscribed':
      return 'complained'
    case 'opened':
      return 'opened'
    case 'clicked':
      return 'clicked'
    default:
      return 'sent'
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const signingKey = config.mailgunWebhookSigningKey
  
  if (!signingKey) {
    logger.error('Mailgun webhook signing key not configured')
    return { received: true, processed: false, error: 'Webhook not configured' }
  }
  
  try {
    const body: MailgunWebhookEvent = await readBody(event)
    
    // Verify signature
    const { timestamp, token, signature } = body.signature
    
    if (!verifyWebhookSignature(signingKey, timestamp, token, signature)) {
      logger.warn('Mailgun webhook signature verification failed')
      return { received: true, processed: false, error: 'Invalid signature' }
    }
    
    // Check timestamp to prevent replay attacks (allow 5 minute window)
    const webhookTimestamp = parseInt(timestamp) * 1000
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    if (Math.abs(now - webhookTimestamp) > fiveMinutes) {
      logger.warn('Mailgun webhook timestamp too old', { timestamp, now })
      return { received: true, processed: false, error: 'Timestamp too old' }
    }
    
    const eventData = body['event-data']
    const eventType = eventData.event
    const recipientEmail = eventData.recipient
    const messageId = eventData.message?.headers?.['message-id']
    const subject = eventData.message?.headers?.subject
    const status = mapEventToStatus(eventType)
    
    logger.info('Mailgun webhook received', {
      event: eventType,
      recipient: recipientEmail,
      messageId,
      status
    })
    
    // Update email log if we have a matching record
    if (recipientEmail) {
      try {
        // Try to find and update the most recent email log for this recipient
        const result = await executeQuery(
          `UPDATE email_logs 
           SET status = $1, 
               updated_at = NOW(),
               webhook_event = $2,
               webhook_data = $3
           WHERE to_email = $4 
             AND sent_at > NOW() - INTERVAL '7 days'
           ORDER BY sent_at DESC
           LIMIT 1
           RETURNING id`,
          [
            status,
            eventType,
            JSON.stringify({
              messageId,
              deliveryStatus: eventData['delivery-status'],
              reason: eventData.reason,
              severity: eventData.severity,
              timestamp: eventData.timestamp
            }),
            recipientEmail
          ]
        )
        
        if (result.rows.length > 0) {
          logger.info('Email log updated from webhook', {
            emailLogId: result.rows[0].id,
            status,
            event: eventType
          })
        }
      } catch (dbError: any) {
        // Log but don't fail - the webhook_event and webhook_data columns might not exist yet
        logger.warn('Could not update email log from webhook', { 
          error: dbError.message,
          recipient: recipientEmail 
        })
      }
    }
    
    // Handle specific events
    switch (eventType) {
      case 'bounced':
      case 'permanent_fail':
        logger.warn('Email bounced', {
          recipient: recipientEmail,
          reason: eventData.reason,
          severity: eventData.severity
        })
        break
        
      case 'complained':
        logger.warn('Email complaint received', {
          recipient: recipientEmail
        })
        // You might want to add this email to a suppression list
        break
        
      case 'failed':
      case 'rejected':
        logger.error('Email delivery failed', {
          recipient: recipientEmail,
          reason: eventData.reason,
          deliveryStatus: eventData['delivery-status']
        })
        break
        
      case 'delivered':
        logger.info('Email delivered successfully', {
          recipient: recipientEmail,
          messageId
        })
        break
    }
    
    return { 
      received: true, 
      processed: true,
      event: eventType,
      recipient: recipientEmail
    }
    
  } catch (error: any) {
    logger.error('Mailgun webhook processing error', { error: error.message })
    return { received: true, processed: false, error: error.message }
  }
})
