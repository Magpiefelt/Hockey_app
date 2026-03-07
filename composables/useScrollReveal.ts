/**
 * PERF: Shared IntersectionObserver pool.
 *
 * The original implementation created one IntersectionObserver per RevealOnScroll
 * component instance. With 42+ instances on the home page alone, this created 42
 * separate observers — each with its own callback and memory overhead.
 *
 * This refactored version shares a single IntersectionObserver per unique
 * threshold value. All elements with the same threshold share one observer,
 * reducing browser overhead from O(n) observers to O(unique thresholds) observers.
 */

type ObserverCallback = (entry: IntersectionObserverEntry) => void

// Module-level cache: threshold+rootMargin key → { observer, callbacks map }
const observerCache = new Map<string, {
  observer: IntersectionObserver
  callbacks: Map<Element, ObserverCallback>
}>()

function getSharedObserver(threshold: number, rootMargin: string): {
  observer: IntersectionObserver
  callbacks: Map<Element, ObserverCallback>
} {
  const key = `${threshold}|${rootMargin}`
  if (!observerCache.has(key)) {
    const callbacks = new Map<Element, ObserverCallback>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cb = callbacks.get(entry.target)
          if (cb) cb(entry)
        })
      },
      { threshold, rootMargin }
    )
    observerCache.set(key, { observer, callbacks })
  }
  return observerCache.get(key)!
}

export const useScrollReveal = (options?: { threshold?: number; once?: boolean }) => {
  const elementRef = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  const threshold = options?.threshold ?? 0.1
  const once = options?.once ?? true
  const rootMargin = '0px 0px -50px 0px'

  onMounted(() => {
    if (!elementRef.value) return

    // If already in viewport on mount, show immediately (fixes above-fold hero elements)
    const rect = elementRef.value.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      isVisible.value = true
      return
    }

    const { observer, callbacks } = getSharedObserver(threshold, rootMargin)
    const el = elementRef.value

    const callback: ObserverCallback = (entry) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        if (once) {
          observer.unobserve(el)
          callbacks.delete(el)
        }
      } else if (!once) {
        isVisible.value = false
      }
    }

    callbacks.set(el, callback)
    observer.observe(el)

    onBeforeUnmount(() => {
      observer.unobserve(el)
      callbacks.delete(el)
    })
  })

  return { elementRef, isVisible }
}
