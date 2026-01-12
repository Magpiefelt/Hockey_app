<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          @click="handleBackdropClick"
        />

        <!-- Dialog container -->
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Transition name="dialog">
            <div
              v-if="isOpen"
              class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              <!-- Content -->
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <!-- Icon -->
                  <div
                    :class="[
                      'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
                      iconBackgroundClass
                    ]"
                  >
                    <UiIcon :name="iconName" size="md" :class="iconClass" />
                  </div>

                  <!-- Text content -->
                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3
                      id="modal-title"
                      class="text-base font-semibold leading-6 text-slate-900"
                    >
                      {{ title }}
                    </h3>
                    <div class="mt-2">
                      <p class="text-sm text-slate-500">
                        {{ message }}
                      </p>
                      
                      <!-- Additional content slot -->
                      <slot name="content" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <UiButton
                  :variant="confirmVariant"
                  :loading="loading"
                  :disabled="loading"
                  @click="handleConfirm"
                  class="w-full sm:w-auto"
                >
                  {{ confirmText }}
                </UiButton>
                <UiButton
                  variant="secondary"
                  :disabled="loading"
                  @click="handleCancel"
                  class="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {{ cancelText }}
                </UiButton>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'

type DialogType = 'danger' | 'warning' | 'info' | 'success'

interface Props {
  isOpen: boolean
  title: string
  message: string
  type?: DialogType
  confirmText?: string
  cancelText?: string
  loading?: boolean
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loading: false,
  closeOnBackdrop: true
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:isOpen', value: boolean): void
}>()

// Icon based on type
const iconName = computed(() => {
  const icons = {
    danger: 'alert-triangle',
    warning: 'alert-circle',
    info: 'info',
    success: 'check-circle'
  }
  return icons[props.type]
})

const iconClass = computed(() => {
  const classes = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    success: 'text-green-600'
  }
  return classes[props.type]
})

const iconBackgroundClass = computed(() => {
  const classes = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100',
    success: 'bg-green-100'
  }
  return classes[props.type]
})

const confirmVariant = computed(() => {
  const variants = {
    danger: 'danger',
    warning: 'warning',
    info: 'primary',
    success: 'success'
  }
  return variants[props.type] as 'danger' | 'warning' | 'primary' | 'success'
})

// Handle keyboard events
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.loading) {
    handleCancel()
  }
}

// Watch for open state to add/remove keyboard listener
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
}, { immediate: true })

// Cleanup on component unmount to prevent memory leaks
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

function handleBackdropClick() {
  if (props.closeOnBackdrop && !props.loading) {
    handleCancel()
  }
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:isOpen', false)
}
</script>

<style scoped>
/* Modal backdrop transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Dialog content transition */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.2s ease;
}

.dialog-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
