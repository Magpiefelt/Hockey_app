/**
 * Enhanced Email Templates
 * Additional email functions for quote enhancements
 * 
 * Migrated from Nodemailer/SMTP to Mailgun
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

// Get app base URL from environment
const getAppBaseUrl = () => process.env.NUXT_PUBLIC_APP_BASE_URL || 'https://elitesportsdj.com'
const getAdminEmail = () => process.env.ADMIN_EMAIL || 'admin@elitesportsdj.com'

/**
 * Log email to database
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
    await executeQuery(
      `INSERT INTO email_logs (quote_id, recipient_email, subject, email_type, status, error_message, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [quoteRequestId, toEmail, subject, template, status, errorMessage || null]
    )
  } catch (error) {
    logger.error('Failed to log email', { toEmail, subject })
  }
}

/**
 * Send email with error handling and logging
 * Uses Mailgun API for delivery
 */
async function sendEmail(options: EmailOptions, template: string, metadata: any, quoteRequestId?: number): Promise<boolean> {
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
        subject: options.subject
      })
      
      await logEmail(quoteRequestId || null, options.to, options.subject, template, metadata, 'sent')
      return true
    } else {
      throw new Error('Email sending returned false')
    }
  } catch (error: any) {
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject
    })
    
    await logEmail(quoteRequestId || null, options.to, options.subject, template, metadata, 'failed', error.message)
    return false
  }
}

// ============================================
// Enhanced Quote Email with Payment Link
// ============================================

export interface EnhancedQuoteEmailData {
  to: string
  name: string
  quoteAmount: number
  packageName: string
  orderId: number
  paymentUrl?: string | null
  quoteViewUrl?: string | null  // Direct link to view quote (token-based)
  eventDate?: string | null
  teamName?: string | null
  sportType?: string | null
  adminNotes?: string | null
  expirationDate?: Date | null
}

export async function sendEnhancedQuoteEmail(data: EnhancedQuoteEmailData): Promise<boolean> {
  const appBaseUrl = getAppBaseUrl()
  const formattedAmount = `$${(data.quoteAmount / 100).toFixed(2)}`
  const expirationText = data.expirationDate 
    ? data.expirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '30 days from today'
  
  // Generate the quote view URL (use token-based URL if available, fallback to standard)
  const quoteUrl = data.quoteViewUrl || `${appBaseUrl}/orders/${data.orderId}/quote`
  
  const paymentSection = data.paymentUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.paymentUrl}" 
         style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
        Accept Quote & Pay Now
      </a>
    </div>
    <p style="text-align: center; color: #64748b; font-size: 14px;">
      Secure payment powered by Stripe
    </p>
  ` : `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${quoteUrl}" 
         style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
        View Quote Details
      </a>
    </div>
    <p style="text-align: center; color: #64748b; font-size: 14px;">
      Click the button above to view your full quote and proceed with your order.<br>
      No login required - this link is unique to your order.
    </p>
  `
  
  const orderDetailsSection = (data.eventDate || data.teamName || data.sportType) ? `
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0f172a;">Order Details</h3>
      ${data.teamName ? `<p style="margin: 8px 0;"><strong>Team Name:</strong> ${data.teamName}</p>` : ''}
      ${data.eventDate ? `<p style="margin: 8px 0;"><strong>Event Date:</strong> ${data.eventDate}</p>` : ''}
      ${data.sportType ? `<p style="margin: 8px 0;"><strong>Sport:</strong> ${data.sportType}</p>` : ''}
      <p style="margin: 8px 0;"><strong>Package:</strong> ${data.packageName}</p>
    </div>
  ` : ''
  
  const adminNotesSection = data.adminNotes ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <strong>Note from our team:</strong>
      <p style="margin: 10px 0 0 0;">${data.adminNotes}</p>
    </div>
  ` : ''
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: #ffffff; padding: 40px 30px; }
        .quote-box { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 12px; margin: 25px 0; border: 2px solid #0ea5e9; text-align: center; }
        .price { font-size: 48px; font-weight: bold; color: #0ea5e9; margin: 15px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Your Custom Quote is Ready!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${data.orderId}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">Hi ${data.name},</p>
          
          <p>Great news! We've prepared a custom quote for your ${data.packageName} request.</p>
          
          <div class="quote-box">
            <p style="margin: 0; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Your Quote</p>
            <div class="price">${formattedAmount}</div>
            <p style="margin: 0; color: #64748b;">Valid until ${expirationText}</p>
          </div>
          
          ${orderDetailsSection}
          
          ${adminNotesSection}
          
          <h3>What's Included:</h3>
          <ul style="padding-left: 20px;">
            <li style="margin-bottom: 8px;">Professional DJ services for your event</li>
            <li style="margin-bottom: 8px;">Custom music selection and mixing</li>
            <li style="margin-bottom: 8px;">High-quality audio production</li>
            <li style="margin-bottom: 8px;">Unlimited revisions until you're satisfied</li>
          </ul>
          
          ${paymentSection}
          
          <p style="margin-top: 30px;">We look forward to working with you!</p>
          <p>Best regards,<br><strong>The Elite Sports DJ Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
          <p style="margin-top: 10px;">
            <a href="${quoteUrl}" style="color: #0ea5e9;">View Quote Online</a>
          </p>
          <p style="margin-top: 5px; font-size: 12px; color: #94a3b8;">
            This link is unique to your order and will expire in 30 days.
          </p>
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
    'quote_enhanced',
    data,
    data.orderId
  )
}

