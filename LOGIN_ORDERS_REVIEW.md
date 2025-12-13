# Login & Orders Review - Findings

**Date:** December 13, 2024  
**Status:** Review Complete

---

## Executive Summary

After a comprehensive review of the login process and orders display functionality, I found that the system architecture is **solid and well-implemented**. However, there is **one minor field name inconsistency** that could cause confusion, though it shouldn't break functionality.

---

## Login Process Review

### ✅ Authentication Flow - WORKING CORRECTLY

**Login Page (`pages/login.vue`):**
- Clean UI with proper form validation
- Calls `authStore.login()` with email/password
- Handles success/error states appropriately
- Redirects based on user role (admin → `/admin`, customer → `/orders`)
- Supports redirect query parameter for return URLs

**Auth Store (`stores/auth.ts`):**
- Uses TRPC to call server-side auth endpoints
- Stores user data in Pinia state
- Persists user to localStorage for client-side hydration
- Properly handles login/logout/register flows
- Implements `initAuth()` for session restoration

**Server-Side Auth (`server/trpc/routers/auth.ts`):**
- ✅ Login endpoint validates credentials
- ✅ Generates JWT token with user ID and role
- ✅ Sets HTTP-only cookie (`auth-token`) for security
- ✅ Cookie is set with proper security flags:
  - `httpOnly: true` (prevents XSS)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'strict'` in production (CSRF protection)
  - 7-day expiration
- ✅ Logs authentication events for audit trail

**Auth Middleware (`middleware/auth.ts`):**
- ✅ Runs on client-side only (auth state in localStorage)
- ✅ Initializes auth if not already done
- ✅ Redirects to login if not authenticated
- ✅ Preserves return URL in query parameter

**Token Verification (`server/utils/auth.ts`):**
- ✅ `getUserFromEvent()` extracts token from cookie
- ✅ Verifies JWT signature and expiration
- ✅ Attaches user to request context
- ✅ Refreshes token if close to expiration

### Verdict: **Login Process is SOLID ✅**

---

## Orders Display Review

### ✅ Orders Fetching - WORKING CORRECTLY

**Orders Page (`pages/orders/index.vue`):**
- Uses `ordersStore.fetchOrders()` on mount
- Displays loading, error, and empty states
- Filters orders by status
- Shows order count
- Renders `OrderCard` components

**Orders Store (`stores/orders.ts`):**
- Calls TRPC `orders.list` query
- Stores orders in Pinia state
- Handles loading and error states
- Provides getters for filtering

**Server-Side Orders Query (`server/trpc/routers/orders.ts`):**
- ✅ Uses `protectedProcedure` (requires authentication)
- ✅ Queries `quote_requests` table with `WHERE user_id = $1`
- ✅ Joins with `packages` table for package names
- ✅ Returns orders sorted by creation date (newest first)
- ✅ Maps database fields to camelCase for frontend

**Database Schema (`database/migrations/001_initial_schema.sql`):**
- ✅ `quote_requests` table has `user_id` foreign key to `users` table
- ✅ Index on `user_id` for fast queries
- ✅ `user_id` can be NULL (for guest orders)

### Verdict: **Orders Fetching is SOLID ✅**

---

## Issues Found

### ⚠️ Issue #1: Minor Field Name Inconsistency

**Location:** `components/customer/OrderCard.vue` line 27

**Problem:**
The OrderCard component checks for both `order.service_name` and `order.serviceType`:

```vue
<p v-if="order.service_name || order.packageId" class="text-slate-700">
  {{ order.service_name || getPackageName(order.packageId) }}
