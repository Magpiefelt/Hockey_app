/**
 * useLocalStorage composable
 * Provides reactive access to localStorage
 */

export const useLocalStorage = (key: string, defaultValue: any = null) => {
  const value = ref(defaultValue)
  
  // Load from localStorage on mount
  if (process.client) {
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        value.value = JSON.parse(stored)
      } catch {
        value.value = stored
      }
    }
  }
  
  // Watch for changes and save to localStorage
  watch(value, (newValue) => {
    if (process.client) {
      if (newValue === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    }
  }, { deep: true })
  
  return value
}
