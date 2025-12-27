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
        // Using actual production column names: start_date, end_date, is_available
        const result = await query<{ date: string }>(`
          SELECT DISTINCT date 
          FROM (
            -- Manual overrides (generate all dates in range)
            SELECT generate_series(
              start_date,
              end_date,
              '1 day'::interval
            )::date as date
            FROM availability_overrides
            WHERE is_available = false
              AND end_date >= CURRENT_DATE
            
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
      } catch (error: any) {
        console.error('Error fetching unavailable dates:', JSON.stringify({
          message: error.message,
          code: error.code,
          detail: error.detail
        }))
        
        // If table doesn't exist or columns are wrong, return empty array instead of crashing
        if (error.code === '42P01' || error.code === '42703') {
          console.warn('availability_overrides table or columns not found, returning empty unavailable dates')
          return []
        }
        
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
        // Log input data as stringified JSON for proper Railway logging
        console.log('Adding override with data: ' + JSON.stringify({
          dateFrom: input.dateFrom,
          dateTo: input.dateTo || input.dateFrom,
          reason: input.reason,
          description: input.description,
          userId: user.userId,
          userRole: user.role
        }))

        // Using actual production column names: start_date, end_date, is_available, notes
        const result = await query<{
          id: number
          start_date: string
          end_date: string
          reason: string
          notes: string | null
          created_at: string
        }>(`
          INSERT INTO availability_overrides (
            start_date,
            end_date,
            reason,
            notes,
            override_type,
            created_by,
            is_available
          ) VALUES ($1, $2, $3, $4, 'manual', $5, false)
          RETURNING id, start_date, end_date, reason, notes, created_at
        `, [
          input.dateFrom,
          input.dateTo || input.dateFrom,
          input.reason,
          input.description || null,
          user.userId
        ])
        
        console.log('Override added successfully: ' + JSON.stringify(result.rows[0]))
        
        // Map to expected frontend format
        const row = result.rows[0]
        return {
          id: row.id,
          date_from: row.start_date,
          date_to: row.end_date,
          reason: row.reason,
          description: row.notes,
          created_at: row.created_at
        }
      } catch (error: any) {
        // Log the full error as stringified JSON for proper Railway logging
        const errorDetails = {
          message: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN',
          detail: error.detail || null,
          hint: error.hint || null,
          constraint: error.constraint || null,
          table: error.table || null,
          column: error.column || null,
          position: error.position || null,
          routine: error.routine || null
        }
        console.error('Error adding override - Full error: ' + JSON.stringify(errorDetails))
        
        // Provide more specific error messages
        if (error.code === '23503') {
          // Foreign key violation
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid user reference. Please try logging out and back in.'
          })
        } else if (error.code === '23505') {
          // Unique violation
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This date range is already blocked.'
          })
        } else if (error.code === '22007' || error.code === '22008') {
          // Invalid date format
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid date format. Please try again.'
          })
        } else if (error.code === '42703') {
          // Undefined column
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database schema error. Please contact support.'
          })
        } else if (error.code === '23502') {
          // NOT NULL violation
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Missing required field: ${error.column || 'unknown'}. Please fill in all required fields.`
          })
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add date override: ${error.message || 'Unknown error'}`
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
        // Using actual production column: is_available (set to true to "remove" the block)
        await query(`
          UPDATE availability_overrides
          SET is_available = true,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [input.id])
        
        return { success: true }
      } catch (error: any) {
        console.error('Error removing override: ' + JSON.stringify({
          message: error.message,
          code: error.code,
          detail: error.detail
        }))
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
        // Using actual production column names: start_date, end_date, is_available, notes
        const result = await query<{
          id: number
          start_date: string
          end_date: string
          reason: string
          notes: string | null
          is_available: boolean
          created_at: string
          created_by_name: string | null
        }>(`
          SELECT 
            ao.id,
            ao.start_date,
            ao.end_date,
            ao.reason,
            ao.notes,
            ao.is_available,
            ao.created_at,
            u.name as created_by_name
          FROM availability_overrides ao
          LEFT JOIN users u ON ao.created_by = u.id
          WHERE ao.is_available = false
          ORDER BY ao.start_date ASC
        `)
        
        // Map to expected frontend format
        return result.rows.map(row => ({
          id: row.id,
          date_from: row.start_date,
          date_to: row.end_date,
          reason: row.reason,
          description: row.notes,
          is_active: !row.is_available,
          created_at: row.created_at,
          created_by_name: row.created_by_name
        }))
      } catch (error: any) {
        console.error('Error fetching overrides: ' + JSON.stringify({
          message: error.message,
          code: error.code,
          detail: error.detail
        }))
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch overrides'
        })
      }
    })
})
