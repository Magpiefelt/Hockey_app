import { createNuxtApiHandler } from 'trpc-nuxt'
import { appRouter } from '../../trpc/routers'
import { createContext } from '../../trpc/context'
import { logger } from '../../utils/logger'

// Export API handler
export default createNuxtApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path }) {
    logger.error(`tRPC Error on ${type} ${path}`, error)
  }
})
