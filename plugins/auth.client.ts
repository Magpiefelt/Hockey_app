/**
 * Client-side auth initialization plugin
 * Restores auth state from localStorage and verifies with server
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize auth state from localStorage and verify with server
  // This runs on app startup (client-side only)
  await authStore.initAuth()
})
