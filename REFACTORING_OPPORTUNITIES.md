# Refactoring & Wrapper Opportunities

This document identifies the largest files in the codebase, the cross-cutting
patterns that make them hard to maintain, and concrete extraction/wrapper
proposals with estimated line savings and priority.

---

## File Size Inventory (top 15)

| # | File | Lines | Primary concern |
|---|------|------:|-----------------|
| 1 | `server/trpc/routers/admin.ts` | 1643 | God-router – dashboard, orders, customers, finance, emails, status, manual complete |
| 2 | `server/trpc/routers/admin-enhancements.ts` | 1090 | Bulk ops, enhanced quotes, CSV export, analytics |
| 3 | `server/trpc/routers/quote-public.ts` | 828 | Duplicated query/fallback chains; copy-pasted response shapes |
| 4 | `server/utils/email-enhanced.ts` | 827 | Inline HTML templates; duplicates core send/log helpers from `email.ts` |
| 5 | `server/services/emailTemplateService.ts` | 790 | Well-structured but could share `getAppBaseUrl()` |
| 6 | `server/trpc/routers/orders.ts` | 697 | Long `create` mutation with deep nesting |
| 7 | `server/trpc/routers/finance.ts` | 692 | Duplicated revenue queries already in `admin.ts` |
| 8 | `server/utils/email.ts` | 663 | Duplicated `logEmail`, `sendEmail`, HTML templates |
| 9 | `server/services/invoiceService.ts` | 594 | Moderate – mostly standalone |
| 10 | `server/services/reportingService.ts` | 593 | Moderate – duplicates some finance.ts queries |
| 11 | `server/trpc/routers/financeAutomation.ts` | 592 | Thin wrappers around services – fine |
| 12 | `server/utils/migrations.ts` | 557 | Embedded SQL – unavoidable; skip |
| 13 | `server/trpc/routers/calendar.ts` | 554 | Moderate – could benefit from shared query builder |
| 14 | `server/services/reminderService.ts` | 518 | Moderate – standalone |
| 15 | `server/trpc/routers/auth.ts` | 516 | Moderate – standalone |

---

## Opportunity 1 – Split `admin.ts` into domain sub-routers

**Files affected:** `server/trpc/routers/admin.ts` (1643 lines)

**Problem:** `admin.ts` is a single monolithic router containing six unrelated
domains: dashboard stats, order CRUD, customer management, finance stats, email
management (with nested template sub-router), status transitions, and manual
order completion. Any change to email logic risks merge conflicts with order
logic.

**Proposed structure:**

```
server/trpc/routers/admin/
  index.ts              — merges sub-routers (~30 lines)
  dashboard.ts          — dashboard stats (~40 lines)
  orders.ts             — orders.list, orders.get, orders.update,
                          orders.submitQuote, orders.updateNotes (~400 lines)
  customers.ts          — customers.list (~40 lines)
  finance.ts            — finance.stats (~90 lines)
  emails.ts             — emails.list, emails.get, emails.resend,
                          emails.stats, emails.templates.* (~480 lines)
  status.ts             — getAllowedTransitions, getAllStatuses,
                          getOrderStatusHistory (~60 lines)
  manual-complete.ts    — manualComplete (~250 lines)
```

**Estimated savings:** ~1643 → 7 files averaging ~200 lines each. No logic
changes required – purely structural.

**Priority:** HIGH – this is the single largest maintainability bottleneck.

---

## Opportunity 2 – Unify `email.ts` and `email-enhanced.ts` core helpers

**Files affected:**
- `server/utils/email.ts` (663 lines)
- `server/utils/email-enhanced.ts` (827 lines)

**Problem:** Both files independently define:
- `logEmail()` – identical fallback chains for missing DB columns
- `sendEmail()` – identical Mailgun + template override + logging wrapper
- `EmailOptions` interface

The only difference is `email.ts` accepts a `config` parameter for
`skipTemplateOverride` while `email-enhanced.ts` does not.

**Proposed extraction:** Create `server/utils/email-core.ts`:

```ts
// ~80 lines
export interface EmailOptions { to: string; subject: string; html: string; text?: string }
export interface SendEmailConfig { skipTemplateOverride?: boolean }
export async function logEmail(quoteRequestId, toEmail, subject, template, metadata, status, errorMessage?) { ... }
export async function sendEmailCore(options: EmailOptions, template: string, metadata: any, quoteRequestId?: number, config?: SendEmailConfig): Promise<boolean> { ... }
```

Then both `email.ts` and `email-enhanced.ts` import from `email-core.ts` and
only contain their template-specific send functions.

**Estimated savings:** ~120 duplicated lines removed; single place to update
the fallback chain if the DB schema changes.

**Priority:** HIGH – the duplicated `logEmail` fallback chain is a bug magnet.

---

## Opportunity 3 – Extract resilient query wrapper

**Files affected:**
- `admin.ts` (~6 occurrences)
- `admin-enhancements.ts` (~4 occurrences)
- `quote-public.ts` (~6 occurrences)
- `orders.ts` (~2 occurrences)
- `finance.ts` (~2 occurrences)

**Problem:** The following pattern appears 20+ times:

