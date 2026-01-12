# Elite Sports DJ Application: Recommendation and Implementation Plan

**Date:** January 12, 2026  
**Author:** Manus AI  
**Version:** 1.0

---

## Executive Summary

This document presents a comprehensive analysis of the Elite Sports DJ web application (Hockey_app) and provides a detailed implementation plan for addressing critical issues in the quote/order process and finance dashboard. The review encompassed the application's architecture, recent development patterns, database schema, component structure, and existing documentation.

The primary objectives of this plan are:

1. **Fix the Quote/Order Process** — Remove the unnecessary "quote validity" field causing database errors and implement a proper event date/time booking system
2. **Enhance the Finance Dashboard** — Transform the generic dashboard into a business-relevant tool with tax calculation support and meaningful visualizations
3. **Promote Component-Driven Architecture** — Identify opportunities for component reuse and refactoring to improve maintainability

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Quote/Order Process Issues and Recommendations](#2-quoteorder-process-issues-and-recommendations)
3. [Finance Dashboard Improvements](#3-finance-dashboard-improvements)
4. [Component Architecture Analysis](#4-component-architecture-analysis)
5. [Implementation Plan](#5-implementation-plan)
6. [Technical Specifications](#6-technical-specifications)
7. [Risk Assessment](#7-risk-assessment)

---

## 1. Current State Analysis

### 1.1 Application Overview

The Elite Sports DJ application is a Nuxt.js-based web application designed to manage DJ service bookings for sports events. The technology stack includes:

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt.js 3, Vue.js 3, TailwindCSS |
| Backend | Nitro (Nuxt server), tRPC |
| Database | PostgreSQL |
| Authentication | JWT with bcrypt |
| Payments | Stripe |
| File Storage | Amazon S3 |
| Email | Mailgun API |

### 1.2 Recent Development Activity

Analysis of the last 50 commits reveals active development focused on:

- **Admin UI/UX Overhaul** — Multiple commits improving the admin dashboard experience
- **Email Integration** — Migration from SMTP to Mailgun API
- **Calendar Management** — Implementation of availability blocking and booking prevention
- **Quote Process Enhancement** — Addition of quote tracking, versioning, and expiration features
- **Component Cleanup** — Removal of unused components and consolidation of UI patterns

### 1.3 Database Schema Overview

The application uses a well-structured PostgreSQL schema with the following key tables:

| Table | Purpose |
|-------|---------|
| `users` | Customer and admin accounts |
| `packages` | Service offerings with pricing |
| `quote_requests` | Main orders/quotes table |
| `form_submissions` | Detailed form data for each quote |
| `invoices` | Stripe invoice tracking |
| `payments` | Payment transaction records |
| `availability_overrides` | Admin-blocked calendar dates |
| `quote_revisions` | Quote version history |
| `quote_events` | Customer interaction tracking |

### 1.4 Existing Component Library

The application has a well-developed UI component library in `components/ui/`:

| Component | Purpose | Reusability |
|-----------|---------|-------------|
| `Button.vue` | Standardized buttons with variants | High |
| `Card.vue` | Container with glass/bordered variants | High |
| `DatePicker.vue` | Calendar integration with availability | High |
| `EmptyState.vue` | Empty data placeholders | High |
| `StatusIndicator.vue` | Order status display | High |
| `ConfirmDialog.vue` | Confirmation modals | High |
| `DataTable.vue` | Basic table wrapper | Medium |
| `Pagination.vue` | Page navigation | Medium |

---

## 2. Quote/Order Process Issues and Recommendations

### 2.1 Current Issue: Quote Validity Field

Based on the user's report, there is an error indicating the database does not have columns for "how long the quote is good for." Upon investigation:

**Finding:** The `quote_expires_at` column exists in the `quote_requests` table (added in migration `007_quote_tracking.sql`). The `EnhancedQuoteModal.vue` component includes an `expirationDays` field that calculates an expiration date.

**Analysis:** The quote validity/expiration feature is actually implemented and functional in the codebase. However, the user indicates this field "doesn't make sense in this context." The current implementation:

1. Allows admin to set expiration days (7, 14, 30, 60, 90)
2. Calculates `quote_expires_at` timestamp
3. Displays expiration in customer-facing quote emails
4. Blocks quote acceptance after expiration

**Recommendation:** If the business model does not require quote expiration, this feature can be simplified or removed. However, the more critical enhancement requested is the **event date/time booking system**.

### 2.2 New Feature: Event Date/Time Selection and Calendar Booking

The user requests that when an admin submits a quote, they should select a date/time. After the quote is accepted and payment is made, that date/time should be automatically blocked on the calendar.

**Current State:**
- Customers select an `event_date` during the quote request process
- The calendar checks `availability_overrides` and confirmed orders for blocking
- The calendar query checks for `status IN ('confirmed', 'in_progress')` but these statuses are not in the current workflow

**Gap Analysis:**

| Current Behavior | Required Behavior |
|------------------|-------------------|
| Customer selects event date | Admin confirms/adjusts event date+time when quoting |
| No automatic calendar blocking | Auto-block calendar after payment |
| Event date stored as DATE only | Event date+time should be stored |
| No time component | Admin should select specific time slot |

### 2.3 Recommended Changes for Quote/Order Process

#### 2.3.1 Database Changes

```sql
-- Add event_time column to quote_requests
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS event_time TIME,
ADD COLUMN IF NOT EXISTS event_datetime TIMESTAMPTZ;

-- Add trigger to auto-block calendar on payment
-- This will be handled in application logic instead
```

#### 2.3.2 UI Changes to EnhancedQuoteModal

The `EnhancedQuoteModal.vue` component should be modified to:

1. **Remove or hide** the `expirationDays` field (if not needed)
2. **Add** an event date/time picker for the admin to confirm or adjust the event date
3. **Display** the customer's requested date for reference
4. **Validate** that the selected date/time is available

#### 2.3.3 Backend Changes

The quote submission flow should be updated:

1. **Store event_datetime** when admin submits quote
2. **On payment success** (Stripe webhook), automatically:
   - Update order status to 'paid'
   - Create an `availability_override` entry OR update order status to a blocking status
   - Refresh calendar cache

#### 2.3.4 Proposed Workflow

```
Customer Request → Admin Reviews → Admin Submits Quote (with confirmed date/time)
                                           ↓
                        Customer Accepts → Payment Processed
                                           ↓
                              Calendar Auto-Blocks Date/Time
```

---

## 3. Finance Dashboard Improvements

### 3.1 Current State Assessment

The current finance dashboard (`pages/admin/finance.vue`) displays:

| Metric | Source | Usefulness |
|--------|--------|------------|
| Total Revenue | Sum of `total_amount` where status is paid/completed | Basic |
| Monthly Revenue | Same, filtered by current month | Basic |
| Average Order Value | Total revenue / paid order count | Basic |
| Pending Payments | Sum of `total_amount` where status is quoted/invoiced | Basic |
| Revenue by Package | Grouped by service type | Moderate |
| Recent Transactions | Last 10 payments | Moderate |

**Limitations:**
- No year-over-year or month-over-month comparisons
- No tax calculation or reporting
- No profit margin analysis
- No seasonal trend visualization
- No accounts receivable aging
- No customer lifetime value metrics
- No booking pipeline visualization

### 3.2 Recommended Finance Dashboard Enhancements

#### 3.2.1 Tax Calculation Support

For Canadian tax reporting (assuming the business operates in Canada based on the `.ca` domain):

| Tax Type | Rate | Applicability |
|----------|------|---------------|
| GST | 5% | Federal (all provinces) |
| PST | Varies | Provincial (BC, SK, MB) |
| HST | 13-15% | Combined (ON, NS, NB, NL, PEI) |
| QST | 9.975% | Quebec |

**Recommended Tax Features:**

1. **Tax Summary by Period** — Show collected taxes by month/quarter/year
2. **Tax Breakdown** — Separate GST/PST/HST amounts
3. **Exportable Tax Report** — CSV/PDF export for accountant

#### 3.2.2 New Metrics to Add

| Metric | Calculation | Business Value |
|--------|-------------|----------------|
| **Revenue Trend** | Monthly revenue over last 12 months | Identify growth patterns |
| **Booking Pipeline** | Count of orders by status | Forecast upcoming work |
| **Average Days to Payment** | Time from quote to payment | Cash flow planning |
| **Conversion Rate** | Paid orders / Total quotes | Sales effectiveness |
| **Revenue by Month (YoY)** | Compare to same month last year | Seasonal analysis |
| **Outstanding Invoices** | Quoted but unpaid, with aging | Collections focus |
| **Top Customers** | Customers by total spend | Relationship management |
| **Busiest Days/Months** | Event date distribution | Capacity planning |

#### 3.2.3 Proposed Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  FINANCE DASHBOARD                                    [Refresh] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ YTD Rev  │ │ MTD Rev  │ │ Pending  │ │ Tax Coll │           │
│  │ $45,000  │ │ $5,200   │ │ $3,400   │ │ $5,850   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌─────────────────────────────────┐ ┌─────────────────────────┐│
│  │ Revenue Trend (12 months)       │ │ Booking Pipeline        ││
│  │ [Line Chart]                    │ │ [Funnel/Bar Chart]      ││
│  │                                 │ │ Submitted: 5            ││
│  │                                 │ │ Quoted: 8               ││
│  │                                 │ │ Paid: 3                 ││
│  └─────────────────────────────────┘ └─────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────┐ ┌─────────────────────────┐│
│  │ Tax Summary                     │ │ Outstanding Invoices    ││
│  │ GST Collected: $2,250           │ │ 0-30 days: $1,200       ││
│  │ PST Collected: $3,600           │ │ 31-60 days: $800        ││
│  │ Total: $5,850                   │ │ 60+ days: $400          ││
│  │ [Export for Tax Filing]         │ │                         ││
│  └─────────────────────────────────┘ └─────────────────────────┘│
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ Recent Transactions                              [View All] ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ Date       Customer      Package        Amount    Status    ││
│  │ Jan 10     John Smith    Game Day DJ    $300      Paid      ││
│  │ Jan 8      Jane Doe      Ultimate       $190      Paid      ││
│  └──────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.4 Backend API Enhancements

The `admin.finance.stats` endpoint should be expanded to return:

```typescript
interface EnhancedFinanceData {
  // Existing
  totalRevenue: number
  monthlyRevenue: number
  pendingPayments: number
  paidOrderCount: number
  revenueByService: Array<{ service: string; revenue: number }>
  recentTransactions: Array<Transaction>
  
  // New
  yearToDateRevenue: number
  lastYearRevenue: number
  revenueByMonth: Array<{ month: string; revenue: number; lastYear: number }>
  
  // Tax
  taxCollected: {
    gst: number
    pst: number
    hst: number
    total: number
  }
  
  // Pipeline
  ordersByStatus: Array<{ status: string; count: number; value: number }>
  
  // Aging
  outstandingByAge: {
    current: number      // 0-30 days
    thirtyDays: number   // 31-60 days
    sixtyPlus: number    // 60+ days
  }
  
  // Performance
  averageDaysToPayment: number
  conversionRate: number
  
  // Top customers
  topCustomers: Array<{ name: string; email: string; totalSpent: number; orderCount: number }>
}
```

---

## 4. Component Architecture Analysis

### 4.1 Current Component Patterns

The application demonstrates good component-driven practices in several areas:

**Well-Implemented Patterns:**
- UI components in `components/ui/` with consistent props interfaces
- Composables for shared logic (`useUtils`, `useNotification`, `useFileUpload`)
- Pinia stores for state management (`calendar`, `auth`, `orders`)
- TypeScript interfaces for type safety

**Areas for Improvement:**
- Some pages have inline styling that could use shared components
- Metric cards are duplicated across dashboard and finance pages
- Status display logic is duplicated in multiple places

### 4.2 Component Reuse Opportunities

#### 4.2.1 MetricCard Component (New)

Currently, metric cards are implemented inline in both `dashboard.vue` and `finance.vue`. A reusable component would reduce duplication:

```vue
<!-- components/ui/MetricCard.vue -->
<template>
  <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
    <div class="flex items-center justify-between mb-4">
      <div :class="iconContainerClass">
        <Icon :name="icon" :class="iconClass" />
      </div>
      <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ label }}</span>
    </div>
    <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ formattedValue }}</p>
    <p class="text-sm text-slate-400">{{ title }}</p>
  </div>
</template>
```

#### 4.2.2 DataCard Component (New)

For sections with headers and content (like "Recent Orders", "Revenue by Package"):

```vue
<!-- components/ui/DataCard.vue -->
<template>
  <div class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
    <div class="flex items-center justify-between p-5 lg:p-6 border-b border-slate-800">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <Icon v-if="icon" :name="icon" class="w-6 h-6" :class="iconClass" />
        {{ title }}
      </h2>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>
```

#### 4.2.3 StatusBadge vs StatusIndicator

The application has `StatusIndicator.vue` but also uses inline status badge styling in multiple places. Consolidate to use `StatusIndicator` consistently, or create a `StatusBadge` variant for pill-style badges.

### 4.3 Recommended Component Refactoring

| Current State | Recommendation | Priority |
|---------------|----------------|----------|
| Inline metric cards in dashboard/finance | Create `MetricCard.vue` | High |
| Inline section cards | Create `DataCard.vue` | Medium |
| Duplicate status styling | Use `StatusIndicator` consistently | Medium |
| Inline chart rendering | Create `ChartCard.vue` wrapper | Low |
| Duplicate empty states | Use `EmptyState` with `variant="dark"` | Low |

---

## 5. Implementation Plan

### 5.1 Phase 1: Quote/Order Process Fix (Priority: Critical)

**Duration:** 3-5 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 1.1 | Add `event_time` and `event_datetime` columns | New migration file |
| 1.2 | Update `EnhancedQuoteModal` to include date/time picker | `components/admin/EnhancedQuoteModal.vue` |
| 1.3 | Update `submitQuoteEnhanced` to store event datetime | `server/trpc/routers/admin-enhancements.ts` |
| 1.4 | Add auto-blocking logic to Stripe webhook | `server/api/webhooks/stripe.post.ts` |
| 1.5 | Update calendar queries to include paid orders | `server/trpc/routers/calendar.ts` |
| 1.6 | Remove/hide quote expiration if not needed | `components/admin/EnhancedQuoteModal.vue` |

**Detailed Steps:**

**Task 1.1: Database Migration**
```sql
-- migrations/009_add_event_datetime.sql
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS event_time TIME,
ADD COLUMN IF NOT EXISTS event_datetime TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_confirmed_datetime BOOLEAN DEFAULT FALSE;

-- Update event_datetime from existing event_date
UPDATE quote_requests 
SET event_datetime = event_date::timestamp 
WHERE event_date IS NOT NULL AND event_datetime IS NULL;
```

**Task 1.2: Update EnhancedQuoteModal**
- Add a datetime picker component (can reuse/extend `DatePicker.vue`)
- Display customer's requested date as reference
- Allow admin to confirm or adjust the date/time
- Validate availability before submission

**Task 1.4: Stripe Webhook Auto-Blocking**
```typescript
// In stripe.post.ts, after successful payment:
if (event.type === 'invoice.paid') {
  // Update order status
  await updateOrderStatus(orderId, 'paid')
  
  // Auto-block the calendar date
  const order = await getOrder(orderId)
  if (order.event_datetime) {
    await createAvailabilityOverride({
      start_date: order.event_datetime,
      end_date: order.event_datetime,
      reason: `Booked: Order #${orderId}`,
      override_type: 'booking'
    })
  }
}
```

### 5.2 Phase 2: Finance Dashboard Enhancement (Priority: High)

**Duration:** 5-7 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 2.1 | Extend finance stats API with new metrics | `server/trpc/routers/admin.ts` |
| 2.2 | Add tax calculation logic | New utility file |
| 2.3 | Create revenue trend chart component | New component |
| 2.4 | Create booking pipeline visualization | New component |
| 2.5 | Add outstanding invoices aging section | `pages/admin/finance.vue` |
| 2.6 | Add tax summary section with export | `pages/admin/finance.vue` |
| 2.7 | Update TypeScript types | `types/trpc.ts` |

**Detailed Steps:**

**Task 2.1: Extended Finance API**
```typescript
// Add to admin.ts finance router
stats: adminProcedure.query(async () => {
  // Existing queries...
  
  // Year-to-date revenue
  const ytdResult = await query(`
    SELECT COALESCE(SUM(total_amount), 0) as revenue 
    FROM quote_requests 
    WHERE status IN ('paid', 'completed', 'delivered')
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  `)
  
  // Revenue by month (last 12 months)
  const monthlyTrendResult = await query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM quote_requests 
    WHERE status IN ('paid', 'completed', 'delivered')
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `)
  
  // Orders by status (pipeline)
  const pipelineResult = await query(`
    SELECT 
      status,
      COUNT(*) as count,
      COALESCE(SUM(COALESCE(quoted_amount, total_amount, 0)), 0) as value
    FROM quote_requests
    GROUP BY status
  `)
  
  // Outstanding invoices aging
  const agingResult = await query(`
    SELECT 
      CASE 
        WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'current'
        WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' THEN 'thirty'
        ELSE 'sixty_plus'
      END as age_bucket,
      COALESCE(SUM(quoted_amount), 0) as amount
    FROM quote_requests
    WHERE status IN ('quoted', 'invoiced')
    GROUP BY age_bucket
  `)
  
  return {
    // ... existing fields
    yearToDateRevenue: parseInt(ytdResult.rows[0].revenue),
    revenueByMonth: monthlyTrendResult.rows,
    ordersByStatus: pipelineResult.rows,
    outstandingByAge: {
      current: agingResult.rows.find(r => r.age_bucket === 'current')?.amount || 0,
      thirtyDays: agingResult.rows.find(r => r.age_bucket === 'thirty')?.amount || 0,
      sixtyPlus: agingResult.rows.find(r => r.age_bucket === 'sixty_plus')?.amount || 0
    }
  }
})
```

**Task 2.2: Tax Calculation Utility**
```typescript
// server/utils/tax.ts
export interface TaxBreakdown {
  subtotal: number
  gst: number
  pst: number
  hst: number
  total: number
}

export function calculateTax(amountCents: number, province: string = 'AB'): TaxBreakdown {
  const subtotal = amountCents
  
  // Alberta has no PST, only GST
  const taxRates: Record<string, { gst: number; pst: number; hst: number }> = {
    'AB': { gst: 0.05, pst: 0, hst: 0 },
    'BC': { gst: 0.05, pst: 0.07, hst: 0 },
    'ON': { gst: 0, pst: 0, hst: 0.13 },
    // ... other provinces
  }
  
  const rates = taxRates[province] || taxRates['AB']
  
  return {
    subtotal,
    gst: Math.round(subtotal * rates.gst),
    pst: Math.round(subtotal * rates.pst),
    hst: Math.round(subtotal * rates.hst),
    total: Math.round(subtotal * (1 + rates.gst + rates.pst + rates.hst))
  }
}
```

### 5.3 Phase 3: Component Refactoring (Priority: Medium)

**Duration:** 2-3 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 3.1 | Create `MetricCard.vue` component | New component |
| 3.2 | Create `DataCard.vue` component | New component |
| 3.3 | Refactor dashboard to use new components | `pages/admin/dashboard.vue` |
| 3.4 | Refactor finance page to use new components | `pages/admin/finance.vue` |
| 3.5 | Ensure consistent `EmptyState` usage | Multiple pages |

### 5.4 Implementation Timeline

```
Week 1:
├── Day 1-2: Phase 1 (Tasks 1.1-1.3) - Database and UI changes
├── Day 3-4: Phase 1 (Tasks 1.4-1.6) - Backend logic and testing
└── Day 5: Phase 1 testing and bug fixes

Week 2:
├── Day 1-2: Phase 2 (Tasks 2.1-2.2) - API and tax logic
├── Day 3-4: Phase 2 (Tasks 2.3-2.6) - UI components
└── Day 5: Phase 2 testing and refinement

Week 3:
├── Day 1-2: Phase 3 - Component refactoring
└── Day 3: Final testing and deployment
```

---

## 6. Technical Specifications

### 6.1 New Database Columns

| Table | Column | Type | Description |
|-------|--------|------|-------------|
| `quote_requests` | `event_time` | TIME | Time of the event |
| `quote_requests` | `event_datetime` | TIMESTAMPTZ | Combined date/time |
| `quote_requests` | `admin_confirmed_datetime` | BOOLEAN | Whether admin confirmed the datetime |
| `quote_requests` | `tax_amount` | INTEGER | Tax collected (cents) |
| `quote_requests` | `tax_province` | VARCHAR(2) | Province for tax calculation |

### 6.2 New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `admin.finance.taxSummary` | Query | Get tax collected by period |
| `admin.finance.exportTaxReport` | Query | Generate CSV tax report |
| `admin.orders.confirmDateTime` | Mutation | Confirm event date/time |

### 6.3 New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MetricCard.vue` | `components/ui/` | Reusable metric display |
| `DataCard.vue` | `components/ui/` | Section container with header |
| `DateTimePicker.vue` | `components/ui/` | Combined date and time picker |
| `RevenueChart.vue` | `components/admin/` | Revenue trend visualization |
| `PipelineChart.vue` | `components/admin/` | Order status funnel |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database migration issues | Low | High | Test migrations on staging first |
| Stripe webhook timing | Medium | Medium | Add idempotency checks |
| Calendar double-booking | Low | High | Server-side validation before payment |
| Tax calculation errors | Medium | Medium | Consult with accountant for rates |
| Component breaking changes | Low | Low | Incremental refactoring with tests |

---

## Appendix A: Files to Modify

### Phase 1 Files
- `database/migrations/009_add_event_datetime.sql` (new)
- `components/admin/EnhancedQuoteModal.vue`
- `server/trpc/routers/admin-enhancements.ts`
- `server/api/webhooks/stripe.post.ts`
- `server/trpc/routers/calendar.ts`

### Phase 2 Files
- `server/trpc/routers/admin.ts`
- `server/utils/tax.ts` (new)
- `pages/admin/finance.vue`
- `types/trpc.ts`
- `components/admin/RevenueChart.vue` (new)
- `components/admin/PipelineChart.vue` (new)

### Phase 3 Files
- `components/ui/MetricCard.vue` (new)
- `components/ui/DataCard.vue` (new)
- `pages/admin/dashboard.vue`
- `pages/admin/finance.vue`

---

## Appendix B: Removed/Deprecated Features

If quote expiration is not needed, the following can be simplified:

| Feature | Current Location | Action |
|---------|------------------|--------|
| `expirationDays` input | `EnhancedQuoteModal.vue` | Remove or hide |
| `quote_expires_at` column | `quote_requests` table | Keep but don't populate |
| Expiration check in quote view | `quote-public.ts` | Remove blocking logic |
| Expiration display in email | `email-enhanced.ts` | Remove from template |

---

**Document End**

*This plan should be reviewed with stakeholders before implementation begins. All database changes should be tested on a staging environment first.*
