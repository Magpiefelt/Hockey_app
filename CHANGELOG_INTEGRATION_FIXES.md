# Integration Fixes & Improvements Summary

**Date:** February 8, 2026  
**Commit:** `3de22f9` pushed to `main`  
**Files Modified:** 12 files, +921 lines, -199 lines

---

## Overview

This update addresses critical integration issues across the **email**, **quote**, and **calendar** systems that were causing broken workflows, failed email resends, incorrect calendar displays, and disconnected state between admin and public-facing components.

---

## 1. Email System Fixes (5 files)

### Problem: Email Resend Sent Placeholder Content
The `emails.ts` router's resend endpoint was sending generic placeholder text ("This is a resend of a previous email") instead of reconstructing the actual original email content.

### Problem: No Metadata Storage for Reconstruction
Email logs did not store the original email parameters (`metadata_json`), making it impossible to reconstruct emails for resend.

### Problem: Reminder/Revision Emails Used Login-Required URLs
Quote reminder and revision emails generated URLs like `/orders/{id}` which required authentication, instead of token-based URLs that customers could access directly from email.

### Fixes Applied

| File | Change |
|------|--------|
| `server/utils/mailgun.ts` | Added `metadata_json` column storage in email logs, improved error handling with detailed categorization, added structured logging |
| `server/utils/email.ts` | Added `metadata_json` storage for `sendQuoteEmail`, improved `sendQuoteEmail` to use token-based URLs via `generateQuoteViewUrl` |
| `server/utils/email-enhanced.ts` | Added `metadata_json` storage for all 5 email types (quote_enhanced, revision, reminder, completion, custom), generate token-based URLs in reminder/revision emails |
| `server/trpc/routers/emails.ts` | Complete rewrite of resend logic to reconstruct actual email content from `metadata_json`, supports all enhanced email types with proper fallback for legacy emails |
| `pages/admin/emails.vue` | Added all enhanced template types to filter dropdown, added icons and labels for quote_enhanced, quote_revision, quote_reminder, manual_completion, contact_notification, admin_notification |

---

## 2. Quote System Fixes (4 files)

### Problem: Double Token Generation
In `admin-enhancements.ts`, the `submitQuoteEnhanced` procedure called both `generateQuoteViewUrl()` (which internally generates a token) AND separately called `generateQuoteToken()` + `storeQuoteToken()`, creating two different tokens where only the second was stored.

### Problem: Resend Quote Email Had No Token URL
The `resendEmailByType` endpoint for quotes called `sendEnhancedQuoteEmail` without generating a `quoteViewUrl`, meaning the resent email had no link for the customer to view their quote.

### Problem: Token Storage Not Automatic
`generateQuoteViewUrl` and `generateQuoteAcceptUrl` generated tokens but didn't store them in the database, requiring callers to manually call `storeQuoteToken`.

### Fixes Applied

| File | Change |
|------|--------|
| `server/trpc/routers/admin-enhancements.ts` | Removed duplicate token generation in `submitQuoteEnhanced`, added token-based URL generation to `resendEmailByType` for quote resends, added safe `useRuntimeConfig` fallback |
| `server/trpc/routers/admin.ts` | Improved `submitQuote` to use enhanced email with token-based URLs, fixed resend handler to reconstruct emails from `metadata_json` with graceful fallback |
| `server/utils/quote-tokens.ts` | Made `generateQuoteViewUrl` and `generateQuoteAcceptUrl` automatically store tokens in database asynchronously |
| `components/admin/EnhancedQuoteModal.vue` | Added calendar store refresh after quote submission so availability updates immediately |

---

## 3. Calendar System Fixes (3 files)

### Problem: Calendar Store Parsed API Response Incorrectly
The calendar store expected the API to return plain date strings (`string[]`), but the API actually returns objects with `{ date: string, source: string }`. This caused `new Date()` to receive `[object Object]` instead of a date string, resulting in all dates being invalid and the calendar showing no unavailable dates.

### Problem: Remove Override Didn't Actually Delete
The `removeOverride` endpoint set `is_available = true` instead of deleting the row, which meant "removed" blocks still appeared in queries and could cause confusion.

### Problem: No Calendar Sync Between Admin and Public
When an admin blocked dates or submitted a quote with a confirmed event date, the public-facing AvailabilityCalendar component didn't refresh, showing stale availability data.

### Fixes Applied

| File | Change |
|------|--------|
| `stores/calendar.ts` | Complete rewrite of `fetchUnavailableDates` to handle `{date, source}` objects with backward compatibility for plain strings, added `unavailableDateMap` for source differentiation (blocked vs booked), improved timezone handling with UTC noon parsing |
| `server/trpc/routers/calendar.ts` | Changed `removeOverride` to use `DELETE` instead of soft-delete, added date validation for new overrides, filtered out past-date overrides from `getOverrides`, added overlap detection for new blocks |
| `pages/admin/calendar.vue` | Added centralized calendar store refresh when admin modifies overrides, keeping public calendar in sync |

---

## 4. Cross-Cutting Integration Improvements

| Area | Improvement |
|------|-------------|
| **Error Handling** | All email send functions now have try/catch with detailed logging instead of silent failures |
| **Config Safety** | Added `try/catch` around `useRuntimeConfig()` calls with `process.env` fallbacks for environments where Nuxt runtime config isn't available |
| **State Synchronization** | Calendar store is now refreshed after quote submissions and admin calendar changes |
| **Backward Compatibility** | All fixes handle legacy data formats (emails without `metadata_json`, calendar responses as plain strings) |
| **Email Logging** | All email types now store `metadata_json` enabling proper resend reconstruction |

---

## Architecture Notes

The codebase has two parallel quote submission paths:
1. **`admin.ts` → `submitQuote`** — Original basic path using `email.ts`
2. **`admin-enhancements.ts` → `submitQuoteEnhanced`** — Enhanced path with event datetime, tax, and revision tracking

Both paths now generate token-based URLs and store email metadata. The frontend (`EnhancedQuoteModal.vue`) uses the enhanced path. The basic path in `admin.ts` serves as a fallback.

---

## Database Considerations

The `metadata_json` column in `email_logs` should already exist if the table was created with the latest schema. If not, run:

```sql
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS metadata_json JSONB;
```

The `quote_access_tokens` table is used for token tracking but failures are handled gracefully (tokens are self-validating via HMAC signatures).
