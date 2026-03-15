/**
 * Content Router
 * Handles FAQ items and testimonials management
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { query } from '../../db/connection'
import { logger } from '../../utils/logger'

// Reusable admin check
function assertAdmin(ctx: any) {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    })
  }
}

export const contentRouter = router({
  // ─── FAQ ───────────────────────────────────────────────

  /**
   * Get visible FAQ items (public)
   */
  faqPublic: publicProcedure
    .query(async () => {
      try {
        const result = await query(
          `SELECT id, question, answer, display_order
           FROM faq_items
           WHERE is_visible = TRUE
           ORDER BY display_order ASC, id ASC`
        )
        return result.rows.map(row => ({
          id: row.id,
          question: row.question,
          answer: row.answer,
          displayOrder: row.display_order
        }))
      } catch (err: any) {
        logger.warn('Failed to fetch FAQ items from DB, returning empty', { error: err.message })
        return []
      }
    }),

  /**
   * Get all FAQ items (admin — includes hidden)
   */
  faqList: publicProcedure
    .query(async ({ ctx }) => {
      assertAdmin(ctx)
      try {
        const result = await query(
          `SELECT id, question, answer, display_order, is_visible, created_at, updated_at
           FROM faq_items
           ORDER BY display_order ASC, id ASC`
        )
        return result.rows.map(row => ({
          id: row.id,
          question: row.question,
          answer: row.answer,
          displayOrder: row.display_order,
          isVisible: row.is_visible,
          createdAt: row.created_at?.toISOString() || null,
          updatedAt: row.updated_at?.toISOString() || null
        }))
      } catch (err: any) {
        logger.warn('Failed to list FAQ items', { error: err.message })
        return []
      }
    }),

  /**
   * Create FAQ item (admin)
   */
  faqCreate: publicProcedure
    .input(z.object({
      question: z.string().min(1).max(500),
      answer: z.string().min(1).max(5000),
      displayOrder: z.number().int().min(0).default(0),
      isVisible: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      const result = await query(
        `INSERT INTO faq_items (question, answer, display_order, is_visible)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [input.question, input.answer, input.displayOrder, input.isVisible]
      )
      return { id: result.rows[0].id }
    }),

  /**
   * Update FAQ item (admin)
   */
  faqUpdate: publicProcedure
    .input(z.object({
      id: z.number(),
      question: z.string().min(1).max(500).optional(),
      answer: z.string().min(1).max(5000).optional(),
      displayOrder: z.number().int().min(0).optional(),
      isVisible: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      const sets: string[] = []
      const params: any[] = []
      let idx = 1

      if (input.question !== undefined) { sets.push(`question = $${idx++}`); params.push(input.question) }
      if (input.answer !== undefined) { sets.push(`answer = $${idx++}`); params.push(input.answer) }
      if (input.displayOrder !== undefined) { sets.push(`display_order = $${idx++}`); params.push(input.displayOrder) }
      if (input.isVisible !== undefined) { sets.push(`is_visible = $${idx++}`); params.push(input.isVisible) }
      sets.push(`updated_at = NOW()`)

      if (sets.length === 1) return { success: true } // only updated_at

      params.push(input.id)
      await query(
        `UPDATE faq_items SET ${sets.join(', ')} WHERE id = $${idx}`,
        params
      )
      return { success: true }
    }),

  /**
   * Delete FAQ item (admin)
   */
  faqDelete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      await query('DELETE FROM faq_items WHERE id = $1', [input.id])
      return { success: true }
    }),

  // ─── TESTIMONIALS ──────────────────────────────────────

  /**
   * Get visible testimonials (public)
   */
  testimonialsPublic: publicProcedure
    .query(async () => {
      try {
        const result = await query(
          `SELECT id, author_name, author_role, content, rating, display_order
           FROM testimonials
           WHERE is_visible = TRUE
           ORDER BY display_order ASC, id ASC`
        )
        return result.rows.map(row => ({
          id: row.id,
          authorName: row.author_name,
          authorRole: row.author_role,
          content: row.content,
          rating: row.rating,
          displayOrder: row.display_order
        }))
      } catch (err: any) {
        logger.warn('Failed to fetch testimonials from DB, returning empty', { error: err.message })
        return []
      }
    }),

  /**
   * Get all testimonials (admin — includes hidden)
   */
  testimonialsList: publicProcedure
    .query(async ({ ctx }) => {
      assertAdmin(ctx)
      try {
        const result = await query(
          `SELECT id, author_name, author_role, content, rating, display_order, is_visible, created_at, updated_at
           FROM testimonials
           ORDER BY display_order ASC, id ASC`
        )
        return result.rows.map(row => ({
          id: row.id,
          authorName: row.author_name,
          authorRole: row.author_role,
          content: row.content,
          rating: row.rating,
          displayOrder: row.display_order,
          isVisible: row.is_visible,
          createdAt: row.created_at?.toISOString() || null,
          updatedAt: row.updated_at?.toISOString() || null
        }))
      } catch (err: any) {
        logger.warn('Failed to list testimonials', { error: err.message })
        return []
      }
    }),

  /**
   * Create testimonial (admin)
   */
  testimonialCreate: publicProcedure
    .input(z.object({
      authorName: z.string().min(1).max(100),
      authorRole: z.string().max(100).optional(),
      content: z.string().min(1).max(5000),
      rating: z.number().int().min(1).max(5).default(5),
      displayOrder: z.number().int().min(0).default(0),
      isVisible: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      const result = await query(
        `INSERT INTO testimonials (author_name, author_role, content, rating, display_order, is_visible)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [input.authorName, input.authorRole || null, input.content, input.rating, input.displayOrder, input.isVisible]
      )
      return { id: result.rows[0].id }
    }),

  /**
   * Update testimonial (admin)
   */
  testimonialUpdate: publicProcedure
    .input(z.object({
      id: z.number(),
      authorName: z.string().min(1).max(100).optional(),
      authorRole: z.string().max(100).optional(),
      content: z.string().min(1).max(5000).optional(),
      rating: z.number().int().min(1).max(5).optional(),
      displayOrder: z.number().int().min(0).optional(),
      isVisible: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      const sets: string[] = []
      const params: any[] = []
      let idx = 1

      if (input.authorName !== undefined) { sets.push(`author_name = $${idx++}`); params.push(input.authorName) }
      if (input.authorRole !== undefined) { sets.push(`author_role = $${idx++}`); params.push(input.authorRole) }
      if (input.content !== undefined) { sets.push(`content = $${idx++}`); params.push(input.content) }
      if (input.rating !== undefined) { sets.push(`rating = $${idx++}`); params.push(input.rating) }
      if (input.displayOrder !== undefined) { sets.push(`display_order = $${idx++}`); params.push(input.displayOrder) }
      if (input.isVisible !== undefined) { sets.push(`is_visible = $${idx++}`); params.push(input.isVisible) }
      sets.push(`updated_at = NOW()`)

      if (sets.length === 1) return { success: true }

      params.push(input.id)
      await query(
        `UPDATE testimonials SET ${sets.join(', ')} WHERE id = $${idx}`,
        params
      )
      return { success: true }
    }),

  /**
   * Delete testimonial (admin)
   */
  testimonialDelete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      await query('DELETE FROM testimonials WHERE id = $1', [input.id])
      return { success: true }
    }),

  // ─── PUBLIC EVENT HIGHLIGHTS ───────────────────────────

  /**
   * Get visible event highlights (public)
   */
  eventHighlightsPublic: publicProcedure
    .query(async () => {
      try {
        const result = await query(
          `SELECT id, title, category, event_date, location, description, display_order
           FROM public_event_highlights
           WHERE is_visible = TRUE
           ORDER BY
             CASE WHEN event_date >= CURRENT_DATE THEN 0 ELSE 1 END,
             CASE WHEN event_date >= CURRENT_DATE THEN event_date END ASC,
             CASE WHEN event_date < CURRENT_DATE THEN event_date END DESC,
             display_order ASC,
             id DESC
           LIMIT 30`
        )

        return result.rows.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          date: row.event_date,
          location: row.location,
          description: row.description,
          displayOrder: row.display_order
        }))
      } catch (err: any) {
        if (err?.code === '42P01') {
          logger.warn('public_event_highlights table missing; returning empty list')
          return []
        }
        logger.warn('Failed to fetch public event highlights', { error: err.message })
        return []
      }
    }),

  /**
   * Get all event highlights (admin)
   */
  eventHighlightsList: publicProcedure
    .query(async ({ ctx }) => {
      assertAdmin(ctx)

      try {
        try {
          const result = await query(
            `SELECT
               peh.id,
               peh.quote_id,
               peh.title,
               peh.category,
               peh.event_date,
               peh.location,
               peh.description,
               peh.display_order,
               peh.is_visible,
               peh.created_at,
               peh.updated_at,
               fs.team_name,
               qr.organization
             FROM public_event_highlights peh
             LEFT JOIN quote_requests qr ON qr.id = peh.quote_id
             LEFT JOIN form_submissions fs ON fs.quote_id = peh.quote_id
             ORDER BY peh.event_date DESC, peh.display_order ASC, peh.id DESC`
          )

          return result.rows.map(row => ({
            id: row.id,
            quoteId: row.quote_id,
            title: row.title,
            category: row.category,
            eventDate: row.event_date,
            location: row.location,
            description: row.description,
            displayOrder: row.display_order,
            isVisible: row.is_visible,
            sourceLabel: row.team_name || row.organization || null,
            createdAt: row.created_at?.toISOString() || null,
            updatedAt: row.updated_at?.toISOString() || null
          }))
        } catch (innerErr: any) {
          // Fallback if form_submissions table doesn't exist
          if (innerErr?.code !== '42P01') throw innerErr

          const result = await query(
            `SELECT
               peh.id,
               peh.quote_id,
               peh.title,
               peh.category,
               peh.event_date,
               peh.location,
               peh.description,
               peh.display_order,
               peh.is_visible,
               peh.created_at,
               peh.updated_at,
               qr.organization
             FROM public_event_highlights peh
             LEFT JOIN quote_requests qr ON qr.id = peh.quote_id
             ORDER BY peh.event_date DESC, peh.display_order ASC, peh.id DESC`
          )

          return result.rows.map(row => ({
            id: row.id,
            quoteId: row.quote_id,
            title: row.title,
            category: row.category,
            eventDate: row.event_date,
            location: row.location,
            description: row.description,
            displayOrder: row.display_order,
            isVisible: row.is_visible,
            sourceLabel: row.organization || null,
            createdAt: row.created_at?.toISOString() || null,
            updatedAt: row.updated_at?.toISOString() || null
          }))
        }
      } catch (err: any) {
        if (err?.code === '42P01') {
          logger.warn('public_event_highlights table missing; returning empty admin list')
          return []
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch event highlights'
        })
      }
    }),

  /**
   * Suggest candidate events from completed/confirmed orders (admin)
   */
  eventHighlightCandidates: publicProcedure
    .query(async ({ ctx }) => {
      assertAdmin(ctx)

      try {
        try {
          const result = await query(
            `SELECT
               qr.id AS quote_id,
               qr.event_date,
               COALESCE(NULLIF(TRIM(fs.team_name), ''), NULLIF(TRIM(qr.organization), ''), 'Sports Event') AS title,
               COALESCE(NULLIF(TRIM(qr.sport_type), ''), NULLIF(TRIM(qr.service_type), ''), 'Live Event') AS category
             FROM quote_requests qr
             LEFT JOIN form_submissions fs ON fs.quote_id = qr.id
             LEFT JOIN public_event_highlights peh ON peh.quote_id = qr.id
             WHERE qr.status IN ('paid', 'confirmed', 'in_progress', 'completed')
               AND qr.event_date IS NOT NULL
               AND qr.event_date >= CURRENT_DATE - INTERVAL '120 days'
               AND peh.id IS NULL
             ORDER BY
               CASE WHEN qr.event_date >= CURRENT_DATE THEN 0 ELSE 1 END,
               CASE WHEN qr.event_date >= CURRENT_DATE THEN qr.event_date END ASC,
               CASE WHEN qr.event_date < CURRENT_DATE THEN qr.event_date END DESC
             LIMIT 30`
          )

          return result.rows.map(row => ({
            quoteId: row.quote_id,
            eventDate: row.event_date,
            title: row.title,
            category: row.category
          }))
        } catch (innerErr: any) {
          if (innerErr?.code !== '42P01') throw innerErr

          const result = await query(
            `SELECT
               qr.id AS quote_id,
               qr.event_date,
               COALESCE(NULLIF(TRIM(qr.organization), ''), 'Sports Event') AS title,
               COALESCE(NULLIF(TRIM(qr.sport_type), ''), NULLIF(TRIM(qr.service_type), ''), 'Live Event') AS category
             FROM quote_requests qr
             LEFT JOIN public_event_highlights peh ON peh.quote_id = qr.id
             WHERE qr.status IN ('paid', 'confirmed', 'in_progress', 'completed')
               AND qr.event_date IS NOT NULL
               AND qr.event_date >= CURRENT_DATE - INTERVAL '120 days'
               AND peh.id IS NULL
             ORDER BY
               CASE WHEN qr.event_date >= CURRENT_DATE THEN 0 ELSE 1 END,
               CASE WHEN qr.event_date >= CURRENT_DATE THEN qr.event_date END ASC,
               CASE WHEN qr.event_date < CURRENT_DATE THEN qr.event_date END DESC
             LIMIT 30`
          )

          return result.rows.map(row => ({
            quoteId: row.quote_id,
            eventDate: row.event_date,
            title: row.title,
            category: row.category
          }))
        }
      } catch (err: any) {
        if (err?.code === '42P01') return []
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch candidate events'
        })
      }
    }),

  /**
   * Create event highlight (admin)
   */
  eventHighlightCreate: publicProcedure
    .input(z.object({
      quoteId: z.number().int().positive().optional(),
      title: z.string().min(1).max(140),
      category: z.string().min(1).max(80).default('Live Event'),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      location: z.string().max(140).optional(),
      description: z.string().max(1000).optional(),
      displayOrder: z.number().int().min(0).default(0),
      isVisible: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)

      try {
        const result = await query(
          `INSERT INTO public_event_highlights (
             quote_id, title, category, event_date, location, description, display_order, is_visible, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            input.quoteId ?? null,
            input.title.trim(),
            input.category.trim(),
            input.eventDate,
            input.location?.trim() || null,
            input.description?.trim() || null,
            input.displayOrder,
            input.isVisible,
            ctx.user?.userId ?? null
          ]
        )

        return { id: result.rows[0].id }
      } catch (err: any) {
        if (err?.code === '42P01') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Event highlights table not found. Run migrations first.'
          })
        }
        throw err
      }
    }),

  /**
   * Create event highlight directly from an order (admin)
   */
  eventHighlightCreateFromOrder: publicProcedure
    .input(z.object({
      quoteId: z.number().int().positive(),
      displayOrder: z.number().int().min(0).default(0),
      isVisible: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)

      try {
        let orderResult
        try {
          orderResult = await query(
            `SELECT
               qr.id,
               qr.event_date,
               qr.organization,
               qr.sport_type,
               qr.service_type,
               fs.team_name
             FROM quote_requests qr
             LEFT JOIN form_submissions fs ON fs.quote_id = qr.id
             WHERE qr.id = $1
               AND qr.event_date IS NOT NULL`,
            [input.quoteId]
          )
        } catch (innerErr: any) {
          if (innerErr?.code !== '42P01') throw innerErr
          orderResult = await query(
            `SELECT
               qr.id,
               qr.event_date,
               qr.organization,
               qr.sport_type,
               qr.service_type,
               NULL::text AS team_name
             FROM quote_requests qr
             WHERE qr.id = $1
               AND qr.event_date IS NOT NULL`,
            [input.quoteId]
          )
        }

        if (orderResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found or missing event date'
          })
        }

        const order = orderResult.rows[0]
        const title = order.team_name || order.organization || 'Sports Event'
        const category = order.sport_type || order.service_type || 'Live Event'

        const insertResult = await query(
          `INSERT INTO public_event_highlights (
             quote_id, title, category, event_date, display_order, is_visible, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            input.quoteId,
            title,
            category,
            order.event_date,
            input.displayOrder,
            input.isVisible,
            ctx.user?.userId ?? null
          ]
        )

        return { id: insertResult.rows[0].id }
      } catch (err: any) {
        if (err?.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This order has already been added as a highlight.'
          })
        }
        if (err instanceof TRPCError) throw err
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create highlight from order'
        })
      }
    }),

  /**
   * Update event highlight (admin)
   */
  eventHighlightUpdate: publicProcedure
    .input(z.object({
      id: z.number(),
      quoteId: z.number().int().positive().nullable().optional(),
      title: z.string().min(1).max(140).optional(),
      category: z.string().min(1).max(80).optional(),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      location: z.string().max(140).nullable().optional(),
      description: z.string().max(1000).nullable().optional(),
      displayOrder: z.number().int().min(0).optional(),
      isVisible: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)

      const sets: string[] = []
      const params: any[] = []
      let idx = 1

      if (input.quoteId !== undefined) { sets.push(`quote_id = $${idx++}`); params.push(input.quoteId) }
      if (input.title !== undefined) { sets.push(`title = $${idx++}`); params.push(input.title.trim()) }
      if (input.category !== undefined) { sets.push(`category = $${idx++}`); params.push(input.category.trim()) }
      if (input.eventDate !== undefined) { sets.push(`event_date = $${idx++}`); params.push(input.eventDate) }
      if (input.location !== undefined) { sets.push(`location = $${idx++}`); params.push(input.location?.trim() || null) }
      if (input.description !== undefined) { sets.push(`description = $${idx++}`); params.push(input.description?.trim() || null) }
      if (input.displayOrder !== undefined) { sets.push(`display_order = $${idx++}`); params.push(input.displayOrder) }
      if (input.isVisible !== undefined) { sets.push(`is_visible = $${idx++}`); params.push(input.isVisible) }

      sets.push(`updated_at = NOW()`)

      if (sets.length === 1) return { success: true }

      params.push(input.id)
      await query(
        `UPDATE public_event_highlights
         SET ${sets.join(', ')}
         WHERE id = $${idx}`,
        params
      )

      return { success: true }
    }),

  /**
   * Delete event highlight (admin)
   */
  eventHighlightDelete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx)
      await query('DELETE FROM public_event_highlights WHERE id = $1', [input.id])
      return { success: true }
    })
})
