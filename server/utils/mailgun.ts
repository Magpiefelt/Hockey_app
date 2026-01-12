/**
 * Mailgun Email Service
 * Centralized email sending utility using Mailgun API
 * 
 * Replaces the previous Nodemailer/SMTP implementation
 */

import { logger } from './logger'

interface MailgunEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

interface MailgunResponse {
  id: string
  message: string
}

/**
 * Send email using Mailgun API
 * 
 * @param options - Email options (to, subject, html, text, from)
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendEmailWithMailgun(options: MailgunEmailOptions): Promise<boolean> {
  const config = useRuntimeConfig()
  
  const apiKey = config.mailgunApiKey
  const domain = config.mailgunDomain
  const apiUrl = config.mailgunApiUrl || 'https://api.mailgun.net'
  const defaultFrom = config.mailgunFromEmail || `Elite Sports DJ <postmaster@${domain}>`
  
  if (!apiKey || !domain) {
    logger.warn('Mailgun not configured, email will be logged to console', {
      to: options.to,
      subject: options.subject
    })
    // In development, log the email content instead of failing
    logger.info('Email content (dev mode):', {
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      htmlLength: options.html?.length || 0
    })
    return true // Return true in dev mode to not break flows
  }
  
  // Build form data for Mailgun API
  const formData = new URLSearchParams()
  formData.append('from', options.from || defaultFrom)
  formData.append('to', options.to)
  formData.append('subject', options.subject)
  formData.append('html', options.html)
  
  // Add plain text version if provided, otherwise strip HTML
  if (options.text) {
    formData.append('text', options.text)
  } else {
    formData.append('text', options.html.replace(/<[^>]*>/g, ''))
  }
  
  try {
    const response = await fetch(`${apiUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
    
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Mailgun API Error: ${response.status} ${response.statusText} - ${errorBody}`)
    }
    
    const result: MailgunResponse = await response.json()
    
    logger.info('Email sent successfully via Mailgun', {
      to: options.to,
      subject: options.subject,
      messageId: result.id
    })
    
    return true
  } catch (error: any) {
    logger.error('Failed to send email with Mailgun', {
      error: error.message,
      to: options.to,
      subject: options.subject
    })
    throw error // Re-throw to allow caller to handle
  }
}

/**
 * Validate email address format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
