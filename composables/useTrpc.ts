/**
 * tRPC composable for Vue components
 * Provides easy access to tRPC client methods
 */

export const useTrpc = () => {
  const client = useNuxtData('trpc-client')
  
  return {
    client,
    // Add common methods here
    async call(procedure: string, input?: any) {
      try {
        return await client?.[procedure]?.(input)
      } catch (error) {
        console.error(`tRPC call failed: ${procedure}`, error)
        throw error
      }
    }
  }
}
