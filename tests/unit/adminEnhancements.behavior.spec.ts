import { describe, expect, it } from 'vitest'

import {
  canReviseQuoteFromStatus,
  canSubmitQuoteFromStatus,
  escapeAdminExportCsvCell,
  normalizeOptionalTaxAmount
} from '../../server/trpc/routers/admin-enhancements'

describe('admin enhancements behavior helpers', () => {
  it('allows quote submission from editable statuses only', () => {
    expect(canSubmitQuoteFromStatus('submitted')).toBe(true)
    expect(canSubmitQuoteFromStatus('in_progress')).toBe(true)
    expect(canSubmitQuoteFromStatus('quoted')).toBe(true)
    expect(canSubmitQuoteFromStatus('quote_viewed')).toBe(true)

    expect(canSubmitQuoteFromStatus('quote_accepted')).toBe(false)
    expect(canSubmitQuoteFromStatus('invoiced')).toBe(false)
    expect(canSubmitQuoteFromStatus('paid')).toBe(false)
  })

  it('allows quote revisions only for quoted states', () => {
    expect(canReviseQuoteFromStatus('quoted')).toBe(true)
    expect(canReviseQuoteFromStatus('quote_viewed')).toBe(true)
    expect(canReviseQuoteFromStatus('submitted')).toBe(false)
    expect(canReviseQuoteFromStatus('invoiced')).toBe(false)
    expect(canReviseQuoteFromStatus('cancelled')).toBe(false)
  })

  it('normalizes optional tax amount without overwriting by default', () => {
    expect(normalizeOptionalTaxAmount(undefined)).toBeNull()
    expect(normalizeOptionalTaxAmount(0)).toBe(0)
    expect(normalizeOptionalTaxAmount(725)).toBe(725)
  })

  it('escapes CSV cells and neutralizes spreadsheet formulas', () => {
    expect(escapeAdminExportCsvCell('Normal Value')).toBe('Normal Value')
    expect(escapeAdminExportCsvCell('Hello, "World"')).toBe('"Hello, ""World"""')
    expect(escapeAdminExportCsvCell('=2+2')).toBe("'=2+2")
    expect(escapeAdminExportCsvCell('@cmd')).toBe("'@cmd")
  })
})
