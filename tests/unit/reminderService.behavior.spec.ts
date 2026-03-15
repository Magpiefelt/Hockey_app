import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  queryMock,
  sendEmailMock,
  getInvoiceSettingsMock,
  loggerInfoMock,
  loggerWarnMock,
  loggerErrorMock
} = vi.hoisted(() => ({
  queryMock: vi.fn(),
  sendEmailMock: vi.fn(),
  getInvoiceSettingsMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  loggerWarnMock: vi.fn(),
  loggerErrorMock: vi.fn()
}))

vi.mock('../../server/db/connection', () => ({
  query: queryMock
}))

vi.mock('../../server/utils/email', () => ({
  sendEmail: sendEmailMock
}))

vi.mock('../../server/services/invoiceService', () => ({
  getInvoiceSettings: getInvoiceSettingsMock
}))

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: loggerInfoMock,
    warn: loggerWarnMock,
    error: loggerErrorMock,
    debug: vi.fn()
  }
}))

import {
  getPendingReminders,
  getReminderHistory,
  saveReminderSettings,
  sendPaymentReminder
} from '../../server/services/reminderService'

describe('reminderService behavior', () => {
  beforeEach(() => {
    queryMock.mockReset()
    sendEmailMock.mockReset()
    getInvoiceSettingsMock.mockReset()
    loggerInfoMock.mockReset()
    loggerWarnMock.mockReset()
    loggerErrorMock.mockReset()
  })

  it('filters out paused orders from pending reminders', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = today.toISOString().split('T')[0]

    queryMock
      .mockResolvedValueOnce({
        rows: [{ value: { daysBefore: [7, 3, 1], daysAfter: [1, 3, 7, 14], maxReminders: 6 } }]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            order_id: 11,
            invoice_number: 'INV-11',
            amount: 12000,
            customer_snapshot: { dueDate },
            contact_name: 'Paused Customer',
            contact_email: 'paused@example.com',
            reminders_sent: '0',
            last_reminder_date: null,
            reminders_paused: true
          },
          {
            order_id: 22,
            invoice_number: 'INV-22',
            amount: 25000,
            customer_snapshot: { dueDate },
            contact_name: 'Active Customer',
            contact_email: 'active@example.com',
            reminders_sent: '0',
            last_reminder_date: null,
            reminders_paused: false
          }
        ]
      })

    const reminders = await getPendingReminders()

    expect(reminders).toHaveLength(1)
    expect(reminders[0].orderId).toBe(22)
    expect(reminders[0].reminderType).toBe('due_today')
  })

  it('falls back to query without settings table join when needed', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = today.toISOString().split('T')[0]

    queryMock
      .mockResolvedValueOnce({ rows: [{ value: { maxReminders: 6 } }] })
      .mockRejectedValueOnce(new Error('relation "settings" does not exist'))
      .mockResolvedValueOnce({
        rows: [
          {
            order_id: 77,
            invoice_number: 'INV-77',
            amount: 9900,
            customer_snapshot: { dueDate },
            contact_name: 'Fallback Customer',
            contact_email: 'fallback@example.com',
            reminders_sent: '0',
            last_reminder_date: null,
            reminders_paused: false
          }
        ]
      })

    const reminders = await getPendingReminders()

    expect(reminders).toHaveLength(1)
    expect(reminders[0].orderId).toBe(77)
    expect(loggerWarnMock).toHaveBeenCalled()
  })

  it('normalizes reminder settings safely before persisting', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const settings = await saveReminderSettings({
      daysBefore: [3, 3, -5, 2.2, 401] as any,
      daysAfter: [1, '2', 2] as any,
      maxReminders: 200 as any
    })

    expect(settings.daysBefore).toEqual([3])
    expect(settings.daysAfter).toEqual([2, 1])
    expect(settings.maxReminders).toBe(20)
  })

  it('returns false when reminder email send fails', async () => {
    getInvoiceSettingsMock.mockResolvedValue({
      companyName: 'Elite Sports DJ',
      companyEmail: 'info@example.com'
    })
    sendEmailMock.mockResolvedValue(false)

    const success = await sendPaymentReminder({
      orderId: 5,
      invoiceNumber: 'INV-5',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      amount: 10000,
      dueDate: '2026-03-20',
      daysUntilDue: 1,
      reminderType: 'upcoming',
      remindersSent: 0
    })

    expect(success).toBe(false)
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
  })

  it('returns reminder history mapped from quote_id', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          order_id: '42',
          invoice_number: 'Payment Reminder - INV-42',
          reminder_type: 'reminder_overdue',
          sent_at: new Date('2026-01-10T00:00:00.000Z'),
          email_status: 'sent',
          error_message: null
        }
      ]
    })

    const history = await getReminderHistory(42)

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("quote_id as order_id"), [42])
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("template LIKE 'reminder_%'"), [42])
    expect(history).toEqual([
      {
        id: 1,
        orderId: 42,
        invoiceNumber: 'Payment Reminder - INV-42',
        reminderType: 'reminder_overdue',
        sentAt: '2026-01-10T00:00:00.000Z',
        emailStatus: 'sent',
        errorMessage: null
      }
    ])
  })
})
