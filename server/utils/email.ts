import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
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

/**
 * Create email transporter based on environment configuration
 */
function createTransporter(): Transporter {
  const config = useRuntimeConfig()
  
  // Check if SMTP credentials are configured
  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    return nodemailer.createTransporter({
      host: config.smtpHost,
      port: parseInt(config.smtpPort || '587'),
      secure: config.smtpSecure === 'true',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    })
  }
  
  // Fallback to console logging for development
  logger.warn('SMTP not configured, emails will be logged to console')
  return nodemailer.createTransporter({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  })
}

/**
 * Log email to database
 */
async function logEmail(
  quoteRequestId: number | null,
  toEmail: string,
  subject: string,
  template: string,
  metadata: any,
  status: 'queued' | 'sent' | 'failed',
  errorMessage?: string
) {
  try {
    await executeQuery(
      `INSERT INTO email_logs (quote_request_id, to_email, subject, template, metadata_json, status, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [quoteRequestId, toEmail, subject, template, JSON.stringify(metadata), status, errorMessage || null]
    )
  } catch (error) {
    logger.error('Failed to log email', { error, toEmail, subject })
  }
}

/**
 * Send email with error handling and logging
 */
async function sendEmail(options: EmailOptions, template: string, metadata: any, quoteRequestId?: number): Promise<boolean> {
  const transporter = createTransporter()
  const config = useRuntimeConfig()
  
  const mailOptions = {
    from: config.smtpFrom || 'Elite Sports DJ <noreply@elitesportsdj.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
  }

  try {
    // Log as queued
    await logEmail(quoteRequestId || null, options.to, options.subject, template, metadata, 'queued')
    
    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId
    })
    
    // Log as sent
    await logEmail(quoteRequestId || null, options.to, options.subject, template, metadata, 'sent')
    
    return true
  } catch (error: any) {
    logger.error('Failed to send email', {
      error: error.message,
      to: options.to,
      subject: options.subject
    })
    
    // Log as failed
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
            📞 Phone: (555) 123-4567<br>
            📧 Email: info@elitesportsdj.com
          </p>
          
          <p>Thank you for choosing Elite Sports DJ!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
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
            📞 Phone: (555) 123-4567<br>
            📧 Email: info@elitesportsdj.com
          </p>
          
          <p>This quote is valid for 30 days from the date of this email.</p>
          
          <p>We look forward to working with you!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
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
            <li>You'll receive a receipt immediately after payment</li>
          </ul>
          
          <p>Once payment is received, we'll begin working on your order immediately.</p>
          
          <p>Questions? Contact us:</p>
          <p>
            📞 Phone: (555) 123-4567<br>
            📧 Email: info@elitesportsdj.com
          </p>
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
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
          <div class="checkmark">✓</div>
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
            📞 Phone: (555) 123-4567<br>
            📧 Email: info@elitesportsdj.com
          </p>
          
          <p>Thank you for choosing Elite Sports DJ!</p>
          
          <p>Best regards,<br>The Elite Sports DJ Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
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
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  htmlContent: string,
  quoteRequestId?: number
): Promise<boolean> {
  return sendEmail(
    {
      to,
      subject,
      html: htmlContent
    },
    'custom',
    { to, subject },
    quoteRequestId
  )
}
