# Manual Order Completion - Work Breakdown and Gap Analysis

## Identified Gaps and Issues

### 1. Database Schema Gaps

**Issue**: The `payments` table requires an `invoice_id` (NOT NULL constraint), but manual completions bypass the invoice creation process.

**Current Schema**:
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(100) UNIQUE,
  ...
);
```

**Solution Options**:
- **Option A (Recommended)**: Create a "manual" invoice record alongside the payment record. This maintains referential integrity and allows the order to appear correctly in finance reports.
- **Option B**: Modify the schema to allow `invoice_id` to be NULL for manual payments. This requires a migration and may break existing queries.

**Decision**: Use Option A - Create both invoice and payment records for manual completions.

### 2. Status Validation Inconsistencies

**Issue**: The `quote_viewed` and `quote_accepted` statuses exist in migrations and some routers but are missing from:
- `/server/utils/validation.ts` - `isValidOrderStatus()` function
- `/server/db/schema.sql` - base schema CHECK constraint

**Impact**: The validation function may reject valid statuses.

**Solution**: Update the validation function to include all valid statuses.

### 3. Status Transition Rules

**Issue**: Current transition rules don't allow direct transition from early statuses (submitted, in_progress, quoted) to `completed`. The manual completion feature needs to bypass the normal flow.

**Current Valid Transitions**:
- `submitted` → `in_progress`, `quoted`, `cancelled`
- `quoted` → `invoiced`, `in_progress`, `cancelled`
- `paid` → `completed`, `delivered`

**Solution**: The `manualComplete` endpoint will explicitly bypass normal transition validation since it's a special admin action.

### 4. Revenue Tracking Consistency

**Issue**: Finance reports query `total_amount` from `quote_requests` for revenue calculations. Manual completions must set this field correctly.

**Example Query**:
```sql
SELECT COALESCE(SUM(total_amount), 0) as revenue 
FROM quote_requests 
WHERE status IN ('paid', 'completed', 'delivered')
```

**Solution**: The manual completion endpoint must set both `quoted_amount` and `total_amount` fields.

### 5. Email Template Missing

**Issue**: No email template exists for manual order completion confirmation.

**Solution**: Create `sendManualCompletionEmail` function in `/server/utils/email-enhanced.ts`.

### 6. Audit Trail Requirements

**Issue**: Manual completions need proper audit logging for accountability.

**Required Logging**:
- Entry in `order_status_history` table
- Entry in `audit_logs` table (if comprehensive audit is needed)
- Record of who performed the action and when

---

## Work Breakdown Structure

### Chunk 1: Backend - tRPC Endpoint (admin.ts)
**Files Modified**: `/server/trpc/routers/admin.ts`

**Tasks**:
1. Add new `manualComplete` mutation to admin router
2. Implement transaction-based logic:
   - Validate order exists and is not already completed/cancelled
   - Create invoice record with `manual_` prefix identifier
   - Create payment record linked to invoice
   - Update order status to `completed`
   - Set `quoted_amount` and `total_amount`
   - Log status change in `order_status_history`
3. Add optional email sending logic (disabled by default)

### Chunk 2: Backend - Email Template (email-enhanced.ts)
**Files Modified**: `/server/utils/email-enhanced.ts`

**Tasks**:
1. Create `ManualCompletionEmailData` interface
2. Implement `sendManualCompletionEmail` function
3. Design email template matching existing style

### Chunk 3: Backend - Validation Update (validation.ts)
**Files Modified**: `/server/utils/validation.ts`

**Tasks**:
1. Add `quote_viewed` and `quote_accepted` to valid statuses
2. Ensure consistency with database constraints

### Chunk 4: Frontend - Modal Component
**Files Created**: `/components/admin/ManualCompletionModal.vue`

**Tasks**:
1. Create modal following existing patterns (OrderEditModal, EnhancedQuoteModal)
2. Include form fields:
   - Completion amount (required)
   - Admin notes (optional)
   - Send email checkbox (unchecked by default)
3. Add validation and error handling
4. Implement submit logic calling tRPC endpoint

### Chunk 5: Frontend - Integration into Order Detail Page
**Files Modified**: `/pages/admin/orders/[id].vue`

**Tasks**:
1. Import and register ManualCompletionModal component
2. Add "Complete Manually" button (conditionally rendered)
3. Add modal state management
4. Handle successful completion (refresh order data)

### Chunk 6: Database Migration (Optional)
**Files Created**: `/database/migrations/008_manual_completion_support.sql`

**Tasks**:
1. Add `payment_method` column to payments table (values: 'stripe', 'manual', 'other')
2. Update invoice status constraint to include 'manual' if needed

---

## Implementation Order

1. **Chunk 3**: Validation update (quick fix, no dependencies)
2. **Chunk 1**: Backend endpoint (core functionality)
3. **Chunk 2**: Email template (supports backend)
4. **Chunk 4**: Frontend modal component
5. **Chunk 5**: Frontend integration
6. **Chunk 6**: Database migration (optional, for future tracking)

---

## Testing Checklist

- [ ] Manual completion creates proper invoice record
- [ ] Manual completion creates proper payment record
- [ ] Order status updates to 'completed'
- [ ] `total_amount` is set correctly
- [ ] Status history is logged
- [ ] Email is NOT sent by default
- [ ] Email IS sent when checkbox is checked
- [ ] Finance dashboard shows correct revenue
- [ ] Order appears in completed orders list
- [ ] Error handling for invalid orders
- [ ] Error handling for already completed orders
