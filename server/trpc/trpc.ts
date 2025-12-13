import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context'
import { logger } from '../utils/logger'
import { toTRPCError } from '../utils/errors'

const t = initTRPC.context<Context>().create({
  // transformer: superjson, // Disabled - causes body parsing issues with trpc-nuxt
})

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router

/**
 * Public procedure - with error handling
 */
export const publicProcedure = t.procedure.use(async ({ ctx, next, path, type }) => {
  try {
    return await next({ ctx })
  } catch (error) {
    logger.error('Public procedure error', error as Error, { 
      path, 
      type,
      ip: ctx.event?.context?.ip 
    })
    throw toTRPCError(error)
  }
})

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next, path, type }) => {
  if (!ctx.user) {
    logger.warn('Unauthorized access attempt', { path, type })
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  
  logger.debug('Protected procedure called', { 
    path, 
    type, 
    userId: ctx.user.userId 
  })
  
  try {
    const result = await next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    })
    return result
  } catch (error) {
    logger.error('Protected procedure error', error as Error, { 
      path, 
      type, 
      userId: ctx.user.userId 
    })
    throw toTRPCError(error)
  }
})

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next, path, type }) => {
  if (!ctx.user) {
    logger.warn('Unauthorized admin access attempt', { path, type })
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  
  if (ctx.user.role !== 'admin') {
    logger.warn('Forbidden admin access attempt', { 
      path, 
      type, 
      userId: ctx.user.userId,
      role: ctx.user.role 
    })
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  
  logger.info('Admin procedure called', { 
    path, 
    type, 
    userId: ctx.user.userId 
  })
  
  try {
    const result = await next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    })
    return result
  } catch (error) {
    logger.error('Admin procedure error', error as Error, { 
      path, 
      type, 
      userId: ctx.user.userId 
    })
    throw toTRPCError(error)
  }
})
