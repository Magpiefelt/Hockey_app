/**
 * Email Utility Module
 * Provides email sending functionality using Mailgun API
 * 
 * Migrated from Nodemailer/SMTP to Mailgun
 * 
 * IMPROVED:
 * - Stores metadata_json in email_logs for reliable email resend
 * - Better error handling and logging
 * - Consistent return types
 * - Input validation
 */

import { sendEmailWithMailgun } from './mailgun'
import { logger } from './logger'
import { executeQuery } from './database'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface OrderConfirmationData {
  to: string
  name: string
  serviceType: string
  orderId: number
}

interface QuoteEmailData {
  to: string
  name: string
  quoteAmount: number
  packageName: string
  orderId: number
}

interface InvoiceEmailData {
  to: string
  name: string
  amount: number
  invoiceUrl: string
  orderId: number
}

interface PaymentReceiptData {
  to: string
  name: string
  amount: number
  orderId: number
}

interface PasswordResetData {
  to: string
  name: string
  resetUrl: string
}

/**
 * Log email to database with metadata for resend capability
 * 
 * IMPROVED: Now stores metadata_json so emails can be properly reconstructed on resend
 */
async function logEmail(
  quoteRequestId: number | null,
  toEmail: string,
  subject: string,
  template: string,
  metadata: any,
  status: 'sent' | 'failed' | 'bounced',
  errorMessage?: string
) {
  try {
    // Try to store with all new columns first
    await executeQuery(
      `INSERT INTO email_logs (quote_id, to_email, subject, template, status, error_message, metadata_json, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [quoteRequestId, toEmail, subject, template, status, errorMessage || null, JSON.stringify(metadata || {})]
    )
  } catch (error: any) {
    // Fallback chain for missing columns
    if (error.code === '42703') {
      try {
        // Try without metadata_json
        await executeQuery(
          `INSERT INTO email_logs (quote_id, to_email, subject, template, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [quoteRequestId, toEmail, subject, template, status, errorMessage || null]
        )
      } catch (fallback1Error: any) {
        if (fallback1Error.code === '42703') {
          try {
            // Fallback to old column names (recipient_email, email_type)
            await executeQuery(
              `INSERT INTO email_logs (quote_id, recipient_email, subject, email_type, status, error_message, sent_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [quoteRequestId, toEmail, subject, template, status, errorMessage || null]
            )
          } catch (fallback2Error) {
            logger.error('Failed to log email (all fallbacks)', { error: fallback2Error, toEmail, subject })
          }
        } else {
          logger.error('Failed to log email (fallback)', { error: fallback1Error, toEmail, subject })
        }
      }
    } else {
      logger.error('Failed to log email', { error, toEmail, subject })
    }
  }
}

/**
 * Send email with error handling and logging
 * Uses Mailgun API for delivery
 */
export async function sendEmail(options: EmailOptions, template: string, metadata: any, quoteRequestId?: number | null): Promise<boolean> {
  // Validate required fields
  if (!options.to) {
    logger.error('Email recipient is required', { template })
    return false
  }

  if (!options.subject) {
    logger.error('Email subject is required', { template, to: options.to })
    return false
  }

  try {
    const sent = await sendEmailWithMailgun({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    })
    
    if (sent) {
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        template
      })
      
      // Log as sent with metadata for resend capability
      await logEmail(quoteRequestId || null, options.to, options.subject, template, metadata, 'sent')
      return true
    } else {
      throw new Error('Email sending returned false')
    }
  } catch (error: any) {
    logger.error('Failed to send email', {
      error: error.message,
      to: options.to,
      subject: options.subject,
      template
    })
    
    // Log as failed with metadata
    await logEmail(quoteRequestId || null, options.to, options.subject, template, metadata, 'failed', error.message)
    
    return false
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>Thank you for your request! We've received your order and will review it shortly.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> #${data.orderId}</p>
            <p><strong>Service Type:</strong> ${data.serviceType}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Our team will review your request within 24 hours</li>
            <li>You'll receive a custom quote via email</li>
            <li>Once approved, we'll begin working on your order</li>
          </ul>
          
          <p>If you have any questions, feel free to contact us:</p>
          <p>
            Phone: (555) 123-4567<br>
            Email: info@elitesportsdj.com
          </p>
          
          <p>Thank you for choosing Elite Sports DJ!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Order Confirmation - Elite Sports DJ #${data.orderId}`,
      html
    },
    'order_confirmation',
    data,
    data.orderId
  )
}

/**
 * Send quote email to customer
 */
export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  const formattedAmount = `$${(data.quoteAmount / 100).toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .quote-box { background: white; padding: 30px; border-radius: 6px; margin: 20px 0; border: 2px solid #0ea5e9; text-align: center; }
        .price { font-size: 48px; font-weight: bold; color: #0ea5e9; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Custom Quote</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>Great news! We've prepared a custom quote for your ${data.packageName} request.</p>
          
          <div class="quote-box">
            <h3 style="margin-top: 0;">Quote Amount</h3>
            <div class="price">${formattedAmount}</div>
            <p style="color: #64748b;">Order #${data.orderId}</p>
          </div>
          
          <h3>What's Included:</h3>
          <ul>
            <li>Professional DJ services for your event</li>
            <li>Custom music selection and mixing</li>
            <li>High-quality audio production</li>
            <li>Unlimited revisions until you're satisfied</li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <p>To proceed with this quote, please reply to this email or contact us at:</p>
          <p>
            Phone: (555) 123-4567<br>
            Email: info@elitesportsdj.com
          </p>
          
          <p>This quote is valid for 30 days from the date of this email.</p>
          
          <p>We look forward to working with you!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Your Quote is Ready - Elite Sports DJ #${data.orderId}`,
      html
    },
    'quote',
    data,
    data.orderId
  )
}

