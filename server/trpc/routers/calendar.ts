import { z } from 'zod'
import { publicProcedure, adminProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { query } from '../../db/connection'

export const calendarRouter = router({
  // Public: Get all unavailable dates
  getUnavailableDates: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // Get all active overrides and confirmed quote dates
        // For overrides, we need to generate all dates in the range
        const result = await query<{ date: string }>(`
          SELECT DISTINCT date 
          FROM (
            -- Manual overrides (generate all dates in range)
            SELECT generate_series(
              date_from,
              date_to,
              '1 day'::interval
            )::date as date
            FROM availability_overrides
            WHERE is_active = true
              AND date_to >= CURRENT_DATE
            
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
        
        return result.rows.map((row) => row.date)
      } catch (error) {
        console.error('Error fetching unavailable dates:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch unavailable dates'
        })
      }
    }),

  // Admin: Add date override
  addOverride: adminProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string().optional(),
      reason: z.string(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to add overrides'
        })
      }

      try {
        const result = await query<{
          id: number
          date_from: string
          date_to: string
          reason: string
          description: string | null
          created_at: string
        }>(`
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
          user.userId
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
  removeOverride: adminProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to remove overrides'
        })
      }

      try {
        await query(`
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
  getOverrides: adminProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to view overrides'
        })
      }

      try {
        const result = await query<{
          id: number
          date_from: string
          date_to: string
          reason: string
          description: string | null
          is_active: boolean
          created_at: string
          created_by_name: string | null
        }>(`
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
