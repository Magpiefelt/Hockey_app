<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-white/10">
            <h2 id="edit-modal-title" class="text-2xl font-bold text-white">
              Edit Order #{{ order.id }}
            </h2>
            <button
              @click="close"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <Icon name="mdi:close" class="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <!-- Body -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
            <!-- Warning for terminal statuses -->
            <div
              v-if="isTerminalStatus"
              class="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
            >
              <Icon name="mdi:alert" class="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="text-yellow-400 font-semibold mb-1">Warning</h4>
                <p class="text-sm text-slate-300">
                  This order has a terminal status ({{ order.status }}). Editing is disabled to prevent accidental changes.
                </p>
              </div>
            </div>

            <!-- Quoted Amount -->
            <div>
              <label for="quoted-amount" class="block text-sm font-medium text-slate-300 mb-2">
                Quoted Amount
                <span class="text-slate-500 font-normal ml-1">(USD)</span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  id="quoted-amount"
                  v-model.number="formData.quotedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  :disabled="isTerminalStatus"
                  class="w-full pl-8 pr-4 py-3 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
              <p class="mt-1 text-xs text-slate-400">
                The amount quoted to the customer for this service
              </p>
            </div>

            <!-- Total Amount -->
            <div>
              <label for="total-amount" class="block text-sm font-medium text-slate-300 mb-2">
                Total Amount
                <span class="text-slate-500 font-normal ml-1">(USD)</span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  id="total-amount"
                  v-model.number="formData.totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  :disabled="isTerminalStatus"
                  class="w-full pl-8 pr-4 py-3 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
              <p class="mt-1 text-xs text-slate-400">
                Final amount including any additional fees or discounts
              </p>
            </div>

            <!-- Admin Notes -->
            <div>
              <label for="admin-notes" class="block text-sm font-medium text-slate-300 mb-2">
                Admin Notes
                <span class="text-slate-500 font-normal ml-1">(Internal only)</span>
              </label>
              <textarea
                id="admin-notes"
                v-model="formData.adminNotes"
                rows="4"
                :disabled="isTerminalStatus"
                class="w-full px-4 py-3 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                placeholder="Add internal notes about this order..."
              ></textarea>
              <p class="mt-1 text-xs text-slate-400">
                These notes are only visible to admins and won't be shared with the customer
              </p>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
            >
              <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h4 class="text-red-400 font-semibold mb-1">Error</h4>
                <p class="text-sm text-slate-300">{{ error }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                @click="close"
                class="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isTerminalStatus || isSaving || !hasChanges"
                class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon v-if="isSaving" name="mdi:loading" class="w-5 h-5 animate-spin" />
                <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

interface Order {
  id: number
  status: string
  quotedAmount?: number | null
  totalAmount?: number | null
  adminNotes?: string | null
}

interface Props {
  modelValue: boolean
  order: Order
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', data: { quotedAmount: number | null; totalAmount: number | null; adminNotes: string | null }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Move tRPC composable to top level (FIX: was inside handleSubmit function)
const trpc = useTrpc()

const formData = reactive({
  quotedAmount: props.order.quotedAmount || null,
  totalAmount: props.order.totalAmount || null,
  adminNotes: props.order.adminNotes || ''
})

const isSaving = ref(false)
const error = ref('')

// Terminal statuses that shouldn't be edited
const terminalStatuses = ['delivered', 'cancelled']
const isTerminalStatus = computed(() => terminalStatuses.includes(props.order.status))

// Check if form has changes
const hasChanges = computed(() => {
  return (
    formData.quotedAmount !== (props.order.quotedAmount || null) ||
    formData.totalAmount !== (props.order.totalAmount || null) ||
    formData.adminNotes !== (props.order.adminNotes || '')
  )
})

// Reset form when order changes
watch(() => props.order, (newOrder) => {
  formData.quotedAmount = newOrder.quotedAmount || null
  formData.totalAmount = newOrder.totalAmount || null
  formData.adminNotes = newOrder.adminNotes || ''
  error.value = ''
}, { deep: true })

function close() {
  emit('update:modelValue', false)
  error.value = ''
}

async function handleSubmit() {
  if (isTerminalStatus.value || !hasChanges.value) return

  isSaving.value = true
  error.value = ''

  try {
    await trpc.admin.orders.update.mutate({
      id: props.order.id,
      quotedAmount: formData.quotedAmount,
      totalAmount: formData.totalAmount,
      adminNotes: formData.adminNotes
    })

    emit('saved', {
      quotedAmount: formData.quotedAmount,
      totalAmount: formData.totalAmount,
      adminNotes: formData.adminNotes
    })

    close()
  } catch (err: any) {
    error.value = err.message || 'Failed to save changes. Please try again.'
  } finally {
    isSaving.value = false
  }
}

// Trap focus within modal
function trapFocus(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}

// Add event listener when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', trapFocus)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', trapFocus)
    document.body.style.overflow = ''
  }
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

.modal-enter-active .bg-dark-secondary,
.modal-leave-active .bg-dark-secondary {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-dark-secondary,
.modal-leave-to .bg-dark-secondary {
  transform: scale(0.95);
}
</style>
