/**
 * Enhanced Finance Router
 * Provides comprehensive financial metrics, tax calculations, and business analytics
 */

import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { query } from '../../db/connection'
import { calculateTax, getTaxRates, getProvinceName, getSupportedProvinces } from '../../utils/tax'

export const financeRouter = router({
  /**
   * Get comprehensive finance statistics
   */
  stats: adminProcedure
    .query(async () => {
      // Total revenue (all time)
      const totalResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue 
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')`
      )
      const totalRevenue = parseInt(totalResult.rows[0].revenue)
      
      // Year-to-date revenue
      const ytdResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue 
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
      )
      const yearToDateRevenue = parseInt(ytdResult.rows[0].revenue)
      
      // Monthly revenue (current month)
      const monthlyResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue 
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
      )
      const monthlyRevenue = parseInt(monthlyResult.rows[0].revenue)
      
      // Last month revenue (for comparison)
      const lastMonthResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as revenue 
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`
      )
      const lastMonthRevenue = parseInt(lastMonthResult.rows[0].revenue)
      
      // Pending payments (quoted but not paid)
      const pendingResult = await query(
        `SELECT COALESCE(SUM(COALESCE(quoted_amount, total_amount)), 0) as amount 
         FROM quote_requests 
         WHERE status IN ('quoted', 'invoiced')`
      )
      const pendingPayments = parseInt(pendingResult.rows[0].amount)
      
      // Paid order count
      const orderCountResult = await query(
        `SELECT COUNT(*) as count 
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')`
      )
      const paidOrderCount = parseInt(orderCountResult.rows[0].count)
      
      // Total quotes sent
      const quotesResult = await query(
        `SELECT COUNT(*) as count FROM quote_requests WHERE quoted_amount IS NOT NULL`
      )
      const totalQuotesSent = parseInt(quotesResult.rows[0].count)
      
      // Conversion rate (paid / quoted)
      const conversionRate = totalQuotesSent > 0 
        ? (paidOrderCount / totalQuotesSent) * 100 
        : 0
      
      // Average order value
      const avgOrderValue = paidOrderCount > 0 
        ? Math.round(totalRevenue / paidOrderCount) 
        : 0
      
      // Average days to payment
      const avgDaysResult = await query(
        `SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
         FROM quote_requests 
         WHERE status IN ('paid', 'completed', 'delivered')
         AND updated_at IS NOT NULL`
      )
      const averageDaysToPayment = Math.round(parseFloat(avgDaysResult.rows[0].avg_days) || 0)
      
      // Tax collected (estimated based on default province)
      let taxCollected = 0
      try {
        const taxResult = await query(
          `SELECT 
            COALESCE(SUM(tax_amount), 0) as collected_tax,
            COALESCE(SUM(CASE WHEN tax_province = 'AB' OR tax_province IS NULL THEN total_amount * 0.05 ELSE 0 END), 0) as estimated_gst
           FROM quote_requests 
           WHERE status IN ('paid', 'completed', 'delivered')`
        )
        taxCollected = parseInt(taxResult.rows[0].collected_tax) || Math.round(parseInt(taxResult.rows[0].estimated_gst))
      } catch {
        // tax_amount/tax_province columns may not exist yet, estimate from total
        const fallbackTax = await query(
          `SELECT COALESCE(SUM(total_amount), 0) * 0.05 as estimated_gst
           FROM quote_requests 
           WHERE status IN ('paid', 'completed', 'delivered')`
        )
        taxCollected = Math.round(parseFloat(fallbackTax.rows[0].estimated_gst) || 0)
      }
      
      // Revenue by service/package
      const serviceResult = await query(
        `SELECT 
          COALESCE(p.name, qr.service_type, 'Other') as service,
          COALESCE(SUM(qr.total_amount), 0) as revenue,
          COUNT(*) as order_count
        FROM quote_requests qr
        LEFT JOIN packages p ON qr.package_id = p.id
        WHERE qr.status IN ('paid', 'completed', 'delivered')
        GROUP BY p.name, qr.service_type
        ORDER BY revenue DESC`
      )
      
      // Orders by status (pipeline)
      const pipelineResult = await query(
        `SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(COALESCE(quoted_amount, total_amount, 0)), 0) as value
        FROM quote_requests
        GROUP BY status`
      )
      
      // Outstanding invoices by age
      const agingResult = await query(
        `SELECT 
          CASE 
            WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'current'
            WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' THEN 'thirty'
            ELSE 'sixty_plus'
          END as age_bucket,
          COUNT(*) as count,
          COALESCE(SUM(COALESCE(quoted_amount, total_amount)), 0) as amount
        FROM quote_requests
        WHERE status IN ('quoted', 'invoiced')
        GROUP BY age_bucket`
      )
      
      const agingMap: Record<string, { count: number; amount: number }> = {}
      agingResult.rows.forEach(row => {
        agingMap[row.age_bucket] = {
          count: parseInt(row.count),
          amount: parseInt(row.amount)
        }
      })
      
      // Recent transactions
      const transactionsResult = await query(
        `SELECT 
          p.id,
          p.paid_at as date,
          qr.contact_name as customer_name,
          COALESCE(pkg.name, qr.service_type, 'Other') as package_name,
          p.amount_cents as amount,
          p.status,
          qr.id as order_id
        FROM payments p
        INNER JOIN invoices i ON p.invoice_id = i.id
        INNER JOIN quote_requests qr ON i.quote_id = qr.id
        LEFT JOIN packages pkg ON qr.package_id = pkg.id
        WHERE p.status = 'succeeded'
        ORDER BY p.paid_at DESC
        LIMIT 10`
      )
      
      // Top customers
      const topCustomersResult = await query(
        `SELECT 
          COALESCE(qr.contact_email, u.email) as email,
          MAX(COALESCE(qr.contact_name, u.name)) as name,
          COUNT(*) as order_count,
          COALESCE(SUM(qr.total_amount), 0) as total_spent
        FROM quote_requests qr
        LEFT JOIN users u ON qr.user_id = u.id
        WHERE qr.status IN ('paid', 'completed', 'delivered')
        GROUP BY COALESCE(qr.contact_email, u.email)
        ORDER BY total_spent DESC
        LIMIT 5`
      )
      
      return {
        // Basic metrics
        totalRevenue,
        yearToDateRevenue,
        monthlyRevenue,
        lastMonthRevenue,
        pendingPayments,
        paidOrderCount,
        
        // Calculated metrics
        avgOrderValue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        averageDaysToPayment,
        
        // Tax
        taxCollected,
        
        // Revenue breakdown
        revenueByService: serviceResult.rows.map(row => ({
          service: row.service,
          revenue: parseInt(row.revenue),
          orderCount: parseInt(row.order_count)
        })),
        
        // Pipeline
        ordersByStatus: pipelineResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count),
          value: parseInt(row.value)
        })),
        
        // Aging
        outstandingByAge: {
          current: agingMap['current'] || { count: 0, amount: 0 },
          thirtyDays: agingMap['thirty'] || { count: 0, amount: 0 },
          sixtyPlus: agingMap['sixty_plus'] || { count: 0, amount: 0 }
        },
        
        // Recent transactions
        recentTransactions: transactionsResult.rows.map(row => ({
          id: row.id,
          date: row.date?.toISOString() || null,
          customerName: row.customer_name,
          packageName: row.package_name,
          amount: row.amount,
          status: row.status,
          orderId: row.order_id
        })),
        
        // Top customers
        topCustomers: topCustomersResult.rows.map(row => ({
          email: row.email,
          name: row.name,
          orderCount: parseInt(row.order_count),
          totalSpent: parseInt(row.total_spent)
        }))
      }
    }),

  /**
   * Get revenue trend data (last 12 months)
   */
  revenueTrend: adminProcedure
    .input(z.object({
      months: z.number().min(3).max(24).default(12)
    }).optional())
    .query(async ({ input }) => {
      const months = input?.months || 12
      
      // Current period revenue by month
      const currentResult = await query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month_short,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as order_count
        FROM quote_requests 
        WHERE status IN ('paid', 'completed', 'delivered')
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - make_interval(months => $1)
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month`,
        [months - 1]
      )
      
      // Previous year same period for comparison
      const previousResult = await query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at) + INTERVAL '1 year', 'YYYY-MM') as month,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM quote_requests 
        WHERE status IN ('paid', 'completed', 'delivered')
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - make_interval(months => $1)
        AND created_at < DATE_TRUNC('month', CURRENT_DATE) - make_interval(months => $2)
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month`,
        [months - 1 + 12, months - 1]
      )
      
      // Create a map of previous year data
      const previousMap: Record<string, number> = {}
      previousResult.rows.forEach(row => {
        previousMap[row.month] = parseInt(row.revenue)
      })
      
      return currentResult.rows.map(row => ({
        month: row.month,
        monthShort: row.month_short,
        revenue: parseInt(row.revenue),
        orderCount: parseInt(row.order_count),
        previousYearRevenue: previousMap[row.month] || 0
      }))
    }),

  /**
   * Get tax summary for a period
   */
  taxSummary: adminProcedure
    .input(z.object({
      year: z.number().optional(),
      quarter: z.number().min(1).max(4).optional()
    }).optional())
    .query(async ({ input }) => {
      const year = input?.year || new Date().getFullYear()
      const quarter = input?.quarter
      
      const params: any[] = [year]
      let dateFilter = `EXTRACT(YEAR FROM created_at) = $1`
      if (quarter) {
        const startMonth = (quarter - 1) * 3 + 1
        const endMonth = quarter * 3
        params.push(startMonth, endMonth)
        dateFilter += ` AND EXTRACT(MONTH FROM created_at) BETWEEN $2 AND $3`
      }
      
      // Get revenue by province - handle missing columns gracefully
      let result
      try {
        result = await query(
          `SELECT 
            COALESCE(tax_province, 'AB') as province,
            COALESCE(SUM(total_amount), 0) as revenue,
            COALESCE(SUM(tax_amount), 0) as tax_collected,
            COUNT(*) as order_count
          FROM quote_requests 
          WHERE status IN ('paid', 'completed', 'delivered')
          AND ${dateFilter}
          GROUP BY COALESCE(tax_province, 'AB')
          ORDER BY revenue DESC`,
          params
        )
      } catch {
        // Fallback if tax columns don't exist yet
        result = await query(
          `SELECT 
            'AB' as province,
            COALESCE(SUM(total_amount), 0) as revenue,
            0 as tax_collected,
            COUNT(*) as order_count
          FROM quote_requests 
          WHERE status IN ('paid', 'completed', 'delivered')
          AND ${dateFilter}`,
          params
        )
      }
      
      // Calculate tax breakdown for each province
      const byProvince = result.rows.map(row => {
        const revenue = parseInt(row.revenue)
        const taxCollected = parseInt(row.tax_collected)
        const rates = getTaxRates(row.province)
        
        // If no tax was recorded, estimate it
        const estimatedTax = taxCollected > 0 
          ? taxCollected 
          : Math.round(revenue * (rates.gst + rates.pst + rates.hst))
        
        return {
          province: row.province,
          provinceName: getProvinceName(row.province),
          revenue,
          orderCount: parseInt(row.order_count),
          taxCollected: estimatedTax,
          gst: Math.round(revenue * rates.gst),
          pst: Math.round(revenue * rates.pst),
          hst: Math.round(revenue * rates.hst)
        }
      })
      
      // Calculate totals
      const totals = byProvince.reduce((acc, p) => ({
        revenue: acc.revenue + p.revenue,
        taxCollected: acc.taxCollected + p.taxCollected,
        gst: acc.gst + p.gst,
        pst: acc.pst + p.pst,
        hst: acc.hst + p.hst,
        orderCount: acc.orderCount + p.orderCount
      }), { revenue: 0, taxCollected: 0, gst: 0, pst: 0, hst: 0, orderCount: 0 })
      
      return {
        year,
        quarter,
        byProvince,
        totals,
        supportedProvinces: getSupportedProvinces()
      }
    }),

  /**
   * Export tax report data
   */
  exportTaxReport: adminProcedure
    .input(z.object({
      year: z.number(),
      quarter: z.number().min(1).max(4).optional(),
      format: z.enum(['json', 'csv']).default('json')
    }))
    .query(async ({ input }) => {
      const { year, quarter } = input
      let periodLabel = `${year}`
      
      const exportParams: any[] = [year]
      let exportDateFilter = `EXTRACT(YEAR FROM qr.created_at) = $1`
      
      if (quarter) {
        const startMonth = (quarter - 1) * 3 + 1
        const endMonth = quarter * 3
        exportParams.push(startMonth, endMonth)
        exportDateFilter += ` AND EXTRACT(MONTH FROM qr.created_at) BETWEEN $2 AND $3`
        periodLabel = `${year} Q${quarter}`
      }
      
      // Get detailed order data for tax report - handle missing columns
      let result
      try {
        result = await query(
          `SELECT 
            qr.id as order_id,
            qr.contact_name as customer_name,
            qr.contact_email as customer_email,
            qr.created_at as order_date,
            qr.updated_at as payment_date,
            COALESCE(qr.tax_province, 'AB') as province,
            qr.total_amount as total,
            COALESCE(qr.tax_amount, 0) as tax_amount,
            COALESCE(p.name, qr.service_type) as service
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          WHERE qr.status IN ('paid', 'completed', 'delivered')
          AND ${exportDateFilter}
          ORDER BY qr.created_at`,
          exportParams
        )
      } catch {
        // Fallback if tax columns don't exist
        result = await query(
          `SELECT 
            qr.id as order_id,
            qr.contact_name as customer_name,
            qr.contact_email as customer_email,
            qr.created_at as order_date,
            qr.updated_at as payment_date,
            'AB' as province,
            qr.total_amount as total,
            0 as tax_amount,
            COALESCE(p.name, qr.service_type) as service
          FROM quote_requests qr
          LEFT JOIN packages p ON qr.package_id = p.id
          WHERE qr.status IN ('paid', 'completed', 'delivered')
          AND ${exportDateFilter}
          ORDER BY qr.created_at`,
          exportParams
        )
      }
      
      const orders = result.rows.map(row => {
        const total = parseInt(row.total)
        const taxAmount = parseInt(row.tax_amount) || 0
        const rates = getTaxRates(row.province)
        
        // Calculate or estimate tax breakdown
        const subtotal = taxAmount > 0 
          ? total - taxAmount 
          : Math.round(total / (1 + rates.gst + rates.pst + rates.hst))
        
        return {
          orderId: row.order_id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          orderDate: row.order_date?.toISOString().split('T')[0],
          paymentDate: row.payment_date?.toISOString().split('T')[0],
          province: row.province,
          provinceName: getProvinceName(row.province),
          service: row.service,
          subtotal,
          gst: Math.round(subtotal * rates.gst),
          pst: Math.round(subtotal * rates.pst),
          hst: Math.round(subtotal * rates.hst),
          totalTax: taxAmount > 0 ? taxAmount : Math.round(subtotal * (rates.gst + rates.pst + rates.hst)),
          total
        }
      })
      
      // Calculate summary
      const summary = orders.reduce((acc, o) => ({
        subtotal: acc.subtotal + o.subtotal,
        gst: acc.gst + o.gst,
        pst: acc.pst + o.pst,
        hst: acc.hst + o.hst,
        totalTax: acc.totalTax + o.totalTax,
        total: acc.total + o.total,
        orderCount: acc.orderCount + 1
      }), { subtotal: 0, gst: 0, pst: 0, hst: 0, totalTax: 0, total: 0, orderCount: 0 })
      
      return {
        period: periodLabel,
        generatedAt: new Date().toISOString(),
        orders,
        summary
      }
    }),

  /**
   * Get busiest days/months analysis
   */
  busyPeriods: adminProcedure
    .query(async () => {
      // Busiest days of week
      const dayResult = await query(
        `SELECT 
          EXTRACT(DOW FROM event_date) as day_of_week,
          COUNT(*) as count
        FROM quote_requests 
        WHERE status IN ('paid', 'completed', 'delivered')
        AND event_date IS NOT NULL
        GROUP BY EXTRACT(DOW FROM event_date)
        ORDER BY count DESC`
      )
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const byDayOfWeek = dayResult.rows.map(row => ({
        day: parseInt(row.day_of_week),
        dayName: dayNames[parseInt(row.day_of_week)],
        count: parseInt(row.count)
      }))
      
      // Busiest months
      const monthResult = await query(
        `SELECT 
          EXTRACT(MONTH FROM event_date) as month,
          COUNT(*) as count
        FROM quote_requests 
        WHERE status IN ('paid', 'completed', 'delivered')
        AND event_date IS NOT NULL
        GROUP BY EXTRACT(MONTH FROM event_date)
        ORDER BY count DESC`
      )
      
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December']
      const byMonth = monthResult.rows.map(row => ({
        month: parseInt(row.month),
        monthName: monthNames[parseInt(row.month)],
        count: parseInt(row.count)
      }))
      
      return {
        byDayOfWeek,
        byMonth
      }
    })
})
