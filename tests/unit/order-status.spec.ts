import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_LABELS,
  MANUAL_COMPLETION_BLOCKED_STATUSES,
  getAllowedOrderTransitions,
  isTerminalOrderStatus,
  isValidOrderStatusTransition
} from '../../server/utils/order-status'

describe('order status utils', () => {
  it('returns allowed transitions for known statuses', () => {
    expect(getAllowedOrderTransitions('paid')).toEqual(['completed', 'delivered', 'refunded'])
    expect(getAllowedOrderTransitions('cancelled')).toEqual([])
  })

  it('returns empty transitions for unknown statuses', () => {
    expect(getAllowedOrderTransitions('not_a_real_status')).toEqual([])
  })

  it('validates transitions consistently', () => {
    expect(isValidOrderStatusTransition('submitted', 'quoted')).toBe(true)
    expect(isValidOrderStatusTransition('submitted', 'paid')).toBe(false)
  })

  it('identifies terminal statuses', () => {
    expect(isTerminalOrderStatus('cancelled')).toBe(true)
    expect(isTerminalOrderStatus('refunded')).toBe(true)
    expect(isTerminalOrderStatus('paid')).toBe(false)
  })

  it('exposes labels and manual completion blocked statuses', () => {
    expect(ORDER_STATUS_LABELS.refunded).toBe('Refunded')
    expect(MANUAL_COMPLETION_BLOCKED_STATUSES.has('completed')).toBe(true)
    expect(MANUAL_COMPLETION_BLOCKED_STATUSES.has('paid')).toBe(false)
  })
})
