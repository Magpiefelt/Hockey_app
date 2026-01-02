<script setup lang="ts">
/**
 * Enhanced Quote Modal Component
 * Improved UX for submitting quotes with payment link option and preview
 */

const props = defineProps<{
  orderId: number
  customerName: string
  customerEmail: string
  packageName: string
  eventDate?: string | null
  teamName?: string | null
  sportType?: string | null
  currentQuote?: number | null
}>()

const emit = defineEmits<{
  close: []
  submitted: [data: { orderId: number; amount: number; version: number }]
}>()

const trpc = useTrpc()
const { showError } = useNotification()

// Form state
const quoteAmount = ref<string>(props.currentQuote ? (props.currentQuote / 100).toFixed(2) : '')
const adminNotes = ref('')
const includePaymentLink = ref(true)
const expirationDays = ref(30)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const showPreview = ref(false)

// Computed
const amountInCents = computed(() => {
  const parsed = parseFloat(quoteAmount.value)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
})

const formattedAmount = computed(() => {
  return amountInCents.value > 0 
    ? `$${(amountInCents.value / 100).toFixed(2)}` 
    : '$0.00'
})

const expirationDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + expirationDays.value)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const isValid = computed(() => {
  return amountInCents.value > 0
})

// Methods
async function submitQuote() {
  if (!isValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    const result = await trpc.adminEnhancements.submitQuoteEnhanced.mutate({
      orderId: props.orderId,
      quoteAmount: amountInCents.value,
      adminNotes: adminNotes.value || undefined,
      includePaymentLink: includePaymentLink.value,
      expirationDays: expirationDays.value
    })
    
    emit('submitted', {
      orderId: props.orderId,
      amount: amountInCents.value,
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

// Quick amount buttons
const quickAmounts = [250, 500, 750, 1000, 1500, 2000]

function setQuickAmount(amount: number) {
  quoteAmount.value = amount.toFixed(2)
}
</script>

<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-white">Submit Quote</h2>
            <p class="text-white/70 text-sm">Order #{{ orderId }}</p>
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
              <span class="text-slate-400">Package:</span>
              <span class="ml-2 font-medium text-white">{{ packageName }}</span>
            </div>
            <div v-if="eventDate">
              <span class="text-slate-400">Event Date:</span>
              <span class="ml-2 font-medium text-white">{{ eventDate }}</span>
            </div>
            <div v-if="teamName">
              <span class="text-slate-400">Team:</span>
              <span class="ml-2 font-medium text-white">{{ teamName }}</span>
            </div>
            <div v-if="sportType">
              <span class="text-slate-400">Sport:</span>
              <span class="ml-2 font-medium text-white">{{ sportType }}</span>
            </div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="bg-error-500/10 border border-error-500/30 text-error-400 px-4 py-3 rounded-lg mb-6">
          {{ error }}
        </div>
        
        <!-- Quote Amount -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Quote Amount
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
            <input
              v-model="quoteAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full pl-10 pr-4 py-3 text-2xl font-bold bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          
          <!-- Quick Amount Buttons -->
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              @click="setQuickAmount(amount)"
              class="px-3 py-1.5 text-sm bg-dark-tertiary hover:bg-white/10 text-slate-300 rounded-full transition-colors border border-white/10"
            >
              ${{ amount }}
            </button>
          </div>
        </div>
        
        <!-- Admin Notes -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Notes for Customer (Optional)
          </label>
          <textarea
            v-model="adminNotes"
            rows="3"
            placeholder="Add any notes or special instructions for the customer..."
            class="w-full px-4 py-3 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
        
        <!-- Options -->
        <div class="space-y-4 mb-6">
          <!-- Payment Link Toggle -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="includePaymentLink"
              type="checkbox"
              class="w-5 h-5 text-brand-500 bg-dark-tertiary border-white/20 rounded focus:ring-brand-500 focus:ring-offset-0"
            />
            <div>
              <span class="font-medium text-white">Include Payment Link</span>
              <p class="text-sm text-slate-400">Customer can accept and pay directly from the email</p>
            </div>
          </label>
          
          <!-- Expiration Days -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Quote Valid For
            </label>
            <select
              v-model="expirationDays"
              class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option :value="7">7 days</option>
              <option :value="14">14 days</option>
              <option :value="30">30 days</option>
              <option :value="60">60 days</option>
              <option :value="90">90 days</option>
            </select>
            <p class="text-sm text-slate-400 mt-1">Expires: {{ expirationDate }}</p>
          </div>
        </div>
        
        <!-- Preview Toggle -->
        <button
          @click="showPreview = !showPreview"
          class="flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium mb-4"
        >
          <svg class="w-5 h-5 transition-transform" :class="{ 'rotate-90': showPreview }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          {{ showPreview ? 'Hide' : 'Show' }} Email Preview
        </button>
        
        <!-- Email Preview -->
        <div v-if="showPreview" class="border border-white/10 rounded-lg p-4 bg-dark-tertiary mb-6">
          <div class="bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-white/5">
            <div class="bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3 text-white text-center">
              <h3 class="font-bold">Your Custom Quote is Ready!</h3>
              <p class="text-sm text-white/70">Order #{{ orderId }}</p>
            </div>
            <div class="p-4 text-slate-200">
              <p class="mb-3">Hi {{ customerName }},</p>
              <p class="mb-4">Great news! We've prepared a custom quote for your {{ packageName }} request.</p>
              
              <div class="bg-brand-500/10 border-2 border-brand-500 rounded-lg p-4 text-center mb-4">
                <p class="text-sm text-slate-400">Your Quote</p>
                <p class="text-3xl font-bold text-brand-400">{{ formattedAmount }}</p>
                <p class="text-sm text-slate-400">Valid until {{ expirationDate }}</p>
              </div>
              
              <div v-if="adminNotes" class="bg-warning-500/10 border-l-4 border-warning-500 p-3 mb-4">
                <strong class="text-warning-400">Note from our team:</strong>
                <p class="mt-1 text-slate-300">{{ adminNotes }}</p>
              </div>
              
              <div v-if="includePaymentLink" class="text-center">
                <div class="inline-block bg-brand-600 text-white px-6 py-2 rounded-lg font-bold">
                  Accept Quote & Pay Now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="border-t border-white/10 px-6 py-4 bg-dark-tertiary flex items-center justify-between">
        <div class="text-sm text-slate-400">
          <span v-if="currentQuote" class="text-warning-400">
            Updating existing quote (was ${{ (currentQuote / 100).toFixed(2) }})
          </span>
        </div>
        <div class="flex gap-3">
          <UiButton
            @click="emit('close')"
            variant="outline"
          >
            Cancel
          </UiButton>
          <UiButton
            @click="submitQuote"
            :disabled="!isValid || isSubmitting"
            :loading="isSubmitting"
            variant="primary"
          >
            {{ isSubmitting ? 'Sending...' : 'Send Quote' }}
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
