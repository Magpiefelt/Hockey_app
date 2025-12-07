/**
 * Request Optimization Utilities
 * Provides debouncing and throttling for API calls and event handlers
 */

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Composable for debounced search/input
 */
export const useDebouncedSearch = (searchFn: (query: string) => Promise<any>, delay = 300) => {
  const query = ref('')
  const results = ref<any[]>([])
  const isLoading = ref(false)

  const performSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      results.value = []
      return
    }

    isLoading.value = true
    try {
      results.value = await searchFn(searchQuery)
    } catch (error) {
      console.error('Search error:', error)
      results.value = []
    } finally {
      isLoading.value = false
    }
  }, delay)

  const handleInput = (value: string) => {
    query.value = value
    performSearch(value)
  }

  return {
    query,
    results,
    isLoading,
    handleInput
  }
}

/**
 * Composable for throttled scroll events
 */
export const useThrottledScroll = (callback: () => void, limit = 100) => {
  const handleScroll = throttle(callback, limit)

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    handleScroll
  }
}
