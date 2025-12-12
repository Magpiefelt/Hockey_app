import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { queryOne, queryMany, executeQuery, executeTransaction } from '../../utils/database'
import { sanitizeEmail, sanitizeString, sanitizePhone } from '../../utils/sanitize'
import { isValidEmail, isValidPhone, isValidDate } from '../../utils/validation'
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors'
import { logOrderEvent, AuditAction } from '../../utils/audit'
import { logger } from '../../utils/logger'
import { sendOrderConfirmation } from '../../utils/email'

export const ordersRouter = router({
  /**
   * Create a new order/quote request
   */
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      phone: z.string().min(10),
      organization: z.string().optional(),
      serviceType: z.string().min(1),
      sportType: z.string().optional(),
      eventDate: z.string().optional(),
      notes: z.string().optional(),
      packageId: z.string().optional(),
      // Form-specific fields
      teamName: z.string().optional(),
      roster: z.any().optional(),
      introSong: z.any().optional(),
      warmupSongs: z.any().optional(),
      goalHorn: z.any().optional(),
      goalSong: z.any().optional(),
      winSong: z.any().optional(),
      sponsors: z.any().optional(),
      includeSample: z.boolean().optional(),
      audioFiles: z.array(z.any()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now()
      
      // Sanitize inputs
      const name = sanitizeString(input.name)
      const email = sanitizeEmail(input.email)
      const phone = sanitizePhone(input.phone)
      const organization = input.organization ? sanitizeString(input.organization) : null
      const serviceType = sanitizeString(input.serviceType)
      const sportType = input.sportType ? sanitizeString(input.sportType) : null
      const notes = input.notes ? sanitizeString(input.notes) : null
      const teamName = input.teamName ? sanitizeString(input.teamName) : null
      
      // Validate inputs
      if (!isValidEmail(email)) {
        throw new ValidationError('Invalid email format', 'email')
      }
      
      if (!isValidPhone(phone)) {
        throw new ValidationError('Invalid phone number format', 'phone')
      }
      
      if (input.eventDate && !isValidDate(input.eventDate)) {
        throw new ValidationError('Invalid event date', 'eventDate')
      }
      
      logger.info('Order creation attempt', { 
        email, 
        serviceType,
        userId: ctx.user?.userId 
      })
      
      // Use transaction for atomic operation
      const result = await executeTransaction(async (client) => {
        // Get package ID from slug if provided
        let dbPackageId = null
        if (input.packageId) {
          const pkgResult = await client.query<{ id: number }>(
            'SELECT id FROM packages WHERE slug = $1',
            [input.packageId]
          )
          if (pkgResult.rows.length > 0) {
            dbPackageId = pkgResult.rows[0].id
          }
        }
        
        // Get user ID if authenticated
        const userId = ctx.user?.userId || null
        
        // Insert order into quote_requests
        const orderResult = await client.query<{ id: number }>(
          `INSERT INTO quote_requests (
            user_id, package_id, contact_name, contact_email, contact_phone,
            organization, status, event_date, service_type, sport_type, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id`,
          [
            userId,
            dbPackageId,
            name,
            email,
            phone,
            organization,
            'submitted',
            input.eventDate || null,
            serviceType,
            sportType,
            notes
          ]
        )
        
        if (orderResult.rows.length === 0) {
          throw new Error('Failed to create order')
        }
        
        const orderId = orderResult.rows[0].id
        
        // Insert form-specific data into form_submissions
        if (teamName || input.roster || input.introSong) {
          await client.query(
            `INSERT INTO form_submissions (
              quote_id, team_name, roster_method, roster_players,
              intro_song, warmup_songs, goal_horn, goal_song, win_song,
              sponsors, include_sample, audio_files
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              orderId,
              teamName,
              input.roster?.method || null,
              input.roster?.players ? JSON.stringify(input.roster.players) : null,
              input.introSong ? JSON.stringify(input.introSong) : null,
              input.warmupSongs ? JSON.stringify(input.warmupSongs) : null,
              input.goalHorn ? JSON.stringify(input.goalHorn) : null,
              input.goalSong ? JSON.stringify(input.goalSong) : null,
              input.winSong ? JSON.stringify(input.winSong) : null,
              input.sponsors ? JSON.stringify(input.sponsors) : null,
              input.includeSample || false,
              input.audioFiles ? JSON.stringify(input.audioFiles) : null
            ]
          )
        }
        
        // Log status change
        await client.query(
          `INSERT INTO order_status_history (quote_id, new_status, notes)
           VALUES ($1, $2, $3)`,
          [orderId, 'submitted', 'Order created']
        )
        
        return orderId
      })
      
      const duration = Date.now() - startTime
      logger.info('Order created successfully', { 
        orderId: result, 
        email,
        userId: ctx.user?.userId,
        duration 
      })
      
      // Log to audit trail
      await logOrderEvent(
        AuditAction.ORDER_CREATED,
        result,
        ctx.user?.userId,
        {
          email,
          serviceType,
          ip: ctx.event.context.ip,
          userAgent: ctx.event.context.userAgent
        }
      )
      
      // Send order confirmation email
      try {
        await sendOrderConfirmation({
          to: email,
          name: name,
          serviceType: serviceType,
          orderId: result
        })
        logger.info('Order confirmation email sent', { orderId: result, email })
      } catch (emailError: any) {
        // Don't fail the order creation if email fails
        logger.error('Failed to send order confirmation email', { 
          orderId: result, 
          email, 
          error: emailError.message 
        })
      }
      
      return {
        id: result.toString(),
        message: 'Order submitted successfully'
      }
    }),

  /**
   * Get user's orders
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      logger.debug('Fetching user orders', { userId: ctx.user.userId })
      
      const orders = await queryMany<{
        id: number
        name: string
        email: string
        status: string
        event_date: Date | null
        service_type: string
        sport_type: string | null
        quoted_amount: number | null
        total_amount: number | null
        created_at: Date
        updated_at: Date | null
        package_id: string | null
        service_name: string
      }>(
        `SELECT 
          qr.id, qr.contact_name as name, qr.contact_email as email,
          qr.status, qr.event_date, qr.service_type, qr.sport_type,
          qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
          p.slug as package_id, COALESCE(p.name, qr.service_type) as service_name
        FROM quote_requests qr
        LEFT JOIN packages p ON qr.package_id = p.id
        WHERE qr.user_id = $1
        ORDER BY qr.created_at DESC`,
        [ctx.user.userId]
      )
      
      return orders.map(row => ({
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        packageId: row.package_id,
        serviceType: row.service_name,
        sportType: row.sport_type,
        status: row.status,
        quotedAmount: row.quoted_amount,
        totalAmount: row.total_amount,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at?.toISOString()
      }))
    }),

  /**
   * Get order details
   */
  get: protectedProcedure
    .input(z.object({
      id: z.union([z.string(), z.number()])
    }))
    .query(async ({ input, ctx }) => {
      const orderId = typeof input.id === 'string' ? parseInt(input.id) : input.id
      
      logger.debug('Fetching order details', { orderId, userId: ctx.user.userId })
      
      // Get order with form submission data
      const order = await queryOne<{
        id: number
        user_id: number | null
        name: string
        email: string
        phone: string
        organization: string | null
        status: string
        event_date: Date | null
        service_type: string
        sport_type: string | null
        notes: string | null
        admin_notes: string | null
        quoted_amount: number | null
        total_amount: number | null
        created_at: Date
        updated_at: Date | null
        package_id: string | null
        package_name: string | null
        team_name: string | null
        roster_method: string | null
        roster_players: any
        intro_song: any
        warmup_songs: any
        goal_horn: any
        goal_song: any
        win_song: any
        sponsors: any
        include_sample: boolean | null
        audio_files: any
      }>(
        `SELECT 
          qr.id, qr.user_id, qr.contact_name as name, qr.contact_email as email,
          qr.contact_phone as phone, qr.organization, qr.status, qr.event_date, qr.service_type,
          qr.sport_type, qr.notes, qr.admin_notes,
          qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
          p.slug as package_id, p.name as package_name,
          fs.team_name, fs.roster_method, fs.roster_players, fs.intro_song,
          fs.warmup_songs, fs.goal_horn, fs.goal_song, fs.win_song,
          fs.sponsors, fs.include_sample, fs.audio_files
        FROM quote_requests qr
        LEFT JOIN packages p ON qr.package_id = p.id
        LEFT JOIN form_submissions fs ON qr.id = fs.quote_id
        WHERE qr.id = $1`,
        [orderId]
      )
      
      if (!order) {
        throw new NotFoundError('Order')
      }
      
      // Check authorization
      if (order.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        logger.warn('Unauthorized order access attempt', { 
          orderId, 
          userId: ctx.user.userId,
          orderUserId: order.user_id
        })
        throw new AuthorizationError('Not authorized to view this order')
      }
      
      // Get files
      const files = await queryMany<{
        id: number
        field_name: string
        file_name: string
        storage_url: string
        mime_type: string
        file_size: number
        kind: string
        created_at: Date
      }>(
        `SELECT id, field_name, file_name, storage_url, mime_type, file_size, kind, created_at
         FROM file_uploads
         WHERE quote_id = $1
         ORDER BY created_at ASC`,
        [orderId]
      )
      
      return {
        order: {
          id: order.id.toString(),
          name: order.name,
          email: order.email,
          phone: order.phone,
          organization: order.organization,
          packageId: order.package_id,
          serviceType: order.service_type || order.package_name,
          sportType: order.sport_type,
          status: order.status,
          quotedAmount: order.quoted_amount,
          totalAmount: order.total_amount,
          notes: order.notes,
          adminNotes: order.admin_notes,
          createdAt: order.created_at.toISOString(),
          updatedAt: order.updated_at?.toISOString(),
          // Form submission data
          formData: order.team_name ? {
            teamName: order.team_name,
            rosterMethod: order.roster_method,
            rosterPlayers: order.roster_players,
            introSong: order.intro_song,
            warmupSongs: order.warmup_songs,
            goalHorn: order.goal_horn,
            goalSong: order.goal_song,
            winSong: order.win_song,
            sponsors: order.sponsors,
            includeSample: order.include_sample || false,
            audioFiles: order.audio_files
          } : null
        },
        files: files.map(file => ({
          id: file.id.toString(),
          filename: file.file_name,
          fileSize: file.file_size,
          kind: file.kind,
          url: file.storage_url,
          createdAt: file.created_at.toISOString()
        }))
      }
    }),

  /**
   * Attach a file to an order
   */
  attachFile: protectedProcedure
    .input(z.object({
      orderId: z.union([z.string(), z.number()]),
      fileId: z.union([z.string(), z.number()])
    }))
    .mutation(async ({ input, ctx }) => {
      const orderId = typeof input.orderId === 'string' ? parseInt(input.orderId) : input.orderId
      const fileId = typeof input.fileId === 'string' ? parseInt(input.fileId) : input.fileId
      
      logger.debug('Attaching file to order', { orderId, fileId, userId: ctx.user.userId })
      
      // Verify the order exists and user has access
      const order = await queryOne<{ id: number; user_id: number | null }>(
        'SELECT id, user_id FROM quote_requests WHERE id = $1',
        [orderId]
      )
      
      if (!order) {
        throw new NotFoundError('Order')
      }
      
      // Check authorization
      if (order.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to attach files to this order')
      }
      
      // Update the file to link it to the order
      await executeQuery(
        'UPDATE file_uploads SET quote_id = $1 WHERE id = $2',
        [orderId, fileId]
      )
      
      logger.info('File attached to order', { orderId, fileId, userId: ctx.user.userId })
      
      return {
        success: true,
        message: 'File attached successfully'
      }
    })
})
