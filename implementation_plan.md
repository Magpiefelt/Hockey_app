# Hockey App Bug Bash & Implementation Plan

This document outlines the findings from a comprehensive audit of the Hockey_app codebase and presents a prioritized plan for implementation. The audit revealed several critical issues affecting core functionality, data integrity, and overall robustness.

## Consolidated Findings

The following table summarizes the key issues discovered during the initial and deep-pass audits.

| Category | Issue | Root Cause | Impact | Priority |
|---|---|---|---|---|
| **Database** | `requirements_json` column is queried but has been removed | The `001_add_form_submissions_table.sql` migration in the `/migrations` directory (which is not run) drops the `requirements_json` column from `quote_requests`, but the `admin-enhancements.ts` router still queries it. | Critical | High |
| **Database** | Duplicate migration number `003` | Two different migration files (`003_add_email_webhook_columns.sql` and `003_add_password_reset.sql`) exist with the same sequence number, causing unpredictable migration order. | High | High |
| **Database** | `quote_access_tokens` table migration is not in the correct directory | The migration `add_quote_access_tokens.sql` is in `server/db/migrations` instead of `database/migrations`, so it is never run. The `storeQuoteToken` function fails silently. | High | High |
| **Database** | Inconsistent `email_logs` column names (`to_email` vs. `recipient_email`) | `001_initial_schema.sql` creates `recipient_email`, but `002_fix_email_logs_schema.sql` renames it to `to_email`. However, multiple queries in `admin.ts` still reference `recipient_email` or the incorrect alias `quote_request_id`. | High | High |
| **Application** | Incorrect `sendCustomEmail` function signature | The `sendCustomEmail` function in `admin.ts` is called with an object payload, but the function definition in `email.ts` expects positional arguments. | Critical | High |
| **Application** | Incorrect `logOrderEvent` function signature | The `logOrderEvent` function is called with both an object payload and positional arguments in different parts of the code (`orders.ts`), but the function definition in `audit.ts` expects positional arguments. | Medium | High |
| **Application** | Broken email resend logic in `admin.ts` | The `resend` mutation in `admin.ts` uses a non-existent `emailUtils.sendCustomEmail` function and references `quote_request_id` which does not exist on the `email_logs` table. | High | High |
| **Robustness** | SQL injection vulnerability in analytics queries | The `admin-enhancements.ts` and `finance.ts` routers use string interpolation to insert the `days` and `months` variables into `INTERVAL` clauses, creating a SQL injection risk. | High | Medium |
| **Configuration** | Inconsistent environment variable usage for `appBaseUrl` | The codebase uses both `process.env.NUXT_PUBLIC_APP_BASE_URL` and `config.public.appBaseUrl` (which is derived from `process.env.APP_URL`), leading to potential inconsistencies. | Medium | Medium |

## Implementation Plan

The fixes will be implemented in the following logical chunks:

### Chunk 1: Database Schema and Migration Fixes

1.  **Fix Duplicate Migration Number:** Rename `003_add_password_reset.sql` to `012_add_password_reset.sql` to resolve the migration order conflict.
2.  **Move `quote_access_tokens` Migration:** Move the `add_quote_access_tokens.sql` migration from `server/db/migrations` to `database/migrations` and rename it to `013_add_quote_access_tokens.sql`.
3.  **Fix `email_logs` Column Name:** Create a new migration `014_fix_email_logs_column_names.sql` to standardize on `recipient_email` and `quote_id` in the `email_logs` table and update all queries in `admin.ts` to use the correct column names.
4.  **Address `requirements_json` Removal:** Since the data has been migrated to the `form_submissions` table, update the `admin-enhancements.ts` router to join with `form_submissions` instead of querying the non-existent `requirements_json` column.

### Chunk 2: Email System Fixes

1.  **Fix `sendCustomEmail` Signature:** Refactor the `sendCustomEmail` function in `email.ts` to accept an object payload to match its usage in `admin.ts`.
2.  **Fix Email Resend Logic:** In `admin.ts`, correct the `resend` mutation to use the proper `sendCustomEmail` function and reference the correct `quote_id` column.

### Chunk 3: Application Code Fixes

1.  **Fix `logOrderEvent` Signature:** Refactor the `logOrderEvent` function in `audit.ts` to consistently accept an object payload and update its call sites in `orders.ts`.

### Chunk 4: Robustness Improvements

1.  **Fix SQL Injection Vulnerability:** Modify the analytics queries in `admin-enhancements.ts` and `finance.ts` to use parameterized queries for the `INTERVAL` clause.
2.  **Standardize `appBaseUrl`:** Consolidate the usage of `appBaseUrl` to use the runtime config `config.public.appBaseUrl` throughout the application.

This plan will be executed sequentially. I will begin with Chunk 1: Database schema and migration fixes.
