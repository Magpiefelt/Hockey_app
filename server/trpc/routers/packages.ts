import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, adminProcedure } from '../trpc'
import { query } from '../../db/connection'
import { logger } from '../../utils/logger'

/**
 * Packages Router
 * Handles service package management
 */
export const packagesRouter = router({
  /**
   * Get all packages (public)
   */
  getAll: publicProcedure
    .query(async () => {
      try {
        const result = await query(
          `SELECT id, slug, name, description, price_cents, currency, is_popular, features, icon, created_at
           FROM packages
           ORDER BY 
             CASE 
               WHEN slug = 'player-intros-basic' THEN 1
               WHEN slug = 'player-intros-warmup' THEN 2
               WHEN slug = 'player-intros-ultimate' THEN 3
               WHEN slug = 'game-day-dj' THEN 4
               WHEN slug = 'event-hosting' THEN 5
               ELSE 6
             END,
             name ASC`
        )
        
        return result.rows.map(row => ({
          id: row.slug, // Use slug as ID for frontend compatibility
          slug: row.slug,
          name: row.name,
          description: row.description,
          price: row.price_cents / 100,
          price_cents: row.price_cents,
          currency: row.currency,
          popular: row.is_popular,
          features: row.features || [],
          icon: row.icon,
          createdAt: row.created_at?.toISOString()
        }))
      } catch (error: any) {
        logger.error('Failed to fetch packages', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load packages'
        })
      }
    }),

  /**
   * Get a single package by slug (public)
   */
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string()
    }))
    .query(async ({ input }) => {
      const result = await query(
        `SELECT id, slug, name, description, price_cents, currency, is_popular, features, icon, created_at
         FROM packages
         WHERE slug = $1`,
        [input.slug]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Package not found'
        })
      }
      
      const row = result.rows[0]
      return {
        id: row.slug,
        slug: row.slug,
        name: row.name,
        description: row.description,
        price: row.price_cents / 100,
        price_cents: row.price_cents,
        currency: row.currency,
        popular: row.is_popular,
        features: row.features || [],
        icon: row.icon,
        createdAt: row.created_at?.toISOString()
      }
    }),

  /**
   * Create a new package (admin only)
   */
  create: adminProcedure
    .input(z.object({
      slug: z.string().min(1).max(50),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      priceCents: z.number().int().min(0),
      currency: z.string().default('usd'),
      isPopular: z.boolean().default(false),
      features: z.array(z.string()).optional(),
      icon: z.string().max(10).optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await query(
          `INSERT INTO packages (slug, name, description, price_cents, currency, is_popular, features, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, slug, name, description, price_cents, currency, is_popular, features, icon, created_at`,
          [
            input.slug,
            input.name,
            input.description || null,
            input.priceCents,
            input.currency,
            input.isPopular,
            JSON.stringify(input.features || []),
            input.icon || null
          ]
        )
        
        const row = result.rows[0]
        logger.info('Package created', { slug: input.slug, name: input.name })
        
        return {
          id: row.slug,
          slug: row.slug,
          name: row.name,
          description: row.description,
          price: row.price_cents / 100,
          price_cents: row.price_cents,
          currency: row.currency,
          popular: row.is_popular,
          features: row.features || [],
          icon: row.icon
        }
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A package with this slug already exists'
          })
        }
        logger.error('Failed to create package', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create package'
        })
      }
    }),

  /**
   * Update a package (admin only)
   */
  update: adminProcedure
    .input(z.object({
      slug: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      priceCents: z.number().int().min(0).optional(),
      currency: z.string().optional(),
      isPopular: z.boolean().optional(),
      features: z.array(z.string()).optional(),
      icon: z.string().max(10).optional()
    }))
    .mutation(async ({ input }) => {
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1
      
      if (input.name !== undefined) {
        updates.push(`name = $${paramCount}`)
        values.push(input.name)
        paramCount++
      }
      
      if (input.description !== undefined) {
        updates.push(`description = $${paramCount}`)
        values.push(input.description)
        paramCount++
      }
      
      if (input.priceCents !== undefined) {
        updates.push(`price_cents = $${paramCount}`)
        values.push(input.priceCents)
        paramCount++
      }
      
      if (input.currency !== undefined) {
        updates.push(`currency = $${paramCount}`)
        values.push(input.currency)
        paramCount++
      }
      
      if (input.isPopular !== undefined) {
        updates.push(`is_popular = $${paramCount}`)
        values.push(input.isPopular)
        paramCount++
      }
      
      if (input.features !== undefined) {
        updates.push(`features = $${paramCount}`)
        values.push(JSON.stringify(input.features))
        paramCount++
      }
      
      if (input.icon !== undefined) {
        updates.push(`icon = $${paramCount}`)
        values.push(input.icon)
        paramCount++
      }
      
      if (updates.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No fields to update'
        })
      }
      
      updates.push(`updated_at = NOW()`)
      values.push(input.slug)
      
      const result = await query(
        `UPDATE packages
         SET ${updates.join(', ')}
         WHERE slug = $${paramCount}
         RETURNING id, slug, name, description, price_cents, currency, is_popular, features, icon`,
        values
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Package not found'
        })
      }
      
      const row = result.rows[0]
      logger.info('Package updated', { slug: input.slug })
      
      return {
        id: row.slug,
        slug: row.slug,
        name: row.name,
        description: row.description,
        price: row.price_cents / 100,
        price_cents: row.price_cents,
        currency: row.currency,
        popular: row.is_popular,
        features: row.features || [],
        icon: row.icon
      }
    }),

  /**
   * Delete a package (admin only)
   */
  delete: adminProcedure
    .input(z.object({
      slug: z.string()
    }))
    .mutation(async ({ input }) => {
      const result = await query(
        'DELETE FROM packages WHERE slug = $1 RETURNING slug',
        [input.slug]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Package not found'
        })
      }
      
      logger.info('Package deleted', { slug: input.slug })
      
      return {
        success: true,
        message: 'Package deleted successfully'
      }
    })
})
