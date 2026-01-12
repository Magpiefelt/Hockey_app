<script setup lang="ts">
/**
 * Manual Completion Modal Component
 * Allows admin to manually complete orders that were handled offline
 * Creates invoice/payment records and optionally sends confirmation email
 * 
 * Enhanced with:
 * - Payment method selection
 * - Confirmation dialog
 * - Large amount warning
 * - Improved validation
 * - Better error handling
 */

const props = defineProps<{
  orderId: number
  customerName: string
  customerEmail: string
  serviceName: string
  currentStatus: string
  existingQuotedAmount?: number | null
}>()

const emit = defineEmits<{
  close: []
  completed: [data: { orderId: number; amount: number; previousStatus: string }]
}>()

const trpc = useTrpc()
const { showError, showSuccess, showWarning } = useNotification()

// Form state
const completionAmount = ref<string>(
  props.existingQuotedAmount ? (props.existingQuotedAmount / 100).toFixed(2) : ''
)
const paymentMethod = ref<'cash' | 'check' | 'wire' | 'other'>('other')
const adminNotes = ref('')
const sendEmail = ref(false) // Disabled by default as per requirements
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const showConfirmation = ref(false)

// Payment method options
const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'check', label: 'Check', icon: '📝' },
  { value: 'wire', label: 'Wire Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '📋' }
] as const

// Computed
const amountInCents = computed(() => {
  const parsed = parseFloat(completionAmount.value)
  return isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 100)
})

const formattedAmount = computed(() => {
  return amountInCents.value > 0 
    ? `$${(amountInCents.value / 100).toFixed(2)}` 
    : '$0.00'
})

const isValidAmount = computed(() => {
  return amountInCents.value > 0 && amountInCents.value <= 5000000 // Max $50,000
})

const isLargeAmount = computed(() => {
  return amountInCents.value > 500000 // Warning for amounts over $5,000
})

const isValid = computed(() => {
  return isValidAmount.value && adminNotes.value.length <= 2000
})

const canComplete = computed(() => {
  const terminalStatuses = ['completed', 'delivered', 'cancelled']
  return !terminalStatuses.includes(props.currentStatus)
})

const notesCharCount = computed(() => adminNotes.value.length)
const notesCharLimit = 2000

// Quick amount buttons
const quickAmounts = [250, 500, 750, 1000, 1500, 2000, 2500, 3000]

function setQuickAmount(amount: number) {
  completionAmount.value = amount.toFixed(2)
}

// Format status for display (handles multiple underscores)
function formatStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Initiate submission (shows confirmation first)
function initiateSubmit() {
  if (!isValid.value || isSubmitting.value || !canComplete.value) return
  
  error.value = null
  
  // Show large amount warning
  if (isLargeAmount.value) {
    showWarning(`You are about to complete this order for ${formattedAmount.value}. Please verify this amount is correct.`)
  }
  
  showConfirmation.value = true
}

// Cancel confirmation
function cancelConfirmation() {
  showConfirmation.value = false
}

// Submit handler (after confirmation)
async function handleSubmit() {
  if (!isValid.value || isSubmitting.value || !canComplete.value) return
  
  showConfirmation.value = false
  isSubmitting.value = true
  error.value = null
  
  try {
    const result = await trpc.admin.manualComplete.mutate({
      orderId: props.orderId,
      completionAmount: amountInCents.value,
      paymentMethod: paymentMethod.value,
      adminNotes: adminNotes.value || undefined,
      sendEmail: sendEmail.value
    })
    
    const emailStatus = result.emailSent ? ' Confirmation email sent.' : ''
    showSuccess(`Order #${props.orderId} has been marked as completed.${emailStatus}`)
    
    emit('completed', {
      orderId: props.orderId,
      amount: amountInCents.value,
      previousStatus: result.previousStatus
    })
    emit('close')
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError(error.value)
  } finally {
    isSubmitting.value = false
  }
}

