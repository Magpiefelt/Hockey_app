import { router } from '../trpc'
import { authRouter } from './auth'
import { ordersRouter } from './orders'
// import { adminRouter } from './admin' // Disabled - missing dependencies
import { filesRouter } from './files'
import { paymentsRouter } from './payments'
import { emailsRouter } from './emails'

export const appRouter = router({
  auth: authRouter,
  orders: ordersRouter,
  // admin: adminRouter, // Disabled - missing dependencies
  files: filesRouter,
  payments: paymentsRouter,
  emails: emailsRouter
})

export type AppRouter = typeof appRouter
