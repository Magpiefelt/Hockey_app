export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  submitted: 'Submitted',
  in_progress: 'In Progress',
  quoted: 'Quoted',
  quote_viewed: 'Quote Viewed',
  quote_accepted: 'Quote Accepted',
  invoiced: 'Invoiced',
  paid: 'Paid',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded'
} as const

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS

export const ORDER_STATUS_VALUES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['submitted', 'cancelled'],
  submitted: ['in_progress', 'quoted', 'cancelled'],
  in_progress: ['quoted', 'cancelled'],
  quoted: ['invoiced', 'in_progress', 'cancelled'],
  quote_viewed: ['invoiced', 'in_progress', 'cancelled'],
  quote_accepted: ['invoiced', 'in_progress', 'cancelled'],
  invoiced: ['paid', 'cancelled'],
  paid: ['completed', 'delivered', 'refunded'],
  completed: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: []
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'gray',
  submitted: 'blue',
  in_progress: 'yellow',
  quoted: 'purple',
  quote_viewed: 'purple',
  quote_accepted: 'green',
  invoiced: 'orange',
  paid: 'green',
  completed: 'green',
  delivered: 'green',
  cancelled: 'red',
  refunded: 'orange'
}

// Manual completion should not run on already-finalized orders.
export const MANUAL_COMPLETION_BLOCKED_STATUSES = new Set<OrderStatus>([
  'completed',
  'delivered',
  'cancelled',
  'refunded'
])

export function getAllowedOrderTransitions(currentStatus: string): OrderStatus[] {
  if (!(currentStatus in ORDER_STATUS_TRANSITIONS)) {
    return []
  }
  return ORDER_STATUS_TRANSITIONS[currentStatus as OrderStatus]
}

export function isValidOrderStatusTransition(currentStatus: string, nextStatus: string): boolean {
  return getAllowedOrderTransitions(currentStatus).includes(nextStatus as OrderStatus)
}

export function isTerminalOrderStatus(status: string): boolean {
  return getAllowedOrderTransitions(status).length === 0
}

// ---------------------------------------------------------------------------
// SQL-safe status group constants
// Use these in template literals so that adding/renaming a status only
// requires a change in one place.
// ---------------------------------------------------------------------------

/** Statuses that count as "revenue-generating" (payment received or later). */
export const PAID_STATUSES: readonly OrderStatus[] = ['paid', 'completed', 'delivered'] as const
export const PAID_STATUS_SQL = `status IN ('paid', 'completed', 'delivered')`

/** Statuses where a payment is expected but not yet received. */
export const PENDING_PAYMENT_STATUSES: readonly OrderStatus[] = ['quoted', 'invoiced'] as const
export const PENDING_PAYMENT_SQL = `status IN ('quoted', 'invoiced')`

/** Active/open order statuses (not yet paid, not cancelled/refunded). */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ['submitted', 'quoted', 'in_progress'] as const
export const ACTIVE_STATUS_SQL = `status IN ('submitted', 'quoted', 'in_progress')`