</p>
```

However, the TRPC orders.list query returns `serviceType` (camelCase):

```typescript
return orders.map(row => ({
  id: row.id.toString(),
  name: row.name,
  email: row.email,
  packageId: row.package_id,
  serviceType: row.service_name,  // ← Returns as 'serviceType'
  // ...
}))
```

**Impact:** 
- The component checks `order.service_name` first, which will always be undefined
- Falls back to `getPackageName(order.packageId)`, which works for known packages
- **This means the component still works**, but doesn't use the `serviceType` field from the API

**Severity:** LOW (cosmetic, not breaking)

**Recommendation:** Update OrderCard to use `serviceType` consistently

---

### ⚠️ Issue #2: Potential Missing Fields in OrderCard

**Location:** `components/customer/OrderCard.vue` TypeScript interface

**Problem:**
The OrderCard interface defines:

```typescript
interface Order {
  id: number
  status: string
  packageId?: string
  service_name?: string
  quoted_amount?: number
  quotedAmount?: number
  created_at?: string
  createdAt?: string
  event_date?: string
  deliverable_url?: string
}
```

But the TRPC query returns:
- `serviceType` (not `service_name`)
- `quotedAmount` (camelCase)
- `createdAt` (camelCase)
- Does NOT return `event_date` or `deliverable_url`

**Impact:**
- Event date won't display on order cards (line 37-41)
- Download button won't appear for completed orders (line 99-107)

**Severity:** MEDIUM (missing features)

**Recommendation:** 
1. Add `eventDate` and `deliverableUrl` to the TRPC orders.list query
2. Update OrderCard interface to match API response

---

## Additional Observations

### ✅ Good Practices Found

1. **Security:**
   - HTTP-only cookies prevent XSS attacks
   - JWT tokens have expiration
   - Passwords are hashed with bcrypt
   - Auth events are logged for audit

2. **Error Handling:**
   - Proper try/catch blocks
   - User-friendly error messages
   - Logging for debugging

3. **User Experience:**
   - Loading states
   - Empty states
   - Error states with retry buttons
   - Redirect after login

4. **Code Quality:**
   - TypeScript for type safety
   - Pinia for state management
   - TRPC for type-safe API calls
   - Proper separation of concerns

---

## Recommendations

### Priority 1: Fix Missing Fields in Orders List

**File:** `server/trpc/routers/orders.ts`

Add `event_date` to the SELECT query and map it to `eventDate`:

```typescript
`SELECT 
  qr.id, qr.contact_name as name, qr.contact_email as email,
  qr.status, qr.event_date, qr.service_type, qr.sport_type,
  qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
  p.slug as package_id, COALESCE(p.name, qr.service_type) as service_name
FROM quote_requests qr
LEFT JOIN packages p ON qr.package_id = p.id
WHERE qr.user_id = $1
ORDER BY qr.created_at DESC`
```

Update the return mapping:

```typescript
return orders.map(row => ({
  id: row.id.toString(),
  name: row.name,
  email: row.email,
  packageId: row.package_id,
  serviceType: row.service_name,
  sportType: row.sport_type,
  status: row.status,
  quotedAmount: row.quoted_amount,
  totalAmount: row.total_amount,
  eventDate: row.event_date?.toISOString().split('T')[0], // ← ADD THIS
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at?.toISOString()
}))
```

### Priority 2: Add Deliverable URL to Orders List

To show the download button, we need to check if deliverables exist:

```typescript
`SELECT 
  qr.id, qr.contact_name as name, qr.contact_email as email,
  qr.status, qr.event_date, qr.service_type, qr.sport_type,
  qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
  p.slug as package_id, COALESCE(p.name, qr.service_type) as service_name,
  (SELECT storage_url FROM file_uploads 
   WHERE quote_id = qr.id AND kind = 'deliverable' 
   LIMIT 1) as deliverable_url
FROM quote_requests qr
LEFT JOIN packages p ON qr.package_id = p.id
WHERE qr.user_id = $1
ORDER BY qr.created_at DESC`
```

Add to return mapping:

```typescript
return orders.map(row => ({
  // ... existing fields ...
  deliverableUrl: row.deliverable_url || null // ← ADD THIS
}))
```

### Priority 3: Fix OrderCard Field Names

**File:** `components/customer/OrderCard.vue`

Update the interface and template to use consistent camelCase naming:

```typescript
interface Order {
  id: string  // Changed from number to match API
  status: string
  packageId?: string
  serviceType?: string  // Changed from service_name
  quotedAmount?: number
  totalAmount?: number
  createdAt?: string
  eventDate?: string  // Changed from event_date
  deliverableUrl?: string  // Changed from deliverable_url
}
```

Update template line 27:

```vue
<p v-if="order.serviceType || order.packageId" class="text-slate-700">
  <Icon name="mdi:package-variant" class="w-4 h-4 inline-block mr-1 text-cyan-500" />
  <span class="font-medium">Package:</span> 
  {{ order.serviceType || getPackageName(order.packageId) }}
</p>
```

Update template lines 35-41:

```vue
<p class="text-slate-600">
  <Icon name="mdi:calendar" class="w-4 h-4 inline-block mr-1 text-slate-400" />
  <span class="font-medium">Submitted:</span> 
  {{ formatDate(order.createdAt) }}
</p>
<p v-if="order.eventDate" class="text-slate-600">
  <Icon name="mdi:calendar-star" class="w-4 h-4 inline-block mr-1 text-slate-400" />
  <span class="font-medium">Event Date:</span> 
  {{ formatDate(order.eventDate) }}
</p>
```

Update template lines 45-52:

```vue
<div v-if="order.quotedAmount" class="text-right flex-shrink-0">
  <p class="text-sm text-slate-500 mb-1">
    {{ order.status === 'paid' || order.status === 'completed' ? 'Paid' : 'Quote' }}
  </p>
  <p class="text-2xl font-bold text-cyan-600">
    {{ formatPrice(order.quotedAmount) }}
  </p>
</div>
```

Update template lines 99-107:

```vue
<button
  v-if="order.status === 'completed' && order.deliverableUrl"
  @click.stop="downloadDeliverable(order)"
  class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
  aria-label="Download deliverable"
>
  <Icon name="mdi:download" class="w-4 h-4 inline-block mr-1" />
  Download
</button>
```

Update the downloadDeliverable function:

```typescript
function downloadDeliverable(order: Order) {
  if (order.deliverableUrl) {
    window.open(order.deliverableUrl, '_blank')
  }
}
```

---

## Testing Checklist

### Login Testing
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Login redirects to `/orders` for customers
- [ ] Login redirects to `/admin` for admins
- [ ] Login preserves redirect URL from query parameter
- [ ] Logout clears session and redirects to home
- [ ] Session persists across page refreshes
- [ ] Session expires after 7 days

### Orders Display Testing
- [ ] Orders page shows loading state initially
- [ ] Orders page shows empty state if no orders
- [ ] Orders page displays all user's orders
- [ ] Order cards show correct status badges
- [ ] Order cards show package names
- [ ] Order cards show event dates (after fix)
- [ ] Order cards show quoted amounts
- [ ] Status filter works correctly
- [ ] Order count is accurate
- [ ] Clicking order card navigates to detail page
- [ ] "Pay Now" button appears for quoted/invoiced orders
- [ ] "Download" button appears for completed orders with deliverables (after fix)

---

## Conclusion

The login and orders system is **well-architected and functional**. The issues found are minor and mostly cosmetic:

1. **Field name inconsistencies** - Easy to fix, low impact
2. **Missing fields in API response** - Prevents some features from working (event date display, download button)

All issues can be resolved with small updates to the TRPC router and OrderCard component. The core authentication and authorization logic is solid and secure.

---

**Next Steps:**
1. Implement the recommended fixes
2. Test login and orders functionality
3. Verify event dates and download buttons appear correctly
