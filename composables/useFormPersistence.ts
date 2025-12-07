export const useFormPersistence = () => {
  const hasStoredData = ref(false)
  const storedData = ref(null)
  
  const saveFormState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data))
  }
  
  const clearFormState = (key: string) => {
    localStorage.removeItem(key)
  }
  
  const loadFormState = (key: string) => {
    const data = localStorage.getItem(key)
    if (data) {
      hasStoredData.value = true
      storedData.value = JSON.parse(data)
    }
  }
  
  return {
    hasStoredData,
    storedData,
    saveFormState,
    clearFormState,
    loadFormState
  }
}
