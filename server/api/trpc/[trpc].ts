import { createNuxtApiHandler } from 'trpc-nuxt'
import { appRouter } from '../../trpc/routers'
import { createContext } from '../../trpc/context'

// Export API handler
export default createNuxtApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path }) {
    console.error(`tRPC Error on ${type} ${path}:`, error)
  }
})
