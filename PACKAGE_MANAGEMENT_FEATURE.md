# Admin Package Management Feature

**Author:** Manus AI  
**Date:** January 11, 2026

This document provides a comprehensive specification and implementation guide for the Admin Package Management feature in the Hockey_app. The feature enables administrators to create, edit, and delete service packages directly from the admin UI, eliminating the need for manual database manipulation or code changes.

---

## Executive Summary

The current package management workflow requires developers to edit markdown files in the `content/packages/` directory and run seed scripts to update the database. This approach creates friction for non-technical administrators and introduces unnecessary deployment cycles for simple content changes.

The new Admin Package Management feature provides a web-based interface that allows administrators to manage packages in real-time. Changes are persisted directly to the database and reflected immediately on the public-facing request form.

---

## Current Implementation Analysis

### Existing Package Data Sources

The application currently maintains package data in two locations, which creates potential synchronization issues:

| Location | Purpose | Format |
|----------|---------|--------|
| `content/packages/*.md` | Nuxt Content source for static rendering | Markdown with YAML frontmatter |
| `packages` database table | Runtime data source for tRPC API | PostgreSQL rows with JSONB features |

### Database Schema

The `packages` table in PostgreSQL stores the following fields:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key |
| `slug` | VARCHAR(50) | Unique identifier used in URLs |
| `name` | VARCHAR(100) | Display name of the package |
| `description` | TEXT | Package description |
| `price_cents` | INTEGER | Price in cents (0 for "Contact for pricing") |
| `currency` | VARCHAR(10) | Currency code (default: 'usd') |
| `is_popular` | BOOLEAN | Flag for highlighting popular packages |
| `features` | JSONB | Array of feature strings |
| `icon` | VARCHAR(10) | Emoji icon for the package |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Existing API Endpoints

The `packages` tRPC router (`/server/trpc/routers/packages.ts`) already provides the necessary CRUD operations:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `packages.getAll` | Query | Public | Fetches all packages |
| `packages.getBySlug` | Query | Public | Fetches a single package by slug |
| `packages.create` | Mutation | Admin | Creates a new package |
| `packages.update` | Mutation | Admin | Updates an existing package |
| `packages.delete` | Mutation | Admin | Deletes a package |

---

## Feature Implementation

### New Files Created

The implementation consists of two new Vue components that integrate seamlessly with the existing admin UI:

**1. `/pages/admin/packages.vue`** - The main package management page that displays a table of all packages with actions for creating, editing, and deleting packages.

**2. `/components/admin/PackageFormModal.vue`** - A reusable modal component containing the form for creating and editing packages. The form includes validation and supports dynamic feature list management.

### Modified Files

**`/pages/admin/dashboard.vue`** - Updated to include a "Manage Packages" quick action card in the admin dashboard, providing easy access to the new feature.

---

## UI/UX Design

The UI design follows the Alberta Design System principles and maintains consistency with the existing admin interface. Key design decisions include:

### Package List View

The package list is displayed in a table format with the following columns: Icon, Name, Slug, Price, Status (Popular badge), Features count, and Actions. This layout provides administrators with a comprehensive overview of all packages at a glance.

The table supports the following interactions:
- **Edit:** Opens the package form modal pre-populated with the package data
- **Delete:** Opens a confirmation dialog before permanently removing the package

### Create/Edit Modal

The package form modal provides a clean, focused interface for package management. The form includes:

- **Name field:** Required text input for the package display name
- **Slug field:** Required text input for the URL-safe identifier (disabled when editing)
- **Description field:** Optional textarea for package description
- **Price field:** Number input for price in cents (0 indicates "Contact for pricing")
- **Icon field:** Text input for emoji icon
- **Popular checkbox:** Toggle for highlighting the package
- **Features list:** Dynamic list of text inputs with add/remove functionality

### Validation

The form implements client-side validation with the following rules:

