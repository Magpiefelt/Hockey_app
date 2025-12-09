export const useFormPersistence = (storageKey: string = 'form_data') => {
  const hasStoredData = ref(false)
  const storedData = ref<any>(null)
  
  // Check if running in browser
  const isBrowser = process.client
  
  /**
   * Save form state to localStorage
   */
  const saveFormState = (data: any) => {
    if (!isBrowser) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save form state:', error)
    }
  }
  
  /**
   * Clear form state from localStorage
   */
  const clearFormState = () => {
    if (!isBrowser) return
    try {
      localStorage.removeItem(storageKey)
      hasStoredData.value = false
      storedData.value = null
    } catch (error) {
      console.error('Failed to clear form state:', error)
    }
  }
  
  /**
   * Load form state from localStorage
   */
  const loadFormState = () => {
    if (!isBrowser) return null
    try {
      const data = localStorage.getItem(storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        hasStoredData.value = true
        storedData.value = parsed
        return parsed
      }
    } catch (error) {
      console.error('Failed to load form state:', error)
      // Clear corrupted data
      clearFormState()
    }
    return null
  }
  
  // Auto-load on initialization (client-side only)
  if (isBrowser) {
    onMounted(() => {
      loadFormState()
    })
  }
  
  return {
    hasStoredData,
    storedData,
    saveFormState,
    clearFormState,
    loadFormState
  }
}
