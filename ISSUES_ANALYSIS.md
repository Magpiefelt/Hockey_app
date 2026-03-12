# End-to-End Request/Admin Workflow: Issues & Enhancements Analysis

## 1. STATUS TRANSITION INCONSISTENCIES (BUG - HIGH)

**Problem:** Status transition maps are duplicated in 3+ places and are inconsistent:

- `admin.ts orders.update` (line ~445): Missing `quote_viewed` and `quote_accepted` transitions
- `admin.ts getAllowedTransitions` (line ~1153): Has `quote_viewed` and `quote_accepted`
- `OrderStatusChanger.vue` fallback (line ~getFallbackTransitions): Has `quote_viewed` and `quote_accepted`

The `orders.update` mutation will **reject** valid transitions from `quote_viewed` → `invoiced` or `quote_accepted` → `invoiced` because those statuses aren't in its `validTransitions` map, even though the UI allows selecting them.

**Fix:** Sync all transition maps to include `quote_viewed` and `quote_accepted`.

---

## 2. CUSTOMER ORDER CARD: WRONG PRICE FORMAT (BUG - MEDIUM)

**Problem:** In `OrderCard.vue` line 213, `formatPrice()` uses `Intl.NumberFormat` directly on `order.quotedAmount`, but the amount is stored in **cents** (e.g., 50000 = $500). The card will display `$50,000.00` instead of `$500.00`.

The admin pages correctly divide by 100 (`formatPrice(cents) => cents / 100`), but the customer OrderCard does not.

**Fix:** Divide by 100 before formatting.

---

## 3. CUSTOMER ORDER DETAIL: PACKAGES LOADED VIA queryContent vs tRPC (INCONSISTENCY)

**Problem:** `pages/orders/[id].vue` uses `queryContent('/packages')` to load packages, while `pages/orders/index.vue` uses `trpc.packages.getAll.query()`. The order detail page will fail to resolve package names if the content directory doesn't have a `/packages` file, even though the database has the packages.

**Fix:** Standardize to use tRPC `packages.getAll` consistently on customer pages.

---

## 4. CUSTOMER ORDER DETAIL: MISSING `emailSnapshot` FIELD (BUG - LOW)

**Problem:** The customer `orders.get` tRPC procedure returns `email` but the template references `orderData.order.emailSnapshot`. This works because the admin `orders.get` returns `emailSnapshot`, but the customer version returns `email`. If a customer views their own order via the customer route, `emailSnapshot` will be undefined.

**Fix:** Add `emailSnapshot` alias in the customer orders.get return, or update the template to use `email`.

---

## 5. ORDER CANCELLATION: NOTES CONCATENATION SQL INJECTION RISK (BUG - MEDIUM)

**Problem:** In `orders.ts cancel` (line ~629), the cancellation reason is concatenated directly into the notes field:
```sql
SET notes = COALESCE(notes, '') || $2
```
Where `$2` includes the user-provided reason. While parameterized, the string concatenation with `||` means the existing notes field gets the cancellation reason appended without any separator validation. If notes is NULL, it becomes just the cancellation text, losing the "COALESCE" intent.

Actually this is safe from SQL injection since it's parameterized, but the formatting is poor - it appends directly without a newline separator when notes already exist.

**Fix:** Already uses COALESCE correctly. Minor: ensure clean formatting.

---

## 6. STATUS HISTORY: MISSING `delivered` and `ready` ICONS (ENHANCEMENT)

**Problem:** `OrderStatusHistory.vue` `getStatusIcon()` is missing icons for `quote_viewed`, `quote_accepted`, `delivered`, `ready`, and `refunded` statuses. These will fall back to `mdi:circle`.

**Fix:** Add missing status icons.

---

## 7. CUSTOMER ORDER LIST: MISSING `quote_viewed` AND `quote_accepted` IN FILTER (ENHANCEMENT)

**Problem:** `pages/orders/index.vue` filter dropdown (line ~56-62) lists: submitted, quoted, invoiced, paid, in_progress, completed. Missing: `quote_viewed`, `quote_accepted`, `delivered`, `cancelled`. Customers can't filter to see their cancelled or delivered orders.

**Fix:** Add missing statuses to the filter dropdown.

---

## 8. CUSTOMER ORDER CARD: `quote_viewed` AND `quote_accepted` NOT IN statusSteps (BUG - MEDIUM)

