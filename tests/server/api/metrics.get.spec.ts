import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const queryMock = vi.fn()
const requireAdminMock = vi.fn()
const loggerWarnMock = vi.fn()

vi.mock('../../../server/db/connection', () => ({
  query: queryMock
}))

vi.mock('../../../server/utils/auth', () => ({
  requireAdmin: requireAdminMock
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: loggerWarnMock,
    error: vi.fn(),
    debug: vi.fn()
  }
}))

const runtimeConfig: any = {
  metricsApiKey: 'test-key',
  metricsIpAllowlist: ''
}

function stubGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: any) => handler)
  vi.stubGlobal('createError', (input: any) => {
    const error = new Error(input.message)
    ;(error as any).statusCode = input.statusCode
    return error
  })
  vi.stubGlobal('getHeader', (event: any, name: string) => {
    const headerName = name.toLowerCase()
    const headers = event.node.req.headers || {}
    return headers[headerName] || headers[name]
  })
  vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
}

async function loadHandler() {
  vi.resetModules()
  vi.unstubAllGlobals()
  stubGlobals()
  return (await import('../../../server/api/metrics.get')).default
}

function setupQueryMock() {
  queryMock.mockImplementation(async (sql: string) => {
    if (sql.includes('COUNT(*) as count FROM quote_requests') && !sql.includes('created_at >')) {
      return { rows: [{ count: '5' }] }
    }

    if (sql.includes('GROUP BY status')) {
      return { rows: [{ status: 'paid', count: '2' }] }
    }

    if (sql.includes('COUNT(*) as count FROM users')) {
      return { rows: [{ count: '3' }] }
    }

    if (sql.includes('COUNT(*) as count FROM file_uploads')) {
      return { rows: [{ count: '4' }] }
    }

    if (sql.includes('COUNT(*) as count FROM email_logs')) {
      return { rows: [{ count: '10' }] }
    }

    if (sql.includes('pg_size_pretty')) {
      return { rows: [{ size: '12 MB' }] }
    }

    if (sql.includes('pg_stat_activity')) {
      return { rows: [{ count: '1' }] }
    }

    if (sql.includes("WHERE created_at > NOW() - INTERVAL '24 hours'")) {
      return { rows: [{ count: '4' }] }
    }

    if (sql.includes('SUM(total_amount)')) {
      return { rows: [{ paid_orders: '1', total_revenue: '1000' }] }
    }

    if (sql.includes('AVG(EXTRACT')) {
      return { rows: [{ avg_seconds: '7200' }] }
    }

    return { rows: [] }
  })
}

function createEvent(headers: Record<string, string> = {}, context: any = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  )

  return {
    path: '/api/metrics',
    node: {
      req: { headers: normalizedHeaders },
      res: {}
    },
    context
  } as any
}

beforeEach(() => {
  queryMock.mockReset()
  requireAdminMock.mockReset()
  loggerWarnMock.mockReset()
  runtimeConfig.metricsApiKey = 'test-key'
  runtimeConfig.metricsIpAllowlist = ''
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('metrics endpoint access control', () => {
  it('allows access with a valid API key', async () => {
    setupQueryMock()
    const handler = await loadHandler()
    const event = createEvent({ 'x-api-key': 'test-key' }, { ip: '10.0.0.1' })

    const response = await handler(event)

    expect(queryMock).toHaveBeenCalled()
    expect(response.database.totalOrders).toBe(5)
    expect(response.database.ordersByStatus.paid).toBe(2)
    expect(response.business.ordersLast24Hours).toBe(4)
  })

  it('rejects requests without valid credentials', async () => {
    setupQueryMock()
    requireAdminMock.mockImplementation(() => {
      throw new Error('Authentication required')
    })

    const handler = await loadHandler()
    const event = createEvent({}, { ip: '10.0.0.1' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(queryMock).not.toHaveBeenCalled()
    expect(loggerWarnMock).toHaveBeenCalled()
  })

  it('rejects requests from non-allowlisted IPs', async () => {
    setupQueryMock()
    runtimeConfig.metricsIpAllowlist = '10.0.0.1,192.168.1.*'

    const handler = await loadHandler()
    const event = createEvent({ 'x-api-key': 'test-key' }, { ip: '192.168.2.5' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(queryMock).not.toHaveBeenCalled()
    expect(loggerWarnMock).toHaveBeenCalled()
  })

  it('allows admin users when no API key is provided', async () => {
    setupQueryMock()
    runtimeConfig.metricsApiKey = ''
    requireAdminMock.mockReturnValue({ userId: 1, role: 'admin' })

    const handler = await loadHandler()
    const event = createEvent({}, { ip: '10.0.0.1' })

    const response = await handler(event)
    expect(response.database.totalUsers).toBe(3)
    expect(requireAdminMock).toHaveBeenCalled()
  })
})
