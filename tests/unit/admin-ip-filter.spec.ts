import { describe, expect, it } from 'vitest'

import { shouldApplyAdminIpFilter } from '../../server/utils/admin-ip-filter'

describe('admin IP filter path matching', () => {
  it('matches admin namespaces directly', () => {
    expect(shouldApplyAdminIpFilter('/api/trpc/admin.dashboard')).toBe(true)
    expect(shouldApplyAdminIpFilter('/api/trpc/finance.stats')).toBe(true)
    expect(shouldApplyAdminIpFilter('/api/trpc/financeAutomation.getFinancialSummary')).toBe(true)
    expect(shouldApplyAdminIpFilter('/api/trpc/adminEnhancements.analytics')).toBe(true)
  })

  it('matches batched requests containing admin namespaces', () => {
    expect(shouldApplyAdminIpFilter('/api/trpc/orders.list,admin.orders.list')).toBe(true)
    expect(shouldApplyAdminIpFilter('/api/trpc/auth.me,payments.getStatus')).toBe(true)
  })

  it('does not match non-admin namespaces', () => {
    expect(shouldApplyAdminIpFilter('/api/trpc/orders.list')).toBe(false)
    expect(shouldApplyAdminIpFilter('/api/trpc/auth.login')).toBe(false)
    expect(shouldApplyAdminIpFilter('/api/trpc/content.faqPublic')).toBe(false)
  })

  it('does not match non-trpc routes', () => {
    expect(shouldApplyAdminIpFilter('/api/health')).toBe(false)
    expect(shouldApplyAdminIpFilter('/admin')).toBe(false)
  })
})
