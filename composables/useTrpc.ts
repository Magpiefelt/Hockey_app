/**
 * tRPC composable for Vue components
 * Provides easy access to tRPC client methods
 */

export const useTrpc = () => {
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$client

  if (!client) {
    throw new Error(
      'tRPC client is not available. Ensure the tRPC plugin is properly configured.'
    )
  }

  return client
}

/**
 * Handle tRPC errors and return user-friendly messages.
 * Sanitizes output to prevent XSS when rendered in the DOM.
 */
export const handleTrpcError = (error: any): string => {
  if (error?.data?.code === 'UNAUTHORIZED') {
    return 'You are not authorized to perform this action'
  }

  if (error?.data?.code === 'NOT_FOUND') {
    return 'The requested resource was not found'
  }

  if (error?.data?.code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action'
  }

  if (error?.data?.code === 'BAD_REQUEST') {
    // Use the server message for validation errors, but sanitize it
    const msg = error.message || 'Invalid request'
    return sanitizeErrorMessage(msg)
  }

  if (error?.data?.code === 'TOO_MANY_REQUESTS') {
    return 'Too many requests. Please wait a moment and try again.'
  }

  if (error?.message) {
    return sanitizeErrorMessage(error.message)
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Strip HTML tags and limit length to prevent XSS and UI overflow
 * from server error messages that may contain user input.
 */
function sanitizeErrorMessage(msg: string): string {
  const cleaned = msg.replace(/<[^>]*>/g, '').trim()
  return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned
}
