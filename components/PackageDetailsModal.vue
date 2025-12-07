<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`modal-title-${package?.id}`"
      >
        <div
          ref="modalContent"
          class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-secondary rounded-xl border-2 border-cyan-500/30 shadow-2xl"
          @click.stop
        >
          <!-- Close Button -->
          <button
            @click="close"
            class="absolute top-4 right-4 z-10 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>

          <!-- Modal Content -->
          <div class="p-8">
            <!-- Header -->
            <div class="text-center mb-8">
              <div class="text-6xl mb-4">{{ package?.icon }}</div>
              <h2 :id="`modal-title-${package?.id}`" class="text-3xl font-bold text-white mb-2">
                {{ package?.name }}
              </h2>
              <p class="text-lg text-slate-400">{{ package?.description }}</p>
            </div>

            <!-- Pricing -->
            <div class="mb-8 p-6 rounded-lg bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 text-center">
              <div v-if="package?.price_cents === 0" class="space-y-2">
                <p class="text-2xl font-bold text-cyan-400">Contact for Pricing</p>
                <p class="text-sm text-slate-400">Custom quotes based on your specific needs</p>
              </div>
              <div v-else class="space-y-2">
                <p class="text-4xl font-bold text-white">
                  ${{ (package?.price_cents / 100).toFixed(2) }}
                </p>
                <p class="text-sm text-slate-400">One-time service fee</p>
              </div>
            </div>

            <!-- Features List -->
            <div class="mb-8">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="mdi:check-circle" class="w-6 h-6 text-cyan-400" />
                What's Included
              </h3>
              <ul class="space-y-3">
                <li
                  v-for="(feature, index) in package?.features"
                  :key="index"
                  class="flex items-start gap-3 text-slate-300"
                >
                  <Icon name="mdi:check" class="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <!-- Additional Info -->
            <div class="mb-8 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Icon name="mdi:information" class="w-4 h-4 text-cyan-400" />
                Good to Know
              </h4>
              <ul class="text-sm text-slate-400 space-y-1">
                <li>• Professional DJ equipment and setup included</li>
                <li>• Custom mixing and effects for your team</li>
                <li>• Delivery within 5-7 business days</li>
                <li>• Unlimited revisions until you're satisfied</li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4">
              <UiButton
                variant="outline"
                @click="close"
                class="flex-1"
              >
                Close
              </UiButton>
              <UiButton
                variant="primary"
                @click="selectPackage"
                class="flex-1"
              >
                <Icon name="mdi:check-circle" class="w-5 h-5 mr-2" />
                Select This Package
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Package {
  id: string
  name: string
  description: string
  price_cents: number
  icon: string
  features: string[]
  popular?: boolean
}

interface Props {
  isOpen: boolean
  package: Package | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  select: [packageId: string]
}>()

const modalContent = ref<HTMLElement | null>(null)
const previouslyFocusedElement = ref<HTMLElement | null>(null)

// Trap focus within modal
function trapFocus(event: KeyboardEvent) {
  if (!props.isOpen || !modalContent.value) return

  const focusableElements = modalContent.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  if (event.key === 'Tab') {
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }

  if (event.key === 'Escape') {
    close()
  }
}

function handleBackdropClick() {
  close()
}

function close() {
  emit('close')
  // Return focus to previously focused element
  if (previouslyFocusedElement.value) {
    previouslyFocusedElement.value.focus()
  }
}

function selectPackage() {
  if (props.package) {
    emit('select', props.package.id)
    close()
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Store currently focused element
    previouslyFocusedElement.value = document.activeElement as HTMLElement
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    // Focus first focusable element in modal
    setTimeout(() => {
      const firstButton = modalContent.value?.querySelector('button') as HTMLElement
      firstButton?.focus()
    }, 100)
  } else {
    // Restore body scroll
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', trapFocus)
})

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
