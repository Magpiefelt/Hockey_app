/**
 * Admin Middleware
 * 
 * Protects admin routes by verifying:
 * 1. User is authenticated
 * 2. User has admin role
 * 
 * Redirects to appropriate pages if checks fail
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

  // Check if user is admin
  if (!authStore.isAdmin) {
    // Authenticated but not admin - redirect to user orders page
    return navigateTo('/orders')
  }

  // User is authenticated and is admin - allow access
})