// ============================================
// Quote Revision Email
// ============================================

export interface QuoteRevisionEmailData {
  to: string
  name: string
  orderId: number
  previousAmount: number
  newAmount: number
  reason: string
  packageName: string
}

export async function sendQuoteRevisionEmail(data: QuoteRevisionEmailData): Promise<boolean> {
  const appBaseUrl = getAppBaseUrl()
  const formattedPrevious = `$${(data.previousAmount / 100).toFixed(2)}`
  const formattedNew = `$${(data.newAmount / 100).toFixed(2)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .revision-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; }
        .price-old { color: #94a3b8; text-decoration: line-through; font-size: 24px; }
        .price-new { color: #0ea5e9; font-size: 32px; font-weight: bold; }
        .reason-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Quote Updated</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>We've updated the quote for your ${data.packageName} order.</p>
          
          <div class="revision-box">
            <h3 style="margin-top: 0; text-align: center;">Order #${data.orderId}</h3>
            <div style="display: flex; justify-content: space-around; text-align: center; margin: 20px 0;">
              <div>
                <p style="margin: 0; color: #64748b;">Previous Quote</p>
                <p class="price-old">${formattedPrevious}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b;">New Quote</p>
                <p class="price-new">${formattedNew}</p>
              </div>
            </div>
          </div>
          
          <div class="reason-box">
            <strong>Reason for update:</strong>
            <p style="margin: 10px 0 0 0;">${data.reason}</p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${appBaseUrl}/orders/${data.orderId}" 
               style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Updated Quote
            </a>
          </p>
          
          <p>If you have any questions about this update, please don't hesitate to contact us.</p>
          
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
      subject: `Quote Updated - Order #${data.orderId}`,
      html
    },
    'quote_revision',
    data,
    data.orderId
  )
}

// ============================================
// Quote Reminder Email
// ============================================

export interface QuoteReminderEmailData {
  to: string
  name: string
  orderId: number
  quoteAmount: number
  packageName: string
  daysOld: number
}

export async function sendQuoteReminderEmail(data: QuoteReminderEmailData): Promise<boolean> {
  const appBaseUrl = getAppBaseUrl()
  const formattedAmount = `$${(data.quoteAmount / 100).toFixed(2)}`
  const daysRemaining = Math.max(0, 30 - data.daysOld)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; text-align: center; }
        .price { font-size: 36px; font-weight: bold; color: #f59e0b; }
        .cta-button { display: inline-block; padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .urgency { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Don't Miss Out!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <p>We noticed you haven't responded to your quote yet. Your custom quote for ${data.packageName} is still waiting for you!</p>
          
          <div class="quote-box">
            <p style="margin: 0; color: #64748b;">Your Quote</p>
            <div class="price">${formattedAmount}</div>
            <p style="margin: 10px 0 0 0; color: #64748b;">Order #${data.orderId}</p>
          </div>
          
          ${daysRemaining <= 7 ? `
          <div class="urgency">
            <strong>⏰ Expiring Soon!</strong>
            <p style="margin: 5px 0 0 0;">This quote expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Don't wait - secure your spot today!</p>
          </div>
          ` : ''}
          
          <p style="text-align: center;">
            <a href="${appBaseUrl}/orders/${data.orderId}" class="cta-button">View Quote</a>
          </p>
          
          <p>Questions? Just reply to this email and we'll be happy to help.</p>
          
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
      subject: `Reminder: Your Quote is Waiting - Order #${data.orderId}`,
      html
    },
    'quote_reminder',
    data,
    data.orderId
  )
}

// ============================================
// Admin Notification Email
// ============================================

export interface AdminNotificationEmailData {
  subject: string
  body: string
  orderId?: number
}

