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
