export const useNotification = () => {
  const notifications = ref([])
  
  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now()
    notifications.value.push({ id, message, type })
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }, 3000)
  }
  
  return {
    notifications,
    addNotification
  }
}