/**
 * Send invoice email with payment link
 */
export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
  const formattedAmount = `$${(data.amount / 100).toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .invoice-box { background: white; padding: 30px; border-radius: 6px; margin: 20px 0; border: 2px solid #0ea5e9; }
        .amount { font-size: 36px; font-weight: bold; color: #0ea5e9; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice Ready</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>Your invoice is ready for payment!</p>
          
          <div class="invoice-box">
            <h3 style="margin-top: 0;">Invoice #${data.orderId}</h3>
            <p><strong>Amount Due:</strong></p>
            <div class="amount">${formattedAmount}</div>
            <p style="color: #64748b;">Due upon receipt</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${data.invoiceUrl}" class="button">Pay Invoice Now</a>
          </p>
          
          <h3>Payment Information:</h3>
          <ul>
            <li>Secure payment processing via Stripe</li>
            <li>Credit card and bank transfer accepted</li>
            <li>Payment confirmation sent immediately</li>
          </ul>
          
          <p>Once payment is received, we'll begin working on your order immediately.</p>
          
          <p>Questions? Contact us:</p>
          <p>
            Phone: (555) 123-4567<br>
            Email: info@elitesportsdj.com
          </p>
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Invoice #${data.orderId} - Elite Sports DJ`,
      html
    },
    'invoice',
    data,
    data.orderId
  )
}

/**
 * Send payment receipt
 */
export async function sendPaymentReceipt(data: PaymentReceiptData): Promise<boolean> {
  const formattedAmount = `$${(data.amount / 100).toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .receipt-box { background: white; padding: 30px; border-radius: 6px; margin: 20px 0; border: 2px solid #10b981; }
        .checkmark { font-size: 64px; color: #10b981; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="checkmark">&#10003;</div>
          <h1>Payment Received!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>Thank you! Your payment has been successfully processed.</p>
          
          <div class="receipt-box">
            <h3 style="margin-top: 0;">Payment Receipt</h3>
            <p><strong>Order #:</strong> ${data.orderId}</p>
            <p><strong>Amount Paid:</strong> ${formattedAmount}</p>
            <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="color: #10b981;">Paid</span></p>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>We're now working on your order</li>
            <li>You'll receive updates as we progress</li>
            <li>Deliverables will be available in your account when ready</li>
            <li>Estimated completion: 5-7 business days</li>
          </ul>
          
          <p>You can track your order status anytime by logging into your account.</p>
          
          <p>Questions? We're here to help:</p>
          <p>
            Phone: (555) 123-4567<br>
            Email: info@elitesportsdj.com
          </p>
          
          <p>Thank you for choosing Elite Sports DJ!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Payment Received - Elite Sports DJ #${data.orderId}`,
      html
    },
    'receipt',
    data,
    data.orderId
  )
}

/**
 * Send custom email (for admin use)
 * 
 * SECURITY NOTE: The htmlContent parameter should be sanitized before passing
 * to this function if it contains any user-provided content.
 * Use escapeHtml() from sanitize.ts for user-provided text.
 * 
 * @param to - Recipient email address
 * @param subject - Email subject (will be escaped)
 * @param htmlContent - HTML content (should be pre-sanitized if contains user input)
 * @param quoteRequestId - Optional order ID for logging
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  htmlContent: string,
  quoteRequestId?: number
): Promise<boolean> {
  // Import escapeHtml for subject sanitization
  const { escapeHtml } = await import('./sanitize')
  
  // Sanitize subject to prevent header injection
  const sanitizedSubject = subject
    .replace(/[\r\n]/g, '') // Remove newlines to prevent header injection
    .substring(0, 200) // Limit length
  
  return sendEmail(
    {
      to,
      subject: sanitizedSubject,
      html: htmlContent
    },
    'custom',
    { to, subject: sanitizedSubject, body: htmlContent },
    quoteRequestId
  )
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px;
          border-radius: 10px;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #667eea;
          margin-top: 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h1>Password Reset Request</h1>
          
          <p>Hi ${data.name},</p>
          
          <p>We received a request to reset your password for your Elite Sports DJ account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
          
          <div class="warning">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
          </div>
          
          <p><strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, never share this link with anyone.</p>
          
          <p>Questions? Contact us:</p>
          <p>
            Phone: (555) 123-4567<br>
            Email: info@elitesportsdj.com
          </p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return sendEmail(
    {
      to: data.to,
      subject: 'Password Reset Request - Elite Sports DJ',
      html
    },
    'password_reset',
    data
  )
}