// Close modal
function close() {
  if (isSubmitting.value) return // Prevent closing during submission
  emit('close')
}

// Handle escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && !showConfirmation.value && !isSubmitting.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div 
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="close"
    >
      <div 
        class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-completion-title"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="manual-completion-title" class="text-xl font-bold text-white">
                Complete Order Manually
              </h2>
              <p class="text-white/70 text-sm">Order #{{ orderId }}</p>
            </div>
            <button 
              @click="close" 
              :disabled="isSubmitting"
              class="text-white/80 hover:text-white transition-colors p-1 disabled:opacity-50"
              aria-label="Close modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <!-- Warning if order cannot be completed -->
          <div 
            v-if="!canComplete" 
            class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6"
          >
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 class="text-yellow-400 font-semibold">Cannot Complete This Order</h4>
                <p class="text-sm text-slate-300 mt-1">
                  This order is already in a terminal status ({{ formatStatus(currentStatus) }}). 
                  Orders that are completed, delivered, or cancelled cannot be modified.
                </p>
              </div>
            </div>
          </div>

          <!-- Info Banner -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="text-blue-400 font-semibold">Offline Order Completion</h4>
                <p class="text-sm text-slate-300 mt-1">
                  Use this to record orders that were completed outside the normal quote/payment flow. 
                  This will create the necessary records for reporting and tracking.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Customer Info Card -->
          <div class="bg-dark-tertiary rounded-lg p-4 mb-6 border border-white/5">
            <h3 class="font-semibold text-white mb-3">Customer Details</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-slate-400">Name:</span>
                <span class="ml-2 font-medium text-white">{{ customerName }}</span>
              </div>
              <div>
                <span class="text-slate-400">Email:</span>
                <span class="ml-2 font-medium text-white">{{ customerEmail }}</span>
              </div>
              <div>
                <span class="text-slate-400">Service:</span>
                <span class="ml-2 font-medium text-white">{{ serviceName }}</span>
              </div>
              <div>
                <span class="text-slate-400">Current Status:</span>
                <span class="ml-2 font-medium text-white">{{ formatStatus(currentStatus) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Error Message -->
          <div 
            v-if="error" 
            class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6"
          >
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ error }}</span>
            </div>
          </div>
          
          <!-- Completion Amount -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Completion Amount <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
              <input
                v-model="completionAmount"
                type="number"
                step="0.01"
                min="0"
                max="50000"
                placeholder="0.00"
                :disabled="!canComplete || isSubmitting"
                class="w-full pl-10 pr-4 py-3 text-2xl font-bold bg-dark-tertiary border rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                :class="[
                  amountInCents > 5000000 ? 'border-red-500' : 
                  isLargeAmount ? 'border-yellow-500' : 'border-white/10'
                ]"
              />
            </div>
            
            <!-- Amount validation messages -->
            <div class="mt-2 space-y-1">
              <p v-if="amountInCents > 5000000" class="text-sm text-red-400">
                Amount cannot exceed $50,000
              </p>
              <p v-else-if="isLargeAmount" class="text-sm text-yellow-400">
                ⚠️ Large amount - please verify before submitting
              </p>
              <p v-else class="text-sm text-slate-400">
                Enter the final amount paid for this order
              </p>
            </div>
            
            <!-- Quick Amount Buttons -->
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                v-for="amount in quickAmounts"
                :key="amount"
                @click="setQuickAmount(amount)"
                :disabled="!canComplete || isSubmitting"
                class="px-3 py-1.5 text-sm bg-dark-tertiary hover:bg-white/10 text-slate-300 rounded-full transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ${{ amount }}
              </button>
            </div>
          </div>
          
          <!-- Payment Method -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Payment Method
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                @click="paymentMethod = method.value"
                :disabled="!canComplete || isSubmitting"
                class="px-4 py-3 rounded-lg border transition-all text-left flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="[
                  paymentMethod === method.value 
                    ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                    : 'bg-dark-tertiary border-white/10 text-slate-300 hover:border-white/20'
                ]"
              >
                <span class="text-xl">{{ method.icon }}</span>
                <span class="font-medium">{{ method.label }}</span>
              </button>
            </div>
          </div>
          
          <!-- Admin Notes -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-300">
                Admin Notes <span class="text-slate-500">(Optional)</span>
              </label>
              <span 
                class="text-xs"
                :class="notesCharCount > notesCharLimit ? 'text-red-400' : 'text-slate-500'"
              >
                {{ notesCharCount }}/{{ notesCharLimit }}
              </span>
            </div>
            <textarea
              v-model="adminNotes"
              rows="3"
              :disabled="!canComplete || isSubmitting"
              :maxlength="notesCharLimit"
              placeholder="Add notes about this offline transaction (e.g., payment reference number, special arrangements)..."
              class="w-full px-4 py-3 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            ></textarea>
            <p class="text-sm text-slate-400 mt-1">
              These notes will be saved to the order history for reference
            </p>
          </div>
          
          <!-- Email Option -->
          <div class="mb-6 p-4 bg-dark-tertiary rounded-lg border border-white/5">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="sendEmail"
                type="checkbox"
                :disabled="!canComplete || isSubmitting"
                class="w-5 h-5 mt-0.5 text-emerald-500 bg-dark-primary border-white/20 rounded focus:ring-emerald-500 focus:ring-offset-0 disabled:opacity-50"
              />
              <div>
                <span class="font-medium text-white">Send Confirmation Email</span>
                <p class="text-sm text-slate-400 mt-1">
                  Send a completion confirmation email to the customer. 
                  <span class="text-yellow-400">Disabled by default</span> since this transaction occurred offline.
                </p>
              </div>
            </label>
          </div>
          
          <!-- Summary Preview -->
          <div v-if="isValid" class="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
            <h4 class="font-semibold text-emerald-400 mb-2">Completion Summary</h4>
            <div class="text-sm space-y-1 text-slate-300">
              <p>Order #{{ orderId }} will be marked as <span class="text-emerald-400 font-medium">Completed</span></p>
              <p>Amount: <span class="text-white font-medium">{{ formattedAmount }}</span></p>
              <p>Payment method: <span class="text-white font-medium capitalize">{{ paymentMethod }}</span></p>
              <p>Email notification: <span class="font-medium" :class="sendEmail ? 'text-emerald-400' : 'text-slate-400'">{{ sendEmail ? 'Will be sent' : 'Will not be sent' }}</span></p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="border-t border-white/10 px-6 py-4 bg-dark-tertiary flex items-center justify-between">
          <div class="text-sm text-slate-400">
            <span v-if="existingQuotedAmount">
              Original quote: ${{ (existingQuotedAmount / 100).toFixed(2) }}
            </span>
          </div>
          <div class="flex gap-3">
            <button
              @click="close"
              :disabled="isSubmitting"
              class="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              @click="initiateSubmit"
              :disabled="!isValid || isSubmitting || !canComplete"
              class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="isSubmitting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSubmitting ? 'Completing...' : 'Complete Order' }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Confirmation Dialog -->
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="showConfirmation"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
          @click.self="cancelConfirmation"
        >
          <div class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Confirm Manual Completion</h3>
              <p class="text-slate-400 mb-6">
                You are about to mark Order #{{ orderId }} as completed for 
                <span class="text-white font-semibold">{{ formattedAmount }}</span> 
                via <span class="text-white font-medium capitalize">{{ paymentMethod }}</span>.
                <br><br>
                <span class="text-yellow-400 text-sm">This action cannot be undone.</span>
              </p>
              <div class="flex gap-3 justify-center">
                <button
                  @click="cancelConfirmation"
                  class="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Go Back
                </button>
                <button
                  @click="handleSubmit"
                  class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Yes, Complete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
