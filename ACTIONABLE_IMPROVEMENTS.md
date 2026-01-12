# Actionable Improvements for Elite Sports DJ Application

**Date:** January 12, 2026

**Author:** Manus AI

This document provides specific, actionable improvements that can be implemented to enhance the Elite Sports DJ application. Each improvement includes a description, the files that need to be modified, and implementation guidance.

---

## Section 1: Critical Bug Fixes

### 1.1. Fix `$NaN` Price Display on Request Page

**Problem:** The service request page displays `$NaN` for package prices because the `PackageSelectionModal.vue` component expects a `price_cents` field, but the `packages.json` file uses `price`.

**Files to Modify:**
- `content/packages.json`
- `components/PackageSelectionModal.vue`

**Implementation:**
1. Update `content/packages.json` to use `price_cents` instead of `price` for all packages.
2. Alternatively, update `PackageSelectionModal.vue` to handle both `price` and `price_cents` fields.

**Example Fix for `packages.json`:**
```json
{
  "id": "player-intros-basic",
  "name": "Package #1 - Basic Package",
  "price_cents": 8000,
  ...
}
```

### 1.2. Create Missing `contact_submissions` Table

**Problem:** The admin contact submissions page displays a database error because the `contact_submissions` table does not exist.

**Files to Modify:**
- Create a new migration file: `database/migrations/010_add_contact_submissions.sql`

**Implementation:**
```sql
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
```

### 1.3. Fix Email Modal Event Listener Error

**Problem:** The admin emails page throws a 500 error due to an event listener cleanup issue in `EmailDetailModal.vue`.

**Files to Modify:**
- `components/admin/EmailDetailModal.vue`

**Implementation:**
Ensure that the watcher on `props.modelValue` is properly stopped when the component is unmounted. Use a `watchEffect` with a cleanup function or store the watcher stop handle.

```typescript
// In script setup
const stopWatcher = watch(
  () => props.modelValue,
  (newVal) => {
    // ... existing logic
  }
)

onUnmounted(() => {
  stopWatcher()
})
```

---

## Section 2: User Experience Enhancements

### 2.1. Add Package Comparison Table

**Problem:** Customers have difficulty comparing packages because features are listed separately for each package.

**Files to Modify:**
- `pages/request.vue`
- Create new component: `components/PackageComparisonTable.vue`

**Implementation:**
Create a comparison table that shows all packages side-by-side with their features, making it easy for customers to see the differences at a glance.

### 2.2. Implement One-Click Quote Acceptance

**Problem:** The quote acceptance process requires multiple steps and email exchanges.

**Files to Modify:**
- `pages/orders/[id]/quote.vue`
- `server/trpc/routers/quote-public.ts`

**Implementation:**
Add a prominent "Accept Quote" button on the customer-facing quote page that triggers the `acceptQuote` mutation and immediately redirects to the payment page.

### 2.3. Add Progress Indicator to Multi-Step Forms

**Problem:** Customers may not know how many steps are remaining in the quote request process.

**Files to Modify:**
- `components/forms/ProgressBar.vue`
- All package form components

**Implementation:**
Ensure the progress bar is visible and accurately reflects the current step and total steps in all multi-step forms.

---

## Section 3: Admin Dashboard Enhancements

### 3.1. Add Revenue Trend Chart

**Problem:** The admin dashboard lacks visual representation of revenue trends.

**Files to Modify:**
- `pages/admin/dashboard.vue`
- `pages/admin/finance.vue`
- Create new component: `components/admin/RevenueTrendChart.vue`

**Implementation:**
Use Chart.js (already installed as `vue-chartjs`) to create a line chart showing monthly revenue for the past 12 months. The data is already available from the `finance.revenueTrend` API endpoint.

### 3.2. Implement Booking Pipeline Visualization

**Problem:** Admins cannot easily see the distribution of orders across different statuses.

**Files to Modify:**
- `pages/admin/dashboard.vue`
- Create new component: `components/admin/BookingPipelineChart.vue`

**Implementation:**
Create a funnel or bar chart showing the count and value of orders at each status stage (Submitted → Quoted → Invoiced → Paid → Completed).

### 3.3. Add Canadian Tax Calculation

**Problem:** The finance module does not calculate or report Canadian taxes (GST/PST/HST).

**Files to Modify:**
- `server/utils/tax.ts` (already exists)
- `server/trpc/routers/finance.ts`
- `pages/admin/finance.vue`

**Implementation:**
The `tax.ts` utility already has tax calculation functions. Integrate these into the finance dashboard to show:
- Total tax collected by period
- Tax breakdown by province
- Exportable tax report for accounting

---

## Section 4: New Features

### 4.1. Client Portal

**Description:** A dedicated area where customers can manage their relationship with Elite Sports DJ.

**Features:**
- View order history
- Track current order status
- Download deliverables
- Update contact information
- View upcoming events

**Files to Create:**
- `pages/portal/index.vue`
- `pages/portal/orders.vue`
- `pages/portal/profile.vue`
- `server/trpc/routers/portal.ts`

### 4.2. In-App Messaging

**Description:** A messaging system for communication between admins and customers.

**Features:**
- Thread-based conversations
- Attachment support
- Email notifications for new messages
- Message history on order detail page

**Files to Create:**
- `components/admin/MessageThread.vue`
- `components/customer/MessageThread.vue`
- `server/trpc/routers/messages.ts`
- Database migration for `messages` table

### 4.3. Automated Reminders

**Description:** Automated email reminders for various events.

**Features:**
- Quote expiration reminders
- Payment reminders
- Event date reminders
- Post-event feedback requests

**Files to Create:**
- `server/utils/reminders.ts`
- `server/api/cron/reminders.ts`

---

## Section 5: Technical Improvements

### 5.1. Increase Test Coverage

**Current State:** Only 6 test files exist, covering basic utilities.

**Recommended Tests:**
- Unit tests for all tRPC routers
- Component tests for key Vue components
- End-to-end tests for critical user flows (quote request, payment)

**Files to Create:**
- `tests/unit/routers/*.spec.ts`
- `tests/components/*.spec.ts`
- `tests/e2e/*.spec.ts`

### 5.2. Implement Structured Logging

**Current State:** Logging uses console.log/warn/error (153 instances).

**Recommendation:** Migrate all logging to use the existing `logger` utility from `server/utils/logger.ts` with structured JSON output.

### 5.3. Add Error Boundary Components

**Description:** Implement error boundaries to gracefully handle component errors.

**Files to Create:**
- `components/ErrorBoundary.vue`

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Fix `$NaN` price display | Low | High |
| 2 | Create `contact_submissions` table | Low | High |
| 3 | Fix email modal error | Medium | High |
| 4 | Add revenue trend chart | Medium | Medium |
| 5 | Implement one-click quote acceptance | Medium | High |
| 6 | Add Canadian tax calculation | Medium | High |
| 7 | Create client portal | High | High |
| 8 | Implement in-app messaging | High | Medium |
| 9 | Increase test coverage | High | Medium |
| 10 | Add automated reminders | Medium | Medium |

---

## Conclusion

This document provides a roadmap for improving the Elite Sports DJ application. By addressing the critical bugs first and then implementing the user experience and admin enhancements, the application will become more robust, user-friendly, and valuable to the business.
