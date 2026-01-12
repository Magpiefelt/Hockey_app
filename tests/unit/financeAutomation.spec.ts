/**
 * Finance Automation Tests
 * Tests for tax service, invoice service, reminder service, and reporting service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Read the service files for testing
const servicesDir = path.join(__dirname, '../../server/services')

describe('Tax Service', () => {
  const taxServicePath = path.join(servicesDir, 'taxService.ts')
  let taxServiceContent: string

  beforeEach(() => {
    taxServiceContent = fs.readFileSync(taxServicePath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(taxServicePath)).toBe(true)
  })

  it('should export getTaxSettings function', () => {
    expect(taxServiceContent).toContain('export async function getTaxSettings')
  })

  it('should export saveTaxSettings function', () => {
    expect(taxServiceContent).toContain('export async function saveTaxSettings')
  })

  it('should export applyTaxToOrder function', () => {
    expect(taxServiceContent).toContain('export async function applyTaxToOrder')
  })

  it('should export generateCRATaxReport function', () => {
    expect(taxServiceContent).toContain('export async function generateCRATaxReport')
  })

  it('should export getTaxFilingDeadlines function', () => {
    expect(taxServiceContent).toContain('export function getTaxFilingDeadlines')
  })

  it('should export calculateEstimatedTaxOwing function', () => {
    expect(taxServiceContent).toContain('export async function calculateEstimatedTaxOwing')
  })

  it('should have TaxSettings interface', () => {
    expect(taxServiceContent).toContain('export interface TaxSettings')
  })

  it('should have CRATaxReport interface', () => {
    expect(taxServiceContent).toContain('export interface CRATaxReport')
  })

  it('should have default tax settings', () => {
    expect(taxServiceContent).toContain('DEFAULT_TAX_SETTINGS')
    expect(taxServiceContent).toContain("defaultProvince: 'AB'")
  })

  it('should handle quarterly tax deadlines', () => {
    expect(taxServiceContent).toContain('Q1')
    expect(taxServiceContent).toContain('Q2')
    expect(taxServiceContent).toContain('Q3')
    expect(taxServiceContent).toContain('Q4')
  })
})

describe('Invoice Service', () => {
  const invoiceServicePath = path.join(servicesDir, 'invoiceService.ts')
  let invoiceServiceContent: string

  beforeEach(() => {
    invoiceServiceContent = fs.readFileSync(invoiceServicePath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(invoiceServicePath)).toBe(true)
  })

  it('should export getInvoiceSettings function', () => {
    expect(invoiceServiceContent).toContain('export async function getInvoiceSettings')
  })

  it('should export saveInvoiceSettings function', () => {
    expect(invoiceServiceContent).toContain('export async function saveInvoiceSettings')
  })

  it('should export generateInvoiceNumber function', () => {
    expect(invoiceServiceContent).toContain('export async function generateInvoiceNumber')
  })

  it('should export createInvoiceFromOrder function', () => {
    expect(invoiceServiceContent).toContain('export async function createInvoiceFromOrder')
  })

  it('should export getInvoiceData function', () => {
    expect(invoiceServiceContent).toContain('export async function getInvoiceData')
  })

  it('should export sendInvoiceEmail function', () => {
    expect(invoiceServiceContent).toContain('export async function sendInvoiceEmail')
  })

  it('should export getOverdueInvoices function', () => {
    expect(invoiceServiceContent).toContain('export async function getOverdueInvoices')
  })

  it('should export getInvoiceAgingSummary function', () => {
    expect(invoiceServiceContent).toContain('export async function getInvoiceAgingSummary')
  })

  it('should export markInvoiceAsPaid function', () => {
    expect(invoiceServiceContent).toContain('export async function markInvoiceAsPaid')
  })

  it('should have InvoiceData interface', () => {
    expect(invoiceServiceContent).toContain('export interface InvoiceData')
  })

  it('should have InvoiceSettings interface', () => {
    expect(invoiceServiceContent).toContain('export interface InvoiceSettings')
  })

  it('should have InvoiceLineItem interface', () => {
    expect(invoiceServiceContent).toContain('export interface InvoiceLineItem')
  })

  it('should have default invoice settings', () => {
    expect(invoiceServiceContent).toContain('DEFAULT_INVOICE_SETTINGS')
    expect(invoiceServiceContent).toContain('paymentTermsDays: 14')
  })

  it('should handle invoice aging buckets', () => {
    expect(invoiceServiceContent).toContain('current')
    expect(invoiceServiceContent).toContain('thirtyDays')
    expect(invoiceServiceContent).toContain('sixtyDays')
    expect(invoiceServiceContent).toContain('ninetyPlus')
  })
})

describe('Reminder Service', () => {
  const reminderServicePath = path.join(servicesDir, 'reminderService.ts')
  let reminderServiceContent: string

  beforeEach(() => {
    reminderServiceContent = fs.readFileSync(reminderServicePath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(reminderServicePath)).toBe(true)
  })

  it('should export getReminderSettings function', () => {
    expect(reminderServiceContent).toContain('export async function getReminderSettings')
  })

  it('should export saveReminderSettings function', () => {
    expect(reminderServiceContent).toContain('export async function saveReminderSettings')
  })

  it('should export getPendingReminders function', () => {
    expect(reminderServiceContent).toContain('export async function getPendingReminders')
  })

  it('should export sendPaymentReminder function', () => {
    expect(reminderServiceContent).toContain('export async function sendPaymentReminder')
  })

  it('should export processAllReminders function', () => {
    expect(reminderServiceContent).toContain('export async function processAllReminders')
  })

  it('should export getReminderHistory function', () => {
    expect(reminderServiceContent).toContain('export async function getReminderHistory')
  })

  it('should export getReminderStats function', () => {
    expect(reminderServiceContent).toContain('export async function getReminderStats')
  })

  it('should export pauseReminders function', () => {
    expect(reminderServiceContent).toContain('export async function pauseReminders')
  })

  it('should export resumeReminders function', () => {
    expect(reminderServiceContent).toContain('export async function resumeReminders')
  })

  it('should have ReminderSchedule interface', () => {
    expect(reminderServiceContent).toContain('export interface ReminderSchedule')
  })

  it('should have PendingReminder interface', () => {
    expect(reminderServiceContent).toContain('export interface PendingReminder')
  })

  it('should have default reminder schedule', () => {
    expect(reminderServiceContent).toContain('DEFAULT_REMINDER_SCHEDULE')
    expect(reminderServiceContent).toContain('daysBefore: [7, 3, 1]')
    expect(reminderServiceContent).toContain('daysAfter: [1, 3, 7, 14]')
  })

  it('should handle different reminder types', () => {
    expect(reminderServiceContent).toContain('upcoming')
    expect(reminderServiceContent).toContain('due_today')
    expect(reminderServiceContent).toContain('overdue')
  })
})

describe('Reporting Service', () => {
  const reportingServicePath = path.join(servicesDir, 'reportingService.ts')
  let reportingServiceContent: string

  beforeEach(() => {
    reportingServiceContent = fs.readFileSync(reportingServicePath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(reportingServicePath)).toBe(true)
  })

  it('should export getFinancialSummary function', () => {
    expect(reportingServiceContent).toContain('export async function getFinancialSummary')
  })

  it('should export getRevenueByCategory function', () => {
    expect(reportingServiceContent).toContain('export async function getRevenueByCategory')
  })

  it('should export getCashFlowProjection function', () => {
    expect(reportingServiceContent).toContain('export async function getCashFlowProjection')
  })

  it('should export getYearOverYearComparison function', () => {
    expect(reportingServiceContent).toContain('export async function getYearOverYearComparison')
  })

  it('should export exportToCSV function', () => {
    expect(reportingServiceContent).toContain('export function exportToCSV')
  })

  it('should export generateIncomeStatement function', () => {
    expect(reportingServiceContent).toContain('export async function generateIncomeStatement')
  })

  it('should export getTopCustomersReport function', () => {
    expect(reportingServiceContent).toContain('export async function getTopCustomersReport')
  })

  it('should export generateComprehensiveReport function', () => {
    expect(reportingServiceContent).toContain('export async function generateComprehensiveReport')
  })

  it('should have FinancialSummary interface', () => {
    expect(reportingServiceContent).toContain('export interface FinancialSummary')
  })

  it('should have CashFlowProjection interface', () => {
    expect(reportingServiceContent).toContain('export interface CashFlowProjection')
  })

  it('should have RevenueByCategory interface', () => {
    expect(reportingServiceContent).toContain('export interface RevenueByCategory')
  })

  it('should handle period comparisons', () => {
    expect(reportingServiceContent).toContain('previousPeriodRevenue')
    expect(reportingServiceContent).toContain('revenueChange')
    expect(reportingServiceContent).toContain('revenueChangePercent')
  })
})

describe('Finance Automation Router', () => {
  const routerPath = path.join(__dirname, '../../server/trpc/routers/financeAutomation.ts')
  let routerContent: string

  beforeEach(() => {
    routerContent = fs.readFileSync(routerPath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(routerPath)).toBe(true)
  })

  it('should import all services', () => {
    expect(routerContent).toContain("import * as taxService from '../../services/taxService'")
    expect(routerContent).toContain("import * as invoiceService from '../../services/invoiceService'")
    expect(routerContent).toContain("import * as reminderService from '../../services/reminderService'")
    expect(routerContent).toContain("import * as reportingService from '../../services/reportingService'")
  })

  it('should export financeAutomationRouter', () => {
    expect(routerContent).toContain('export const financeAutomationRouter')
  })

  // Tax endpoints
  it('should have getTaxSettings endpoint', () => {
    expect(routerContent).toContain('getTaxSettings: adminProcedure')
  })

  it('should have updateTaxSettings endpoint', () => {
    expect(routerContent).toContain('updateTaxSettings: adminProcedure')
  })

  it('should have applyTaxToOrder endpoint', () => {
    expect(routerContent).toContain('applyTaxToOrder: adminProcedure')
  })

  it('should have generateCRATaxReport endpoint', () => {
    expect(routerContent).toContain('generateCRATaxReport: adminProcedure')
  })

  // Invoice endpoints
  it('should have getInvoiceSettings endpoint', () => {
    expect(routerContent).toContain('getInvoiceSettings: adminProcedure')
  })

  it('should have createInvoice endpoint', () => {
    expect(routerContent).toContain('createInvoice: adminProcedure')
  })

  it('should have getOverdueInvoices endpoint', () => {
    expect(routerContent).toContain('getOverdueInvoices: adminProcedure')
  })

  it('should have markInvoiceAsPaid endpoint', () => {
    expect(routerContent).toContain('markInvoiceAsPaid: adminProcedure')
  })

  // Reminder endpoints
  it('should have getReminderSettings endpoint', () => {
    expect(routerContent).toContain('getReminderSettings: adminProcedure')
  })

  it('should have getPendingReminders endpoint', () => {
    expect(routerContent).toContain('getPendingReminders: adminProcedure')
  })

  it('should have processAllReminders endpoint', () => {
    expect(routerContent).toContain('processAllReminders: adminProcedure')
  })

  // Reporting endpoints
  it('should have getFinancialSummary endpoint', () => {
    expect(routerContent).toContain('getFinancialSummary: adminProcedure')
  })

  it('should have getCashFlowProjection endpoint', () => {
    expect(routerContent).toContain('getCashFlowProjection: adminProcedure')
  })

  it('should have exportToCSV endpoint', () => {
    expect(routerContent).toContain('exportToCSV: adminProcedure')
  })
})

describe('Finance Automation Dashboard Component', () => {
  const componentPath = path.join(__dirname, '../../components/admin/FinanceAutomationDashboard.vue')
  let componentContent: string

  beforeEach(() => {
    componentContent = fs.readFileSync(componentPath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(componentPath)).toBe(true)
  })

  it('should have all tabs', () => {
    expect(componentContent).toContain("'overview'")
    expect(componentContent).toContain("'invoices'")
    expect(componentContent).toContain("'reminders'")
    expect(componentContent).toContain("'reports'")
    expect(componentContent).toContain("'settings'")
  })

  it('should fetch finance automation data', () => {
    expect(componentContent).toContain('$client.financeAutomation')
  })

  it('should have processReminders function', () => {
    expect(componentContent).toContain('async function processReminders')
  })

  it('should have sendReminder function', () => {
    expect(componentContent).toContain('async function sendReminder')
  })

  it('should have markAsPaid function', () => {
    expect(componentContent).toContain('async function markAsPaid')
  })

  it('should display tax deadlines', () => {
    expect(componentContent).toContain('Tax Deadlines')
  })

  it('should display cash flow projection', () => {
    expect(componentContent).toContain('Cash Flow Projection')
  })

  it('should display invoice aging', () => {
    expect(componentContent).toContain('Invoice Aging')
  })

  it('should have settings for tax, invoice, and reminders', () => {
    expect(componentContent).toContain('Tax Settings')
    expect(componentContent).toContain('Invoice Settings')
    expect(componentContent).toContain('Reminder Settings')
  })
})

describe('Settings Migration', () => {
  const migrationPath = path.join(__dirname, '../../database/migrations/011_add_settings_table.sql')
  let migrationContent: string

  beforeEach(() => {
    migrationContent = fs.readFileSync(migrationPath, 'utf-8')
  })

  it('should exist', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
  })

  it('should create settings table', () => {
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS settings')
  })

  it('should have key column', () => {
    expect(migrationContent).toContain('key VARCHAR(100)')
  })

  it('should have value column as JSONB', () => {
    expect(migrationContent).toContain('value JSONB')
  })

  it('should have unique constraint on key', () => {
    expect(migrationContent).toContain('UNIQUE')
  })

  it('should insert default tax settings', () => {
    expect(migrationContent).toContain('tax_settings')
  })

  it('should insert default invoice settings', () => {
    expect(migrationContent).toContain('invoice_settings')
  })

  it('should insert default reminder settings', () => {
    expect(migrationContent).toContain('reminder_settings')
  })

  it('should have rollback migration', () => {
    const rollbackPath = path.join(__dirname, '../../database/migrations/011_add_settings_table.rollback.sql')
    expect(fs.existsSync(rollbackPath)).toBe(true)
  })
})

describe('Router Index Integration', () => {
  const indexPath = path.join(__dirname, '../../server/trpc/routers/index.ts')
  let indexContent: string

  beforeEach(() => {
    indexContent = fs.readFileSync(indexPath, 'utf-8')
  })

  it('should import financeAutomationRouter', () => {
    expect(indexContent).toContain("import { financeAutomationRouter } from './financeAutomation'")
  })

  it('should include financeAutomation in appRouter', () => {
    expect(indexContent).toContain('financeAutomation: financeAutomationRouter')
  })
})
