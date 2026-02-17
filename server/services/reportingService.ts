/**
 * Financial Reporting Service
 * Comprehensive reporting, analytics, and export functionality
 */

import { query } from '../db/connection'
import { getTaxRates, getProvinceName } from '../utils/tax'
import { logger } from '../utils/logger'

export interface FinancialSummary {
  period: string
  revenue: {
    gross: number
    net: number
    tax: number
  }
  orders: {
    total: number
    paid: number
    pending: number
    cancelled: number
  }
  averages: {
    orderValue: number
    daysToPayment: number
    conversionRate: number
  }
  comparison?: {
    previousPeriodRevenue: number
    revenueChange: number
    revenueChangePercent: number
  }
}

export interface RevenueByCategory {
  category: string
  revenue: number
  orderCount: number
  percentage: number
}

export interface CashFlowProjection {
  month: string
  expectedRevenue: number
  confirmedRevenue: number
  pendingRevenue: number
  projectedExpenses: number
  netCashFlow: number
}

export interface ProfitLossStatement {
  period: string
  revenue: {
    services: number
    other: number
    total: number
  }
  expenses: {
    equipment: number
    travel: number
    marketing: number
    software: number
    other: number
    total: number
  }
  grossProfit: number
  netProfit: number
  profitMargin: number
}

export interface ExportFormat {
  type: 'csv' | 'json' | 'pdf'
  filename: string
  data: string | object
  mimeType: string
}

/**
 * Get financial summary for a period
 */
export async function getFinancialSummary(
  startDate: Date,
  endDate: Date
): Promise<FinancialSummary> {
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]
  
  // Current period revenue - handle missing tax columns
  let revenueResult
  try {
    revenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as gross,
        COALESCE(SUM(total_amount - COALESCE(tax_amount, 0)), 0) as net,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM quote_requests
      WHERE status IN ('paid', 'completed', 'delivered')
      AND updated_at >= $1 AND updated_at < $2`,
      [startStr, endStr]
    )
  } catch {
    revenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as gross,
        COALESCE(SUM(total_amount), 0) as net,
        0 as tax
      FROM quote_requests
      WHERE status IN ('paid', 'completed', 'delivered')
      AND updated_at >= $1 AND updated_at < $2`,
      [startStr, endStr]
    )
  }
  
  // Order counts
  const ordersResult = await query(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status IN ('paid', 'completed', 'delivered')) as paid,
      COUNT(*) FILTER (WHERE status IN ('quoted', 'invoiced', 'submitted')) as pending,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
    FROM quote_requests
    WHERE created_at >= $1 AND created_at < $2`,
    [startStr, endStr]
  )
  
  // Averages
  const avgResult = await query(
    `SELECT 
      AVG(total_amount) as avg_order_value,
      AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days_to_payment
    FROM quote_requests
    WHERE status IN ('paid', 'completed', 'delivered')
    AND updated_at >= $1 AND updated_at < $2`,
    [startStr, endStr]
  )
  
  // Conversion rate
  const conversionResult = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE status IN ('paid', 'completed', 'delivered')) as paid,
      COUNT(*) FILTER (WHERE quoted_amount IS NOT NULL) as quoted
    FROM quote_requests
    WHERE created_at >= $1 AND created_at < $2`,
    [startStr, endStr]
  )
  
  // Previous period for comparison
  const periodLength = endDate.getTime() - startDate.getTime()
  const prevStartDate = new Date(startDate.getTime() - periodLength)
  const prevEndDate = startDate
  
  const prevResult = await query(
    `SELECT COALESCE(SUM(total_amount), 0) as revenue
    FROM quote_requests
    WHERE status IN ('paid', 'completed', 'delivered')
    AND updated_at >= $1 AND updated_at < $2`,
    [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]
  )
  
  const currentRevenue = parseInt(revenueResult.rows[0].gross) || 0
  const previousRevenue = parseInt(prevResult.rows[0].revenue) || 0
  const revenueChange = currentRevenue - previousRevenue
  const revenueChangePercent = previousRevenue > 0 
    ? (revenueChange / previousRevenue) * 100 
    : 0
  
  const quoted = parseInt(conversionResult.rows[0].quoted) || 0
  const paidCount = parseInt(conversionResult.rows[0].paid) || 0
  
  return {
    period: `${startStr} to ${endStr}`,
    revenue: {
      gross: parseInt(revenueResult.rows[0].gross) || 0,
      net: parseInt(revenueResult.rows[0].net) || 0,
      tax: parseInt(revenueResult.rows[0].tax) || 0
    },
    orders: {
      total: parseInt(ordersResult.rows[0].total) || 0,
      paid: parseInt(ordersResult.rows[0].paid) || 0,
      pending: parseInt(ordersResult.rows[0].pending) || 0,
      cancelled: parseInt(ordersResult.rows[0].cancelled) || 0
    },
    averages: {
      orderValue: Math.round(parseFloat(avgResult.rows[0].avg_order_value) || 0),
      daysToPayment: Math.round(parseFloat(avgResult.rows[0].avg_days_to_payment) || 0),
      conversionRate: quoted > 0 ? Math.round((paidCount / quoted) * 100) : 0
    },
    comparison: {
      previousPeriodRevenue: previousRevenue,
      revenueChange,
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10
    }
  }
}

