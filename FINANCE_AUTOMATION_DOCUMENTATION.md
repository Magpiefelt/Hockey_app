# Finance Automation Documentation

## Overview

This document describes the comprehensive finance automation system implemented for the Elite Sports DJ application. The system automates key financial management tasks that admin users would normally handle manually, reducing workload and improving accuracy.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tax Service](#tax-service)
3. [Invoice Service](#invoice-service)
4. [Reminder Service](#reminder-service)
5. [Reporting Service](#reporting-service)
6. [API Reference](#api-reference)
7. [Dashboard Component](#dashboard-component)
8. [Database Migrations](#database-migrations)
9. [Configuration](#configuration)
10. [Best Practices](#best-practices)

---

## Architecture Overview

The finance automation system is built with a service-oriented architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Finance Automation                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Tax Service │  │   Invoice   │  │  Reminder Service   │  │
│  │             │  │   Service   │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Reporting Service                          ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│              Finance Automation Router (tRPC)               │
├─────────────────────────────────────────────────────────────┤
│           Finance Automation Dashboard (Vue.js)             │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `server/services/taxService.ts` | Tax calculation and CRA reporting |
| `server/services/invoiceService.ts` | Invoice generation and tracking |
| `server/services/reminderService.ts` | Payment reminder automation |
| `server/services/reportingService.ts` | Financial reporting and analytics |
| `server/trpc/routers/financeAutomation.ts` | API endpoints |
| `components/admin/FinanceAutomationDashboard.vue` | Admin UI |
| `database/migrations/011_add_settings_table.sql` | Settings storage |

---

## Tax Service

### Purpose
Automates Canadian tax calculations for all provinces and territories, including GST, PST, and HST.

### Features

1. **Automatic Tax Application**
   - Apply correct tax rates based on customer province
   - Support for all Canadian provinces and territories
   - Configurable default province

2. **CRA Tax Reports**
   - Generate quarterly and annual tax reports
   - GST/HST breakdown by province
   - PST tracking for applicable provinces
   - Export-ready for tax filing

3. **Tax Filing Deadlines**
   - Track upcoming GST/HST filing deadlines
   - Quarterly and annual deadline reminders
   - Days remaining countdown

4. **Estimated Tax Owing**
   - Calculate estimated tax liability
   - Quarterly and annual projections
   - Province-by-province breakdown

### Tax Rates (Current)

| Province | GST | PST | HST | Total |
|----------|-----|-----|-----|-------|
| Alberta | 5% | 0% | 0% | 5% |
| British Columbia | 5% | 7% | 0% | 12% |
| Ontario | 0% | 0% | 13% | 13% |
| Quebec | 5% | 9.975% | 0% | 14.975% |
| Nova Scotia | 0% | 0% | 15% | 15% |

### Usage Example

```typescript
// Apply tax to an order
const result = await taxService.applyTaxToOrder(orderId, 'ON')
// Returns: { subtotal, gst, pst, hst, totalTax, total, province }

// Generate CRA report
const report = await taxService.generateCRATaxReport(
  new Date('2025-01-01'),
  new Date('2025-03-31'),
  'quarterly'
)
```

---

## Invoice Service

### Purpose
Automates invoice generation, tracking, and management.

### Features

1. **Automatic Invoice Generation**
   - Create invoices from accepted quotes
   - Auto-generate invoice numbers
   - Include tax breakdown
   - Support for line items and add-ons

2. **Invoice Tracking**
   - Track invoice status (draft, sent, paid, overdue)
   - Invoice aging summary (current, 30, 60, 90+ days)
   - Overdue invoice alerts

3. **Email Integration**
   - Send invoices via email
   - Customizable invoice templates
   - Automatic status updates

4. **Payment Recording**
   - Mark invoices as paid
   - Record payment details
   - Update order status automatically

### Invoice Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `companyName` | "Elite Sports DJ" | Company name on invoices |
| `paymentTermsDays` | 14 | Days until payment due |
| `invoicePrefix` | "INV-" | Invoice number prefix |
| `autoSendOnQuoteAccept` | true | Auto-send when quote accepted |

### Usage Example

```typescript
// Create invoice from order
const invoice = await invoiceService.createInvoiceFromOrder(orderId, {
  sendEmail: true,
  customNotes: 'Thank you for booking!'
})

// Get overdue invoices
const overdue = await invoiceService.getOverdueInvoices()

// Mark as paid
await invoiceService.markInvoiceAsPaid(orderId, {
  transactionId: 'stripe_payment_123'
})
```

---

## Reminder Service

### Purpose
Automates payment reminder emails based on configurable schedules.

### Features

1. **Scheduled Reminders**
   - Configurable days before due date
   - Configurable days after due date (overdue)
   - Maximum reminder limit

2. **Reminder Types**
   - `upcoming`: Before due date
   - `due_today`: On due date
   - `overdue`: After due date

3. **Reminder Management**
   - Pause reminders for specific orders
   - Resume reminders
   - View reminder history

4. **Statistics**
   - Total reminders sent
   - Monthly reminder count
   - Average days to payment

### Default Schedule

| Type | Days |
|------|------|
| Before Due | 7, 3, 1 days |
| After Due | 1, 3, 7, 14 days |
| Max Reminders | 6 |

### Usage Example

```typescript
// Get pending reminders for today
const pending = await reminderService.getPendingReminders()

// Process all reminders
const result = await reminderService.processAllReminders()
// Returns: { sent: 5, failed: 0, skipped: 2 }

// Pause reminders for an order
await reminderService.pauseReminders(orderId, 'Customer requested delay')
```

---

## Reporting Service

### Purpose
Provides comprehensive financial reporting and analytics.

### Features

1. **Financial Summary**
   - Gross and net revenue
   - Tax collected
   - Order counts by status
   - Period-over-period comparison

2. **Revenue Analysis**
   - Revenue by category/package
   - Top customers report
   - Year-over-year comparison

3. **Cash Flow Projection**
   - 6-month forward projection
   - Confirmed vs pending revenue
   - Net cash flow estimates

4. **Export Capabilities**
   - CSV export for all reports
   - JSON export for API integration
   - Income statement generation

### Report Types

| Report | Description |
|--------|-------------|
| Financial Summary | Overall financial health |
| Revenue by Category | Package/service breakdown |
| Cash Flow Projection | Future revenue estimates |
| Year-over-Year | Annual comparison |
| Income Statement | Profit and loss |
| Top Customers | Customer spending analysis |

### Usage Example

```typescript
// Get financial summary
const summary = await reportingService.getFinancialSummary(
  new Date('2025-01-01'),
  new Date('2025-12-31')
)

// Get cash flow projection
const projection = await reportingService.getCashFlowProjection(6)

// Export to CSV
const csv = reportingService.exportToCSV(data, [
  { key: 'category', header: 'Category' },
  { key: 'revenue', header: 'Revenue' }
])
```

---

## API Reference

### Tax Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `financeAutomation.getTaxSettings` | Query | Get tax settings |
| `financeAutomation.updateTaxSettings` | Mutation | Update tax settings |
| `financeAutomation.applyTaxToOrder` | Mutation | Apply tax to order |
| `financeAutomation.generateCRATaxReport` | Query | Generate CRA report |
| `financeAutomation.getTaxFilingDeadlines` | Query | Get upcoming deadlines |
| `financeAutomation.getEstimatedTaxOwing` | Query | Get estimated tax liability |

### Invoice Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `financeAutomation.getInvoiceSettings` | Query | Get invoice settings |
| `financeAutomation.updateInvoiceSettings` | Mutation | Update invoice settings |
| `financeAutomation.createInvoice` | Mutation | Create invoice from order |
| `financeAutomation.getInvoice` | Query | Get invoice details |
| `financeAutomation.sendInvoiceEmail` | Mutation | Send invoice email |
| `financeAutomation.getOverdueInvoices` | Query | Get overdue invoices |
| `financeAutomation.getInvoiceAgingSummary` | Query | Get aging summary |
| `financeAutomation.markInvoiceAsPaid` | Mutation | Mark invoice as paid |

### Reminder Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `financeAutomation.getReminderSettings` | Query | Get reminder settings |
| `financeAutomation.updateReminderSettings` | Mutation | Update reminder settings |
| `financeAutomation.getPendingReminders` | Query | Get pending reminders |
| `financeAutomation.sendReminder` | Mutation | Send specific reminder |
| `financeAutomation.processAllReminders` | Mutation | Process all pending |
| `financeAutomation.getReminderHistory` | Query | Get reminder history |
| `financeAutomation.getReminderStats` | Query | Get reminder statistics |
| `financeAutomation.pauseReminders` | Mutation | Pause for order |
| `financeAutomation.resumeReminders` | Mutation | Resume for order |

### Reporting Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `financeAutomation.getFinancialSummary` | Query | Get financial summary |
| `financeAutomation.getRevenueByCategory` | Query | Get revenue breakdown |
| `financeAutomation.getCashFlowProjection` | Query | Get cash flow projection |
| `financeAutomation.getYearOverYearComparison` | Query | Get YoY comparison |
| `financeAutomation.getIncomeStatement` | Query | Get income statement |
| `financeAutomation.getTopCustomers` | Query | Get top customers |
| `financeAutomation.generateComprehensiveReport` | Query | Get full report |
| `financeAutomation.exportToCSV` | Query | Export data to CSV |

---

## Dashboard Component

### Location
`components/admin/FinanceAutomationDashboard.vue`

### Tabs

1. **Overview**
   - Quick stats (overdue, pending, reminders)
   - Tax filing deadlines
   - Cash flow projection
   - Invoice aging chart

2. **Invoices**
   - Overdue invoices list
   - Send reminders
   - Mark as paid

3. **Reminders**
   - Pending reminders
   - Send all button
   - Individual send

4. **Reports**
   - Report generation
   - Year/quarter selection
   - Export options

5. **Settings**
   - Tax settings
   - Invoice settings
   - Reminder settings

---

## Database Migrations

### Migration 011: Settings Table

Creates a key-value settings table for storing configuration:

```sql
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Default Settings

- `tax_settings`: Tax calculation configuration
- `invoice_settings`: Invoice generation settings
- `reminder_settings`: Reminder schedule configuration
- `business_info`: Company information

---

## Configuration

### Environment Variables

No additional environment variables required. All settings are stored in the database.

### Default Values

Settings are automatically initialized with sensible defaults on first access.

---

## Best Practices

### Tax Management

1. **Verify tax rates annually** - Tax rates may change
2. **Set correct default province** - Based on business location
3. **Generate quarterly reports** - For GST/HST filing
4. **Keep transaction records** - For audit purposes

### Invoice Management

1. **Set appropriate payment terms** - 14 days is standard
2. **Enable auto-send** - Reduces manual work
3. **Monitor aging summary** - Address overdue invoices promptly
4. **Use consistent invoice numbering** - For record keeping

### Reminder Management

1. **Start reminders early** - 7 days before due
2. **Escalate appropriately** - More frequent after overdue
3. **Pause when needed** - For customer relations
4. **Track effectiveness** - Monitor days to payment

### Reporting

1. **Review monthly** - Stay on top of finances
2. **Compare periods** - Identify trends
3. **Export for accountant** - CSV format works well
4. **Project cash flow** - Plan for slow periods

---

## Testing

All services have comprehensive unit tests:

```bash
# Run finance automation tests
npx vitest run tests/unit/financeAutomation.spec.ts
```

**Test Coverage:**
- 91 tests covering all services
- Tax service: 10 tests
- Invoice service: 15 tests
- Reminder service: 14 tests
- Reporting service: 12 tests
- Router integration: 18 tests
- Dashboard component: 12 tests
- Migration: 10 tests

---

## Future Enhancements

1. **PDF Invoice Generation** - Generate PDF invoices
2. **Expense Tracking** - Track business expenses
3. **Bank Reconciliation** - Match payments to invoices
4. **Multi-currency Support** - USD, EUR support
5. **Scheduled Report Emails** - Weekly/monthly summaries
6. **Integration with Accounting Software** - QuickBooks, Xero
