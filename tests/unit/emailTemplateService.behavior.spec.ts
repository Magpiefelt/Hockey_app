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

describe('emailTemplateService behavior', () => {
  beforeEach(() => {
    vi.resetModules()
    queryMock.mockReset()
  })

  it('renders preview with template placeholders', async () => {
    const service = await import('../../server/services/emailTemplateService')
    const preview = await service.previewManagedEmailTemplate({
      templateKey: 'custom',
      subject: 'Hello {{name}}',
      body: '<p>Order #{{orderId}} is {{message}}</p>',
      context: {
        name: 'Taylor',
        orderId: 44,
        message: 'ready'
      }
    })

    expect(preview.subject).toBe('Hello Taylor')
    expect(preview.html).toContain('Order #44 is ready')
  })

  it('rejects unknown placeholders when saving an override', async () => {
    const service = await import('../../server/services/emailTemplateService')

    await expect(
      service.saveManagedEmailTemplate({
        templateKey: 'custom',
        enabled: true,
        subject: 'Hello {{unknownField}}',
        body: '<p>Hi {{name}}</p>',
        updatedBy: 1
      })
    ).rejects.toThrow('Unknown template variables')
  })

  it('applies stored template overrides during resolution', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          value: {
            version: 1,
            templates: {
              custom: {
                enabled: true,
                subject: 'Update for Order #{{orderId}}',
                body: '<p>{{message}}</p>',
                updatedAt: '2026-03-15T12:00:00.000Z',
                updatedBy: 1
              }
            }
          }
        }
      ]
    })

    const service = await import('../../server/services/emailTemplateService')
    const resolved = await service.resolveManagedEmailTemplate('custom', {
      subject: 'Fallback Subject',
      html: '<p>Fallback Body</p>',
      metadata: {
        orderId: 91,
        message: 'Your files are ready'
      }
    })

    expect(resolved.overrideApplied).toBe(true)
    expect(resolved.subject).toBe('Update for Order #91')
    expect(resolved.html).toContain('Your files are ready')
  })
})