export async function sendAdminNotificationEmail(data: AdminNotificationEmailData): Promise<boolean> {
  const appBaseUrl = getAppBaseUrl()
  const adminEmail = getAdminEmail()
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 20px;">Admin Notification</h1>
        </div>
        <div class="content">
          <div class="message-box">
            ${data.body}
          </div>
          
          ${data.orderId ? `
          <p style="text-align: center;">
            <a href="${appBaseUrl}/admin/orders/${data.orderId}" 
               style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">
              View Order
            </a>
          </p>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: adminEmail,
      subject: data.subject,
      html
    },
    'admin_notification',
    data,
    data.orderId
  )
}

// ============================================
// Custom Email (Enhanced)
// ============================================

export interface CustomEmailEnhancedData {
  to: string
  name: string
  subject: string
  body: string
  orderId?: number
}

export async function sendCustomEmailEnhanced(data: CustomEmailEnhancedData): Promise<boolean> {
  // Replace template variables
  let processedBody = data.body
    .replace(/\{\{name\}\}/g, data.name)
    .replace(/\{\{orderId\}\}/g, data.orderId?.toString() || '')
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Elite Sports DJ</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <div style="white-space: pre-wrap;">${processedBody}</div>
          
          <p style="margin-top: 30px;">Best regards,<br>The Elite Sports DJ Team</p>
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
      subject: data.subject,
      html
    },
    'custom',
    data,
    data.orderId
  )
}

// ============================================
// Manual Order Completion Email
// ============================================

export interface ManualCompletionEmailData {
  to: string
  name: string
  amount: number
  orderId: number
  serviceType: string
  completionDate?: Date
  adminMessage?: string
}

/**
 * Send confirmation email for manually completed orders
 * Used when admin completes an order that was handled offline
 */
export async function sendManualCompletionEmail(data: ManualCompletionEmailData): Promise<boolean> {
  const formattedAmount = `$${(data.amount / 100).toFixed(2)}`
  const completionDate = (data.completionDate || new Date()).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const adminMessageSection = data.adminMessage ? `
    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <strong style="color: #0369a1;">Message from our team:</strong>
      <p style="margin: 10px 0 0 0; color: #334155;">${data.adminMessage}</p>
    </div>
  ` : ''
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: #ffffff; padding: 40px 30px; }
        .completion-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 12px; margin: 25px 0; border: 2px solid #10b981; text-align: center; }
        .checkmark { font-size: 48px; margin-bottom: 10px; }
        .amount { font-size: 36px; font-weight: bold; color: #059669; margin: 15px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .details-table td:first-child { color: #64748b; width: 40%; }
        .details-table td:last-child { font-weight: 500; color: #1e293b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="checkmark">✓</div>
          <h1 style="margin: 0; font-size: 28px;">Order Complete!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your business</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">Hi ${data.name},</p>
          
          <p>We're pleased to confirm that your order has been completed successfully.</p>
          
          <div class="completion-box">
            <p style="margin: 0; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Amount Paid</p>
            <div class="amount">${formattedAmount}</div>
            <p style="margin: 0; color: #059669; font-weight: 500;">Payment Confirmed</p>
          </div>
          
          <table class="details-table">
            <tr>
              <td>Order Number</td>
              <td>#${data.orderId}</td>
            </tr>
            <tr>
              <td>Service</td>
              <td>${data.serviceType}</td>
            </tr>
            <tr>
              <td>Completion Date</td>
              <td>${completionDate}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td style="color: #059669;">✓ Completed</td>
            </tr>
          </table>
          
          ${adminMessageSection}
          
          <h3 style="color: #1e293b; margin-top: 30px;">What's Next?</h3>
          <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;">Your deliverables will be available in your account shortly</li>
            <li style="margin-bottom: 8px;">You'll receive a notification when files are ready for download</li>
            <li style="margin-bottom: 8px;">Feel free to reach out if you have any questions</li>
          </ul>
          
          <p style="margin-top: 30px;">Thank you for choosing Elite Sports DJ! We hope you're delighted with our service.</p>
          
          <p>Best regards,<br><strong>The Elite Sports DJ Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Questions? Contact us at info@elitesportsdj.com</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Elite Sports DJ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(
    {
      to: data.to,
      subject: `Order Complete - Elite Sports DJ #${data.orderId}`,
      html
    },
    'manual_completion',
    data,
    data.orderId
  )
}

// ============================================
// Contact Form Notification Email
// ============================================

export interface ContactNotificationEmailData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  submissionId: number
}

/**
 * Send contact form notification to admin
 */
export async function sendContactNotificationEmail(data: ContactNotificationEmailData): Promise<boolean> {
  const adminEmail = getAdminEmail()
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .value { margin-top: 5px; }
        .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Contact Form Submission</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Submission #${data.submissionId}</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">From</div>
            <div class="value">${data.name} &lt;${data.email}&gt;</div>
          </div>
          ${data.phone ? `
          <div class="field">
            <div class="label">Phone</div>
            <div class="value">${data.phone}</div>
          </div>
          ` : ''}
          <div class="field">
            <div class="label">Subject</div>
            <div class="value">${data.subject}</div>
          </div>
          <div class="message-box">
            <div class="label">Message</div>
            <div class="value" style="white-space: pre-wrap;">${data.message}</div>
          </div>
          <p style="margin-top: 20px; text-align: center;">
            <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" 
               style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reply to ${data.name}
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This message was sent via the Elite Sports DJ contact form.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return sendEmail(
    {
      to: adminEmail,
      subject: `[Contact Form] ${data.subject}`,
      html
    },
    'contact_notification',
    data
  )
}
