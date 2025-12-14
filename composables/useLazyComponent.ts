/**
 * Composable for lazy loading components when they enter the viewport
 * This improves initial page load performance by deferring non-critical components
 */

import { ref, onMounted, onUnmounted } from 'vue'

export const useLazyComponent = (options: {
  rootMargin?: string
  threshold?: number
} = {}) => {
  const isVisible = ref(false)
  const elementRef = ref<HTMLElement | null>(null)
  const observer = ref<IntersectionObserver | null>(null)

  const { rootMargin = '50px', threshold = 0.1 } = options

  onMounted(() => {
    if (!elementRef.value) return

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible.value) {
            isVisible.value = true
            // Disconnect after first intersection to save resources
            if (observer.value) {
              observer.value.disconnect()
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.value.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
    }
  })

  return {
    isVisible,
    elementRef
  }
}
