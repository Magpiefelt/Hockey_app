<script setup lang="ts">
/**
 * Quote Revision Modal Component
 * For updating existing quotes with reason tracking
 */

const props = defineProps<{
  orderId: number
  customerName: string
  currentAmount: number
  packageName: string
}>()

const emit = defineEmits<{
  close: []
  revised: [data: { orderId: number; previousAmount: number; newAmount: number; version: number }]
}>()

const trpc = useTrpc()
const { showError } = useNotification()

// Form state
const newAmount = ref<string>((props.currentAmount / 100).toFixed(2))
const reason = ref('')
const notifyCustomer = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Revision history
const revisions = ref<Array<{
  version: number
  amount: number
  notes: string
  createdAt: string
  createdBy: string
}>>([])
const loadingHistory = ref(true)

// Load revision history
onMounted(async () => {
  try {
    const history = await trpc.adminEnhancements.getQuoteRevisions.query({
      orderId: props.orderId
    })
    revisions.value = history
  } catch (err) {
    console.error('Failed to load revision history', err)
  } finally {
    loadingHistory.value = false
  }
})

// Computed
const newAmountInCents = computed(() => {
  const parsed = parseFloat(newAmount.value)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
})

const amountDifference = computed(() => {
  return newAmountInCents.value - props.currentAmount
})

const percentChange = computed(() => {
  if (props.currentAmount === 0) return 0
  return ((amountDifference.value / props.currentAmount) * 100).toFixed(1)
})

const isValid = computed(() => {
  return newAmountInCents.value > 0 && 
         newAmountInCents.value !== props.currentAmount && 
         reason.value.trim().length > 0
})

// Methods
async function submitRevision() {
  if (!isValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    const result = await trpc.adminEnhancements.reviseQuote.mutate({
      orderId: props.orderId,
      newAmount: newAmountInCents.value,
      reason: reason.value,
      notifyCustomer: notifyCustomer.value
    })
    
    emit('revised', {
      orderId: props.orderId,
      previousAmount: result.previousAmount,
      newAmount: result.newAmount,
      version: result.version
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

// Common revision reasons
const commonReasons = [
  'Scope change requested by customer',
  'Additional services added',
  'Discount applied',
  'Price adjustment based on event details',
  'Promotional pricing',
  'Correction to original quote'
]

function useCommonReason(r: string) {
  reason.value = r
}
</script>

<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-warning-600 to-warning-500 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-white">Revise Quote</h2>
            <p class="text-white/70 text-sm">Order #{{ orderId }} - {{ customerName }}</p>
          </div>
          <button 
            @click="emit('close')" 
            class="text-white/80 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <!-- Error Message -->
        <div v-if="error" class="bg-error-500/10 border border-error-500/30 text-error-400 px-4 py-3 rounded-lg mb-6">
          {{ error }}
        </div>
        
        <!-- Current vs New Amount -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-dark-tertiary border border-white/10 rounded-lg p-4 text-center">
            <p class="text-sm text-slate-400 mb-1">Current Quote</p>
            <p class="text-2xl font-bold text-slate-300">${{ (currentAmount / 100).toFixed(2) }}</p>
          </div>
          <div class="bg-warning-500/10 border-2 border-warning-500 rounded-lg p-4 text-center">
            <p class="text-sm text-slate-400 mb-1">New Quote</p>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                v-model="newAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-7 pr-2 py-1 text-2xl font-bold text-center border-0 bg-transparent text-warning-400 focus:ring-0"
              />
            </div>
          </div>
        </div>
        
        <!-- Difference Indicator -->
        <div 
          v-if="amountDifference !== 0"
          class="flex items-center justify-center gap-2 mb-6 py-2 rounded-lg"
          :class="amountDifference > 0 ? 'bg-success-500/10 text-success-400' : 'bg-error-500/10 text-error-400'"
        >
          <svg v-if="amountDifference > 0" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span class="font-medium">
            {{ amountDifference > 0 ? '+' : '' }}${{ (amountDifference / 100).toFixed(2) }}
            ({{ amountDifference > 0 ? '+' : '' }}{{ percentChange }}%)
          </span>
        </div>
        
        <!-- Reason -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Reason for Revision <span class="text-error-500">*</span>
          </label>
          <textarea
            v-model="reason"
            rows="3"
            placeholder="Explain why the quote is being revised..."
            class="w-full px-4 py-3 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-warning-500 focus:border-transparent resize-none"
            :class="{ 'border-error-500/50': !reason.trim() && newAmountInCents !== currentAmount }"
          ></textarea>
          
          <!-- Common Reasons -->
          <div class="mt-3">
            <p class="text-xs text-slate-400 mb-2">Quick select:</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in commonReasons"
                :key="r"
                @click="useCommonReason(r)"
                class="px-2 py-1 text-xs bg-dark-tertiary hover:bg-white/10 text-slate-300 rounded-full transition-colors border border-white/10"
              >
                {{ r }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Notify Customer -->
        <label class="flex items-center gap-3 cursor-pointer mb-6">
          <input
            v-model="notifyCustomer"
            type="checkbox"
            class="w-5 h-5 text-warning-500 bg-dark-tertiary border-white/20 rounded focus:ring-warning-500 focus:ring-offset-0"
          />
          <div>
            <span class="font-medium text-white">Notify Customer</span>
            <p class="text-sm text-slate-400">Send email notification about the revised quote</p>
          </div>
        </label>
        
        <!-- Revision History -->
        <div class="border-t border-white/10 pt-6">
          <h3 class="font-semibold text-white mb-3">Quote History</h3>
          
          <div v-if="loadingHistory" class="text-center py-4 text-slate-400">
            Loading history...
          </div>
          
          <div v-else-if="revisions.length === 0" class="text-center py-4 text-slate-400">
            No previous revisions
          </div>
          
          <div v-else class="space-y-3 max-h-48 overflow-y-auto">
            <div 
              v-for="rev in revisions" 
              :key="rev.version"
              class="flex items-start gap-3 p-3 bg-dark-tertiary border border-white/5 rounded-lg"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium text-slate-300">
                v{{ rev.version }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-white">${{ (rev.amount / 100).toFixed(2) }}</span>
                  <span class="text-xs text-slate-400">
                    {{ new Date(rev.createdAt).toLocaleDateString() }}
                  </span>
                </div>
                <p class="text-sm text-slate-400 truncate">{{ rev.notes }}</p>
                <p v-if="rev.createdBy" class="text-xs text-slate-500">by {{ rev.createdBy }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="border-t border-white/10 px-6 py-4 bg-dark-tertiary flex items-center justify-end gap-3">
        <UiButton
          @click="emit('close')"
          variant="outline"
        >
          Cancel
        </UiButton>
        <UiButton
          @click="submitRevision"
          :disabled="!isValid || isSubmitting"
          :loading="isSubmitting"
          variant="secondary"
        >
          {{ isSubmitting ? 'Updating...' : 'Update Quote' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>
