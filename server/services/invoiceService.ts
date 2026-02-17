/**
 * Invoice Service
 * Automated invoice generation, PDF creation, and tracking
 */

import { query } from '../db/connection'
import { calculateTax, getTaxRates, getProvinceName, TaxBreakdown } from '../utils/tax'
import { sendEmail } from '../utils/email'
import { logger } from '../utils/logger'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number  // in cents
  total: number      // in cents
}

export interface InvoiceData {
  invoiceNumber: string
  orderId: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  eventDate?: string
  eventVenue?: string
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxBreakdown: TaxBreakdown
  total: number
  province: string
  notes?: string
  paymentUrl?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}

export interface InvoiceSettings {
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  paymentTermsDays: number
  invoicePrefix: string
  nextInvoiceNumber: number
  defaultNotes: string
  autoSendOnQuoteAccept: boolean
  reminderSchedule: number[]  // Days before/after due date to send reminders
}

// Default invoice settings
const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  companyName: 'Elite Sports DJ',
  companyAddress: 'Calgary, Alberta, Canada',
  companyPhone: '',
  companyEmail: 'info@elitesportsdj.com',
  paymentTermsDays: 14,
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1001,
  defaultNotes: 'Thank you for your business! Payment is due within 14 days.',
  autoSendOnQuoteAccept: true,
  reminderSchedule: [7, 3, 1, -1, -3, -7]  // 7, 3, 1 days before; 1, 3, 7 days after
}

/**
 * Get invoice settings from database
 */
export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  try {
    const result = await query(
      `SELECT value FROM settings WHERE key = 'invoice_settings'`
    )
    
    if (result.rows.length > 0 && result.rows[0].value) {
      return { ...DEFAULT_INVOICE_SETTINGS, ...result.rows[0].value }
    }
  } catch (error) {
    logger.warn('Could not load invoice settings, using defaults', { error })
  }
  
  return DEFAULT_INVOICE_SETTINGS
}

/**
 * Save invoice settings
 */
export async function saveInvoiceSettings(settings: Partial<InvoiceSettings>): Promise<InvoiceSettings> {
  const currentSettings = await getInvoiceSettings()
  const newSettings = { ...currentSettings, ...settings }
  
  try {
    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('invoice_settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(newSettings)]
    )
  } catch (error) {
    logger.warn('Could not save invoice settings (settings table may not exist)', { error })
  }
  
  return newSettings
}

/**
 * Generate next invoice number
 */
export async function generateInvoiceNumber(): Promise<string> {
  const settings = await getInvoiceSettings()
  const invoiceNumber = `${settings.invoicePrefix}${settings.nextInvoiceNumber}`
  
  // Increment for next invoice
  await saveInvoiceSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 })
  
  return invoiceNumber
}

/**
 * Create invoice from order
 */
