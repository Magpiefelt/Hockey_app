const ADMIN_TRPC_ROUTERS = new Set([
  'admin',
  'adminEnhancements',
  'payments',
  'emails',
  'packages',
  'calendar',
  'finance',
  'financeAutomation'
])

export function shouldApplyAdminIpFilter(path: string): boolean {
  if (!path.startsWith('/api/trpc/')) {
    return false
  }

  const trpcSegments = path
    .slice('/api/trpc/'.length)
    .split(',')
    .map(segment => segment.split('?')[0]?.trim() || '')
    .filter(Boolean)

  return trpcSegments.some(segment => {
    const routerName = segment.split('.')[0]
    return ADMIN_TRPC_ROUTERS.has(routerName)
  })
}