| Field | Validation Rules |
|-------|------------------|
| Name | Required, non-empty |
| Slug | Required, lowercase letters, numbers, and hyphens only |
| Price | Non-negative integer |

Server-side validation is handled by the existing tRPC router with Zod schemas.

---

## Data Flow Architecture

The feature follows the established patterns in the application:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin UI      │────▶│   tRPC Client   │────▶│   tRPC Router   │
│  (Vue Pages)    │◀────│   (useTrpc)     │◀────│   (packages.ts) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   (packages)    │
                                               └─────────────────┘
```

### State Management

The package list page manages its own local state using Vue's Composition API. The state includes:
- `packages`: Array of package objects fetched from the API
- `loading`: Boolean flag for loading state
- `error`: Error message string (if any)
- `showModal`: Boolean flag for modal visibility
- `editingPackage`: The package being edited (null for create mode)

---

## Integration Points

### Public Request Form

The public request form (`/pages/request.vue`) already fetches packages from Nuxt Content. To ensure consistency, the application should be updated to fetch packages from the tRPC API instead. This change will ensure that package updates made through the admin UI are immediately reflected on the public form.

### Navigation

The admin dashboard has been updated to include a "Manage Packages" quick action card. The navigation structure now includes:

| Route | Page | Description |
|-------|------|-------------|
| `/admin/dashboard` | Dashboard | Overview with quick actions |
| `/admin/orders` | Orders | Order management |
| `/admin/customers` | Customers | Customer management |
| `/admin/finance` | Finance | Financial reports |
| `/admin/calendar` | Calendar | Date blocking |
| `/admin/packages` | **Packages** | **Package management (NEW)** |

---

## Migration Considerations

### Deprecating Markdown Files

Once the admin package management feature is in production, the markdown files in `content/packages/` should be considered deprecated. The recommended migration path is:

1. Deploy the new feature to production
2. Verify all packages exist in the database
3. Remove the `content/packages/` directory
4. Update any code that references Nuxt Content for packages to use the tRPC API

### Request Form Update

The request form currently uses Nuxt Content to fetch packages. To complete the integration, update the form to use the tRPC API:

```typescript
// Before (Nuxt Content)
const { data: packagesData } = await useAsyncData('packages', () => 
  queryContent('packages').find()
)

// After (tRPC API)
const trpc = useTrpc()
const { data: packagesData } = await useAsyncData('packages', () => 
  trpc.packages.getAll.query()
)
```

---

## Security Considerations

The feature leverages the existing authentication and authorization infrastructure:

- All mutation endpoints (`create`, `update`, `delete`) are protected by the `adminProcedure` middleware
- The admin pages are protected by the `admin` middleware that verifies the user's role
- Input validation is performed on both client and server sides

---

## Testing Recommendations

The following test scenarios should be covered:

| Scenario | Expected Result |
|----------|-----------------|
| Create package with valid data | Package created, appears in list |
| Create package with duplicate slug | Error message displayed |
| Edit package name | Name updated in list |
| Edit package price | Price updated in list |
| Delete package | Package removed from list |
| Add/remove features | Features updated correctly |
| Form validation | Error messages displayed for invalid input |
| Unauthorized access | Redirect to login page |

---

## Files Reference

The complete implementation consists of the following files:

| File | Type | Description |
|------|------|-------------|
| `/pages/admin/packages.vue` | New | Main package management page |
| `/components/admin/PackageFormModal.vue` | New | Create/edit form modal |
| `/pages/admin/dashboard.vue` | Modified | Added quick action link |
| `/server/trpc/routers/packages.ts` | Existing | API endpoints (no changes needed) |

---

## Conclusion

The Admin Package Management feature provides a significant improvement to the administrative workflow by enabling real-time package management through a user-friendly interface. The implementation follows established patterns in the codebase and integrates seamlessly with the existing admin UI.

The feature is ready for deployment and testing. Future enhancements could include package ordering/sorting, package categories, and package versioning.