```ts
let result
try {
  result = await query(`SELECT ... new_col ... FROM ...`, params)
} catch {
  result = await query(`SELECT ... NULL as new_col ... FROM ...`, params)
}
```

This is used to handle schema evolution where newer columns
(`form_submissions`, `quote_viewed_at`, `current_quote_version`,
`tax_province`, etc.) may not exist yet.

**Proposed wrapper:** `server/utils/resilient-query.ts`:

```ts
export async function queryWithFallback<T>(
  primary: { sql: string; params?: any[] },
  fallback: { sql: string; params?: any[] }
): Promise<QueryResult<T>> {
  try {
    return await query(primary.sql, primary.params)
  } catch (err: any) {
    if (err.code === '42703' || err.code === '42P01') {
      return await query(fallback.sql, fallback.params)
    }
    throw err
  }
}
```

**Estimated savings:** ~200 lines of boilerplate removed across 5 files;
centralizes the error-code detection logic.

**Priority:** MEDIUM – reduces noise and prevents inconsistent fallback
handling.

---

## Opportunity 4 – Shared SQL constants and query fragments

**Files affected:**
- `admin.ts`, `admin-enhancements.ts`, `finance.ts`, `reportingService.ts`,
  `taxService.ts`, `metrics.get.ts`

**Problem:** The literal string `status IN ('paid', 'completed', 'delivered')`
appears **46 times** across the codebase. Similarly, `status IN ('quoted',
'invoiced')` for pending payments appears ~8 times.

If a new terminal status is added (e.g. `archived`) or a status is renamed,
every occurrence must be found and updated.

**Proposed extraction:** `server/utils/query-constants.ts`:

```ts
export const PAID_STATUS_SQL = `status IN ('paid', 'completed', 'delivered')`
export const PENDING_PAYMENT_SQL = `status IN ('quoted', 'invoiced')`
export const ACTIVE_STATUS_SQL = `status IN ('submitted', 'quoted', 'in_progress')`
```

These are already partially captured in `order-status.ts` as TypeScript values
but not as SQL-safe fragments.

**Estimated savings:** ~50 scattered literals replaced; prevents silent
omissions when statuses change.

**Priority:** MEDIUM – easy to do incrementally.

---

## Opportunity 5 – Deduplicate quote-detail fetching in `quote-public.ts`

**Files affected:** `server/trpc/routers/quote-public.ts` (828 lines)

**Problem:** The `getQuote` (lines 63-184) and `getQuoteWithToken` (lines
189-302) endpoints contain nearly identical:
1. Three-level try/catch query fallbacks for the same column set
2. The same quote-notes fetch from `quote_revisions`
3. The same response DTO mapping

The only differences are the authorization check and the audit log message.

**Proposed extraction:**

```ts
async function fetchQuoteDetails(orderId: number): Promise<QuoteDetailsDTO> {
  // Single place for the 3-level fallback query chain
  // Single place for the quote_revisions notes fetch
  // Single place for the response mapping
}
```

Then `getQuote` calls `fetchQuoteDetails` after auth check, and
`getQuoteWithToken` calls it after token validation.

**Estimated savings:** ~120 lines of duplicated SQL and mapping code removed.

**Priority:** HIGH – the duplicated fallback chains must stay in sync today;
easy to forget one.

---

## Opportunity 6 – Extract shared email HTML layout wrapper

**Files affected:**
- `server/utils/email.ts` (663 lines)
- `server/utils/email-enhanced.ts` (827 lines)

**Problem:** Every email function (`sendOrderConfirmation`,
`sendEnhancedQuoteEmail`, `sendQuoteRevisionEmail`, `sendQuoteReminderEmail`,
`sendInvoiceEmail`, `sendPaymentReceipt`, `sendPasswordResetEmail`,
`sendManualCompletionEmail`, `sendCustomEmailEnhanced`,
`sendAdminNotificationEmail`, `sendContactNotificationEmail`) builds a
complete `<!DOCTYPE html>...<html>...<body>` document with:
- Inline CSS in a `<style>` block (repeated with minor variations)
- `.container`, `.header`, `.content`, `.footer` classes
- Same brand colors (`#0ea5e9`, `#06b6d4`)
- Same copyright footer pattern

This results in ~70 lines of boilerplate per email function.

**Proposed wrapper:** `server/utils/email-layout.ts`:

```ts
export function wrapEmailLayout(options: {
  headerBg?: string        // gradient CSS, defaults to brand blue
  headerTitle: string
  headerSubtitle?: string
  bodyHtml: string
  footerHtml?: string
}): string { ... }
```

Each email function would then only provide the unique content.

**Estimated savings:** ~500+ lines of duplicated HTML boilerplate across the
two email files.

**Priority:** MEDIUM – high line savings but lower risk than logic
duplication.

---

## Opportunity 7 – Extract parameterized SQL filter builder

**Files affected:**
- `admin.ts` lines 118-256 (`orders.list`)
- `admin.ts` lines 884-963 (`emails.list`)
- `admin-enhancements.ts` lines 732-787 (`exportOrders`)

