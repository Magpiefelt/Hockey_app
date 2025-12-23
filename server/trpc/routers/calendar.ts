import { z } from 'zod'
import { publicProcedure, protectedProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'

export const calendarRouter = router({
  // Public: Get all unavailable dates
  getUnavailableDates: publicProcedure
    .query(async ({ ctx }) => {
      const { db } = ctx
      
      try {
        // Get all active overrides and confirmed quote dates
        const result = await db.query(`
          SELECT DISTINCT date 
          FROM (
            -- Manual overrides
            SELECT date_from as date
            FROM availability_overrides
            WHERE is_active = true
              AND date_from >= CURRENT_DATE
            
            UNION
            
            -- Confirmed quotes
            SELECT event_date as date
            FROM quote_requests
            WHERE status IN ('confirmed', 'in_progress')
              AND event_date >= CURRENT_DATE
              AND event_date IS NOT NULL
          ) AS unavailable_dates
          ORDER BY date ASC
        `)
        
        return result.rows.map((row: any) => row.date)
      } catch (error) {
        console.error('Error fetching unavailable dates:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch unavailable dates'
        })
      }
    }),

  // Admin: Add date override
  addOverride: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string().optional(),
      reason: z.string(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to add overrides'
        })
      }

      try {
        const result = await db.query(`
          INSERT INTO availability_overrides (
            date_from,
            date_to,
            reason,
            description,
            created_by,
            is_active
          ) VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id, date_from, date_to, reason, description, created_at
        `, [
          input.dateFrom,
          input.dateTo || input.dateFrom,
          input.reason,
          input.description || null,
          user.id
        ])
        
        return result.rows[0]
      } catch (error) {
        console.error('Error adding override:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add date override'
        })
      }
    }),

  // Admin: Remove date override
  removeOverride: protectedProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to remove overrides'
        })
      }

      try {
        await db.query(`
          UPDATE availability_overrides
          SET is_active = false,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [input.id])
        
        return { success: true }
      } catch (error) {
        console.error('Error removing override:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove date override'
        })
      }
    }),

  // Admin: Get all overrides
  getOverrides: protectedProcedure
    .query(async ({ ctx }) => {
      const { db, user } = ctx
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to view overrides'
        })
      }

      try {
        const result = await db.query(`
          SELECT 
            ao.id,
            ao.date_from,
            ao.date_to,
            ao.reason,
            ao.description,
            ao.is_active,
            ao.created_at,
            u.name as created_by_name
          FROM availability_overrides ao
          LEFT JOIN users u ON ao.created_by = u.id
          WHERE ao.is_active = true
          ORDER BY ao.date_from ASC
        `)
        
        return result.rows
      } catch (error) {
        console.error('Error fetching overrides:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch overrides'
        })
      }
    })
})
