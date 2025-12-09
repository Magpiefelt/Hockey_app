/**
 * Auth Middleware
 * 
 * Protects authenticated routes by verifying user is logged in
 * Redirects to login page if not authenticated
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // On server side, we can't access localStorage, so we skip the check
  // The client-side navigation will handle the redirect
  if (process.server) {
    return
  }
  
  // Initialize auth if not already done (client-side only)
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
