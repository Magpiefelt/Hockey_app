# Hockey App - Integration Improvements Plan

## Issues Identified

### EMAIL INTEGRATION
1. **Mailgun `sendEmailWithMailgun` returns boolean but errors silently** - needs retry logic and better error propagation
2. **`resendEmailByType` doesn't generate token-based URLs** - resent quote emails lack direct-access token links
3. **`bulkSendEmail` doesn't generate token URLs for reminders** - reminder emails link to auth-required pages
4. **Quote reminder emails use hardcoded 30-day expiry** but quotes "no longer expire" per code comments
5. **Email logging doesn't capture metadata JSON** - `logEmail` accepts metadata param but never stores it
6. **`sendCustomEmailEnhanced` double-processes template vars** - body is processed in both bulkSendEmail AND sendCustomEmailEnhanced
7. **No plain-text fallback** in most email templates (spam filter risk)
8. **Admin notification email body isn't HTML-escaped** - potential XSS in admin email body

### QUOTE INTEGRATION  
9. **`submitQuote` in admin.ts doesn't generate/include token URL** in the quote email
10. **Quote revision email links to `/orders/{id}` (auth-required)** instead of token-based URL
11. **`canSubmitQuote` only allows `submitted` and `in_progress`** - should also allow `quoted` for revisions
12. **Status transition map missing `quote_viewed`** in bulkUpdateStatus - can't transition from quote_viewed
13. **`acceptQuoteInternal` ownership check uses `order.user_id !== userId`** - but user_id can be null for guest orders
14. **Quote revision doesn't update `quote_expires_at`** when creating new revision

### CALENDAR INTEGRATION
15. **Calendar `getUnavailableDates` returns raw date strings** but format isn't guaranteed consistent
16. **Calendar `addUnavailableDate`/`removeUnavailableDate` don't invalidate client cache** - no signal to refresh
17. **CalendarManager.vue `toggleDate` has race condition** - rapid clicks can cause duplicate entries
18. **AvailabilityCalendar doesn't handle loading/error states gracefully**
19. **Calendar store `isDateAvailable` uses `includes()` on array** - O(n) lookup, should use Set

### GENERAL ROBUSTNESS
20. **`useTrpc` composable error handling** - `handleTrpcError` is imported dynamically everywhere
21. **Missing try-catch in several async operations** in admin order detail page
22. **`quote_revisions` table queries wrapped in try-catch with "table might not exist"** - should ensure table exists
23. **`getAppBaseUrl()` in email-enhanced.ts** - `useRuntimeConfig()` may not be available in all contexts
24. **Inconsistent amount handling** - some places use cents, display divides by 100, but no validation
