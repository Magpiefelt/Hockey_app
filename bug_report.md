# Hockey App Quote Sending Investigation: Bug Report and Fixes

An investigation into the Hockey_app repository has revealed several critical bugs and inconsistencies that are causing the quote-sending functionality to fail. This report details the identified issues, their impact, and the necessary steps to resolve them.

## Summary of Findings

The investigation uncovered a series of issues ranging from database schema inconsistencies and incorrect function calls to mismatched environment variables. These problems are distributed across the application, affecting database operations, email generation, and API endpoints. The following sections provide a detailed breakdown of each issue and the recommended fixes.

## 1. Database Schema and Migration Issues

Several problems were identified related to the database schema and the application of migrations. These are the most critical issues as they cause fundamental operations to fail.

### 1.1. Inconsistent `email_logs` Table Schema

The `email_logs` table schema is inconsistent across the codebase, leading to SQL errors when different parts of the application interact with it.

*   **Issue:** The `database/migrations/001_initial_schema.sql` file defines the columns as `recipient_email` and `email_type`. However, the `database/migrations/002_fix_email_logs_schema.sql` migration renames them to `to_email` and `template`. The application code is not consistently updated to reflect this change.
*   **Impact:** Queries to the `email_logs` table will fail with "column does not exist" errors, depending on which column names are used.
*   **Fix:** The `server/utils/email.ts`, `server/utils/email-enhanced.ts`, and `server/trpc/routers/emails.ts` files need to be updated to use the new column names (`to_email` and `template`) when logging emails.

### 1.2. Missing `quote_viewed` and `quote_accepted` Statuses

The `quote_requests` table `status` column has a `CHECK` constraint that is missing the `quote_viewed` and `quote_accepted` statuses.

*   **Issue:** The application logic in `server/trpc/routers/quote-public.ts` attempts to set these statuses, but they are not included in the `CHECK` constraint in the `server/db/schema.sql` file. While the `database/migrations/007_quote_tracking.sql` migration adds these statuses, the main schema file is not up-to-date.
*   **Impact:** Any operation that tries to set the order status to `quote_viewed` or `quote_accepted` will fail with a database constraint violation.
*   **Fix:** The `server/db/schema.sql` file should be updated to include `quote_viewed` and `quote_accepted` in the `CHECK` constraint for the `status` column in the `quote_requests` table.

### 1.3. Unapplied `quote_access_tokens` Migration

The application attempts to use a `quote_access_tokens` table that has not been created because its migration file is in the wrong directory.

*   **Issue:** The `server/utils/quote-tokens.ts` file contains logic to store tokens in the `quote_access_tokens` table. The migration for this table, `add_quote_access_tokens.sql`, is located in `server/db/migrations/` instead of `database/migrations/`, so it is never executed by the migration runner.
*   **Impact:** The `storeQuoteToken` function fails silently, and no access tokens are stored in the database. This breaks the secure quote access feature.
*   **Fix:** The `add_quote_access_tokens.sql` migration file must be moved from `server/db/migrations/` to `database/migrations/` so that it is applied on application startup.

### 1.4. Removed `requirements_json` Column Still in Use

The `admin-enhancements.ts` router still queries for the `requirements_json` column, which has been removed from the `quote_requests` table.

*   **Issue:** The `migrations/001_add_form_submissions_table.sql` migration removes the `requirements_json` column and moves its data to the `form_submissions` table. However, the `submitQuoteEnhanced` mutation in `server/trpc/routers/admin-enhancements.ts` still attempts to select this column.
*   **Impact:** The `submitQuoteEnhanced` mutation will fail with a "column does not exist" error.
*   **Fix:** The query in `server/trpc/routers/admin-enhancements.ts` must be updated to remove the reference to `requirements_json`.

## 2. Application Code Bugs

In addition to the database issues, several bugs were found in the application's TypeScript code.

### 2.1. Mismatched `sendCustomEmail` Function Signature

The `sendCustomEmail` function is called with an incorrect signature in the `admin.ts` router.

*   **Issue:** In `server/trpc/routers/admin.ts`, the status change notification logic calls `sendCustomEmail` with a single object argument containing `to`, `subject`, `body`, and `orderId`. However, the function definition in `server/utils/email.ts` expects four separate arguments: `(to: string, subject: string, htmlContent: string, quoteRequestId?: number)`.
*   **Impact:** This will cause a runtime error when a status change notification is triggered, and the email will not be sent.
*   **Fix:** The call to `sendCustomEmail` in `server/trpc/routers/admin.ts` must be updated to pass the arguments correctly. The `body` property should be passed as the `htmlContent` parameter.

### 2.2. Incorrect `sendEnhancedQuoteEmail` Call

The `sendEnhancedQuoteEmail` function is called with an extra property that is not defined in its interface.

*   **Issue:** The `submitQuoteEnhanced` mutation in `admin-enhancements.ts` passes an `eventDateTime` property in the data object to `sendEnhancedQuoteEmail`. However, the `EnhancedQuoteEmailData` interface in `email-enhanced.ts` does not include this property.
*   **Impact:** This will cause a TypeScript compilation error and may lead to unexpected behavior in the email template if it were to be used.
*   **Fix:** The `EnhancedQuoteEmailData` interface should be updated to include the optional `eventDateTime: string` property, and the email template should be updated to use this new data.

## 3. Configuration and Consistency Issues

Finally, there are some configuration and consistency issues that can lead to problems.

### 3.1. Mismatched Environment Variable for Application URL

The application uses two different environment variable names for the base URL, which can lead to inconsistent URL generation.

*   **Issue:** `nuxt.config.ts` uses `APP_URL`, while `server/trpc/routers/admin-enhancements.ts` and `server/utils/email-enhanced.ts` use `NUXT_PUBLIC_APP_BASE_URL`.
*   **Impact:** If only one of these variables is set, the application may generate incorrect URLs in emails and other parts of the system.
*   **Fix:** The code should be standardized to use a single environment variable for the application's base URL. It is recommended to use `NUXT_PUBLIC_APP_BASE_URL` as it is part of the Nuxt.js convention.

## Conclusion and Next Steps

The identified issues are significant and explain why the quote-sending functionality is failing. To resolve these problems, the following actions should be taken:

1.  **Apply all database migration fixes:** Update the `email_logs` table references, correct the `quote_requests` status `CHECK` constraint, and move the `quote_access_tokens` migration to the correct directory.
2.  **Fix all application code bugs:** Correct the function call signatures for `sendCustomEmail` and `sendEnhancedQuoteEmail`, and remove the usage of the deleted `requirements_json` column.
3.  **Standardize environment variables:** Unify the environment variable used for the application's base URL.

By addressing these issues, the quote-sending functionality can be restored, and the overall stability and reliability of the application will be improved.
