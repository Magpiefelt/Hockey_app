/**
 * File Upload Composable
 * Handles file uploads to S3 via presigned URLs
 * Integrates with the files tRPC router
 */

import { ref } from 'vue'

export interface UploadProgress {
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  key?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  fileId?: number
  error?: string
}

export function useFileUpload() {
  const isUploading = ref(false)
  const uploadProgress = ref<UploadProgress[]>([])
  const lastError = ref<string | null>(null)

  /**
   * Upload a single file to S3
   */
  async function uploadFile(
    file: File,
    options: {
      orderId?: number
      kind?: 'upload' | 'deliverable'
      fieldName?: string
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<UploadResult> {
    const trpc = useTrpc()
    lastError.value = null

    // Add to progress tracking
    const progressEntry: UploadProgress = {
      filename: file.name,
      progress: 0,
      status: 'pending'
    }
    uploadProgress.value.push(progressEntry)
    const progressIndex = uploadProgress.value.length - 1

    try {
      isUploading.value = true
      progressEntry.status = 'uploading'

      // Step 1: Get presigned upload URL
      const { uploadUrl, key, publicUrl } = await trpc.files.getUploadUrl.mutate({
        orderId: options.orderId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        kind: options.kind || 'upload'
      })

      // Step 2: Upload file directly to S3
      await uploadToS3(uploadUrl, file, (progress) => {
        progressEntry.progress = progress
        uploadProgress.value[progressIndex] = { ...progressEntry }
        options.onProgress?.(progress)
      })

      progressEntry.progress = 100
      progressEntry.status = 'success'
      progressEntry.url = publicUrl
      progressEntry.key = key
      uploadProgress.value[progressIndex] = { ...progressEntry }

      // Step 3: Register the upload in the database (if orderId provided)
      let fileId: number | undefined
      if (options.orderId) {
        try {
          const registered = await trpc.files.registerUpload.mutate({
            orderId: options.orderId,
            fieldName: options.fieldName || 'file',
            filename: file.name,
            storagePath: key,
            storageUrl: publicUrl,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            kind: options.kind || 'upload'
          })
          fileId = registered.id
        } catch (regError: any) {
          // Log but don't fail - file is already uploaded
          console.warn('Failed to register upload in database:', regError.message)
        }
      }

      return {
        success: true,
        url: publicUrl,
        key,
        fileId
      }
    } catch (error: any) {
      progressEntry.status = 'error'
      progressEntry.error = error.message || 'Upload failed'
      uploadProgress.value[progressIndex] = { ...progressEntry }
      lastError.value = error.message || 'Upload failed'

      return {
        success: false,
        error: error.message || 'Upload failed'
      }
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Upload multiple files
   */
  async function uploadFiles(
    files: File[],
    options: {
      orderId?: number
      kind?: 'upload' | 'deliverable'
      fieldName?: string
      onProgress?: (filename: string, progress: number) => void
    } = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (const file of files) {
      const result = await uploadFile(file, {
        ...options,
        onProgress: (progress) => options.onProgress?.(file.name, progress)
      })
      results.push(result)
    }

    return results
  }

  /**
   * Upload file to S3 using presigned URL with progress tracking
   */
  async function uploadToS3(
    presignedUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress?.(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'))
      })

      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.send(file)
    })
  }

  /**
   * Clear upload progress
   */
  function clearProgress() {
    uploadProgress.value = []
    lastError.value = null
  }

  /**
   * Remove a specific progress entry
   */
  function removeProgress(index: number) {
    uploadProgress.value.splice(index, 1)
  }

  return {
    isUploading,
    uploadProgress,
    lastError,
    uploadFile,
    uploadFiles,
    clearProgress,
    removeProgress
  }
}
