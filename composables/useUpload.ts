/**
 * useUpload composable
 * Handles file uploads using S3 presigned URLs via tRPC
 * 
 * FIX Issue 8: Added uploadFile function that was missing but expected by admin order detail page
 */

interface UploadOptions {
  orderId?: number
  kind?: 'upload' | 'deliverable'
}

interface UploadResult {
  key: string
  filename: string
  mime: string
  fileSize: number
  sizeBytes: number
  url: string
  fileId?: number
}

export const useUpload = () => {
  /**
   * Legacy upload function using /api/upload endpoint
   * Kept for backward compatibility
   */
  const upload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      return await response.json()
    } catch (error) {
      // Upload failed - error will be handled by caller
      throw error
    }
  }
  
  /**
   * Upload file using S3 presigned URLs via tRPC
   * This is the preferred method for file uploads
   * 
   * @param file - The file to upload
   * @param options - Upload options including orderId and kind
   * @returns Upload result with file metadata and registered file ID
   */
  const uploadFile = async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
    const trpc = useTrpc()
    
    // Step 1: Get presigned upload URL from the server
    const { uploadUrl, key, publicUrl } = await trpc.files.getUploadUrl.mutate({
      orderId: options.orderId,
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      kind: options.kind || 'upload'
    })
    
    // Step 2: Upload the file directly to S3 using the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`)
    }
    
    // Step 3: Register the uploaded file in the database
    const registeredFile = await trpc.files.registerUpload.mutate({
      orderId: options.orderId || 0,
      fieldName: 'file',
      filename: file.name,
      storagePath: key,
      storageUrl: publicUrl,
      fileSize: file.size,
      mimeType: file.type,
      kind: options.kind || 'upload'
    })
    
    // Return comprehensive upload result
    return {
      key,
      filename: file.name,
      mime: file.type,
      fileSize: file.size,
      sizeBytes: file.size,
      url: publicUrl,
      fileId: registeredFile.id
    }
  }
  
  return { 
    upload,
    uploadFile 
  }
}
