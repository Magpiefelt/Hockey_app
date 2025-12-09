/**
 * Auth Middleware
 * 
 * Protects authenticated routes by verifying user is logged in
 * Redirects to login page if not authenticated
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side to access auth store
  if (process.server) {
    return
  }

  const authStore = useAuthStore()
  
  // Initialize auth if not already done
  if (!authStore.isAuthenticated && !authStore.isLoading) {
    await authStore.initAuth()
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Redirect to login with return URL
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // User is authenticated - allow access
})