/**
 * Get revenue breakdown by category
 */
export async function getRevenueByCategory(
  startDate?: Date,
  endDate?: Date
): Promise<RevenueByCategory[]> {
  let dateFilter = ''
  const params: any[] = []
  
  if (startDate && endDate) {
    dateFilter = 'AND qr.updated_at >= $1 AND qr.updated_at < $2'
    params.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
  }
  
  const result = await query(
    `SELECT 
      COALESCE(p.name, qr.service_type, 'Other') as category,
      COALESCE(SUM(qr.total_amount), 0) as revenue,
      COUNT(*) as order_count
    FROM quote_requests qr
    LEFT JOIN packages p ON qr.package_id = p.id
    WHERE qr.status IN ('paid', 'completed', 'delivered')
    ${dateFilter}
    GROUP BY COALESCE(p.name, qr.service_type, 'Other')
    ORDER BY revenue DESC`,
    params
  )
  
  const totalRevenue = result.rows.reduce((sum, row) => sum + parseInt(row.revenue), 0)
  
  return result.rows.map(row => ({
    category: row.category,
    revenue: parseInt(row.revenue),
    orderCount: parseInt(row.order_count),
    percentage: totalRevenue > 0 ? Math.round((parseInt(row.revenue) / totalRevenue) * 1000) / 10 : 0
  }))
}

/**
 * Get cash flow projection for upcoming months
 */
