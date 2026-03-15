/**
 * Expense & Budget Service
 * Tracks real operating expenses and monthly category budgets.
 */

import { query } from '../db/connection'
import { logger } from '../utils/logger'

export const EXPENSE_CATEGORIES = [
  'travel',
  'equipment',
  'marketing',
  'software',
  'contractor',
  'taxes_fees',
  'office',
  'other'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export interface ExpenseItem {
  id: number
  description: string
  category: ExpenseCategory
  amountCents: number
  incurredOn: string
  vendor?: string
  notes?: string
  createdBy?: number
  createdAt: string
  updatedAt: string
}

export interface BudgetVsActualRow {
  category: ExpenseCategory
  budgetCents: number
  actualCents: number
  varianceCents: number
  utilizationPercent: number
}

function normalizeCategory(category?: string): ExpenseCategory {
  if (!category) return 'other'
  const normalized = category.toLowerCase().trim() as ExpenseCategory
  return EXPENSE_CATEGORIES.includes(normalized) ? normalized : 'other'
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function monthWindow(year: number, month: number): { start: string; end: string } {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 1))
  return { start: toDateOnlyString(startDate), end: toDateOnlyString(endDate) }
}

function throwIfExpenseTablesMissing(error: any): never {
  if (error?.code === '42P01') {
    throw new Error('Expense tracking tables are missing. Run database migrations first.')
  }
  throw error
}

export async function createExpense(input: {
  description: string
  category?: string
  amountCents: number
  incurredOn: string
  vendor?: string
  notes?: string
  createdBy?: number
}): Promise<ExpenseItem> {
  const category = normalizeCategory(input.category)
  const amountCents = Math.round(input.amountCents)

  if (!input.description?.trim()) {
    throw new Error('Expense description is required')
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Expense amount must be a positive integer amount in cents')
  }

  try {
    const result = await query(
      `INSERT INTO finance_expenses (
        description,
        category,
        amount_cents,
        incurred_on,
        vendor,
        notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, description, category, amount_cents, incurred_on, vendor, notes, created_by, created_at, updated_at`,
      [
        input.description.trim(),
        category,
        amountCents,
        input.incurredOn,
        input.vendor?.trim() || null,
        input.notes?.trim() || null,
        input.createdBy || null
      ]
    )

    const row = result.rows[0]
    return {
      id: row.id,
      description: row.description,
      category: normalizeCategory(row.category),
      amountCents: parseInt(row.amount_cents ?? '0') || 0,
      incurredOn: row.incurred_on?.toISOString().split('T')[0] || input.incurredOn,
      vendor: row.vendor || undefined,
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString() || new Date().toISOString()
    }
  } catch (error: any) {
    logger.error('Failed to create expense', error)
    throwIfExpenseTablesMissing(error)
  }
}

export async function updateExpense(
  expenseId: number,
  updates: {
    description?: string
    category?: string
    amountCents?: number
    incurredOn?: string
    vendor?: string
    notes?: string
  }
): Promise<ExpenseItem> {
  const sets: string[] = []
  const params: any[] = []

  if (updates.description !== undefined) {
    params.push(updates.description.trim())
    sets.push(`description = $${params.length}`)
  }
  if (updates.category !== undefined) {
    params.push(normalizeCategory(updates.category))
    sets.push(`category = $${params.length}`)
  }
  if (updates.amountCents !== undefined) {
    const amountCents = Math.round(updates.amountCents)
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new Error('Expense amount must be a positive integer amount in cents')
    }
    params.push(amountCents)
    sets.push(`amount_cents = $${params.length}`)
  }
  if (updates.incurredOn !== undefined) {
    params.push(updates.incurredOn)
    sets.push(`incurred_on = $${params.length}`)
  }
  if (updates.vendor !== undefined) {
    params.push(updates.vendor.trim() || null)
    sets.push(`vendor = $${params.length}`)
  }
  if (updates.notes !== undefined) {
    params.push(updates.notes.trim() || null)
    sets.push(`notes = $${params.length}`)
  }

  if (sets.length === 0) {
    throw new Error('No expense fields provided to update')
  }

  params.push(expenseId)
  const idParam = `$${params.length}`

  try {
    const result = await query(
      `UPDATE finance_expenses
       SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = ${idParam}
       RETURNING id, description, category, amount_cents, incurred_on, vendor, notes, created_by, created_at, updated_at`,
      params
    )

    if (result.rows.length === 0) {
      throw new Error(`Expense ${expenseId} not found`)
    }

    const row = result.rows[0]
    return {
      id: row.id,
      description: row.description,
      category: normalizeCategory(row.category),
      amountCents: parseInt(row.amount_cents ?? '0') || 0,
      incurredOn: row.incurred_on?.toISOString().split('T')[0] || '',
      vendor: row.vendor || undefined,
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString() || new Date().toISOString()
    }
  } catch (error: any) {
    logger.error('Failed to update expense', error, { expenseId })
    throwIfExpenseTablesMissing(error)
  }
}

