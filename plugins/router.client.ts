export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  // Handle hash navigation for smooth scrolling to sections
  router.options.scrollBehavior = async (to, from, savedPosition) => {
    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }

    // If navigating to a hash anchor
    if (to.hash) {
      // Wait for the page to be mounted
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const element = document.querySelector(to.hash)
      if (element) {
        return {
          el: to.hash,
          behavior: 'smooth',
          top: 80, // Offset for fixed header
        }
      }
    }

    // Default: scroll to top
    return { top: 0, behavior: 'smooth' }
  }

  // Handle hash navigation when already on the same page
  router.afterEach((to, from) => {
    if (to.path === from.path && to.hash) {
      setTimeout(() => {
        const element = document.querySelector(to.hash)
        if (element) {
          const headerOffset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  })
})
