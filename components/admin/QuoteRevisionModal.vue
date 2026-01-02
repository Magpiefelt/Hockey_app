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

const { $trpc } = useNuxtApp()

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
    const history = await $trpc.adminEnhancements.getQuoteRevisions.query({
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
    const result = await $trpc.adminEnhancements.reviseQuote.mutate({
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
    error.value = err.message || 'Failed to revise quote'
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Revise Quote</h2>
            <p class="text-amber-100 text-sm">Order #{{ orderId }} - {{ customerName }}</p>
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
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {{ error }}
        </div>
        
        <!-- Current vs New Amount -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-100 rounded-lg p-4 text-center">
            <p class="text-sm text-gray-500 mb-1">Current Quote</p>
            <p class="text-2xl font-bold text-gray-700">${{ (currentAmount / 100).toFixed(2) }}</p>
          </div>
          <div class="bg-amber-50 border-2 border-amber-500 rounded-lg p-4 text-center">
            <p class="text-sm text-gray-500 mb-1">New Quote</p>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                v-model="newAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full pl-7 pr-2 py-1 text-2xl font-bold text-center border-0 bg-transparent focus:ring-0"
              />
            </div>
          </div>
        </div>
        
        <!-- Difference Indicator -->
        <div 
          v-if="amountDifference !== 0"
          class="flex items-center justify-center gap-2 mb-6 py-2 rounded-lg"
          :class="amountDifference > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
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
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Reason for Revision <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="reason"
            rows="3"
            placeholder="Explain why the quote is being revised..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            :class="{ 'border-red-300': !reason.trim() && newAmountInCents !== currentAmount }"
          ></textarea>
          
          <!-- Common Reasons -->
          <div class="mt-2">
            <p class="text-xs text-gray-500 mb-2">Quick select:</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in commonReasons"
                :key="r"
                @click="useCommonReason(r)"
                class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
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
            class="w-5 h-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
          />
          <div>
            <span class="font-medium text-gray-900">Notify Customer</span>
            <p class="text-sm text-gray-500">Send email notification about the revised quote</p>
          </div>
        </label>
        
        <!-- Revision History -->
        <div class="border-t border-gray-200 pt-6">
          <h3 class="font-semibold text-gray-900 mb-3">Quote History</h3>
          
          <div v-if="loadingHistory" class="text-center py-4 text-gray-500">
            Loading history...
          </div>
          
          <div v-else-if="revisions.length === 0" class="text-center py-4 text-gray-500">
            No previous revisions
          </div>
          
          <div v-else class="space-y-3 max-h-48 overflow-y-auto">
            <div 
              v-for="rev in revisions" 
              :key="rev.version"
              class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                v{{ rev.version }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="font-medium">${{ (rev.amount / 100).toFixed(2) }}</span>
                  <span class="text-xs text-gray-500">
                    {{ new Date(rev.createdAt).toLocaleDateString() }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 truncate">{{ rev.notes }}</p>
                <p v-if="rev.createdBy" class="text-xs text-gray-400">by {{ rev.createdBy }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="submitRevision"
          :disabled="!isValid || isSubmitting"
          class="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSubmitting ? 'Updating...' : 'Update Quote' }}
        </button>
      </div>
    </div>
  </div>
</template>