export async function deleteExpense(expenseId: number): Promise<void> {
  try {
    await query(`DELETE FROM finance_expenses WHERE id = $1`, [expenseId])
  } catch (error: any) {
    logger.error('Failed to delete expense', error, { expenseId })
    throwIfExpenseTablesMissing(error)
  }
}

export async function listExpenses(input?: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  category?: string
}): Promise<{
  items: ExpenseItem[]
  total: number
  page: number
  limit: number
}> {
  const page = Math.max(1, input?.page || 1)
  const limit = Math.min(100, Math.max(1, input?.limit || 20))
  const offset = (page - 1) * limit

  const where: string[] = []
  const params: any[] = []

  if (input?.startDate) {
    params.push(input.startDate)
    where.push(`incurred_on >= $${params.length}`)
  }
  if (input?.endDate) {
    params.push(input.endDate)
    where.push(`incurred_on <= $${params.length}`)
  }
  if (input?.category) {
    params.push(normalizeCategory(input.category))
    where.push(`category = $${params.length}`)
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

  try {
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM finance_expenses ${whereSql}`,
      params
    )

    const paginatedParams = [...params, limit, offset]
    const listResult = await query(
      `SELECT id, description, category, amount_cents, incurred_on, vendor, notes, created_by, created_at, updated_at
       FROM finance_expenses
       ${whereSql}
       ORDER BY incurred_on DESC, id DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      paginatedParams
    )

    return {
      items: listResult.rows.map(row => ({
        id: row.id,
        description: row.description,
        category: normalizeCategory(row.category),
        amountCents: parseInt(row.amount_cents ?? '0') || 0,
        incurredOn: row.incurred_on?.toISOString().split('T')[0] || '',
        vendor: row.vendor || undefined,
        notes: row.notes || undefined,
        createdBy: row.created_by || undefined,
        createdAt: row.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: row.updated_at?.toISOString() || new Date().toISOString()
      })),
      total: parseInt(totalResult.rows[0]?.count ?? '0') || 0,
      page,
      limit
    }
  } catch (error: any) {
    logger.error('Failed to list expenses', error)
    throwIfExpenseTablesMissing(error)
  }
}

export async function getExpenseSummary(input?: {
  startDate?: string
  endDate?: string
}): Promise<{
  totalExpensesCents: number
  expenseCount: number
  averageExpenseCents: number
  byCategory: Array<{
    category: ExpenseCategory
    totalCents: number
    count: number
    percentage: number
  }>
}> {
  const now = new Date()
  const currentYearStart = toDateOnlyString(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)))
  const today = toDateOnlyString(now)
  const startDate = input?.startDate || currentYearStart
  const endDate = input?.endDate || today

  try {
    const totalsResult = await query(
      `SELECT
        COALESCE(SUM(amount_cents), 0) as total_cents,
        COUNT(*) as expense_count
       FROM finance_expenses
       WHERE incurred_on >= $1
       AND incurred_on <= $2`,
      [startDate, endDate]
    )

    const byCategoryResult = await query(
      `SELECT
        category,
        COALESCE(SUM(amount_cents), 0) as total_cents,
        COUNT(*) as expense_count
       FROM finance_expenses
       WHERE incurred_on >= $1
       AND incurred_on <= $2
       GROUP BY category
       ORDER BY total_cents DESC`,
      [startDate, endDate]
    )

    const totalExpensesCents = parseInt(totalsResult.rows[0]?.total_cents ?? '0') || 0
    const expenseCount = parseInt(totalsResult.rows[0]?.expense_count ?? '0') || 0
    const averageExpenseCents = expenseCount > 0 ? Math.round(totalExpensesCents / expenseCount) : 0

    const byCategory = byCategoryResult.rows.map(row => {
      const totalCents = parseInt(row.total_cents ?? '0') || 0
      return {
        category: normalizeCategory(row.category),
        totalCents,
        count: parseInt(row.expense_count ?? '0') || 0,
        percentage: totalExpensesCents > 0
          ? Math.round((totalCents / totalExpensesCents) * 1000) / 10
          : 0
      }
    })

    return {
      totalExpensesCents,
      expenseCount,
      averageExpenseCents,
      byCategory
    }
  } catch (error: any) {
    logger.error('Failed to get expense summary', error)
    throwIfExpenseTablesMissing(error)
  }
}

