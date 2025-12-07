/**
 * Component Preloading Utility
 * Preloads components that will be needed soon to improve perceived performance
 */

export const preloadComponent = async (componentName: string) => {
  try {
    // Dynamic import to preload component
    await import(`~/components/${componentName}.vue`)
  } catch (error) {
    console.warn(`Failed to preload component: ${componentName}`, error)
  }
}

/**
 * Preload multiple components
 */
export const preloadComponents = async (componentNames: string[]) => {
  await Promise.all(componentNames.map(name => preloadComponent(name)))
}

/**
 * Preload components on route change
 */
export const useComponentPreload = () => {
  const router = useRouter()
  
  const preloadForRoute = (routeName: string) => {
    const componentMap: Record<string, string[]> = {
      'index': ['PackageSelectionModal', 'ServiceCard', 'TestimonialCard'],
      'request': ['FormStep', 'ReviewStep', 'ProgressBar', 'PackageSelectionModal'],
      'gallery': ['GalleryGrid', 'LightboxModal'],
      'admin': ['AdminDashboard', 'DataTable', 'ChartComponent']
    }
    
    const components = componentMap[routeName] || []
    if (components.length > 0) {
      preloadComponents(components)
    }
  }
  
  // Preload components on route change
  router.beforeEach((to, from, next) => {
    // Preload components for the next route
    const routeName = to.name?.toString() || ''
    preloadForRoute(routeName)
    next()
  })
  
  return {
    preloadForRoute
  }
}
