# Elite Sports DJ Application: UI/UX & Bug Report

**Date:** January 11, 2026

**Author:** Manus AI

## 1. Executive Summary

This report details the findings from a comprehensive review of the Elite Sports DJ web application, hosted at `elitesportsdj.ca`. The review included an analysis of the codebase, recent commits, and extensive UI/UX testing of the live application. 

Several critical bugs were identified that significantly impact core functionality, including a **500 server error** on the admin emails page, a **database relation error** on the contact submissions page, and a **critical pricing display bug** on the service request page. Additionally, a number of high and medium-priority UI/UX issues were found that degrade the user experience, such as data display inconsistencies, theme mismatches, and broken animations.

This report provides a detailed breakdown of each issue, its severity, and a recommended course of action for remediation. Addressing these findings will stabilize the application, improve usability, and create a more professional and reliable experience for both customers and administrators.

## 2. Summary of Issues

| ID  | Issue                                                 | Severity | Page / Area              | Status      |
| --- | ----------------------------------------------------- | -------- | ------------------------ | ----------- |
| 1   | 500 Server Error on Admin Emails Page                 | Critical | `/admin/emails`          | **Open**    |
| 2   | Database Error on Admin Contact Submissions Page      | Critical | `/admin/contact`         | **Open**    |
| 3   | "$NaN" Price Display on Request Page                  | Critical | `/request`               | **Open**    |
| 4   | Incorrect Data Display in Admin Orders                | High     | `/admin/orders`          | **Open**    |
| 5   | Theme Inconsistency on Customer Orders Page           | High     | `/orders`                | **Open**    |
| 6   | Stats Counters Not Animating on Homepage              | Medium   | `/` (Homepage)           | **Open**    |
| 7   | Disorganized Package Display on Request Page          | Medium   | `/request`               | **Open**    |
| 8   | Visible Calendar Widget on Homepage                   | Low      | `/` (Homepage)           | **Open**    |

---

## 3. Detailed Findings & Recommendations

### 3.1. Critical Issues

#### **1. 500 Server Error on Admin Emails Page**

- **Severity:** Critical
- **Page/Area:** `/admin/emails`
- **Description:** Navigating to the admin emails page results in a 500 Internal Server Error with the message: `Cannot read properties of undefined (reading 'removeEventListener')`.
- **Impact:** This page is completely inaccessible, preventing administrators from managing or monitoring email communications.
- **Suggested Fix:** The error originates from a client-side rendering issue within a Vue component. The `removeEventListener` is likely being called on a DOM element that no longer exists. The `EmailDetailModal.vue` and `ConfirmDialog.vue` components have `removeEventListener` calls in their `onUnmounted` or `watch` hooks. The issue is likely in `EmailDetailModal.vue` where the watcher is not being cleaned up correctly. The watcher on `props.modelValue` should be stopped when the component is unmounted.

#### **2. Database Error on Admin Contact Submissions Page**

- **Severity:** Critical
- **Page/Area:** `/admin/contact`
- **Description:** The admin page for contact submissions displays a database error: `relation "contact_submissions" does not exist`.
- **Impact:** Administrators cannot view or manage any contact form submissions from the website.
- **Suggested Fix:** This is a database schema issue. The application is trying to query a table that has not been created. A migration file exists at `server/db/migrations/add_contact_submissions.sql`. This migration needs to be run against the database to create the `contact_submissions` table.

#### **3. "$NaN" Price Display on Request Page**

- **Severity:** Critical
- **Page/Area:** `/request`
- **Description:** The service request page displays "$NaN" (Not a Number) for the price of the first package. This is caused by an issue in the `PackageSelectionModal.vue` component where the `price_cents` field is being read from the `packages.json` file as `price`.
- **Impact:** This critical bug prevents users from seeing the correct price, breaks the user experience, and makes the application look unprofessional.
- **Suggested Fix:** In `request.vue`, the `packagesData` is loaded from `queryContent('packages').find()`. The `packages.json` file has a `price` field, but the `PackageSelectionModal.vue` component expects a `price_cents` field. The `packages.json` file should be updated to use `price_cents` instead of `price` for all packages to ensure consistency. Additionally, the `formatPrice` function in `PackageSelectionModal.vue` uses `toFixed(0)`, which will round the price to the nearest dollar. It should be `toFixed(2)` to correctly display cents.

