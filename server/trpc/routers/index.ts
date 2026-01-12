import { router } from '../trpc'
import { authRouter } from './auth'
import { ordersRouter } from './orders'
import { adminRouter } from './admin'
import { filesRouter } from './files'
import { paymentsRouter } from './payments'
import { emailsRouter } from './emails'
import { packagesRouter } from './packages'
import { calendarRouter } from './calendar'
import { adminEnhancementsRouter } from './admin-enhancements'
import { quotePublicRouter } from './quote-public'
import { contactRouter } from './contact'
import { financeRouter } from './finance'

export const appRouter = router({
  auth: authRouter,
  orders: ordersRouter,
  admin: adminRouter,
  files: filesRouter,
  payments: paymentsRouter,
  emails: emailsRouter,
  packages: packagesRouter,
  calendar: calendarRouter,
  // New enhanced routers
  adminEnhancements: adminEnhancementsRouter,
  quote: quotePublicRouter,
  contact: contactRouter,
  // Enhanced finance router with tax calculations
  finance: financeRouter
})

export type AppRouter = typeof appRouter