export async function getCashFlowProjection(months: number = 6): Promise<CashFlowProjection[]> {
  const projections: CashFlowProjection[] = []
  const now = new Date()
  
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0)
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    // Get confirmed revenue (paid orders with events in this month)
    const confirmedResult = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue
       FROM quote_requests
       WHERE status IN ('paid', 'completed')
       AND event_date >= $1 AND event_date <= $2`,
      [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    )
    
    // Get pending revenue (quoted/invoiced orders with events in this month)
    const pendingResult = await query(
      `SELECT COALESCE(SUM(COALESCE(quoted_amount, total_amount)), 0) as revenue
       FROM quote_requests
       WHERE status IN ('quoted', 'invoiced')
       AND event_date >= $1 AND event_date <= $2`,
      [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    )
    
    const confirmedRevenue = parseInt(confirmedResult.rows[0].revenue) || 0
    const pendingRevenue = parseInt(pendingResult.rows[0].revenue) || 0
    
    // Estimate expected revenue (confirmed + 50% of pending)
    const expectedRevenue = confirmedRevenue + Math.round(pendingRevenue * 0.5)
    
    // Estimate expenses (this would come from an expense tracking system)
    // For now, estimate as 30% of expected revenue
    const projectedExpenses = Math.round(expectedRevenue * 0.3)
    
    projections.push({
      month: monthLabel,
      expectedRevenue,
      confirmedRevenue,
      pendingRevenue,
      projectedExpenses,
      netCashFlow: expectedRevenue - projectedExpenses
    })
  }
  
  return projections
}

/**
 * Get year-over-year comparison
 */
export async function getYearOverYearComparison(year: number): Promise<{
  currentYear: { month: string; revenue: number }[]
  previousYear: { month: string; revenue: number }[]
  totalCurrent: number
  totalPrevious: number
  growthPercent: number
}> {
  const currentResult = await query(
    `SELECT 
      TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon') as month,
      EXTRACT(MONTH FROM updated_at) as month_num,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM quote_requests
    WHERE status IN ('paid', 'completed', 'delivered')
    AND EXTRACT(YEAR FROM updated_at) = $1
    GROUP BY DATE_TRUNC('month', updated_at), EXTRACT(MONTH FROM updated_at)
    ORDER BY month_num`,
    [year]
  )
  
  const previousResult = await query(
    `SELECT 
      TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon') as month,
      EXTRACT(MONTH FROM updated_at) as month_num,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM quote_requests
    WHERE status IN ('paid', 'completed', 'delivered')
    AND EXTRACT(YEAR FROM updated_at) = $1
    GROUP BY DATE_TRUNC('month', updated_at), EXTRACT(MONTH FROM updated_at)
    ORDER BY month_num`,
    [year - 1]
  )
  
  const currentYear = currentResult.rows.map(row => ({
    month: row.month,
    revenue: parseInt(row.revenue)
  }))
  
  const previousYear = previousResult.rows.map(row => ({
    month: row.month,
    revenue: parseInt(row.revenue)
  }))
  
  const totalCurrent = currentYear.reduce((sum, m) => sum + m.revenue, 0)
  const totalPrevious = previousYear.reduce((sum, m) => sum + m.revenue, 0)
  const growthPercent = totalPrevious > 0 
    ? Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 1000) / 10
    : 0
  
  return {
    currentYear,
    previousYear,
    totalCurrent,
    totalPrevious,
    growthPercent
  }
}

/**
 * Export financial data to CSV
 */
export function exportToCSV(
  data: any[],
  columns: { key: string; header: string }[]
): string {
  const headers = columns.map(c => c.header).join(',')
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.key]
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  )
  
  return [headers, ...rows].join('\n')
}

/**
 * Generate income statement report
 */
export async function generateIncomeStatement(
  startDate: Date,
  endDate: Date
): Promise<{
  period: string
  revenue: number
  costOfServices: number
  grossProfit: number
  operatingExpenses: number
  netIncome: number
  taxLiability: number
  netIncomeAfterTax: number
}> {
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]
  
  // Get revenue and tax - handle missing tax columns
  let revenueResult
  try {
    revenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM quote_requests
      WHERE status IN ('paid', 'completed', 'delivered')
      AND updated_at >= $1 AND updated_at < $2`,
      [startStr, endStr]
    )
  } catch {
    revenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        0 as tax
      FROM quote_requests
      WHERE status IN ('paid', 'completed', 'delivered')
      AND updated_at >= $1 AND updated_at < $2`,
      [startStr, endStr]
    )
  }
  
  const revenue = parseInt(revenueResult.rows[0].revenue) || 0
  const taxCollected = parseInt(revenueResult.rows[0].tax) || 0
  
  // Estimate cost of services (equipment, music licensing, etc.) - typically 20-30%
  const costOfServices = Math.round(revenue * 0.25)
  
  // Gross profit
  const grossProfit = revenue - costOfServices - taxCollected
  
  // Estimate operating expenses - typically 15-25% of revenue
  const operatingExpenses = Math.round(revenue * 0.20)
  
  // Net income before tax
  const netIncome = grossProfit - operatingExpenses
  
  // Estimate income tax liability (simplified - actual would depend on business structure)
  const taxLiability = Math.round(Math.max(0, netIncome) * 0.15)
  
  // Net income after tax
  const netIncomeAfterTax = netIncome - taxLiability
  
  return {
    period: `${startStr} to ${endStr}`,
    revenue,
    costOfServices,
    grossProfit,
    operatingExpenses,
    netIncome,
    taxLiability,
    netIncomeAfterTax
  }
}

/**
 * Get top customers report
 */
export async function getTopCustomersReport(
  limit: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  rank: number
  customerName: string
  customerEmail: string
  totalSpent: number
  orderCount: number
  averageOrderValue: number
  lastOrderDate: string
}>> {
  let dateFilter = ''
  const params: any[] = [limit]
  
  if (startDate && endDate) {
    dateFilter = 'AND qr.updated_at >= $2 AND qr.updated_at < $3'
    params.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
  }
  
  const result = await query(
    `SELECT 
      qr.contact_email,
      MAX(qr.contact_name) as contact_name,
      COALESCE(SUM(qr.total_amount), 0) as total_spent,
      COUNT(*) as order_count,
      MAX(qr.updated_at) as last_order_date
    FROM quote_requests qr
    WHERE qr.status IN ('paid', 'completed', 'delivered')
    ${dateFilter}
    GROUP BY qr.contact_email
    ORDER BY total_spent DESC
    LIMIT $1`,
    params
  )
  
  return result.rows.map((row, index) => ({
    rank: index + 1,
    customerName: row.contact_name,
    customerEmail: row.contact_email,
    totalSpent: parseInt(row.total_spent),
    orderCount: parseInt(row.order_count),
    averageOrderValue: Math.round(parseInt(row.total_spent) / parseInt(row.order_count)),
    lastOrderDate: row.last_order_date?.toISOString().split('T')[0] || ''
  }))
}

/**
 * Generate comprehensive financial report
 */
export async function generateComprehensiveReport(
  year: number,
  quarter?: number
): Promise<{
  summary: FinancialSummary
  revenueByCategory: RevenueByCategory[]
  topCustomers: any[]
  taxSummary: any
  monthlyTrend: any[]
}> {
  let startDate: Date
  let endDate: Date
  
  if (quarter) {
    startDate = new Date(year, (quarter - 1) * 3, 1)
    endDate = new Date(year, quarter * 3, 0)
  } else {
    startDate = new Date(year, 0, 1)
    endDate = new Date(year, 11, 31)
  }
  
  const [summary, revenueByCategory, topCustomers] = await Promise.all([
    getFinancialSummary(startDate, endDate),
    getRevenueByCategory(startDate, endDate),
    getTopCustomersReport(10, startDate, endDate)
  ])
  
  // Get monthly trend
  const monthlyResult = await query(
    `SELECT 
      TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon') as month,
      EXTRACT(MONTH FROM updated_at) as month_num,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as order_count
    FROM quote_requests
    WHERE status IN ('paid', 'completed', 'delivered')
    AND updated_at >= $1 AND updated_at <= $2
    GROUP BY DATE_TRUNC('month', updated_at), EXTRACT(MONTH FROM updated_at)
    ORDER BY month_num`,
    [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
  )
  
  const monthlyTrend = monthlyResult.rows.map(row => ({
    month: row.month,
    revenue: parseInt(row.revenue),
    orderCount: parseInt(row.order_count)
  }))
  
  // Tax summary - handle missing tax columns
  let taxResult
  try {
    taxResult = await query(
      `SELECT 
        COALESCE(tax_province, 'AB') as province,
        COALESCE(SUM(tax_amount), 0) as tax_collected,
        COUNT(*) as order_count
      FROM quote_requests
      WHERE status IN ('paid', 'completed', 'delivered')
      AND updated_at >= $1 AND updated_at <= $2
      GROUP BY COALESCE(tax_province, 'AB')`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    )
  } catch {
    taxResult = await query(
      `SELECT 
        'AB' as province,
        0 as tax_collected,
        COUNT(*) as order_count
      FROM quote_requests
      WHERE status IN ('paid', 'completed', 'delivered')
      AND updated_at >= $1 AND updated_at <= $2`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    )
  }
  
  const taxSummary = {
    byProvince: taxResult.rows.map(row => ({
      province: row.province,
      provinceName: getProvinceName(row.province),
      taxCollected: parseInt(row.tax_collected),
      orderCount: parseInt(row.order_count)
    })),
    total: taxResult.rows.reduce((sum, row) => sum + parseInt(row.tax_collected), 0)
  }
  
  return {
    summary,
    revenueByCategory,
    topCustomers,
    taxSummary,
    monthlyTrend
  }
}
