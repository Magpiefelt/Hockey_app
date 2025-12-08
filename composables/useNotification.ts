interface Notification {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

// Global state for notifications
const notifications = ref<Notification[]>([])

export const useNotification = () => {
  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 5000) => {
    const id = Date.now() + Math.random() // Ensure unique IDs
    notifications.value.push({ id, message, type })
    
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    
    return id
  }
  
  const showSuccess = (message: string, duration = 5000) => {
    return addNotification(message, 'success', duration)
  }
  
  const showError = (message: string, duration = 7000) => {
    return addNotification(message, 'error', duration)
  }
  
  const showInfo = (message: string, duration = 5000) => {
    return addNotification(message, 'info', duration)
  }
  
  const showWarning = (message: string, duration = 6000) => {
    return addNotification(message, 'warning', duration)
  }
  
  const remove = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }
  
  const clear = () => {
    notifications.value = []
  }
  
  // Alias for compatibility
  const toasts = notifications
  
  return {
    notifications,
    toasts,
    addNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    remove,
    clear
  }
}