export async function createInvoiceFromOrder(
  orderId: number,
  options?: {
    sendEmail?: boolean
    customNotes?: string
    customDueDays?: number
  }
): Promise<InvoiceData> {
  const settings = await getInvoiceSettings()
  
  // Get order details
  const orderResult = await query(
    `SELECT 
      qr.*,
      COALESCE(p.name, qr.service_type) as package_name,
      COALESCE(p.price_cents, qr.total_amount) as package_price
    FROM quote_requests qr
    LEFT JOIN packages p ON qr.package_id = p.id
    WHERE qr.id = $1`,
    [orderId]
  )
  
  if (orderResult.rows.length === 0) {
    throw new Error(`Order ${orderId} not found`)
  }
  
  const order = orderResult.rows[0]
  
  // Check if invoice already exists
  const existingInvoice = await query(
    `SELECT id, stripe_invoice_id FROM invoices WHERE quote_id = $1`,
    [orderId]
  )
  
  if (existingInvoice.rows.length > 0) {
    logger.info('Invoice already exists for order', { orderId })
    // Return existing invoice data
    return getInvoiceData(orderId)
  }
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber()
  
  // Calculate dates
  const issueDate = new Date()
  const dueDays = options?.customDueDays || settings.paymentTermsDays
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + dueDays)
  
  // Calculate tax
  const province = order.tax_province || 'AB'
  const subtotal = order.quoted_amount || order.total_amount || 0
  const taxBreakdown = calculateTax(subtotal, province)
  
  // Create line items
  const lineItems: InvoiceLineItem[] = [
    {
      description: order.package_name || 'DJ Services',
      quantity: 1,
      unitPrice: subtotal,
      total: subtotal
    }
  ]
  
  // Add any add-ons if present
  if (order.add_ons) {
    try {
      const addOns = typeof order.add_ons === 'string' ? JSON.parse(order.add_ons) : order.add_ons
      if (Array.isArray(addOns)) {
        for (const addOn of addOns) {
          if (addOn.name && addOn.price) {
            lineItems.push({
              description: addOn.name,
              quantity: addOn.quantity || 1,
              unitPrice: addOn.price,
              total: addOn.price * (addOn.quantity || 1)
            })
          }
        }
      }
    } catch (e) {
      // Ignore add-on parsing errors
    }
  }
  
  // Create invoice record
  await query(
    `INSERT INTO invoices (
      quote_id, 
      stripe_invoice_id, 
      stripe_customer_id,
      amount_cents, 
      status, 
      customer_snapshot,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      orderId,
      invoiceNumber,
      `customer_${order.contact_email}`,
      taxBreakdown.total,
      'draft',
      JSON.stringify({
        name: order.contact_name,
        email: order.contact_email,
        phone: order.contact_phone,
        invoiceNumber,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        lineItems,
        notes: options?.customNotes || settings.defaultNotes
      })
    ]
  )
  
  // Update order with invoice info - handle missing tax columns
  try {
    await query(
      `UPDATE quote_requests 
       SET total_amount = $1, 
           tax_amount = $2, 
           tax_province = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [taxBreakdown.total, taxBreakdown.totalTax, province, orderId]
    )
  } catch {
    await query(
      `UPDATE quote_requests 
       SET total_amount = $1, 
           updated_at = NOW()
       WHERE id = $2`,
      [taxBreakdown.total, orderId]
    )
  }
  
  const invoiceData: InvoiceData = {
    invoiceNumber,
    orderId,
    customerName: order.contact_name,
    customerEmail: order.contact_email,
    customerPhone: order.contact_phone,
    eventDate: order.event_date?.toISOString().split('T')[0],
    eventVenue: order.event_venue,
    issueDate: issueDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    lineItems,
    subtotal,
    taxBreakdown,
    total: taxBreakdown.total,
    province,
    notes: options?.customNotes || settings.defaultNotes,
    status: 'draft'
  }
  
  logger.info('Invoice created', { orderId, invoiceNumber, total: taxBreakdown.total })
  
  // Send email if requested
  if (options?.sendEmail) {
    await sendInvoiceEmail(invoiceData)
  }
  
  return invoiceData
}

/**
 * Get invoice data for an order
 */
