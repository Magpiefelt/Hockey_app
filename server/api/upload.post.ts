import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { requireAuth } from '../utils/auth'
import { sanitizeFilename } from '../utils/sanitize'
import { isValidFileSize, isValidMimeType } from '../utils/validation'
import { logger } from '../utils/logger'
import { logFileEvent, AuditAction } from '../utils/audit'

/**
 * Handle file uploads
 * In production, this would upload to S3/R2
 * For development, saves to public/uploads directory
 */
export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)
    
    logger.info('File upload attempt', { userId: user.userId })
    
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const file = formData[0]
    
    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file data'
      })
    }

    // Validate file size (max 200MB)
    if (!isValidFileSize(file.data.length, 200)) {
      logger.warn('File upload rejected - file too large', {
        userId: user.userId,
        filename: file.filename,
        size: file.data.length
      })
      throw createError({
        statusCode: 413,
        statusMessage: 'File too large. Maximum size is 200MB'
      })
    }
    
    // Validate file type
    if (file.type && !isValidMimeType(file.type)) {
      logger.warn('File upload rejected - invalid type', {
        userId: user.userId,
        filename: file.filename,
        type: file.type
      })
      throw createError({
        statusCode: 400,
        statusMessage: `File type ${file.type} is not allowed`
      })
    }

    // Sanitize and generate unique filename
    const timestamp = Date.now()
    const sanitized = sanitizeFilename(file.filename)
    const filename = `${timestamp}-${sanitized}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, file.data)

    logger.info('File uploaded successfully', {
      userId: user.userId,
      filename: file.filename,
      savedAs: filename,
      size: file.data.length,
      type: file.type
    })
    
    // Log to audit trail
    // Note: We don't have a file ID yet since this is just uploading to local storage
    // In production with S3, you would log the S3 key or file ID
    await logFileEvent(
      AuditAction.FILE_UPLOADED,
      0, // Placeholder - would be actual file ID in production
      user.userId,
      {
        filename: file.filename,
        savedAs: filename,
        size: file.data.length,
        type: file.type,
        ip: event.context.ip
      }
    )

    // Return file info
    return {
      success: true,
      file: {
        filename: file.filename,
        savedAs: filename,
        size: file.data.length,
        mime: file.type || 'application/octet-stream',
        url: `/uploads/${filename}`,
        key: filename
      }
    }
  } catch (error: any) {
    logger.error('File upload failed', error, {
      userId: event.context.user?.userId,
      ip: event.context.ip
    })
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to upload file'
    })
  }
})
