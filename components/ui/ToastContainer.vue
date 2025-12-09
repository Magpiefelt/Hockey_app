<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-md">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="toastClasses(toast.type)"
        class="flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <UiIcon :name="getIcon(toast.type)" size="md" />
        </div>
        
        <!-- Message -->
        <div class="flex-1 text-sm font-medium">
          {{ toast.message }}
        </div>
        
        <!-- Close button -->
        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <UiIcon name="x" size="sm" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const { notifications: toasts, remove } = useNotification()

function toastClasses(type: string) {
  const base = 'border-l-4 bg-white'
  
  const variants = {
    success: 'border-green-500 text-green-800',
    error: 'border-red-500 text-red-800',
    warning: 'border-yellow-500 text-yellow-800',
    info: 'border-blue-500 text-blue-800'
  }
  
  return `${base} ${variants[type as keyof typeof variants] || variants.info}`
}

function getIcon(type: string) {
  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  }
  
  return icons[type as keyof typeof icons] || 'info'
}

function removeToast(id: number) {
  remove(id)
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