**Problem:** `OrderCard.vue` `statusOrder` array (line 154) doesn't include `quote_viewed` or `quote_accepted`, so `isStepCompleted()` returns false for these statuses, making the progress bar look incorrect (shows no progress past "submitted" even though the quote has been viewed/accepted).

**Fix:** Add intermediate statuses to the status order array.

---

## 9. ENHANCED QUOTE MODAL: MISSING `eventDateTime` AND `eventTime` PROPS (BUG - LOW)

**Problem:** The `EnhancedQuoteModal` component accepts `eventDate` and `eventDateTime` and `eventTime` props (as seen in the parent `[id].vue` line ~529-531), but the component's `defineProps` only declares `eventDate`. The `eventDateTime` and `eventTime` props are passed but never received, so the modal always shows "Not specified" for the customer's requested date if only `eventDateTime` was set.

**Fix:** Add `eventDateTime` and `eventTime` to the props and use them to initialize the date picker.

---

## 10. ADMIN ORDER DETAIL: `orderId` TYPE MISMATCH (BUG - MEDIUM)

**Problem:** In `pages/admin/orders/[id].vue`, `orderId` is computed as `parseInt(route.params.id)` returning a number. But the tRPC `admin.orders.get` returns `order.id` as a string (`.toString()`). When the page passes `orderId` to child components, some expect number and some expect string. The `resendQuoteEmail` and other mutations use `orderId.value` (number), which is correct, but `navigateToOrder` compares `id !== orderId.value.toString()` which is fragile.

**Fix:** Ensure consistent typing throughout.

---

## 11. ADMIN ORDER LIST: SEARCH DEBOUNCE MISSING (ENHANCEMENT)

**Problem:** The search filter in `pages/admin/orders/index.vue` triggers `fetchOrders()` on every keystroke via the `watch` on `filters.value.search` (line ~518). This fires a server request for every character typed, creating unnecessary load.

**Fix:** Add debounce to the search watcher.

---

## 12. CUSTOMER ORDER DETAIL: `eventDate` AND `eventDateTime` DISPLAY GAPS (BUG - LOW)

**Problem:** The customer order detail page (`pages/orders/[id].vue`) only shows `eventDate` in the quote amount box (line ~62-64) but doesn't display `eventDateTime` or `eventTime`. The admin confirmed datetime isn't visible to the customer in the order detail view.

**Fix:** Add event date/time display to the customer order detail page.

---

## 13. ADMIN ORDER EDIT MODAL: NOT REFRESHING STATUS HISTORY (ENHANCEMENT)

**Problem:** When admin changes status via `OrderStatusChanger`, the `handleStatusChanged` function calls `fetchOrder()` to refresh data, but the `OrderStatusHistory` component has its own internal state and doesn't re-fetch. The status history sidebar shows stale data until page refresh.

**Fix:** Add a ref to the StatusHistory component and call its `refresh()` method after status changes.

---

## 14. FORM PERSISTENCE: `deepMerge` UTILITY NOT IMPORTED (POTENTIAL BUG)

**Problem:** `request.vue` uses `deepMerge()` (line ~407, 464) but it's not clear where this is imported from. If it's a global utility, it should be explicitly imported for clarity.

**Fix:** Verify and add explicit import if needed.

---

## 15. ADMIN ORDERS LIST: `ready` STATUS MISSING FROM FILTER (BUG - LOW)

**Problem:** The admin orders list `statusOptions` (line ~427-435) includes `ready` but the actual status values used in the system are `completed` and `delivered`. The `ready` status doesn't appear in any transition map, so filtering by "Ready" would return no results.

**Fix:** Remove `ready` from admin filter options or replace with `quote_viewed`/`quote_accepted`.

---

## 16. CUSTOMER PAYMENT BUTTON: `quote_viewed`/`quote_accepted` NOT TRIGGERING PAY (BUG - MEDIUM)

**Problem:** In `OrderCard.vue` (line ~90), the "Pay Now" button only shows for `quoted` or `invoiced` status. But after a customer views and accepts a quote (status = `quote_accepted`), the pay button disappears because `quote_accepted` isn't in the condition.

**Fix:** Add `quote_viewed` and `quote_accepted` to the pay button visibility condition.

---

## 17. ADMIN STATUS CHANGE EMAIL: XSS IN HTML TEMPLATE (SECURITY - MEDIUM)

**Problem:** In `admin.ts orders.update` (line ~554-566), the status change notification email template directly interpolates `order.name` and `orderId` into HTML without escaping. A malicious customer name containing HTML/script tags could be injected into the email.

**Fix:** HTML-escape user-provided values in email templates.

---