export async function upsertBudget(input: {
  year: number
  month: number
  category: string
  amountCents: number
}): Promise<{
  year: number
  month: number
  category: ExpenseCategory
  amountCents: number
}> {
  const category = normalizeCategory(input.category)
  const amountCents = Math.max(0, Math.round(input.amountCents))

  if (input.year < 2000 || input.year > 2100) {
    throw new Error('Budget year must be between 2000 and 2100')
  }
  if (input.month < 1 || input.month > 12) {
    throw new Error('Budget month must be between 1 and 12')
  }

  try {
    await query(
      `INSERT INTO finance_budgets (year, month, category, amount_cents, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (year, month, category)
       DO UPDATE SET amount_cents = EXCLUDED.amount_cents, updated_at = NOW()`,
      [input.year, input.month, category, amountCents]
    )

    return {
      year: input.year,
      month: input.month,
      category,
      amountCents
    }
  } catch (error: any) {
    logger.error('Failed to upsert budget', error)
    throwIfExpenseTablesMissing(error)
  }
}

export async function getBudgetVsActual(input: {
  year: number
  month: number
}): Promise<{
  year: number
  month: number
  rows: BudgetVsActualRow[]
  totals: {
    budgetCents: number
    actualCents: number
    varianceCents: number
    utilizationPercent: number
  }
}> {
  if (input.month < 1 || input.month > 12) {
    throw new Error('Budget month must be between 1 and 12')
  }

  const { start, end } = monthWindow(input.year, input.month)

  try {
    const result = await query(
      `WITH budget AS (
          SELECT category, SUM(amount_cents) as budget_cents
          FROM finance_budgets
          WHERE year = $1 AND month = $2
          GROUP BY category
        ),
        actual AS (
          SELECT category, SUM(amount_cents) as actual_cents
          FROM finance_expenses
          WHERE incurred_on >= $3 AND incurred_on < $4
          GROUP BY category
        ),
        categories AS (
          SELECT category FROM budget
          UNION
          SELECT category FROM actual
        )
        SELECT
          c.category,
          COALESCE(b.budget_cents, 0) as budget_cents,
          COALESCE(a.actual_cents, 0) as actual_cents
        FROM categories c
        LEFT JOIN budget b ON b.category = c.category
        LEFT JOIN actual a ON a.category = c.category
        ORDER BY c.category`,
      [input.year, input.month, start, end]
    )

    const rows: BudgetVsActualRow[] = result.rows.map(row => {
      const budgetCents = parseInt(row.budget_cents ?? '0') || 0
      const actualCents = parseInt(row.actual_cents ?? '0') || 0
      const varianceCents = budgetCents - actualCents
      const utilizationPercent = budgetCents > 0
        ? Math.round((actualCents / budgetCents) * 1000) / 10
        : (actualCents > 0 ? 100 : 0)

      return {
        category: normalizeCategory(row.category),
        budgetCents,
        actualCents,
        varianceCents,
        utilizationPercent
      }
    })

    const totals = rows.reduce((acc, row) => {
      acc.budgetCents += row.budgetCents
      acc.actualCents += row.actualCents
      acc.varianceCents += row.varianceCents
      return acc
    }, {
      budgetCents: 0,
      actualCents: 0,
      varianceCents: 0
    })

    return {
      year: input.year,
      month: input.month,
      rows,
      totals: {
        ...totals,
        utilizationPercent: totals.budgetCents > 0
          ? Math.round((totals.actualCents / totals.budgetCents) * 1000) / 10
          : (totals.actualCents > 0 ? 100 : 0)
      }
    }
  } catch (error: any) {
    logger.error('Failed to get budget vs actual', error)
    throwIfExpenseTablesMissing(error)
  }
}
