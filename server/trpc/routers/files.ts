import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc'
import { query } from '../../db/connection'
import { sanitizeFilename } from '../../utils/sanitize'

/**
 * File Upload Integration
 * Handles file uploads using AWS S3 presigned URLs
 */
import { getUploadPresignedUrl, getDownloadPresignedUrl, generateS3Key, isS3Configured } from '../../utils/s3'
import { logger } from '../../utils/logger'

export const filesRouter = router({
  /**
   * Get presigned upload URL
   */
  getUploadUrl: publicProcedure
    .input(z.object({
      orderId: z.number().optional(),
      filename: z.string(),
      contentType: z.string(),
      sizeBytes: z.number(),
      kind: z.enum(['upload', 'deliverable']).optional()
    }))
    .mutation(async ({ input }) => {
      const config = useRuntimeConfig()
      
      // Validate file size (max 200MB)
      const maxSize = 200 * 1024 * 1024
      if (input.sizeBytes > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size exceeds maximum allowed size of 200MB'
        })
      }
      
      // Validate content type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'video/mp4',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
      
      if (!allowedTypes.includes(input.contentType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File type not allowed'
        })
      }
      
      // Check if S3 is configured
      if (!isS3Configured()) {
        logger.warn('S3 not configured, file uploads unavailable')
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'File upload service is not configured. Please contact support.'
        })
      }
      
      try {
        // SECURITY FIX: Sanitize filename to prevent path traversal
        const safeFilename = sanitizeFilename(input.filename)
        
        // Generate S3 key
        const orderId = input.orderId || 0
        const kind = input.kind || 'upload'
        const key = generateS3Key(orderId, safeFilename, kind)
        
        // Generate presigned upload URL (valid for 1 hour)
        const uploadUrl = await getUploadPresignedUrl({
          key,
          contentType: input.contentType,
          expiresIn: 3600
        })
        
        // Generate public URL (will be used after upload)
        const publicUrl = `https://${config.s3BucketName}.s3.${config.s3Region}.amazonaws.com/${key}`
        
        logger.info('Generated upload URL', { 
          orderId, 
          filename: input.filename, 
          kind 
        })
        
        return {
          uploadUrl,
          key,
          publicUrl
        }
      } catch (error: any) {
        logger.error('Upload URL generation error', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate upload URL'
        })
      }
    }),

  /**
   * Get download URL for a file
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({
      fileId: z.union([z.string(), z.number()])
    }))
    .query(async ({ input, ctx }) => {
      const fileId = typeof input.fileId === 'string' ? parseInt(input.fileId) : input.fileId
      
      // Get file record
      const result = await query(
        `SELECT fu.*, qr.user_id
         FROM file_uploads fu
         JOIN quote_requests qr ON fu.quote_id = qr.id
         WHERE fu.id = $1`,
        [fileId]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found'
        })
      }
      
      const file = result.rows[0]
      
      // Check authorization
      if (file.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this file'
        })
      }
      
      try {
        // Generate presigned download URL for S3
        const downloadUrl = await getDownloadPresignedUrl(file.storage_path, 3600)
        
        logger.info('Generated download URL', { fileId, userId: ctx.user.userId })
        
        return {
          url: downloadUrl,
          filename: file.file_name,
          mimeType: file.mime_type,
          fileSize: file.file_size
        }
      } catch (error: any) {
        logger.error('Download URL generation error', error, { fileId })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate download URL'
        })
      }
    }),

  /**
   * Register uploaded file in database
   * SECURITY FIX: Changed from publicProcedure to protectedProcedure
   * Deliverables can only be uploaded by admins
   */
  registerUpload: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      fieldName: z.string().default('file'),
      filename: z.string(),
      storagePath: z.string(),
      storageUrl: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      kind: z.enum(['upload', 'deliverable']).default('upload')
    }))
    .mutation(async ({ input, ctx }) => {
      // SECURITY: Only admins can upload deliverables
      if (input.kind === 'deliverable' && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can upload deliverables'
        })
      }
      
      // Sanitize filename
      const safeFilename = sanitizeFilename(input.filename)
      const result = await query(
        `INSERT INTO file_uploads (quote_id, field_name, file_name, storage_path, storage_url, file_size, mime_type, kind)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, file_name, storage_url, kind, created_at`,
        [input.orderId, input.fieldName, safeFilename, input.storagePath, input.storageUrl, input.fileSize, input.mimeType, input.kind]
      )
      
      const file = result.rows[0]
      
      return {
        id: file.id,
        filename: file.file_name,
        url: file.storage_url,
        kind: file.kind,
        createdAt: file.created_at.toISOString()
      }
    }),

  /**
   * List files for an order
   */
  listByOrder: protectedProcedure
    .input(z.object({
      orderId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to this order
      const orderResult = await query(
        'SELECT user_id FROM quote_requests WHERE id = $1',
        [input.orderId]
      )
      
      if (orderResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found'
        })
      }
      
      const order = orderResult.rows[0]
      
      // Check authorization
      if (order.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this order'
        })
      }
      
      // Get files
      const result = await query(
        `SELECT id, file_name, storage_url, file_size, mime_type, kind, created_at
         FROM file_uploads
         WHERE quote_id = $1
         ORDER BY created_at DESC`,
        [input.orderId]
      )
      
      return result.rows.map(row => ({
        id: row.id,
        filename: row.file_name,
        url: row.storage_url,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        kind: row.kind,
        createdAt: row.created_at.toISOString()
      }))
    }),

  /**
   * Delete a file
   */
  delete: protectedProcedure
    .input(z.object({
      fileId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Get file record
      const result = await query(
        `SELECT fu.*, qr.user_id
         FROM file_uploads fu
         JOIN quote_requests qr ON fu.quote_id = qr.id
         WHERE fu.id = $1`,
        [input.fileId]
      )
      
      if (result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found'
        })
      }
      
      const file = result.rows[0]
      
      // Check authorization (only admin or file owner can delete)
      if (file.user_id !== ctx.user.userId && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this file'
        })
      }
      
      try {
        // Delete from S3
        const { deleteFile } = await import('../../utils/s3')
        await deleteFile(file.storage_path)
        
        // Delete from database
        await query('DELETE FROM file_uploads WHERE id = $1', [input.fileId])
        
        logger.info('File deleted', { fileId: input.fileId, userId: ctx.user.userId })
        
        return {
          success: true,
          message: 'File deleted successfully'
        }
      } catch (error: any) {
        logger.error('File deletion error', error, { fileId: input.fileId })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete file'
        })
      }
    })
})
