<script setup lang="ts">
/**
 * Enhanced Quote Modal Component
 * Improved UX for submitting quotes with event date/time confirmation
 * 
 * Changes from original:
 * - Removed quote expiration days (not needed for this business model)
 * - Added event date/time picker for admin to confirm booking slot
 * - Added availability validation for selected date/time
 */

import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useCalendarStore } from '~/stores/calendar'

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
const { showError, showSuccess } = useNotification()

// Form state
const quoteAmount = ref<string>(props.currentQuote ? (props.currentQuote / 100).toFixed(2) : '')
const adminNotes = ref('')
const includePaymentLink = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const showPreview = ref(false)

// Event date/time state
const confirmedEventDate = ref<Date | null>(props.eventDate ? new Date(props.eventDate) : null)
const confirmedEventTime = ref<string>('12:00')
const isCheckingAvailability = ref(false)
const dateAvailable = ref<boolean | null>(null)

// Time options for the dropdown
const timeOptions = [
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '20:30', label: '8:30 PM' },
  { value: '21:00', label: '9:00 PM' },
]

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

const formattedEventDateTime = computed(() => {
  if (!confirmedEventDate.value) return 'Not selected'
  
  const date = confirmedEventDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const timeOption = timeOptions.find(t => t.value === confirmedEventTime.value)
  const time = timeOption?.label || confirmedEventTime.value
  
  return `${date} at ${time}`
})

const customerRequestedDate = computed(() => {
  if (!props.eventDate) return 'Not specified'
  return new Date(props.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const isValid = computed(() => {
  return amountInCents.value > 0 && confirmedEventDate.value !== null && dateAvailable.value === true
})

// Check availability when date changes
watch(confirmedEventDate, async (newDate) => {
  if (!newDate) {
    dateAvailable.value = null
    return
  }
  
  isCheckingAvailability.value = true
  try {
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    const result = await trpc.calendar.isDateAvailable.query({ date: dateString })
    dateAvailable.value = result.available
  } catch (err) {
    console.error('Failed to check availability:', err)
    dateAvailable.value = true // Assume available on error
  } finally {
    isCheckingAvailability.value = false
  }
})

// Methods
async function submitQuote() {
  if (!isValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    // Format the event datetime
    const eventDateTime = confirmedEventDate.value ? new Date(confirmedEventDate.value) : null
    if (eventDateTime && confirmedEventTime.value) {
      const [hours, minutes] = confirmedEventTime.value.split(':').map(Number)
      eventDateTime.setHours(hours, minutes, 0, 0)
    }
    
    const result = await trpc.adminEnhancements.submitQuoteEnhanced.mutate({
      orderId: props.orderId,
      quoteAmount: amountInCents.value,
      adminNotes: adminNotes.value || undefined,
      includePaymentLink: includePaymentLink.value,
      eventDateTime: eventDateTime?.toISOString(),
      confirmDateTime: true
    })
    
    showSuccess('Quote submitted successfully!')
    
    // Refresh calendar store so availability is updated immediately
    // (the confirmed event date should now show as booked)
    try {
      const calendarStore = useCalendarStore()
      await calendarStore.refresh()
    } catch (calErr) {
      // Non-critical - calendar will refresh on next page load
      console.warn('Calendar refresh after quote submission failed:', calErr)
    }
    
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

function useCustomerDate() {
  if (props.eventDate) {
    confirmedEventDate.value = new Date(props.eventDate)
  }
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
            <div v-if="teamName">
              <span class="text-slate-400">Team:</span>
              <span class="ml-2 font-medium text-white">{{ teamName }}</span>
            </div>
            <div v-if="sportType">
              <span class="text-slate-400">Sport:</span>
              <span class="ml-2 font-medium text-white">{{ sportType }}</span>
            </div>
            <div>
              <span class="text-slate-400">Requested Date:</span>
              <span class="ml-2 font-medium text-amber-400">{{ customerRequestedDate }}</span>
            </div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="bg-error-500/10 border border-error-500/30 text-error-400 px-4 py-3 rounded-lg mb-6">
          {{ error }}
        </div>
        
        <!-- Event Date/Time Confirmation -->
        <div class="mb-6 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-white flex items-center gap-2">
              <Icon name="mdi:calendar-clock" class="w-5 h-5 text-cyan-400" />
              Confirm Event Date & Time
            </h3>
            <button
              v-if="eventDate"
              @click="useCustomerDate"
              class="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              Use customer's requested date
            </button>
          </div>
          <p class="text-sm text-slate-400 mb-4">
            Select the confirmed date and time for this event. This will be blocked on the calendar after payment.
          </p>
          
          <div class="grid grid-cols-2 gap-4">
            <!-- Date Picker -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Event Date</label>
              <VueDatePicker 
                v-model="confirmedEventDate"
                :dark="true"
                :min-date="new Date()"
                placeholder="Select date"
                format="MM/dd/yyyy"
                :enable-time-picker="false"
                auto-apply
                class="w-full"
              />
            </div>
            
            <!-- Time Picker -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Event Time</label>
              <select
                v-model="confirmedEventTime"
                class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option v-for="time in timeOptions" :key="time.value" :value="time.value">
                  {{ time.label }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Availability Status -->
          <div class="mt-3">
            <div v-if="isCheckingAvailability" class="flex items-center gap-2 text-slate-400 text-sm">
              <Icon name="mdi:loading" class="w-4 h-4 animate-spin" />
              <span>Checking availability...</span>
            </div>
            <div v-else-if="confirmedEventDate && dateAvailable === true" class="flex items-center gap-2 text-emerald-400 text-sm">
              <Icon name="mdi:check-circle" class="w-4 h-4" />
              <span>{{ formattedEventDateTime }} is available</span>
            </div>
            <div v-else-if="confirmedEventDate && dateAvailable === false" class="flex items-center gap-2 text-red-400 text-sm">
              <Icon name="mdi:alert-circle" class="w-4 h-4" />
              <span>This date is already booked or blocked. Please select another date.</span>
            </div>
          </div>
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
              </div>
              
              <div class="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-4">
                <p class="text-sm text-cyan-400 font-medium">Event Date & Time:</p>
                <p class="text-white">{{ formattedEventDateTime }}</p>
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
          <span v-else-if="!confirmedEventDate" class="text-amber-400">
            Please select an event date
          </span>
          <span v-else-if="dateAvailable === false" class="text-red-400">
            Selected date is not available
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

<style scoped>
/* Override VueDatePicker styles for dark theme */
:deep(.dp__theme_dark) {
  --dp-background-color: #1e293b;
  --dp-text-color: #ffffff;
  --dp-hover-color: #334155;
  --dp-hover-text-color: #ffffff;
  --dp-primary-color: #06b6d4;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #475569;
  --dp-border-color: rgba(255, 255, 255, 0.1);
  --dp-menu-border-color: rgba(255, 255, 255, 0.1);
  --dp-border-color-hover: #06b6d4;
}

:deep(.dp__input) {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
</style>
