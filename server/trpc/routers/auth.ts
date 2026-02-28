import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { queryOne, queryOneOrFail, executeQuery } from '../../utils/database'
import { hashPassword, verifyPassword, generateToken, setAuthCookie, clearAuthCookie } from '../../utils/auth'
import { sanitizeEmail, sanitizeString } from '../../utils/sanitize'
import { isValidEmail, isStrongPassword } from '../../utils/validation'
import { ConflictError, AuthenticationError, NotFoundError } from '../../utils/errors'
import { logAuthEvent, AuditAction } from '../../utils/audit'
import { logger } from '../../utils/logger'

export const authRouter = router({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(8)
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now()
      
      // Sanitize inputs
      const name = sanitizeString(input.name)
      const email = sanitizeEmail(input.email)
      const password = input.password
      
      // Validate email
      if (!isValidEmail(email)) {
        throw new AuthenticationError('Invalid email format')
      }
      
      // Validate password strength
      const passwordValidation = isStrongPassword(password)
      if (!passwordValidation.valid) {
        throw new AuthenticationError(passwordValidation.errors.join(', '))
      }
      
      logger.info('Registration attempt', { email })
      
      // Check if user already exists
      const existingUser = await queryOne<{ id: number }>(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      
      if (existingUser) {
        logger.warn('Registration failed - email already exists', { email })
        await logAuthEvent(AuditAction.REGISTER, undefined, false, { 
          email, 
          reason: 'email_exists',
          ip: ctx.event.context.ip
        })
        // SECURITY FIX: Use generic error message to prevent user enumeration
        // The specific reason is logged internally but not exposed to the user
        throw new AuthenticationError('Unable to create account. Please check your information and try again.')
      }
      
      // Hash password
      const passwordHash = await hashPassword(password)
      
      // Create user
      const user = await queryOneOrFail<{
        id: number
        name: string
        email: string
        role: string
      }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [name, email, passwordHash, 'customer'],
        'Failed to create user'
      )
      
      // Generate token and set cookie
      const token = generateToken(user.id, user.role)
      setAuthCookie(ctx.event, token)
      
      // Log successful registration
      const duration = Date.now() - startTime
      logger.info('User registered successfully', { 
        userId: user.id, 
        email: user.email,
        duration 
      })
      
      await logAuthEvent(AuditAction.REGISTER, user.id, true, {
        email: user.email,
        ip: ctx.event.context.ip,
        userAgent: ctx.event.context.userAgent
      })
      
      return {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now()
      
      // Sanitize email
      const email = sanitizeEmail(input.email)
      const password = input.password
      
      logger.info('Login attempt started', { email, timestamp: new Date().toISOString() })
      
      // Find user with enhanced error handling
      let user
      try {
        logger.debug('Executing user lookup query', { email })
        
        user = await queryOne<{
          id: number
          name: string
          email: string
          password_hash: string
          role: string
        }>(
          'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
          [email]
        )
        
        logger.info('User lookup query completed', { 
          email, 
          userFound: !!user,
          userId: user?.id,
          userRole: user?.role
        })
        
      } catch (queryError: any) {
        // This is the critical error path
        logger.error('CRITICAL: User lookup query threw an exception', {
          email,
          errorMessage: queryError.message,
          errorName: queryError.name,
          errorType: queryError.constructor.name,
          stack: queryError.stack,
          originalError: queryError.originalError || queryError.cause
        })
        
        // Log to audit trail
        await logAuthEvent(AuditAction.LOGIN, undefined, false, {
          email,
          reason: 'database_query_failed',
          error: queryError.message,
          ip: ctx.event.context.ip
        })
        
        // Return a user-safe error while the real cause is logged above
        throw new AuthenticationError('Unable to process login request. Please try again.')
      }
      
      // User not found
      if (!user) {
        logger.warn('Login failed - user not found in database', { 
          email,
          searchedEmail: email,
          timestamp: new Date().toISOString()
        })
        
        await logAuthEvent(AuditAction.LOGIN, undefined, false, {
          email,
          reason: 'user_not_found',
          ip: ctx.event.context.ip
        })
        
        // Return 401 Unauthorized, not 500
        throw new AuthenticationError('Invalid email or password')
      }
      
      logger.debug('Verifying password', { userId: user.id })
      
      // Verify password
      let isValid
      try {
        isValid = await verifyPassword(password, user.password_hash)
        logger.debug('Password verification completed', { userId: user.id, isValid })
      } catch (verifyError: any) {
        logger.error('Password verification threw an exception', {
          userId: user.id,
          error: verifyError.message
        })
        throw new AuthenticationError('Unable to process login request. Please try again.')
      }
      
      if (!isValid) {
        logger.warn('Login failed - invalid password', { 
          email, 
          userId: user.id 
        })
        await logAuthEvent(AuditAction.LOGIN, user.id, false, {
          email,
          reason: 'invalid_password',
          ip: ctx.event.context.ip
        })
        throw new AuthenticationError('Invalid email or password')
      }
      
      logger.debug('Generating authentication token', { userId: user.id })
      
      // Generate token and set cookie
      let token
      try {
        token = generateToken(user.id, user.role)
        setAuthCookie(ctx.event, token)
        logger.debug('Auth cookie set successfully', { userId: user.id })
      } catch (tokenError: any) {
        logger.error('Token generation or cookie setting failed', {
          userId: user.id,
          error: tokenError.message,
          stack: tokenError.stack
        })
        throw new AuthenticationError('Unable to complete login. Please try again.')
      }
      
      // Log successful login
      const duration = Date.now() - startTime
      logger.info('User logged in successfully', { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        duration 
      })
      
      await logAuthEvent(AuditAction.LOGIN, user.id, true, {
        email: user.email,
        ip: ctx.event.context.ip,
        userAgent: ctx.event.context.userAgent
      })
      
      return {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    }),

  /**
   * Get current user
   */
  me: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new AuthenticationError('Not authenticated')
      }
      
      // Get user details from database
      const user = await queryOneOrFail<{
        id: number
        name: string
        email: string
        role: string
      }>(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [ctx.user.userId],
        'User not found'
      )
      
      return {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    }),

  /**
   * Logout
   */
  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.userId
      
      clearAuthCookie(ctx.event)
      
      if (userId) {
        logger.info('User logged out', { userId })
        await logAuthEvent(AuditAction.LOGOUT, userId, true, {
          ip: ctx.event.context.ip
        })
      }
      
      return { success: true }
    }),

  /**
   * Change password (protected)
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8)
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId
      
      // Validate new password strength
      const passwordValidation = isStrongPassword(input.newPassword)
      if (!passwordValidation.valid) {
        throw new AuthenticationError(passwordValidation.errors.join(', '))
      }
      
      // Get current password hash
      const user = await queryOneOrFail<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId],
        'User not found'
      )
      
      // Verify current password
      const isValid = await verifyPassword(input.currentPassword, user.password_hash)
      if (!isValid) {
        logger.warn('Password change failed - invalid current password', { userId })
        await logAuthEvent(AuditAction.PASSWORD_CHANGE, userId, false, {
          reason: 'invalid_current_password',
          ip: ctx.event.context.ip
        })
        throw new AuthenticationError('Current password is incorrect')
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword)
      
      // Update password
      await executeQuery(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
      )
      
      logger.info('Password changed successfully', { userId })
      await logAuthEvent(AuditAction.PASSWORD_CHANGE, userId, true, {
        ip: ctx.event.context.ip,
        userAgent: ctx.event.context.userAgent
      })
      
      return { success: true }
    }),

  /**
   * Request password reset (public)
   */
  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email()
    }))
    .mutation(async ({ input, ctx }) => {
      const email = sanitizeEmail(input.email)
      
      logger.info('Password reset requested', { email })
      
      // Find user
      const user = await queryOne<{ id: number; name: string; email: string }>(
        'SELECT id, name, email FROM users WHERE email = $1',
        [email]
      )
      
      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        logger.warn('Password reset requested for non-existent user', { email })
        // Still return success to prevent user enumeration
        return { success: true, message: 'If an account exists with this email, you will receive a password reset link.' }
      }
      
      // Generate secure random token
      const crypto = await import('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      
      // Store token in database - handle missing table
      try {
        await executeQuery(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at)
           VALUES ($1, $2, $3)`,
          [user.id, token, expiresAt]
        )
      } catch (dbErr: any) {
        if (dbErr.message?.includes('password_reset_tokens')) {
          // Create table on the fly if it doesn't exist
          await executeQuery(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id),
              token VARCHAR(255) NOT NULL UNIQUE,
              expires_at TIMESTAMPTZ NOT NULL,
              used BOOLEAN DEFAULT FALSE,
              used_at TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `)
          await executeQuery(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, token, expiresAt]
          )
        } else {
          throw dbErr
        }
      }
      
      // Send password reset email
      const config = useRuntimeConfig()
      const resetUrl = `${config.public.appBaseUrl}/reset-password?token=${token}`
      
      const { sendPasswordResetEmail } = await import('../../utils/email')
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl
      })
      
      logger.info('Password reset email sent', { userId: user.id, email: user.email })
      
      await logAuthEvent(AuditAction.PASSWORD_RESET_REQUEST, user.id, true, {
        email: user.email,
        ip: ctx.event.context.ip
      })
      
      return { 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      }
    }),

  /**
   * Reset password with token (public)
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8)
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate new password strength
      const passwordValidation = isStrongPassword(input.newPassword)
      if (!passwordValidation.valid) {
        throw new AuthenticationError(passwordValidation.errors.join(', '))
      }
      
      logger.info('Password reset attempt', { token: input.token.substring(0, 8) + '...' })
      
      // Find valid token
      const tokenRecord = await queryOne<{
        id: number
        user_id: number
        expires_at: Date
        used: boolean
      }>(
        `SELECT id, user_id, expires_at, used
         FROM password_reset_tokens
         WHERE token = $1`,
        [input.token]
      )
      
      if (!tokenRecord) {
        logger.warn('Invalid password reset token', { token: input.token.substring(0, 8) + '...' })
        throw new AuthenticationError('Invalid or expired password reset token')
      }
      
      // Check if token has been used
      if (tokenRecord.used) {
        logger.warn('Password reset token already used', { tokenId: tokenRecord.id })
        throw new AuthenticationError('This password reset link has already been used')
      }
      
      // Check if token has expired
      if (new Date() > new Date(tokenRecord.expires_at)) {
        logger.warn('Password reset token expired', { tokenId: tokenRecord.id })
        throw new AuthenticationError('This password reset link has expired. Please request a new one.')
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword)
      
      // Update password and mark token as used
      await executeQuery(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, tokenRecord.user_id]
      )
      
      await executeQuery(
        'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1',
        [tokenRecord.id]
      )
      
      logger.info('Password reset successful', { userId: tokenRecord.user_id })
      
      await logAuthEvent(AuditAction.PASSWORD_RESET, tokenRecord.user_id, true, {
        ip: ctx.event.context.ip,
        userAgent: ctx.event.context.userAgent
      })
      
      return { success: true, message: 'Your password has been reset successfully. You can now log in with your new password.' }
    })
})
