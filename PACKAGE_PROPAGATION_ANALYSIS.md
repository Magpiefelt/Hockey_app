# Package Propagation Issue Analysis

## Problem Statement

Users can modify package information in the admin panel (`/admin/packages`), but these changes do not propagate to the customer-facing request page (`/request`).

## Root Cause

The application has **two separate data sources** for packages:

1. **Database (Dynamic)**: The admin panel uses the `packages` tRPC router which reads/writes to the `packages` database table.

2. **Static JSON (Static)**: The customer-facing request page uses Nuxt Content to load packages from `content/packages.json`.

```
Admin Panel → packages.ts router → PostgreSQL packages table
Request Page → Nuxt Content → content/packages.json (static file)
```

## Evidence

### Admin Panel (pages/admin/packages.vue)
```javascript
const fetchPackages = async () => {
  const data = await trpc.packages.getAll.query()  // ← Uses database
  packages.value = data
}
```

### Request Page (pages/request.vue)
```javascript
const { data: packagesData } = await useAsyncData('packages', () => 
  queryContent('packages').find()  // ← Uses static JSON file
)
```

## Solution

The request page should be updated to fetch packages from the database via tRPC instead of from the static JSON file. This will ensure that any changes made in the admin panel are immediately reflected on the customer-facing request page.

### Required Changes

1. **Update `pages/request.vue`**: Replace `queryContent('packages').find()` with `trpc.packages.getAll.query()`

2. **Update `PackageSelectionModal.vue`**: The component expects `price_cents` but the static JSON uses `price`. The tRPC router already converts this correctly, so this should work once we switch to the database source.

3. **Consider removing `content/packages.json`**: Once the database is the single source of truth, this file becomes redundant and could cause confusion.

## Additional Notes

- The `packages.json` file uses `price` (in cents) while the component expects `price_cents`
- The tRPC router already maps `price_cents` correctly in its response
- The database also stores `is_popular` which gets mapped to `popular` in the response