export async function getInvoiceData(orderId: number): Promise<InvoiceData> {
  const result = await query(
    `SELECT 
      i.*,
      qr.contact_name,
      qr.contact_email,
      qr.contact_phone,
      qr.event_date,
      qr.event_venue,
      qr.tax_province,
      qr.tax_amount,
      qr.total_amount,
      COALESCE(p.name, qr.service_type) as package_name
    FROM invoices i
    JOIN quote_requests qr ON i.quote_id = qr.id
    LEFT JOIN packages p ON qr.package_id = p.id
    WHERE i.quote_id = $1
    ORDER BY i.created_at DESC
    LIMIT 1`,
    [orderId]
  )
  
  if (result.rows.length === 0) {
    throw new Error(`Invoice not found for order ${orderId}`)
  }
  
  const row = result.rows[0]
  const snapshot = row.customer_snapshot || {}
  const province = row.tax_province || 'AB'
  const subtotal = row.amount_cents - (row.tax_amount || 0)
  const taxBreakdown = calculateTax(subtotal, province)
  
  return {
    invoiceNumber: row.stripe_invoice_id,
    orderId,
    customerName: row.contact_name,
    customerEmail: row.contact_email,
    customerPhone: row.contact_phone,
    eventDate: row.event_date?.toISOString().split('T')[0],
    eventVenue: row.event_venue,
    issueDate: snapshot.issueDate || row.created_at?.toISOString().split('T')[0],
    dueDate: snapshot.dueDate || '',
    lineItems: snapshot.lineItems || [{
      description: row.package_name || 'DJ Services',
      quantity: 1,
      unitPrice: subtotal,
      total: subtotal
    }],
    subtotal,
    taxBreakdown,
    total: row.amount_cents,
    province,
    notes: snapshot.notes,
    paymentUrl: row.invoice_url,
    status: row.status
  }
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(invoice: InvoiceData): Promise<void> {
  const settings = await getInvoiceSettings()
  
  // Update invoice status to sent
  await query(
    `UPDATE invoices 
     SET status = 'sent', sent_at = NOW()
     WHERE stripe_invoice_id = $1`,
    [invoice.invoiceNumber]
  )
  
  // Update order status
  await query(
    `UPDATE quote_requests 
     SET status = 'invoiced', updated_at = NOW()
     WHERE id = $1`,
    [invoice.orderId]
  )
  
  // Send email
  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    lineItems: invoice.lineItems,
    subtotal: (invoice.subtotal / 100).toFixed(2),
    gst: (invoice.taxBreakdown.gst / 100).toFixed(2),
    pst: (invoice.taxBreakdown.pst / 100).toFixed(2),
    hst: (invoice.taxBreakdown.hst / 100).toFixed(2),
    totalTax: (invoice.taxBreakdown.totalTax / 100).toFixed(2),
    total: (invoice.total / 100).toFixed(2),
    notes: invoice.notes,
    paymentUrl: invoice.paymentUrl,
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail
  }

  // Build HTML for the invoice email
  const lineItemsHtml = invoice.lineItems.map(item =>
    `<tr><td>${item.description}</td><td>${item.quantity}</td><td>$${(item.unitPrice / 100).toFixed(2)}</td><td>$${(item.total / 100).toFixed(2)}</td></tr>`
  ).join('')

  const invoiceHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Invoice ${invoice.invoiceNumber}</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${invoice.customerName},</p>
        <p>Please find your invoice details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead><tr style="background: #e2e8f0;"><th style="padding: 8px; text-align: left;">Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${lineItemsHtml}</tbody>
        </table>
        <p><strong>Subtotal:</strong> $${invoiceData.subtotal}</p>
        <p><strong>Tax:</strong> $${invoiceData.totalTax}</p>
        <p style="font-size: 18px;"><strong>Total: $${invoiceData.total}</strong></p>
        <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
        ${invoice.paymentUrl ? `<p><a href="${invoice.paymentUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Pay Now</a></p>` : ''}
        ${invoice.notes ? `<p style="color: #64748b; font-size: 14px;">${invoice.notes}</p>` : ''}
        <p>Best regards,<br>${settings.companyName}</p>
      </div>
    </div>
  `

  await sendEmail(
    {
      to: invoice.customerEmail,
      subject: `Invoice ${invoice.invoiceNumber} - ${settings.companyName}`,
      html: invoiceHtml
    },
    'invoice',
    invoiceData,
    invoice.orderId
  )
  
  logger.info('Invoice email sent', { 
    invoiceNumber: invoice.invoiceNumber, 
    to: invoice.customerEmail 
  })
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices(): Promise<Array<{
  orderId: number
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  dueDate: string
  daysOverdue: number
}>> {
  const result = await query(
    `SELECT 
      i.quote_id as order_id,
      i.stripe_invoice_id as invoice_number,
      i.amount_cents as amount,
      i.customer_snapshot,
      qr.contact_name,
      qr.contact_email
    FROM invoices i
    JOIN quote_requests qr ON i.quote_id = qr.id
    WHERE i.status IN ('sent', 'draft')
    AND qr.status IN ('quoted', 'invoiced')
    ORDER BY i.created_at`
  )
  
  const now = new Date()
  const overdueInvoices = []
  
  for (const row of result.rows) {
    const snapshot = row.customer_snapshot || {}
    const dueDate = snapshot.dueDate ? new Date(snapshot.dueDate) : null
    
    if (dueDate && dueDate < now) {
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      overdueInvoices.push({
        orderId: row.order_id,
        invoiceNumber: row.invoice_number,
        customerName: row.contact_name,
        customerEmail: row.contact_email,
        amount: row.amount,
        dueDate: dueDate.toISOString().split('T')[0],
        daysOverdue
      })
    }
  }
  
  return overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue)
}

/**
 * Get invoice aging summary
 */
export async function getInvoiceAgingSummary(): Promise<{
  current: { count: number; amount: number }
  thirtyDays: { count: number; amount: number }
  sixtyDays: { count: number; amount: number }
  ninetyPlus: { count: number; amount: number }
  total: { count: number; amount: number }
}> {
  const result = await query(
    `SELECT 
      CASE 
        WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'current'
        WHEN i.created_at >= CURRENT_DATE - INTERVAL '60 days' THEN 'thirty'
        WHEN i.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 'sixty'
        ELSE 'ninety_plus'
      END as age_bucket,
      COUNT(*) as count,
      COALESCE(SUM(i.amount_cents), 0) as amount
    FROM invoices i
    JOIN quote_requests qr ON i.quote_id = qr.id
    WHERE i.status IN ('sent', 'draft')
    AND qr.status IN ('quoted', 'invoiced')
    GROUP BY age_bucket`
  )
  
  const buckets: Record<string, { count: number; amount: number }> = {
    current: { count: 0, amount: 0 },
    thirty: { count: 0, amount: 0 },
    sixty: { count: 0, amount: 0 },
    ninety_plus: { count: 0, amount: 0 }
  }
  
  for (const row of result.rows) {
    buckets[row.age_bucket] = {
      count: parseInt(row.count),
      amount: parseInt(row.amount)
    }
  }
  
  const total = {
    count: Object.values(buckets).reduce((sum, b) => sum + b.count, 0),
    amount: Object.values(buckets).reduce((sum, b) => sum + b.amount, 0)
  }
  
  return {
    current: buckets.current,
    thirtyDays: buckets.thirty,
    sixtyDays: buckets.sixty,
    ninetyPlus: buckets.ninety_plus,
    total
  }
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(
  orderId: number,
  paymentDetails?: {
    paymentMethod?: string
    transactionId?: string
    paidAt?: Date
  }
): Promise<void> {
  const paidAt = paymentDetails?.paidAt || new Date()
  
  // Update invoice
  await query(
    `UPDATE invoices 
     SET status = 'paid', paid_at = $1, updated_at = NOW()
     WHERE quote_id = $2`,
    [paidAt, orderId]
  )
  
  // Update order
  await query(
    `UPDATE quote_requests 
     SET status = 'paid', updated_at = NOW()
     WHERE id = $1`,
    [orderId]
  )
  
  // Create payment record if transaction ID provided
  if (paymentDetails?.transactionId) {
    const invoiceResult = await query(
      `SELECT id, amount_cents FROM invoices WHERE quote_id = $1`,
      [orderId]
    )
    
    if (invoiceResult.rows.length > 0) {
      await query(
        `INSERT INTO payments (invoice_id, stripe_payment_id, amount_cents, status, paid_at)
         VALUES ($1, $2, $3, 'succeeded', $4)
         ON CONFLICT (stripe_payment_id) DO NOTHING`,
        [
          invoiceResult.rows[0].id,
          paymentDetails.transactionId,
          invoiceResult.rows[0].amount_cents,
          paidAt
        ]
      )
    }
  }
  
  logger.info('Invoice marked as paid', { orderId, paidAt })
}
