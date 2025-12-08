import { router } from '../trpc'
import { authRouter } from './auth'
import { ordersRouter } from './orders'
import { adminRouter } from './admin'
import { filesRouter } from './files'
import { paymentsRouter } from './payments'
import { emailsRouter } from './emails'
import { packagesRouter } from './packages'

export const appRouter = router({
  auth: authRouter,
  orders: ordersRouter,
  admin: adminRouter,
  files: filesRouter,
  payments: paymentsRouter,
  emails: emailsRouter,
  packages: packagesRouter
})

export type AppRouter = typeof appRouter
