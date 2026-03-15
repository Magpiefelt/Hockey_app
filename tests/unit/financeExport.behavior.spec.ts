import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn()
}))

vi.mock('../../server/db/connection', () => ({
  query: queryMock
}))

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { buildTaxReportCsv, financeRouter } from '../../server/trpc/routers/finance'

describe('finance export behavior', () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it('escapes CSV values safely', () => {
    const csv = buildTaxReportCsv(
      [
        {
          orderId: 1,
          customerName: 'ACME, "North"',
          customerEmail: 'north@example.com',
          orderDate: '2026-03-01',
          paymentDate: '2026-03-02',
          province: 'ON',
          provinceName: 'Ontario',
          service: 'Play-by-play, premium',
          subtotal: 10000,
          gst: 0,
          pst: 0,
          hst: 1300,
          totalTax: 1300,
          total: 11300
        }
      ],
      {
        subtotal: 10000,
        gst: 0,
        pst: 0,
        hst: 1300,
        totalTax: 1300,
        total: 11300,
        orderCount: 1
      }
    )

    expect(csv).toContain('"ACME, ""North"""')
    expect(csv).toContain('"Play-by-play, premium"')
    expect(csv).toContain('SUMMARY')
  })

  it('returns CSV payload when requested', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          order_id: 10,
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          order_date: new Date('2026-01-05T00:00:00.000Z'),
          payment_date: new Date('2026-01-10T00:00:00.000Z'),
          province: 'AB',
          tax_amount: 500,
          total: 10500,
          service: 'Custom Package'
        }
      ]
    })

    const caller = financeRouter.createCaller({
      user: { userId: 1, role: 'admin' },
      event: {} as any
    })

    const report = await caller.exportTaxReport({ year: 2026, format: 'csv' })

    expect(report.mimeType).toBe('text/csv')
    expect(report.filename).toBe('tax-report-2026.csv')
    expect(typeof report.content).toBe('string')
    expect(report.content).toContain('Order ID')
    expect(report.content).toContain('SUMMARY')
  })

  it('returns JSON payload by default', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          order_id: 12,
          customer_name: 'John Smith',
          customer_email: 'john@example.com',
          order_date: new Date('2026-02-01T00:00:00.000Z'),
          payment_date: new Date('2026-02-03T00:00:00.000Z'),
          province: 'AB',
          tax_amount: 700,
          total: 14700,
          service: 'Elite Package'
        }
      ]
    })

    const caller = financeRouter.createCaller({
      user: { userId: 1, role: 'admin' },
      event: {} as any
    })

    const report = await caller.exportTaxReport({ year: 2026, format: 'json' })

    expect(report.period).toBe('2026')
    expect(report.orders).toHaveLength(1)
    expect((report as any).content).toBeUndefined()
    expect((report as any).mimeType).toBeUndefined()
  })
})
