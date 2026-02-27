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
   * Get all packages (public + admin)
   * Returns ALL packages ordered by display_order. Used by admin panel.
   * For public-facing pages that should only show visible packages, use getVisible.
   */
  getAll: publicProcedure
    .query(async () => {
      try {
        const result = await query(
          `SELECT id, slug, name, description, price_cents, currency, is_popular, features, icon,
                  display_order, badge_text, is_visible, price_suffix, created_at
           FROM packages
           ORDER BY display_order ASC, name ASC`
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
          displayOrder: row.display_order ?? 0,
          badgeText: row.badge_text || null,
          isVisible: row.is_visible ?? true,
          priceSuffix: row.price_suffix || '/game',
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
   * Get visible packages only (public, for home page and request form)
   */
  getVisible: publicProcedure
    .query(async () => {
      try {
        const result = await query(
          `SELECT id, slug, name, description, price_cents, currency, is_popular, features, icon,
                  display_order, badge_text, is_visible, price_suffix, created_at
           FROM packages
           WHERE is_visible = TRUE
           ORDER BY display_order ASC, name ASC`
        )
        
        return result.rows.map(row => ({
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
          displayOrder: row.display_order ?? 0,
          badgeText: row.badge_text || null,
          isVisible: true,
          priceSuffix: row.price_suffix || '/game',
          createdAt: row.created_at?.toISOString()
        }))
      } catch (error: any) {
        logger.error('Failed to fetch visible packages', error)
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
      try {
        const result = await query(
          `SELECT id, slug, name, description, price_cents, currency, is_popular, features, icon,
                  display_order, badge_text, is_visible, price_suffix, created_at
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
          displayOrder: row.display_order ?? 0,
          badgeText: row.badge_text || null,
          isVisible: row.is_visible ?? true,
          priceSuffix: row.price_suffix || '/game',
          createdAt: row.created_at?.toISOString()
        }
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        logger.error('Failed to fetch package by slug', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load package'
        })
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
      icon: z.string().max(10).optional(),
      displayOrder: z.number().int().min(0).default(0),
      badgeText: z.string().max(50).optional(),
      isVisible: z.boolean().default(true),
      priceSuffix: z.string().max(30).default('/game')
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await query(
          `INSERT INTO packages (slug, name, description, price_cents, currency, is_popular, features, icon,
                                 display_order, badge_text, is_visible, price_suffix)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id, slug, name, description, price_cents, currency, is_popular, features, icon,
                     display_order, badge_text, is_visible, price_suffix, created_at`,
          [
            input.slug,
            input.name,
            input.description || null,
            input.priceCents,
            input.currency,
            input.isPopular,
            JSON.stringify(input.features || []),
            input.icon || null,
            input.displayOrder,
            input.badgeText || null,
            input.isVisible,
            input.priceSuffix
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
          icon: row.icon,
          displayOrder: row.display_order ?? 0,
          badgeText: row.badge_text || null,
          isVisible: row.is_visible ?? true,
          priceSuffix: row.price_suffix || '/game'
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
      icon: z.string().max(10).optional(),
      displayOrder: z.number().int().min(0).optional(),
      badgeText: z.string().max(50).nullable().optional(),
      isVisible: z.boolean().optional(),
      priceSuffix: z.string().max(30).optional()
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

      if (input.displayOrder !== undefined) {
        updates.push(`display_order = $${paramCount}`)
        values.push(input.displayOrder)
        paramCount++
      }

      if (input.badgeText !== undefined) {
        updates.push(`badge_text = $${paramCount}`)
        values.push(input.badgeText)
        paramCount++
      }

      if (input.isVisible !== undefined) {
        updates.push(`is_visible = $${paramCount}`)
        values.push(input.isVisible)
        paramCount++
      }

      if (input.priceSuffix !== undefined) {
        updates.push(`price_suffix = $${paramCount}`)
        values.push(input.priceSuffix)
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
      
      try {
        const result = await query(
          `UPDATE packages
           SET ${updates.join(', ')}
           WHERE slug = $${paramCount}
           RETURNING id, slug, name, description, price_cents, currency, is_popular, features, icon,
                     display_order, badge_text, is_visible, price_suffix`,
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
          icon: row.icon,
          displayOrder: row.display_order ?? 0,
          badgeText: row.badge_text || null,
          isVisible: row.is_visible ?? true,
          priceSuffix: row.price_suffix || '/game'
        }
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        logger.error('Failed to update package', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update package'
        })
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
      try {
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
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        logger.error('Failed to delete package', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete package'
        })
      }
    })
})
