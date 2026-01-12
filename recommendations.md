# Recommendations for Hockey_app Improvement

This document outlines specific, actionable recommendations for improving the calendar, request submission, and admin UI of the Hockey_app. These recommendations are based on a thorough review of the existing codebase.

## 1. Calendar System

The current calendar system is functional but can be enhanced for better maintainability, user experience, and administrative efficiency.

### 1.1. Refactor `getUnavailableDates` for Clarity

The `getUnavailableDates` tRPC procedure in `/server/trpc/routers/calendar.ts` uses a complex SQL query that can be difficult to understand and maintain. 

**Recommendation:** Refactor the SQL query to improve readability and modularity. Using a Common Table Expression (CTE) can make the logic clearer.

**Example (Current):**
```sql
SELECT DISTINCT date 
FROM (
  SELECT generate_series(
    start_date,
    end_date,
    '1 day'::interval
  )::date as date
  FROM availability_overrides
  WHERE is_available = false
    AND end_date >= CURRENT_DATE
  
  UNION
  
  SELECT event_date as date
  FROM quote_requests
  WHERE status IN ('confirmed', 'in_progress')
    AND event_date >= CURRENT_DATE
    AND event_date IS NOT NULL
) AS unavailable_dates
ORDER BY date ASC
```

**Example (Recommended):**
```sql
WITH blocked_dates AS (
  SELECT generate_series(start_date, end_date, '1 day'::interval)::date as date
  FROM availability_overrides
  WHERE is_available = false AND end_date >= CURRENT_DATE
),
booked_dates AS (
  SELECT event_date as date
  FROM quote_requests
  WHERE status IN ('confirmed', 'in_progress') AND event_date >= CURRENT_DATE AND event_date IS NOT NULL
)
SELECT date FROM blocked_dates
UNION
SELECT date FROM booked_dates
ORDER BY date ASC;
```

### 1.2. Enhance Calendar UI

The `CalendarManager.vue` component provides a basic interface for managing blocked dates. The user experience can be improved with some visual enhancements.

**Recommendation:** Introduce color-coding to the calendar to distinguish between different types of unavailable dates. For example, use one color for manually blocked dates and another for dates with confirmed orders. This will provide admins with a more intuitive at-a-glance view of the calendar.

### 1.3. Implement "Quick Block" Functionality

Blocking a single day is a frequent action for administrators. The current workflow requires filling out a form, which can be cumbersome for single-day blocks.

**Recommendation:** Add a "Quick Block" feature to the `CalendarManager.vue` component. This could be a button on each day in the calendar view that allows an admin to block that specific day with a single click, automatically creating an override with a default reason (e.g., "Blocked").

## 2. Request Submission System

The request submission process is a critical part of the application. The following recommendations focus on improving the user experience and data integrity of the submission forms.

### 2.1. Centralize Form State Management

The multi-step form in `pages/request.vue` currently manages its state locally. This can lead to complex prop drilling and make the component difficult to maintain.

**Recommendation:** Utilize the existing Pinia store (`/stores/calendar.ts`) or create a new one to manage the form state. This will centralize the state, simplify the components, and make the form data easier to access and modify across different steps.

### 2.2. Strengthen Server-Side Validation

The `handleFinalSubmit` function in `pages/request.vue` performs client-side validation. While this is good for user experience, it's not sufficient to guarantee data integrity.

**Recommendation:** Implement comprehensive server-side validation in the `orders.create` tRPC mutation in `/server/trpc/routers/admin.ts`. This will ensure that all data is valid before it is inserted into the database, preventing invalid or malicious data from being submitted.

### 2.3. Improve File Upload Experience

The `AudioUpload.vue` and `RosterInput.vue` components provide basic file upload functionality. The user experience can be significantly improved with modern features.

**Recommendation:** Enhance the file upload components to include:

*   **Drag-and-drop support:** Allow users to drag and drop files directly onto the upload area.
*   **Multiple file selection:** Enable users to select and upload multiple files at once.
*   **Progress bars:** Provide visual feedback to the user on the progress of their uploads.

## 3. Admin UI

The admin UI is the central hub for managing the application. The following recommendations aim to improve the efficiency and usability of the admin dashboard and related pages.

### 3.1. Implement a More Powerful Data Table

The orders list in `pages/admin/orders/index.vue` is a simple table. As the number of orders grows, this will become difficult to manage.

**Recommendation:** Replace the basic HTML table with a more feature-rich data table component. There are many open-source options available for Vue that provide features like:

*   **Sorting:** Allow admins to sort the data by any column.
*   **Filtering:** Provide a way to filter the data based on different criteria.
*   **Pagination:** Implement pagination to handle large datasets.

### 3.2. Enhance Dashboard Visualizations

The `AnalyticsDashboard.vue` component provides a good overview of the business. However, it could be more impactful with more visual elements.

**Recommendation:** Add more charts and graphs to the dashboard to visualize key metrics. For example:

*   A line chart showing revenue trends over time.
*   A bar chart showing the number of orders per package.
*   A pie chart showing the distribution of order statuses.

### 3.3. Create a Centralized Customer Management View

Customer information is currently tied to individual orders. This makes it difficult to get a holistic view of a customer's history.

**Recommendation:** Create a new `pages/admin/customers.vue` page that provides a centralized view of all customers. This page should display a list of all customers and allow admins to click on a customer to view their details, including their complete order history and contact information.
