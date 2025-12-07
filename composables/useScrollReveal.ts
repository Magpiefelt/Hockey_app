export const useScrollReveal = (options?: { threshold?: number; once?: boolean }) => {
  const elementRef = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  
  onMounted(() => {
    if (!elementRef.value) return
    
    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            // If once is true, stop observing after first intersection
            if (options?.once) {
              observer.unobserve(entry.target)
            }
          } else if (!options?.once) {
            // Allow re-hiding if once is false
            isVisible.value = false
          }
        })
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element enters viewport
      }
    )
    
    observer.observe(elementRef.value)
    
    // Cleanup
    onBeforeUnmount(() => {
      observer.disconnect()
    })
  })
  
  return {
    elementRef,
    isVisible
  }
}