### 3.2. High-Priority Issues

#### **4. Incorrect Data Display in Admin Orders**

- **Severity:** High
- **Page/Area:** `/admin/orders` and `/admin/orders/{id}`
- **Description:** Several data display issues were found in the admin order management section:
    - The main orders table shows raw package IDs (e.g., `event-hosting`) instead of user-friendly package names.
    - On the order detail page, the "Intro Song" field displays raw JSON (`{"text":"adad","method":"text"}`) instead of a formatted, human-readable value.
- **Impact:** These issues make it difficult for administrators to quickly understand order details, requiring them to mentally parse raw data.
- **Suggested Fix:** 
    - For the package names, the frontend should map the package ID to its corresponding name before rendering the table. This can be done by fetching the package list and creating a lookup map.
    - For the intro song, the component responsible for displaying this information should parse the JSON and format it appropriately.

#### **5. Theme Inconsistency on Customer Orders Page**

- **Severity:** High
- **Page/Area:** `/orders`
- **Description:** When a customer has no orders, the "My Orders" page displays an empty state card with a white/light theme, which clashes with the application's consistent dark theme.
- **Impact:** This creates a jarring and unprofessional visual inconsistency for the user.
- **Suggested Fix:** The CSS for the empty state card on this page should be updated to match the application's dark theme. The background should be a dark color, and the text should be a light color.

### 3.3. Medium-Priority Issues

#### **6. Stats Counters Not Animating on Homepage**

- **Severity:** Medium
- **Page/Area:** `/` (Homepage)
- **Description:** The "Proven Results" section on the homepage displays static "0+" values for all statistics. These are intended to be animated counters that count up to the correct numbers (e.g., 500+ Events Covered).
- **Impact:** This makes the homepage feel static and broken, and it fails to convey the company's experience and credibility effectively.
- **Suggested Fix:** The JavaScript that controls this animation is either not being triggered or is failing to fetch the correct data. The component responsible for this section needs to be debugged to ensure the animation is correctly implemented and that the data is being passed to it.

#### **7. Disorganized Package Display on Request Page**

- **Severity:** Medium
- **Page/Area:** `/request`
- **Description:** The packages on the service request page are displayed in a seemingly random order, with the "Most Popular" package appearing last. A broken, empty card also appears first.
- **Impact:** This makes it difficult for users to compare packages and may cause confusion.
- **Suggested Fix:** The packages should be sorted in a logical order (e.g., by price or by package number). The broken card should be removed. The data source for the packages (`content/packages.json`) should be checked for any empty or malformed entries.

### 3.4. Low-Priority Issues

#### **8. Visible Calendar Widget on Homepage**

- **Severity:** Low
- **Page/Area:** `/` (Homepage)
- **Description:** A calendar datepicker widget is visible in the hero section of the homepage upon initial load. It appears to be out of place and serves no purpose in that location.
- **Impact:** This is a minor visual glitch that clutters the main landing area of the site.
- **Suggested Fix:** The calendar component is likely being rendered unintentionally. The CSS or component logic should be adjusted to hide this element on the homepage. It may be a component that is being used elsewhere and is incorrectly being displayed on the homepage.

## 4. Conclusion & Next Steps

The Elite Sports DJ application has a solid foundation but is currently hampered by several critical and high-priority issues that affect both the user experience and administrative functionality. 

It is recommended to address these issues in the order of severity outlined in this report. The most critical bugs should be fixed immediately to restore core functionality. Once the critical bugs are resolved, the high and medium priority issues should be addressed to improve the overall user experience and professionalism of the application.

By systematically addressing these findings, the Elite Sports DJ application can become a stable, reliable, and user-friendly platform for both customers and administrators.
