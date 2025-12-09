/**
 * tRPC composable for Vue components
 * Provides easy access to tRPC client methods
 */

export const useTrpc = () => {
  const { $client } = useNuxtApp()
  
  return $client
}

/**
 * Handle tRPC errors and return user-friendly messages
 */
export const handleTrpcError = (error: any): string => {
  if (error?.data?.code === 'UNAUTHORIZED') {
    return 'You are not authorized to perform this action'
  }
  
  if (error?.data?.code === 'NOT_FOUND') {
    return 'The requested resource was not found'
  }
  
  if (error?.data?.code === 'BAD_REQUEST') {
    return error.message || 'Invalid request'
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}
