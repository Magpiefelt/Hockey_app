import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { queryOne, queryMany, executeQuery, executeTransaction } from '../../utils/database'
import { sanitizeEmail, sanitizeString, sanitizePhone } from '../../utils/sanitize'
import { isValidEmail, isValidPhone, isValidDate, isFutureDate } from '../../utils/validation'
import { NotFoundError, AuthorizationError, ValidationError, ConflictError } from '../../utils/errors'
import { logOrderEvent, AuditAction } from '../../utils/audit'
import { logger } from '../../utils/logger'
import { sendOrderConfirmation } from '../../utils/email'
import { cleanJsonbObject, cleanWarmupSongs, cleanRosterPlayers, cleanSongObject } from '../../utils/jsonb'
import { validateOrderInputLengths, validateJsonbFields, validateNoXSS } from '../../utils/validation-extended'
import { logFailedSubmission } from '../../utils/failed-submissions'
import { rateLimit } from '../middleware/rateLimit'
import { calendarRouter } from './calendar'

export const ordersRouter = router({
  /**
   * Create a new order/quote request
   */
  create: publicProcedure
    .use(rateLimit({
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier: (ctx) => ctx.event?.context?.ip || 'unknown',
      message: 'Too many submission attempts'
    }))
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
      
      // Validate event date is in the future
      if (input.eventDate && !isFutureDate(input.eventDate)) {
        throw new ValidationError('Event date must be in the future', 'eventDate')
      }
      
      // SERVER-SIDE DATE AVAILABILITY CHECK
      // This is the critical validation to prevent double-bookings
      // Even if the client-side check passes, we verify here to handle race conditions
      if (input.eventDate) {
        try {
          // Create a caller for the calendar router to check availability
          const calendarApi = calendarRouter.createCaller(ctx)
          const availability = await calendarApi.isDateAvailable({ date: input.eventDate })
          
          if (!availability.available) {
            const reasonMessage = availability.reason === 'blocked' 
              ? 'This date has been blocked by the administrator.'
              : 'This date is already booked for another event.'
            
            logger.warn('Date availability conflict during order creation', {
              date: input.eventDate,
              reason: availability.reason,
              email,
              ip: ctx.event?.context?.ip
            })
            
            throw new ConflictError(
              `The selected date (${input.eventDate}) is no longer available. ${reasonMessage} Please go back and choose another date.`
            )
          }
          
          logger.debug('Date availability check passed', { date: input.eventDate })
        } catch (error: any) {
          // If it's already a ConflictError, re-throw it
          if (error instanceof ConflictError) {
            throw error
          }
          
          // Log the error but don't block submission if availability check fails
          // This is a graceful degradation - we'd rather accept the order than reject it
          // due to a temporary API issue
          logger.error('Date availability check failed, proceeding with order', error, {
            date: input.eventDate
          })
        }
      }
      
      // Validate input lengths
      validateOrderInputLengths(input)
      
      // Validate JSONB fields
      const jsonbValidation = validateJsonbFields(input)
      if (!jsonbValidation.isValid) {
        throw new ValidationError(jsonbValidation.errors.join(', '), 'jsonb')
      }
      
      // Check for XSS attempts
      validateNoXSS(input)
      
      logger.info('Order creation attempt', { 
        email, 
        serviceType,
        userId: ctx.user?.userId 
      })
      
      // Get package ID for failed submission logging
      // Resolve package ID from slug
      // The packages table may not be seeded yet, so we handle this gracefully
      let dbPackageId: number | null = null
      if (input.packageId) {
        const pkgResult = await executeQuery<{ id: number }>(
          'SELECT id FROM packages WHERE slug = $1',
          [input.packageId]
        )
        if (pkgResult.rows.length > 0) {
          dbPackageId = pkgResult.rows[0].id
        } else {
          // Package not found in database - this can happen if:
          // 1. The packages table hasn't been seeded yet
          // 2. The package slug is invalid
          // We log a warning but allow the order to proceed with null package_id
          // The serviceType field will still capture what package was selected
          logger.warn('Package slug not found in database, proceeding without package_id', {
            packageId: input.packageId,
            email,
            serviceType
          })
          // Note: We intentionally do NOT throw an error here to avoid blocking
          // legitimate orders when the database hasn't been seeded.
          // The admin can still see the serviceType to understand what was ordered.
        }
      }
      
      // Use transaction for atomic operation
      let result: number
      try {
        result = await executeTransaction(async (client) => {
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
        // Check if ANY form data is provided (not just teamName/roster/introSong)
        const hasAnyFormData = teamName || input.roster || input.introSong || 
                               input.warmupSongs || input.goalHorn || input.goalSong || 
                               input.winSong || input.sponsors || 
                               (input.audioFiles && input.audioFiles.length > 0)
        
        if (hasAnyFormData) {
          // Log the cleaned data for debugging
          const cleanedData = {
            introSong: cleanSongObject(input.introSong),
            warmupSongs: cleanWarmupSongs(input.warmupSongs),
            goalHorn: cleanJsonbObject(input.goalHorn),
            goalSong: cleanJsonbObject(input.goalSong),
            winSong: cleanJsonbObject(input.winSong)
          }
          logger.info('Cleaned JSONB data', { cleanedData, orderId })
          
          try {
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
              // Arrays must be JSON.stringify'd for JSONB columns (pg library limitation)
              cleanRosterPlayers(input.roster?.players) ? JSON.stringify(cleanRosterPlayers(input.roster?.players)) : null,
              cleanSongObject(input.introSong),
              cleanWarmupSongs(input.warmupSongs),
              cleanJsonbObject(input.goalHorn),
              cleanJsonbObject(input.goalSong),
              cleanJsonbObject(input.winSong),
              cleanJsonbObject(input.sponsors),
              input.includeSample || false,
              // Arrays must be JSON.stringify'd for JSONB columns (pg library limitation)
              (() => {
                const cleaned = cleanJsonbObject(input.audioFiles)
                return cleaned && Array.isArray(cleaned) ? JSON.stringify(cleaned) : cleaned
              })()
            ]
          )
          } catch (dbError: any) {
            logger.error('Database JSONB insertion error', {
              error: dbError.message,
              code: dbError.code,
              detail: dbError.detail,
              hint: dbError.hint,
              cleanedData,
              rawInput: {
                introSong: input.introSong,
                warmupSongs: input.warmupSongs,
                goalHorn: input.goalHorn
              }
            })
            throw new Error(`Database error: ${dbError.message}. Please check that all song fields are properly formatted.`)
          }
        }
        
        // Log status change
        await client.query(
          `INSERT INTO order_status_history (quote_id, new_status, notes)
           VALUES ($1, $2, $3)`,
          [orderId, 'submitted', 'Order created']
        )
        
        return orderId
      })
      } catch (transactionError: any) {
        // Log failed submission for follow-up
        await logFailedSubmission({
          contactEmail: email,
          contactName: name,
          contactPhone: phone,
          packageId: dbPackageId,
          formData: input,
          error: transactionError,
          errorCode: transactionError.code,
          ipAddress: ctx.event?.context?.ip,
          userAgent: ctx.event?.context?.userAgent
        })
        
        // Re-throw the error to be handled by error middleware
        throw transactionError
      }
      
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
          ip: ctx.event?.context?.ip,
          userAgent: ctx.event?.context?.userAgent
        }
      )
      
      // Send order confirmation email asynchronously (non-blocking)
      // This prevents the 2-minute delay issue when SMTP is slow
      sendOrderConfirmation({
        to: email,
        name: name,
        serviceType: serviceType,
        orderId: result
      }).then(() => {
        logger.info('Order confirmation email sent', { orderId: result, email })
      }).catch((emailError: any) => {
        // Don't fail the order creation if email fails
        logger.error('Failed to send order confirmation email', { 
          orderId: result, 
          email, 
          error: emailError.message 
        })
      })
      
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
        deliverable_url: string | null
      }>(
        `SELECT 
          qr.id, qr.contact_name as name, qr.contact_email as email,
          qr.status, qr.event_date, qr.service_type, qr.sport_type,
          qr.quoted_amount, qr.total_amount, qr.created_at, qr.updated_at,
          p.slug as package_id, COALESCE(p.name, qr.service_type) as service_name,
          (SELECT storage_url FROM file_uploads 
           WHERE quote_id = qr.id AND kind = 'deliverable' 
           ORDER BY created_at DESC LIMIT 1) as deliverable_url
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
        eventDate: row.event_date ? new Date(row.event_date).toISOString().split('T')[0] : null,
        deliverableUrl: row.deliverable_url || null,
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
      
      // SECURITY FIX: Check authorization BEFORE fetching full data
      // This prevents data leakage by verifying access with minimal data fetch
      const authCheck = await queryOne<{ user_id: number | null }>(
        'SELECT user_id FROM quote_requests WHERE id = $1',
        [orderId]
      )
      
      if (!authCheck) {
        throw new NotFoundError('Order')
      }
      
      if (authCheck.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        logger.warn('Unauthorized order access attempt', { 
          orderId, 
          userId: ctx.user.userId,
          orderUserId: authCheck.user_id
        })
        throw new AuthorizationError('Not authorized to view this order')
      }
      
      // Now safe to fetch full order data
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
        // This shouldn't happen since we already checked above, but handle gracefully
        throw new NotFoundError('Order')
      }
      
      // Authorization already verified above - safe to proceed
      
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
    }),

  /**
   * Cancel an order (customer can only cancel before payment)
   */
  cancel: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string().max(500).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { orderId, reason } = input
      
      logger.info('Order cancellation requested', { orderId, userId: ctx.user.userId })
      
      // Get the order
      const order = await queryOne<{ 
        id: number
        user_id: number | null
        status: string
        contact_email: string
      }>(
        'SELECT id, user_id, status, contact_email FROM quote_requests WHERE id = $1',
        [orderId]
      )
      
      if (!order) {
        throw new NotFoundError('Order')
      }
      
      // Check authorization - user must own the order
      if (order.user_id !== ctx.user.userId) {
        throw new AuthorizationError('Not authorized to cancel this order')
      }
      
      // Check if order can be cancelled
      // Customers can only cancel orders that haven't been paid yet
      const cancellableStatuses = ['submitted', 'quoted', 'quote_viewed', 'quote_accepted', 'invoiced']
      if (!cancellableStatuses.includes(order.status)) {
        throw new ValidationError(
          `Orders with status '${order.status}' cannot be cancelled. Please contact support for assistance.`,
          'status'
        )
      }
      
      // Update order status to cancelled
      await executeQuery(
        `UPDATE quote_requests 
         SET status = 'cancelled', 
             updated_at = NOW(),
             notes = COALESCE(notes, '') || $2
         WHERE id = $1`,
        [orderId, reason ? `\n\n[Customer Cancelled: ${reason}]` : '\n\n[Cancelled by customer]']
      )
      
      // Log the cancellation
      await logOrderEvent(
        AuditAction.ORDER_STATUS_CHANGED,
        orderId,
        ctx.user.userId,
        {
          previousStatus: order.status,
          newStatus: 'cancelled',
          reason: reason || 'Customer requested cancellation'
        }
      )
      
      logger.info('Order cancelled by customer', { 
        orderId, 
        userId: ctx.user.userId,
        previousStatus: order.status,
        reason 
      })
      
      return {
        success: true,
        message: 'Order cancelled successfully'
      }
    })
})
