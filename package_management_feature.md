# Admin Package Management Feature Specification

This document outlines the design and architecture for a new feature that allows administrators to manage service packages directly from the admin UI.

## 1. Feature Overview

The Admin Package Management feature will provide a user-friendly interface for administrators to perform CRUD (Create, Read, Update, Delete) operations on service packages. This will eliminate the need for developers to manually edit markdown files and run seed scripts to update package information.

## 2. UI/UX Design

The UI will be designed following the principles of the Alberta Design System. It will consist of a main package list view and a modal for creating and editing packages.

### 2.1. Package List View

A new page will be created at `/admin/packages` that displays a list of all service packages in a table. The table will have the following columns:

*   **Name:** The name of the package.
*   **Slug:** The unique slug for the package.
*   **Price:** The price of the package.
*   **Popular:** A badge indicating if the package is marked as popular.
*   **Actions:** A button group with "Edit" and "Delete" actions.

A "Create Package" button will be prominently displayed at the top of the page.

### 2.2. Create/Edit Modal

Clicking the "Create Package" or "Edit" button will open a modal with a form for creating or editing a package. The form will include the following fields, based on the `packages` table schema:

*   **Name:** (Text Input) The name of the package.
*   **Slug:** (Text Input) The unique slug for the package. This field will be disabled when editing an existing package.
*   **Description:** (Text Area) A description of the package.
*   **Price (in cents):** (Number Input) The price of the package in cents.
*   **Icon:** (Text Input) The icon for the package.
*   **Popular:** (Checkbox) A checkbox to mark the package as popular.
*   **Features:** (Dynamic List of Text Inputs) A list of features for the package. The admin can add or remove features from the list.

## 3. Component Architecture

The feature will be implemented using the following new Vue components:

*   **`pages/admin/packages.vue`:** The main page for the feature. It will fetch and display the list of packages and handle the opening of the create/edit modal.
*   **`components/admin/PackageList.vue`:** A component that displays the list of packages in a table and emits events for edit and delete actions.
*   **`components/admin/PackageForm.vue`:** A form component for creating and editing packages. It will be displayed inside a modal.

## 4. Data Flow

The data will flow between the UI, the tRPC API, and the database as follows:

1.  The `pages/admin/packages.vue` component will call the `packages.getAll` tRPC endpoint to fetch the list of packages.
2.  The `PackageList.vue` component will display the list of packages.
3.  When the admin clicks the "Edit" or "Delete" button, the `PackageList.vue` component will emit an event with the package ID.
4.  The `pages/admin/packages.vue` component will handle the event and either open the edit modal or call the `packages.delete` tRPC endpoint.
5.  The `PackageForm.vue` component will call the `packages.create` or `packages.update` tRPC endpoint when the form is submitted.

## 5. API Endpoints

The existing `packages` tRPC router (`/server/trpc/routers/packages.ts`) will be used for this feature. The following endpoints are already available:

*   `packages.getAll`: Fetches all packages.
*   `packages.create`: Creates a new package.
*   `packages.update`: Updates an existing package.
*   `packages.delete`: Deletes a package.

## 6. Database Schema

No changes are required to the database schema. The existing `packages` table will be used.
