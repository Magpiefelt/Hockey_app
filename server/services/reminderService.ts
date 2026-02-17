/**
 * Payment Reminder Service
 * Automated payment reminders and follow-ups
 */

import { query } from '../db/connection'
import { sendEmail } from '../utils/email'
import { logger } from '../utils/logger'
import { getInvoiceSettings } from './invoiceService'

export interface ReminderSchedule {
  daysBefore: number[]   // Days before due date to send reminders
  daysAfter: number[]    // Days after due date to send reminders (overdue)
  maxReminders: number   // Maximum number of reminders to send
}

export interface PendingReminder {
  orderId: number
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  dueDate: string
  daysUntilDue: number  // Negative if overdue
  reminderType: 'upcoming' | 'due_today' | 'overdue'
  remindersSent: number
  lastReminderDate?: string
}

export interface ReminderLog {
  id: number
  orderId: number
  invoiceNumber: string
  reminderType: string
  sentAt: string
  emailStatus: 'sent' | 'failed'
  errorMessage?: string
}

// Default reminder schedule
const DEFAULT_REMINDER_SCHEDULE: ReminderSchedule = {
  daysBefore: [7, 3, 1],      // 7, 3, and 1 day before due
  daysAfter: [1, 3, 7, 14],   // 1, 3, 7, and 14 days after due
  maxReminders: 6
}

/**
 * Get reminder settings
 */
export async function getReminderSettings(): Promise<ReminderSchedule> {
  try {
    const result = await query(
      `SELECT value FROM settings WHERE key = 'reminder_settings'`
    )
    
    if (result.rows.length > 0 && result.rows[0].value) {
      return { ...DEFAULT_REMINDER_SCHEDULE, ...result.rows[0].value }
    }
  } catch (error) {
    logger.warn('Could not load reminder settings, using defaults', { error })
  }
  
  return DEFAULT_REMINDER_SCHEDULE
}

/**
 * Save reminder settings
 */
export async function saveReminderSettings(settings: Partial<ReminderSchedule>): Promise<ReminderSchedule> {
  const currentSettings = await getReminderSettings()
  const newSettings = { ...currentSettings, ...settings }
  
  try {
    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('reminder_settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(newSettings)]
    )
  } catch (error) {
    logger.warn('Could not save reminder settings (settings table may not exist)', { error })
  }
  
  return newSettings
}

/**
 * Get all pending reminders that should be sent today
 */
export async function getPendingReminders(): Promise<PendingReminder[]> {
  const settings = await getReminderSettings()
  
  // Get all unpaid invoices
  const result = await query(
    `SELECT 
      i.quote_id as order_id,
      i.stripe_invoice_id as invoice_number,
      i.amount_cents as amount,
      i.customer_snapshot,
      i.created_at,
      qr.contact_name,
      qr.contact_email,
      (
        SELECT COUNT(*) FROM email_logs 
        WHERE quote_id = i.quote_id 
        AND template LIKE 'reminder%'
      ) as reminders_sent,
      (
        SELECT MAX(created_at) FROM email_logs 
        WHERE quote_id = i.quote_id 
        AND template LIKE 'reminder%'
      ) as last_reminder_date
    FROM invoices i
    JOIN quote_requests qr ON i.quote_id = qr.id
    WHERE i.status IN ('sent', 'draft')
    AND qr.status IN ('quoted', 'invoiced')
    ORDER BY i.created_at`
  )
  
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const pendingReminders: PendingReminder[] = []
  
  for (const row of result.rows) {
    const snapshot = row.customer_snapshot || {}
    const dueDate = snapshot.dueDate ? new Date(snapshot.dueDate) : null
    
    if (!dueDate) continue
    
    dueDate.setHours(0, 0, 0, 0)
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const remindersSent = parseInt(row.reminders_sent) || 0
    
    // Check if we've hit max reminders
    if (remindersSent >= settings.maxReminders) continue
    
    // Determine if a reminder should be sent today
    let shouldRemind = false
    let reminderType: 'upcoming' | 'due_today' | 'overdue' = 'upcoming'
    
    if (daysUntilDue === 0) {
      shouldRemind = true
      reminderType = 'due_today'
    } else if (daysUntilDue > 0 && settings.daysBefore.includes(daysUntilDue)) {
      shouldRemind = true
      reminderType = 'upcoming'
    } else if (daysUntilDue < 0 && settings.daysAfter.includes(Math.abs(daysUntilDue))) {
      shouldRemind = true
      reminderType = 'overdue'
    }
    
    // Check if we already sent a reminder today
    if (shouldRemind && row.last_reminder_date) {
      const lastReminder = new Date(row.last_reminder_date)
      lastReminder.setHours(0, 0, 0, 0)
      if (lastReminder.getTime() === now.getTime()) {
        shouldRemind = false
      }
    }
    
    if (shouldRemind) {
      pendingReminders.push({
        orderId: row.order_id,
        invoiceNumber: row.invoice_number,
        customerName: row.contact_name,
        customerEmail: row.contact_email,
        amount: row.amount,
        dueDate: dueDate.toISOString().split('T')[0],
        daysUntilDue,
        reminderType,
        remindersSent,
        lastReminderDate: row.last_reminder_date?.toISOString().split('T')[0]
      })
    }
  }
  
  return pendingReminders
}

