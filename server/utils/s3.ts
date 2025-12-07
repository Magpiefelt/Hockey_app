/**
 * AWS S3 Utility
 * Handles file uploads and downloads using presigned URLs
 */

import { logger } from './logger'

interface S3Config {
  bucket: string
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
}

interface PresignedUrlOptions {
  key: string
  contentType?: string
  expiresIn?: number
}

let s3Client: any = null
let s3Configured = false

/**
 * Initialize S3 client
 */
async function initS3Client() {
  if (s3Client) return s3Client

  const config = useRuntimeConfig()
  
  const s3Config: S3Config = {
    bucket: config.s3BucketName || process.env.S3_BUCKET_NAME || '',
    region: config.s3Region || process.env.S3_REGION || 'us-east-1',
    accessKeyId: config.s3AccessKeyId || process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: config.s3SecretAccessKey || process.env.S3_SECRET_ACCESS_KEY,
    endpoint: config.s3Endpoint || process.env.S3_ENDPOINT
  }

  if (!s3Config.bucket) {
    logger.warn('S3 bucket not configured, file uploads will not work')
    return null
  }

  try {
    // Dynamically import AWS SDK
    const { S3Client } = await import('@aws-sdk/client-s3')
    
    const clientConfig: any = {
      region: s3Config.region
    }

    // Use explicit credentials if provided, otherwise use IAM role
    if (s3Config.accessKeyId && s3Config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey
      }
    }

    // Use custom endpoint for S3-compatible services (e.g., MinIO, R2)
    if (s3Config.endpoint) {
      clientConfig.endpoint = s3Config.endpoint
      clientConfig.forcePathStyle = true
    }

    s3Client = new S3Client(clientConfig)
    s3Configured = true
    
    logger.info('S3 client initialized', { 
      bucket: s3Config.bucket, 
      region: s3Config.region,
      useIAM: !s3Config.accessKeyId 
    })
    
    return s3Client
  } catch (error: any) {
    logger.error('Failed to initialize S3 client', error)
    return null
  }
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return s3Configured
}

/**
 * Generate presigned URL for file upload
 */
export async function getUploadPresignedUrl(
  options: PresignedUrlOptions
): Promise<string> {
  const client = await initS3Client()
  
  if (!client) {
    throw new Error('S3 is not configured')
  }

  const config = useRuntimeConfig()
  const bucket = config.s3BucketName || process.env.S3_BUCKET_NAME

  try {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: options.key,
      ContentType: options.contentType || 'application/octet-stream'
    })

    const url = await getSignedUrl(client, command, {
      expiresIn: options.expiresIn || 3600 // 1 hour default
    })

    logger.debug('Generated upload presigned URL', { key: options.key })
    
    return url
  } catch (error: any) {
    logger.error('Failed to generate upload presigned URL', error, { key: options.key })
    throw new Error('Failed to generate upload URL')
  }
}

/**
 * Generate presigned URL for file download
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = await initS3Client()
  
  if (!client) {
    throw new Error('S3 is not configured')
  }

  const config = useRuntimeConfig()
  const bucket = config.s3BucketName || process.env.S3_BUCKET_NAME

  try {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })

    const url = await getSignedUrl(client, command, {
      expiresIn
    })

    logger.debug('Generated download presigned URL', { key })
    
    return url
  } catch (error: any) {
    logger.error('Failed to generate download presigned URL', error, { key })
    throw new Error('Failed to generate download URL')
  }
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const client = await initS3Client()
  
  if (!client) {
    throw new Error('S3 is not configured')
  }

  const config = useRuntimeConfig()
  const bucket = config.s3BucketName || process.env.S3_BUCKET_NAME

  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })

    await client.send(command)
    
    logger.info('File deleted from S3', { key })
  } catch (error: any) {
    logger.error('Failed to delete file from S3', error, { key })
    throw new Error('Failed to delete file')
  }
}

/**
 * Check if file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = await initS3Client()
  
  if (!client) {
    return false
  }

  const config = useRuntimeConfig()
  const bucket = config.s3BucketName || process.env.S3_BUCKET_NAME

  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    })

    await client.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false
    }
    logger.error('Error checking file existence', error, { key })
    return false
  }
}

/**
 * Generate S3 key for file upload
 */
export function generateS3Key(
  orderId: number,
  filename: string,
  kind: 'upload' | 'deliverable' = 'upload'
): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `orders/${orderId}/${kind}/${timestamp}-${sanitizedFilename}`
}
