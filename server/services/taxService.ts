/**
 * Tax Service
 * Automated tax calculation, application, and CRA reporting
 */

import { query } from '../db/connection'
import { calculateTax, getTaxRates, getProvinceName, TaxBreakdown } from '../utils/tax'
import { logger } from '../utils/logger'

export interface TaxSettings {
  defaultProvince: string
  autoApplyTax: boolean
  includeInPrice: boolean  // If true, prices are tax-inclusive
  roundingMethod: 'standard' | 'up' | 'down'
}

export interface CRATaxReport {
  reportingPeriod: {
    startDate: string
    endDate: string
    type: 'monthly' | 'quarterly' | 'annual'
  }
  businessInfo: {
    businessNumber?: string
    businessName?: string
    reportDate: string
  }
  gstHstCollected: number
  gstHstRemittable: number
  pstCollected: Record<string, number>  // By province
  totalTaxCollected: number
  orderCount: number
  grossRevenue: number
  netRevenue: number
  transactions: Array<{
    date: string
    orderId: number
    customerName: string
    province: string
    subtotal: number
    gst: number
    pst: number
    hst: number
    total: number
  }>
}

// Default tax settings
const DEFAULT_TAX_SETTINGS: TaxSettings = {
  defaultProvince: 'AB',
  autoApplyTax: true,
  includeInPrice: false,
  roundingMethod: 'standard'
}

/**
 * Get tax settings from database or return defaults
 */
export async function getTaxSettings(): Promise<TaxSettings> {
  try {
    const result = await query(
      `SELECT value FROM settings WHERE key = 'tax_settings'`
    )
    
    if (result.rows.length > 0 && result.rows[0].value) {
      return { ...DEFAULT_TAX_SETTINGS, ...result.rows[0].value }
    }
  } catch (error) {
    logger.warn('Could not load tax settings, using defaults', { error })
  }
  
  return DEFAULT_TAX_SETTINGS
}

/**
 * Save tax settings to database
 */
export async function saveTaxSettings(settings: Partial<TaxSettings>): Promise<TaxSettings> {
  const currentSettings = await getTaxSettings()
  const newSettings = { ...currentSettings, ...settings }
  
  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('tax_settings', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(newSettings)]
  )
  
  return newSettings
}

/**
 * Automatically apply tax to an order based on customer province
 */
