/**
 * Mailgun Email Service
 * Centralized email sending utility using Mailgun API
 * 
 * Replaces the previous Nodemailer/SMTP implementation
 * 
 * IMPROVED:
 * - Better error handling with specific error types
 * - Retry logic for transient failures
 * - Input validation before API call
 * - Timeout handling
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
 * Validate email address format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Send email using Mailgun API with retry logic
 * 
 * @param options - Email options (to, subject, html, text, from)
 * @param retries - Number of retry attempts for transient failures (default: 2)
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendEmailWithMailgun(options: MailgunEmailOptions, retries: number = 2): Promise<boolean> {
  // Validate inputs before making API call
  if (!options.to || !isValidEmailFormat(options.to)) {
    logger.error('Invalid recipient email address', { to: options.to })
    throw new Error(`Invalid recipient email address: ${options.to}`)
  }

  if (!options.subject || options.subject.trim().length === 0) {
    logger.error('Email subject is empty')
    throw new Error('Email subject cannot be empty')
  }

  if (!options.html || options.html.trim().length === 0) {
    logger.error('Email HTML content is empty')
    throw new Error('Email HTML content cannot be empty')
  }

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
  
  // Add plain text version if provided, otherwise generate from HTML
  if (options.text) {
    formData.append('text', options.text)
  } else {
    // Better HTML-to-text conversion: handle common elements
    const plainText = options.html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    formData.append('text', plainText)
  }
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`${apiUrl}/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString(),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorBody = await response.text()
        const statusCode = response.status
        
        // Don't retry on client errors (4xx) except rate limiting (429)
        if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw new Error(`Mailgun API Error: ${statusCode} ${response.statusText} - ${errorBody}`)
        }
        
        // Retry on server errors (5xx) and rate limiting (429)
        lastError = new Error(`Mailgun API Error: ${statusCode} ${response.statusText} - ${errorBody}`)
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
          logger.warn(`Mailgun API error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`, {
            statusCode,
            to: options.to
          })
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw lastError
      }
      
      const result: MailgunResponse = await response.json()
      
      logger.info('Email sent successfully via Mailgun', {
        to: options.to,
        subject: options.subject,
        messageId: result.id
      })
      
      return true
    } catch (error: any) {
      lastError = error
      
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        lastError = new Error(`Mailgun API request timed out after 30 seconds`)
      }
      
      // Retry on network errors
      if (attempt < retries && (error.name === 'AbortError' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        logger.warn(`Network error sending email, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`, {
          error: error.message,
          to: options.to
        })
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry on other errors
      if (attempt >= retries || (error.message && error.message.includes('Mailgun API Error: 4'))) {
        break
      }
    }
  }
  
  logger.error('Failed to send email with Mailgun after all retries', {
    error: lastError?.message,
    to: options.to,
    subject: options.subject
  })
  throw lastError || new Error('Unknown error sending email')
}
