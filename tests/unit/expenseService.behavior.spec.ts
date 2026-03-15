import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock, loggerErrorMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  loggerErrorMock: vi.fn()
}))

vi.mock('../../server/db/connection', () => ({
  query: queryMock
}))

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: loggerErrorMock,
    debug: vi.fn()
  }
}))

import { createExpense, getBudgetVsActual, getExpenseSummary } from '../../server/services/expenseService'

describe('expenseService behavior', () => {
  beforeEach(() => {
    queryMock.mockReset()
    loggerErrorMock.mockReset()
  })

  it('creates an expense with normalized category', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 101,
          description: 'Arena parking',
          category: 'travel',
          amount_cents: 2500,
          incurred_on: new Date('2026-03-01T00:00:00.000Z'),
          vendor: 'Downtown Parkade',
          notes: 'Home game',
          created_by: 1,
          created_at: new Date('2026-03-01T12:00:00.000Z'),
          updated_at: new Date('2026-03-01T12:00:00.000Z')
        }
      ]
    })

    const expense = await createExpense({
      description: 'Arena parking',
      category: 'Travel',
      amountCents: 2500,
      incurredOn: '2026-03-01',
      vendor: 'Downtown Parkade',
      notes: 'Home game',
      createdBy: 1
    })

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO finance_expenses'),
      expect.arrayContaining(['Arena parking', 'travel', 2500, '2026-03-01'])
    )
    expect(expense.category).toBe('travel')
    expect(expense.amountCents).toBe(2500)
  })

  it('builds expense summary percentages from actual totals', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ total_cents: '30000', expense_count: '2' }]
      })
      .mockResolvedValueOnce({
        rows: [
          { category: 'travel', total_cents: '20000', expense_count: '1' },
          { category: 'other', total_cents: '10000', expense_count: '1' }
        ]
      })

    const summary = await getExpenseSummary({
      startDate: '2026-01-01',
      endDate: '2026-03-31'
    })

    expect(summary.totalExpensesCents).toBe(30000)
    expect(summary.expenseCount).toBe(2)
    expect(summary.averageExpenseCents).toBe(15000)
    expect(summary.byCategory[0]).toMatchObject({
      category: 'travel',
      totalCents: 20000,
      percentage: 66.7
    })
  })

  it('computes budget vs actual totals and utilization', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { category: 'travel', budget_cents: '50000', actual_cents: '40000' },
        { category: 'marketing', budget_cents: '0', actual_cents: '10000' }
      ]
    })

    const snapshot = await getBudgetVsActual({ year: 2026, month: 3 })

    expect(snapshot.rows).toHaveLength(2)
    expect(snapshot.rows[0]).toMatchObject({
      category: 'travel',
      budgetCents: 50000,
      actualCents: 40000,
      varianceCents: 10000,
      utilizationPercent: 80
    })
    expect(snapshot.rows[1]).toMatchObject({
      category: 'marketing',
      budgetCents: 0,
      actualCents: 10000,
      varianceCents: -10000,
      utilizationPercent: 100
    })
    expect(snapshot.totals).toMatchObject({
      budgetCents: 50000,
      actualCents: 50000,
      varianceCents: 0,
      utilizationPercent: 100
    })
  })
})
