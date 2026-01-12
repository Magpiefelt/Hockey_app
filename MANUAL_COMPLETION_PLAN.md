# Admin Manual Order Completion: Recommendation and Plan

## 1. Introduction

This document outlines a plan to implement a new feature enabling administrators to manually mark an order as complete and record a final price. This addresses the scenario where a deal is finalized offline, bypassing the standard online quote submission and payment workflow. The goal is to ensure these manually completed orders are seamlessly integrated into the existing system, maintaining data consistency and providing administrators with the necessary flexibility.

## 2. Analysis of the Current System

Our review of the Hockey_app codebase reveals a structured order management system built on a Nuxt.js frontend, a tRPC backend, and a PostgreSQL database. The key components relevant to this new feature are:

- **Order Management**: The `quote_requests` table is the central repository for all orders, tracking their status, from initial submission to completion. The admin interface provides views for listing and detailing these orders.
- **Quote and Payment Workflow**: The standard process involves an admin submitting a quote, the customer accepting it, and payment being processed through Stripe. The `checkout.session.completed` webhook is crucial for automatically updating the order status to `paid`.
- **Admin Authorization**: The application uses a role-based access control system, with an `adminProcedure` in the tRPC layer to protect sensitive operations. This ensures that only authorized administrators can perform administrative tasks.
- **Email Notifications**: The system uses Nodemailer to send various transactional emails, such as order confirmations and quote notifications. The email sending logic is centralized in the `/server/utils/email.ts` and `/server/utils/email-enhanced.ts` files.

## 3. Proposed Solution

To meet the requirements, we propose the addition of a "Manual Completion" feature, which will consist of the following components:

### 3.1. User Interface (UI) Additions

- **"Manual Completion" Button**: A new button will be added to the admin order details page (`/pages/admin/orders/[id].vue`). This button will be conditionally rendered, appearing only for administrators on orders that have not yet been completed or cancelled.
- **Manual Completion Modal**: Clicking the button will open a new modal, `AdminManualCompletionModal.vue`. This modal will provide a form for the administrator to:
    - Input the final completion price of the order.
    - Add internal notes for context about the offline transaction.
    - A checkbox to control whether a confirmation email should be sent to the customer.

### 3.2. Backend (tRPC) Endpoint

- **`admin.orders.manualComplete` Endpoint**: A new tRPC mutation will be created to handle the logic of manual order completion. This endpoint will be protected by the `adminProcedure` and will perform the following actions:
    1. **Update Order Status**: Set the order's `status` in the `quote_requests` table to `completed`.
    2. **Record Final Price**: Set both the `quoted_amount` and `total_amount` fields to the price provided by the admin. This ensures consistency with orders that have gone through the standard quoting process.
    3. **Create a Manual Payment Record**: To ensure data consistency and equivalence with Stripe-processed orders, a new entry will be created in the `payments` table. This record will have a unique identifier to denote it as a manual entry (e.g., `manual_<order_id>_<timestamp>`).
    4. **Log the Action**: A record of the manual completion will be added to the `order_status_history` table for auditing purposes.
    5. **Conditional Email Notification**: If the admin opts to send an email, a confirmation will be sent to the customer. This email will be a new template, `sendManualCompletionEmail`, designed for this specific scenario.

## 4. Implementation Plan

The implementation will be broken down into the following steps:

1.  **Create the `AdminManualCompletionModal.vue` component**: This will be a new Vue component in the `/components/admin/` directory, containing the form for manual completion.
2.  **Add the `manualComplete` tRPC mutation**: This new endpoint will be added to the `admin` router in `/server/trpc/routers/admin.ts`.
3.  **Integrate the new component**: The `AdminManualCompletionModal.vue` component and the button to trigger it will be added to the `/pages/admin/orders/[id].vue` page.
4.  **Implement the email template**: A new function, `sendManualCompletionEmail`, will be added to `/server/utils/email-enhanced.ts`.
5.  **Testing**: Thoroughly test the new workflow to ensure it functions as expected and does not introduce any regressions.

By following this plan, we can deliver a robust and intuitive feature that enhances the administrative capabilities of the Hockey_app, providing a more flexible and comprehensive order management experience.