**Problem:** All three endpoints manually build parameterized SQL with:
```ts
const params: any[] = []
let paramCount = 1
if (input?.status) {
  sql += ` AND qr.status = $${paramCount}`
  params.push(input.status)
  paramCount++
}
// ...repeat for each filter
```

Then they separately build a matching `COUNT(*)` query with duplicated filter
logic.

**Proposed utility:** `server/utils/sql-filter-builder.ts`:

```ts
class SqlFilterBuilder {
  where(condition: string, value: any): this
  ilike(column: string, value: string): this
  build(): { clause: string; params: any[] }
}
```

**Estimated savings:** ~150 lines; eliminates the risk of the count query's
filters drifting from the data query's filters.

**Priority:** LOW-MEDIUM – helpful but not urgent.

---

## Opportunity 8 – Deduplicate `getAppBaseUrl()` across files

**Files affected:**
- `server/utils/email-enhanced.ts` (line 28-35)
- `server/services/emailTemplateService.ts` (line 309-316)

**Problem:** Both files define an identical `getAppBaseUrl()` function that
tries `useRuntimeConfig()` then falls back to `process.env.APP_URL`. A third
instance exists in `admin-enhancements.ts` inline.

**Proposed extraction:** Move to `server/utils/config.ts`:

```ts
export function getAppBaseUrl(): string { ... }
export function getAdminEmail(): string { ... }
export function getBusinessName(): string { ... }
export function getSupportEmail(): string { ... }
```

**Estimated savings:** ~30 lines; more importantly, a single source of truth
for default URLs.

**Priority:** LOW – easy quick win.

---

## Opportunity 9 – Deduplicate revenue/stats queries between `admin.ts` and `finance.ts`

**Files affected:**
- `admin.ts` `finance.stats` (lines 757-847)
- `finance.ts` `stats` (lines 97-368)

**Problem:** `admin.ts` has a `finance.stats` sub-router that duplicates a
subset of the queries in the dedicated `finance.ts` router. The admin finance
stats query total revenue, monthly revenue, pending payments, and recent
transactions – all of which `finance.ts` also computes with more detail.

**Proposed fix:** Remove `admin.finance.stats` and have the frontend call
`finance.stats` directly (it already requires admin auth). If a lightweight
summary is needed, add a `finance.summary` endpoint that returns a subset.

**Estimated savings:** ~90 lines of duplicated SQL removed from `admin.ts`.

**Priority:** LOW-MEDIUM – prevents stats from drifting between the two
endpoints.

---

## Opportunity 10 – Use managed template system for inline status notifications

**Files affected:** `admin.ts` lines 550-610 (inside `orders.update`)

**Problem:** The `orders.update` mutation has a hardcoded `statusMessages` map
with inline HTML email templates for status change notifications. This
bypasses the managed email template system in `emailTemplateService.ts`, which
already supports admin-customizable templates.

**Proposed fix:** Register each status notification as a managed template key
(e.g. `status_change_quoted`, `status_change_paid`) and use
`resolveManagedEmailTemplate()` instead of inline HTML.

**Estimated savings:** ~60 lines; more importantly, makes all customer-facing
emails customizable from the admin UI.

**Priority:** LOW – correctness improvement, not size reduction.

---

## Summary Table

| # | Opportunity | Est. line savings | Risk | Priority |
|---|-------------|------------------:|------|----------|
| 1 | Split `admin.ts` into sub-routers | ~0 (structural) | Low | **HIGH** |
| 2 | Unify email core helpers | ~120 | Low | **HIGH** |
| 3 | Resilient query wrapper | ~200 | Low | **MEDIUM** |
| 4 | Shared SQL status constants | ~50 (literals) | Low | **MEDIUM** |
| 5 | Deduplicate quote-detail fetch | ~120 | Low | **HIGH** |
| 6 | Shared email HTML layout | ~500 | Low | **MEDIUM** |
| 7 | SQL filter builder utility | ~150 | Low | **LOW-MEDIUM** |
| 8 | Shared `getAppBaseUrl()` | ~30 | Low | **LOW** |
| 9 | Deduplicate admin/finance stats | ~90 | Low | **LOW-MEDIUM** |
| 10 | Use managed templates for status emails | ~60 | Low | **LOW** |

**Total estimated reduction:** ~1300+ lines of duplicated or boilerplate code.

---

## Recommended Implementation Order

1. **Opportunity 2** (email core) – quick win, removes the most dangerous
   duplication
2. **Opportunity 5** (quote-public dedup) – focused on one file, easy to test
3. **Opportunity 8** (shared config) – 5-minute change, unblocks others
4. **Opportunity 1** (split admin.ts) – biggest structural improvement; do
   after #2 and #5 so the new sub-files are already smaller
5. **Opportunity 3** (resilient query) – apply file-by-file after #1
6. **Opportunity 4** (SQL constants) – mechanical find-and-replace
7. **Opportunity 6** (email layout) – large savings but needs design review
   for template flexibility
8. **Opportunity 7** (filter builder) – nice-to-have
9. **Opportunity 9** (admin/finance dedup) – needs frontend coordination
10. **Opportunity 10** (managed status templates) – last, lowest risk
