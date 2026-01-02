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

const { $trpc } = useNuxtApp()

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
    const result = await $trpc.adminEnhancements.submitQuoteEnhanced.mutate({
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
    error.value = err.message || 'Failed to submit quote'
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Submit Quote</h2>
            <p class="text-cyan-100 text-sm">Order #{{ orderId }}</p>
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
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-gray-900 mb-2">Customer Details</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Name:</span>
              <span class="ml-2 font-medium">{{ customerName }}</span>
            </div>
            <div>
              <span class="text-gray-500">Email:</span>
              <span class="ml-2 font-medium">{{ customerEmail }}</span>
            </div>
            <div>
              <span class="text-gray-500">Package:</span>
              <span class="ml-2 font-medium">{{ packageName }}</span>
            </div>
            <div v-if="eventDate">
              <span class="text-gray-500">Event Date:</span>
              <span class="ml-2 font-medium">{{ eventDate }}</span>
            </div>
            <div v-if="teamName">
              <span class="text-gray-500">Team:</span>
              <span class="ml-2 font-medium">{{ teamName }}</span>
            </div>
            <div v-if="sportType">
              <span class="text-gray-500">Sport:</span>
              <span class="ml-2 font-medium">{{ sportType }}</span>
            </div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {{ error }}
        </div>
        
        <!-- Quote Amount -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Quote Amount
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              v-model="quoteAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full pl-8 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          
          <!-- Quick Amount Buttons -->
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              @click="setQuickAmount(amount)"
              class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              ${{ amount }}
            </button>
          </div>
        </div>
        
        <!-- Admin Notes -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Notes for Customer (Optional)
          </label>
          <textarea
            v-model="adminNotes"
            rows="3"
            placeholder="Add any notes or special instructions for the customer..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
        
        <!-- Options -->
        <div class="space-y-4 mb-6">
          <!-- Payment Link Toggle -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="includePaymentLink"
              type="checkbox"
              class="w-5 h-5 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
            />
            <div>
              <span class="font-medium text-gray-900">Include Payment Link</span>
              <p class="text-sm text-gray-500">Customer can accept and pay directly from the email</p>
            </div>
          </label>
          
          <!-- Expiration Days -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Quote Valid For
            </label>
            <select
              v-model="expirationDays"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option :value="7">7 days</option>
              <option :value="14">14 days</option>
              <option :value="30">30 days</option>
              <option :value="60">60 days</option>
              <option :value="90">90 days</option>
            </select>
            <p class="text-sm text-gray-500 mt-1">Expires: {{ expirationDate }}</p>
          </div>
        </div>
        
        <!-- Preview Toggle -->
        <button
          @click="showPreview = !showPreview"
          class="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium mb-4"
        >
          <svg class="w-5 h-5" :class="{ 'rotate-90': showPreview }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          {{ showPreview ? 'Hide' : 'Show' }} Email Preview
        </button>
        
        <!-- Email Preview -->
        <div v-if="showPreview" class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-white text-center">
              <h3 class="font-bold">Your Custom Quote is Ready!</h3>
              <p class="text-sm text-cyan-100">Order #{{ orderId }}</p>
            </div>
            <div class="p-4">
              <p class="mb-3">Hi {{ customerName }},</p>
              <p class="mb-4">Great news! We've prepared a custom quote for your {{ packageName }} request.</p>
              
              <div class="bg-cyan-50 border-2 border-cyan-500 rounded-lg p-4 text-center mb-4">
                <p class="text-sm text-gray-500">Your Quote</p>
                <p class="text-3xl font-bold text-cyan-500">{{ formattedAmount }}</p>
                <p class="text-sm text-gray-500">Valid until {{ expirationDate }}</p>
              </div>
              
              <div v-if="adminNotes" class="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4">
                <strong>Note from our team:</strong>
                <p class="mt-1">{{ adminNotes }}</p>
              </div>
              
              <div v-if="includePaymentLink" class="text-center">
                <div class="inline-block bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold">
                  Accept Quote & Pay Now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <span v-if="currentQuote" class="text-amber-600">
            Updating existing quote (was ${{ (currentQuote / 100).toFixed(2) }})
          </span>
        </div>
        <div class="flex gap-3">
          <button
            @click="emit('close')"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="submitQuote"
            :disabled="!isValid || isSubmitting"
            class="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg v-if="isSubmitting" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? 'Sending...' : 'Send Quote' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