/**
 * Send a payment reminder
 */
export async function sendPaymentReminder(reminder: PendingReminder): Promise<boolean> {
  const invoiceSettings = await getInvoiceSettings()
  
  try {
    // Determine email template and subject based on reminder type
    let template: string
    let subject: string
    let urgency: string
    
    switch (reminder.reminderType) {
      case 'due_today':
        template = 'reminder_due_today'
        subject = `Payment Due Today - Invoice ${reminder.invoiceNumber}`
        urgency = 'Your payment is due today.'
        break
      case 'overdue':
        template = 'reminder_overdue'
        subject = `Overdue Payment - Invoice ${reminder.invoiceNumber}`
        urgency = `Your payment is ${Math.abs(reminder.daysUntilDue)} days overdue.`
        break
      default:
        template = 'reminder_upcoming'
        subject = `Payment Reminder - Invoice ${reminder.invoiceNumber}`
        urgency = `Your payment is due in ${reminder.daysUntilDue} days.`
    }
    
    // Build reminder email HTML
    const amount = (reminder.amount / 100).toFixed(2)
    const isOverdue = reminder.daysUntilDue < 0
    const urgencyColor = isOverdue ? '#ef4444' : (reminder.reminderType === 'due_today' ? '#f59e0b' : '#0ea5e9')
    
    const reminderHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>${subject}</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${reminder.customerName},</p>
          <p style="font-size: 16px; font-weight: bold; color: ${urgencyColor};">${urgency}</p>
          <p><strong>Invoice:</strong> ${reminder.invoiceNumber}</p>
          <p><strong>Amount:</strong> $${amount}</p>
          <p><strong>Due Date:</strong> ${reminder.dueDate}</p>
          <p>Please arrange payment at your earliest convenience.</p>
          <p>Best regards,<br>${invoiceSettings.companyName}</p>
        </div>
      </div>
    `

    const reminderData = {
      customerName: reminder.customerName,
      invoiceNumber: reminder.invoiceNumber,
      amount,
      dueDate: reminder.dueDate,
      urgency,
      daysUntilDue: reminder.daysUntilDue,
      isOverdue,
      companyName: invoiceSettings.companyName,
      companyEmail: invoiceSettings.companyEmail
    }

    // Send email with correct positional arguments
    await sendEmail(
      { to: reminder.customerEmail, subject, html: reminderHtml },
      template,
      reminderData,
      reminder.orderId
    )
    
    // Log the reminder
    await logReminder(reminder, 'sent')
    
    logger.info('Payment reminder sent', {
      orderId: reminder.orderId,
      invoiceNumber: reminder.invoiceNumber,
      type: reminder.reminderType,
      to: reminder.customerEmail
    })
    
    return true
  } catch (error: any) {
    logger.error('Failed to send payment reminder', error, {
      orderId: reminder.orderId,
      invoiceNumber: reminder.invoiceNumber
    })
    
    await logReminder(reminder, 'failed', error.message)
    return false
  }
}

/**
 * Log reminder to database
 */
async function logReminder(
  reminder: PendingReminder,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO email_logs (
        quote_id, 
        to_email, 
        subject, 
        template, 
        status, 
        error_message,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        reminder.orderId,
        reminder.customerEmail,
        `Payment Reminder - ${reminder.invoiceNumber}`,
        `reminder_${reminder.reminderType}`,
        status === 'sent' ? 'sent' : 'failed',
        errorMessage
      ]
    )
  } catch (error) {
    logger.warn('Failed to log reminder', { error, orderId: reminder.orderId })
  }
}

/**
 * Process all pending reminders
 */
export async function processAllReminders(): Promise<{
  sent: number
  failed: number
  skipped: number
}> {
  const pendingReminders = await getPendingReminders()
  
  let sent = 0
  let failed = 0
  let skipped = 0
  
  for (const reminder of pendingReminders) {
    // Add a small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const success = await sendPaymentReminder(reminder)
    if (success) {
      sent++
    } else {
      failed++
    }
  }
  
  logger.info('Reminder processing complete', { sent, failed, skipped })
  
  return { sent, failed, skipped }
}

/**
 * Get reminder history for an order
 */
export async function getReminderHistory(orderId: number): Promise<ReminderLog[]> {
  const result = await query(
    `SELECT 
      id,
      order_id,
      subject as invoice_number,
      template as reminder_type,
      created_at as sent_at,
      status as email_status,
      error_message
    FROM email_logs
    WHERE quote_id = $1
    AND template LIKE 'reminder%'
    ORDER BY created_at DESC`,
    [orderId]
  )
  
  return result.rows.map(row => ({
    id: row.id,
    orderId: row.order_id,
    invoiceNumber: row.invoice_number,
    reminderType: row.reminder_type,
    sentAt: row.sent_at?.toISOString(),
    emailStatus: row.email_status,
    errorMessage: row.error_message
  }))
}

/**
 * Get reminder statistics
 */
export async function getReminderStats(): Promise<{
  totalSent: number
  sentThisMonth: number
  pendingToday: number
  overdueInvoices: number
  avgDaysToPayment: number
}> {
  // Total reminders sent
  const totalResult = await query(
    `SELECT COUNT(*) as count FROM email_logs WHERE template LIKE 'reminder%' AND status = 'sent'`
  )
  
  // Reminders sent this month
  const monthResult = await query(
    `SELECT COUNT(*) as count FROM email_logs 
     WHERE template LIKE 'reminder%' 
     AND status = 'sent'
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
  )
  
  // Pending reminders for today
  const pendingReminders = await getPendingReminders()
  
  // Overdue invoices count
  const overdueResult = await query(
    `SELECT COUNT(*) as count
     FROM invoices i
     JOIN quote_requests qr ON i.quote_id = qr.id
     WHERE i.status IN ('sent', 'draft')
     AND qr.status IN ('quoted', 'invoiced')
     AND i.created_at < CURRENT_DATE - INTERVAL '14 days'`
  )
  
  // Average days to payment
  const avgDaysResult = await query(
    `SELECT AVG(EXTRACT(DAY FROM (i.paid_at - i.sent_at))) as avg_days
     FROM invoices i
     WHERE i.status = 'paid'
     AND i.paid_at IS NOT NULL
     AND i.sent_at IS NOT NULL`
  )
  
  return {
    totalSent: parseInt(totalResult.rows[0].count) || 0,
    sentThisMonth: parseInt(monthResult.rows[0].count) || 0,
    pendingToday: pendingReminders.length,
    overdueInvoices: parseInt(overdueResult.rows[0].count) || 0,
    avgDaysToPayment: Math.round(parseFloat(avgDaysResult.rows[0].avg_days) || 0)
  }
}