export async function applyTaxToOrder(
  orderId: number,
  province?: string
): Promise<TaxBreakdown & { orderId: number; province: string }> {
  const settings = await getTaxSettings()
  const taxProvince = province || settings.defaultProvince
  
  // Get order details
  const orderResult = await query(
    `SELECT id, total_amount, tax_amount, tax_province, status
     FROM quote_requests WHERE id = $1`,
    [orderId]
  )
  
  if (orderResult.rows.length === 0) {
    throw new Error(`Order ${orderId} not found`)
  }
  
  const order = orderResult.rows[0]
  
  // Don't modify paid orders
  if (['paid', 'completed', 'delivered'].includes(order.status)) {
    throw new Error('Cannot modify tax on a paid order')
  }
  
  // Calculate tax
  let taxBreakdown: TaxBreakdown
  
  if (settings.includeInPrice) {
    // Price includes tax, calculate backwards
    const { calculateTaxFromTotal } = await import('../utils/tax')
    taxBreakdown = calculateTaxFromTotal(order.total_amount, taxProvince)
  } else {
    // Price is before tax
    taxBreakdown = calculateTax(order.total_amount, taxProvince)
  }
  
  // Update order with tax information
  await query(
    `UPDATE quote_requests 
     SET tax_amount = $1, 
         tax_province = $2, 
         total_amount = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [taxBreakdown.totalTax, taxProvince, taxBreakdown.total, orderId]
  )
  
  logger.info('Tax applied to order', { 
    orderId, 
    province: taxProvince, 
    taxAmount: taxBreakdown.totalTax,
    total: taxBreakdown.total
  })
  
  return {
    ...taxBreakdown,
    orderId,
    province: taxProvince
  }
}

/**
 * Generate CRA-compliant tax report for a period
 */
export async function generateCRATaxReport(
  startDate: Date,
  endDate: Date,
  reportType: 'monthly' | 'quarterly' | 'annual' = 'quarterly'
): Promise<CRATaxReport> {
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]
  
  // Get all paid orders in the period
  const result = await query(
    `SELECT 
      qr.id as order_id,
      qr.contact_name,
      qr.contact_email,
      qr.created_at,
      qr.updated_at as payment_date,
      COALESCE(qr.tax_province, 'AB') as province,
      qr.total_amount,
      qr.tax_amount,
      COALESCE(p.name, qr.service_type) as service
    FROM quote_requests qr
    LEFT JOIN packages p ON qr.package_id = p.id
    WHERE qr.status IN ('paid', 'completed', 'delivered')
    AND qr.updated_at >= $1
    AND qr.updated_at < $2
    ORDER BY qr.updated_at`,
    [startStr, endStr]
  )
  
  let gstHstCollected = 0
  const pstByProvince: Record<string, number> = {}
  let grossRevenue = 0
  let netRevenue = 0
  
  const transactions = result.rows.map(row => {
    const total = parseInt(row.total_amount) || 0
    const taxAmount = parseInt(row.tax_amount) || 0
    const rates = getTaxRates(row.province)
    
    // Calculate tax breakdown
    const subtotal = taxAmount > 0 
      ? total - taxAmount 
      : Math.round(total / (1 + rates.gst + rates.pst + rates.hst))
    
    let gst = 0, pst = 0, hst = 0
    
    if (rates.hst > 0) {
      hst = Math.round(subtotal * rates.hst)
      gstHstCollected += hst
    } else {
      gst = Math.round(subtotal * rates.gst)
      pst = Math.round(subtotal * rates.pst)
      gstHstCollected += gst
      
      if (pst > 0) {
        pstByProvince[row.province] = (pstByProvince[row.province] || 0) + pst
      }
    }
    
    grossRevenue += total
    netRevenue += subtotal
    
    return {
      date: row.payment_date?.toISOString().split('T')[0] || '',
      orderId: row.order_id,
      customerName: row.contact_name,
      province: row.province,
      subtotal,
      gst,
      pst,
      hst,
      total
    }
  })
  
  const totalTaxCollected = gstHstCollected + Object.values(pstByProvince).reduce((a, b) => a + b, 0)
  
  return {
    reportingPeriod: {
      startDate: startStr,
      endDate: endStr,
      type: reportType
    },
    businessInfo: {
      reportDate: new Date().toISOString().split('T')[0]
    },
    gstHstCollected,
    gstHstRemittable: gstHstCollected, // In a real scenario, this would subtract ITCs
    pstCollected: pstByProvince,
    totalTaxCollected,
    orderCount: transactions.length,
    grossRevenue,
    netRevenue,
    transactions
  }
}

/**
 * Get upcoming tax filing deadlines
 */
export function getTaxFilingDeadlines(): Array<{
  type: string
  period: string
  deadline: Date
  daysRemaining: number
}> {
  const now = new Date()
  const deadlines = []
  
  // GST/HST filing deadlines (quarterly for most small businesses)
  const currentQuarter = Math.floor(now.getMonth() / 3)
  const quarters = [
    { q: 1, deadline: new Date(now.getFullYear(), 3, 30) },  // Q1 due Apr 30
    { q: 2, deadline: new Date(now.getFullYear(), 6, 31) },  // Q2 due Jul 31
    { q: 3, deadline: new Date(now.getFullYear(), 9, 31) },  // Q3 due Oct 31
    { q: 4, deadline: new Date(now.getFullYear() + 1, 0, 31) }  // Q4 due Jan 31
  ]
  
  for (const { q, deadline } of quarters) {
    if (deadline > now) {
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      deadlines.push({
        type: 'GST/HST',
        period: `Q${q} ${deadline.getFullYear() - (q === 4 ? 1 : 0)}`,
        deadline,
        daysRemaining
      })
    }
  }
  
  // Annual income tax deadline
  const annualDeadline = new Date(now.getFullYear(), 3, 30) // April 30
  if (annualDeadline > now) {
    deadlines.push({
      type: 'Annual Income Tax',
      period: `${now.getFullYear() - 1}`,
      deadline: annualDeadline,
      daysRemaining: Math.ceil((annualDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    })
  }
  
  return deadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
}

/**
 * Calculate estimated tax owing for a period
 */
export async function calculateEstimatedTaxOwing(
  year: number,
  quarter?: number
): Promise<{
  gstHst: number
  estimatedPst: Record<string, number>
  total: number
  period: string
}> {
  const taxParams: any[] = [year]
  let dateFilter = `EXTRACT(YEAR FROM updated_at) = $1`
  let period = `${year}`
  
  if (quarter) {
    const startMonth = (quarter - 1) * 3 + 1
    const endMonth = quarter * 3
    taxParams.push(startMonth, endMonth)
    dateFilter += ` AND EXTRACT(MONTH FROM updated_at) BETWEEN $2 AND $3`
    period = `Q${quarter} ${year}`
  }
  
  const result = await query(
    `SELECT 
      COALESCE(tax_province, 'AB') as province,
      COALESCE(SUM(tax_amount), 0) as tax_collected,
      COALESCE(SUM(total_amount), 0) as total_revenue
    FROM quote_requests
    WHERE status IN ('paid', 'completed', 'delivered')
    AND ${dateFilter}
    GROUP BY COALESCE(tax_province, 'AB')`,
    taxParams
  )
  
  let gstHst = 0
  const pstByProvince: Record<string, number> = {}
  
  for (const row of result.rows) {
    const taxCollected = parseInt(row.tax_collected) || 0
    const revenue = parseInt(row.total_revenue) || 0
    const rates = getTaxRates(row.province)
    
    if (taxCollected > 0) {
      // Use actual collected tax
      if (rates.hst > 0) {
        gstHst += taxCollected
      } else {
        const gstPortion = Math.round(taxCollected * (rates.gst / (rates.gst + rates.pst)))
        const pstPortion = taxCollected - gstPortion
        gstHst += gstPortion
        if (pstPortion > 0) {
          pstByProvince[row.province] = (pstByProvince[row.province] || 0) + pstPortion
        }
      }
    } else {
      // Estimate based on revenue
      const subtotal = Math.round(revenue / (1 + rates.gst + rates.pst + rates.hst))
      if (rates.hst > 0) {
        gstHst += Math.round(subtotal * rates.hst)
      } else {
        gstHst += Math.round(subtotal * rates.gst)
        if (rates.pst > 0) {
          pstByProvince[row.province] = (pstByProvince[row.province] || 0) + Math.round(subtotal * rates.pst)
        }
      }
    }
  }
  
  const totalPst = Object.values(pstByProvince).reduce((a, b) => a + b, 0)
  
  return {
    gstHst,
    estimatedPst: pstByProvince,
    total: gstHst + totalPst,
    period
  }
}
