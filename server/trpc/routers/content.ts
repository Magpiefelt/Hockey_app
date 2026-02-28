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
    })
})