/**
 * Pause reminders for an order
 */
export async function pauseReminders(orderId: number, reason?: string): Promise<void> {
  try {
    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [
        `reminder_paused_${orderId}`,
        JSON.stringify({ paused: true, reason, pausedAt: new Date().toISOString() })
      ]
    )
  } catch (error) {
    logger.warn('Could not pause reminders (settings table may not exist)', { error })
  }
  
  logger.info('Reminders paused for order', { orderId, reason })
}

/**
 * Resume reminders for an order
 */
export async function resumeReminders(orderId: number): Promise<void> {
  try {
    await query(
      `DELETE FROM settings WHERE key = $1`,
      [`reminder_paused_${orderId}`]
    )
  } catch (error) {
    logger.warn('Could not resume reminders (settings table may not exist)', { error })
  }
  
  logger.info('Reminders resumed for order', { orderId })
}

/**
 * Check if reminders are paused for an order
 */
export async function areRemindersPaused(orderId: number): Promise<boolean> {
  try {
    const result = await query(
      `SELECT value FROM settings WHERE key = $1`,
      [`reminder_paused_${orderId}`]
    )
    
    if (result.rows.length > 0) {
      const value = result.rows[0].value
      return value?.paused === true
    }
  } catch {
    // Settings table may not exist yet
  }
  
  return false
}
