/**
 * Finance Automation Router
 * Provides automated financial management endpoints
 */

import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

// Import services
import * as taxService from '../../services/taxService'
import * as invoiceService from '../../services/invoiceService'
import * as reminderService from '../../services/reminderService'
import * as reportingService from '../../services/reportingService'

export const financeAutomationRouter = router({
  // ==================== TAX MANAGEMENT ====================
  
  /**
   * Get tax settings
   */
  getTaxSettings: adminProcedure
    .query(async () => {
      return taxService.getTaxSettings()
    }),
  
  /**
   * Update tax settings
   */
  updateTaxSettings: adminProcedure
    .input(z.object({
      defaultProvince: z.string().length(2).optional(),
      autoApplyTax: z.boolean().optional(),
      includeInPrice: z.boolean().optional(),
      roundingMethod: z.enum(['standard', 'up', 'down']).optional()
    }))
    .mutation(async ({ input }) => {
      return taxService.saveTaxSettings(input)
    }),
  
  /**
   * Apply tax to an order
   */
  applyTaxToOrder: adminProcedure
    .input(z.object({
      orderId: z.number(),
      province: z.string().length(2).optional()
    }))
    .mutation(async ({ input }) => {
      return taxService.applyTaxToOrder(input.orderId, input.province)
    }),
  
  /**
   * Generate CRA tax report
   */
  generateCRATaxReport: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      reportType: z.enum(['monthly', 'quarterly', 'annual']).default('quarterly')
    }))
    .query(async ({ input }) => {
      return taxService.generateCRATaxReport(
        new Date(input.startDate),
        new Date(input.endDate),
        input.reportType
      )
    }),
  
  /**
   * Get tax filing deadlines
   */
  getTaxFilingDeadlines: adminProcedure
    .query(async () => {
      return taxService.getTaxFilingDeadlines()
    }),
  
  /**
   * Get estimated tax owing
   */
  getEstimatedTaxOwing: adminProcedure
    .input(z.object({
      year: z.number(),
      quarter: z.number().min(1).max(4).optional()
    }))
    .query(async ({ input }) => {
      return taxService.calculateEstimatedTaxOwing(input.year, input.quarter)
    }),
  
  // ==================== INVOICE MANAGEMENT ====================
  
  /**
   * Get invoice settings
   */
  getInvoiceSettings: adminProcedure
    .query(async () => {
      return invoiceService.getInvoiceSettings()
    }),
  
  /**
   * Update invoice settings
   */
  updateInvoiceSettings: adminProcedure
    .input(z.object({
      companyName: z.string().optional(),
      companyAddress: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().email().optional(),
      paymentTermsDays: z.number().min(1).max(90).optional(),
      invoicePrefix: z.string().optional(),
      defaultNotes: z.string().optional(),
      autoSendOnQuoteAccept: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      return invoiceService.saveInvoiceSettings(input)
    }),
  
  /**
   * Create invoice from order
   */
  createInvoice: adminProcedure
    .input(z.object({
      orderId: z.number(),
      sendEmail: z.boolean().default(false),
      customNotes: z.string().optional(),
      customDueDays: z.number().min(1).max(90).optional()
    }))
    .mutation(async ({ input }) => {
      return invoiceService.createInvoiceFromOrder(input.orderId, {
        sendEmail: input.sendEmail,
        customNotes: input.customNotes,
        customDueDays: input.customDueDays
      })
    }),
  
  /**
   * Get invoice for order
   */
  getInvoice: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input }) => {
      try {
        return await invoiceService.getInvoiceData(input.orderId)
      } catch (error) {
        return null
      }
    }),
  
  /**
   * Send invoice email
   */
  sendInvoiceEmail: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input }) => {
      const invoice = await invoiceService.getInvoiceData(input.orderId)
      await invoiceService.sendInvoiceEmail(invoice)
      return { success: true }
    }),
  
  /**
   * Get overdue invoices
   */
  getOverdueInvoices: adminProcedure
    .query(async () => {
      return invoiceService.getOverdueInvoices()
    }),
  
  /**
   * Get invoice aging summary
   */
  getInvoiceAgingSummary: adminProcedure
    .query(async () => {
      return invoiceService.getInvoiceAgingSummary()
    }),
  
  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid: adminProcedure
    .input(z.object({
      orderId: z.number(),
      paymentMethod: z.string().optional(),
      transactionId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await invoiceService.markInvoiceAsPaid(input.orderId, {
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId
      })
      return { success: true }
    }),
  
  // ==================== REMINDER MANAGEMENT ====================
  
  /**
   * Get reminder settings
   */
  getReminderSettings: adminProcedure
    .query(async () => {
      return reminderService.getReminderSettings()
    }),
  
  /**
   * Update reminder settings
   */
  updateReminderSettings: adminProcedure
    .input(z.object({
      daysBefore: z.array(z.number()).optional(),
      daysAfter: z.array(z.number()).optional(),
      maxReminders: z.number().min(1).max(20).optional()
    }))
    .mutation(async ({ input }) => {
      return reminderService.saveReminderSettings(input)
    }),
  
  /**
   * Get pending reminders
   */
  getPendingReminders: adminProcedure
    .query(async () => {
      return reminderService.getPendingReminders()
    }),
  
  /**
   * Send a specific reminder
   */
  sendReminder: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input }) => {
      const pendingReminders = await reminderService.getPendingReminders()
      const reminder = pendingReminders.find(r => r.orderId === input.orderId)
      
      if (!reminder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No pending reminder found for this order'
        })
      }
      
      const success = await reminderService.sendPaymentReminder(reminder)
      return { success }
    }),
  
  /**
   * Process all pending reminders
   */
  processAllReminders: adminProcedure
    .mutation(async () => {
      return reminderService.processAllReminders()
    }),
  
  /**
   * Get reminder history for an order
   */
  getReminderHistory: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input }) => {
      return reminderService.getReminderHistory(input.orderId)
    }),
  
  /**
   * Get reminder statistics
   */
  getReminderStats: adminProcedure
    .query(async () => {
      return reminderService.getReminderStats()
    }),
  
  /**
   * Pause reminders for an order
   */
  pauseReminders: adminProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await reminderService.pauseReminders(input.orderId, input.reason)
      return { success: true }
    }),
  
  /**
   * Resume reminders for an order
   */
  resumeReminders: adminProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .mutation(async ({ input }) => {
      await reminderService.resumeReminders(input.orderId)
      return { success: true }
    }),
  
  // ==================== REPORTING ====================
  
  /**
   * Get financial summary
   */
  getFinancialSummary: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string()
    }))
    .query(async ({ input }) => {
      return reportingService.getFinancialSummary(
        new Date(input.startDate),
        new Date(input.endDate)
      )
    }),
  
  /**
   * Get revenue by category
   */
  getRevenueByCategory: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }).optional())
    .query(async ({ input }) => {
      return reportingService.getRevenueByCategory(
        input?.startDate ? new Date(input.startDate) : undefined,
        input?.endDate ? new Date(input.endDate) : undefined
      )
    }),
  
  /**
   * Get cash flow projection
   */
  getCashFlowProjection: adminProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(6)
    }).optional())
    .query(async ({ input }) => {
      return reportingService.getCashFlowProjection(input?.months || 6)
    }),
  
  /**
   * Get year-over-year comparison
   */
  getYearOverYearComparison: adminProcedure
    .input(z.object({
      year: z.number()
    }))
    .query(async ({ input }) => {
      return reportingService.getYearOverYearComparison(input.year)
    }),
  
  /**
   * Get income statement
   */
  getIncomeStatement: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string()
    }))
    .query(async ({ input }) => {
      return reportingService.generateIncomeStatement(
        new Date(input.startDate),
        new Date(input.endDate)
      )
    }),
  
  /**
   * Get top customers report
   */
  getTopCustomers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }).optional())
    .query(async ({ input }) => {
      return reportingService.getTopCustomersReport(
        input?.limit || 10,
        input?.startDate ? new Date(input.startDate) : undefined,
        input?.endDate ? new Date(input.endDate) : undefined
      )
    }),
  
  /**
   * Generate comprehensive financial report
   */
  generateComprehensiveReport: adminProcedure
    .input(z.object({
      year: z.number(),
      quarter: z.number().min(1).max(4).optional()
    }))
    .query(async ({ input }) => {
      return reportingService.generateComprehensiveReport(input.year, input.quarter)
    }),
  
  /**
   * Export data to CSV
   */
  exportToCSV: adminProcedure
    .input(z.object({
      reportType: z.enum(['revenue', 'invoices', 'customers', 'tax']),
      startDate: z.string(),
      endDate: z.string()
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.startDate)
      const endDate = new Date(input.endDate)
      
      let data: any[]
      let columns: { key: string; header: string }[]
      
      switch (input.reportType) {
        case 'revenue':
          data = await reportingService.getRevenueByCategory(startDate, endDate)
          columns = [
            { key: 'category', header: 'Category' },
            { key: 'revenue', header: 'Revenue (cents)' },
            { key: 'orderCount', header: 'Order Count' },
            { key: 'percentage', header: 'Percentage' }
          ]
          break
        
        case 'customers':
          data = await reportingService.getTopCustomersReport(100, startDate, endDate)
          columns = [
            { key: 'rank', header: 'Rank' },
            { key: 'customerName', header: 'Customer Name' },
            { key: 'customerEmail', header: 'Email' },
            { key: 'totalSpent', header: 'Total Spent (cents)' },
            { key: 'orderCount', header: 'Order Count' },
            { key: 'averageOrderValue', header: 'Avg Order Value (cents)' },
            { key: 'lastOrderDate', header: 'Last Order Date' }
          ]
          break
        
        case 'tax':
          const taxReport = await taxService.generateCRATaxReport(startDate, endDate)
          data = taxReport.transactions
          columns = [
            { key: 'date', header: 'Date' },
            { key: 'orderId', header: 'Order ID' },
            { key: 'customerName', header: 'Customer' },
            { key: 'province', header: 'Province' },
            { key: 'subtotal', header: 'Subtotal (cents)' },
            { key: 'gst', header: 'GST (cents)' },
            { key: 'pst', header: 'PST (cents)' },
            { key: 'hst', header: 'HST (cents)' },
            { key: 'total', header: 'Total (cents)' }
          ]
          break
        
        default:
          const invoices = await invoiceService.getOverdueInvoices()
          data = invoices
          columns = [
            { key: 'orderId', header: 'Order ID' },
            { key: 'invoiceNumber', header: 'Invoice Number' },
            { key: 'customerName', header: 'Customer' },
            { key: 'customerEmail', header: 'Email' },
            { key: 'amount', header: 'Amount (cents)' },
            { key: 'dueDate', header: 'Due Date' },
            { key: 'daysOverdue', header: 'Days Overdue' }
          ]
      }
      
      const csv = reportingService.exportToCSV(data, columns)
      
      return {
        filename: `${input.reportType}_report_${input.startDate}_${input.endDate}.csv`,
        content: csv,
        mimeType: 'text/csv'
      }
    })
})
