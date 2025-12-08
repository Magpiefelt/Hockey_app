/**
 * Performance Monitoring Composable
 * Tracks and reports performance metrics
 */

export const usePerformanceMonitoring = () => {
  const metrics = ref({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0
  })

  const reportMetrics = () => {
    if (process.client && typeof window !== 'undefined') {
      // Use Performance Observer API
      if ('PerformanceObserver' in window) {
        try {
          // Observe LCP (Largest Contentful Paint)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            metrics.value.largestContentfulPaint = Math.round(lastEntry.renderTime || lastEntry.loadTime)
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

          // Observe CLS (Cumulative Layout Shift)
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                metrics.value.cumulativeLayoutShift += entry.value
              }
            }
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })
        } catch (error) {
          // Performance monitoring not fully supported - silent fail
        }
      }

      // Page load time
      window.addEventListener('load', () => {
        const perfData = window.performance.timing
        metrics.value.pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      })
    }
  }

  const logMetrics = () => {
    // Metrics are available in metrics.value for external logging
    return metrics.value
  }

  onMounted(() => {
    reportMetrics()
  })

  return {
    metrics,
    logMetrics
  }
}
