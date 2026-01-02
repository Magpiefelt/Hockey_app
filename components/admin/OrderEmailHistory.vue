<script setup lang="ts">
/**
 * Order Email History Component
 * Shows email communication history for an order
 */

const props = defineProps<{
  orderId: number
}>()

const { $trpc } = useNuxtApp()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const emails = ref<Array<{
  id: number
  recipientEmail: string
  subject: string
  type: string
  status: string
  errorMessage: string | null
  sentAt: string | null
  createdAt: string | null
}>>([])

const isResending = ref<number | null>(null)
const resendType = ref<'quote' | 'invoice' | 'confirmation' | 'reminder' | null>(null)

// Load email history
async function loadEmails() {
  loading.value = true
  error.value = null
  
  try {
    emails.value = await $trpc.adminEnhancements.getEmailHistory.query({
      orderId: props.orderId
    })
  } catch (err: any) {
    error.value = err.message || 'Failed to load email history'
  } finally {
    loading.value = false
  }
}

onMounted(loadEmails)

// Resend email
async function resendEmail(type: 'quote' | 'reminder') {
  if (isResending.value !== null) return
  
  isResending.value = -1 // Use -1 to indicate resend by type
  resendType.value = type
  
  try {
    await $trpc.adminEnhancements.resendEmailByType.mutate({
      orderId: props.orderId,
      emailType: type
    })
    
    // Reload emails
    await loadEmails()
  } catch (err: any) {
    error.value = err.message || 'Failed to resend email'
  } finally {
    isResending.value = null
    resendType.value = null
  }
}

// Helpers
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'sent': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'bounced': 'bg-orange-100 text-orange-800',
    'queued': 'bg-blue-100 text-blue-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'order_confirmation': 'Confirmation',
    'quote': 'Quote',
    'quote_enhanced': 'Quote',
    'quote_revision': 'Quote Update',
    'quote_reminder': 'Reminder',
    'invoice': 'Invoice',
    'payment_receipt': 'Receipt',
    'custom': 'Custom'
  }
  return labels[type] || type
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h3 class="font-semibold text-gray-900">Email History</h3>
      
      <!-- Quick Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="resendEmail('quote')"
          :disabled="isResending !== null"
          class="px-3 py-1 text-xs bg-cyan-100 text-cyan-700 rounded-full hover:bg-cyan-200 disabled:opacity-50 transition-colors"
        >
          {{ isResending === -1 && resendType === 'quote' ? 'Sending...' : 'Resend Quote' }}
        </button>
        <button
          @click="resendEmail('reminder')"
          :disabled="isResending !== null"
          class="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 disabled:opacity-50 transition-colors"
        >
          {{ isResending === -1 && resendType === 'reminder' ? 'Sending...' : 'Send Reminder' }}
        </button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="p-4">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="text-red-600 text-sm py-4 text-center">
        {{ error }}
      </div>
      
      <!-- Empty -->
      <div v-else-if="emails.length === 0" class="text-gray-500 text-sm py-8 text-center">
        No emails sent yet
      </div>
      
      <!-- Email List -->
      <div v-else class="space-y-3 max-h-64 overflow-y-auto">
        <div 
          v-for="email in emails" 
          :key="email.id"
          class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <!-- Status Icon -->
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="email.status === 'sent' ? 'bg-green-100' : 'bg-red-100'"
          >
            <svg 
              v-if="email.status === 'sent'" 
              class="w-4 h-4 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg 
              v-else 
              class="w-4 h-4 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <!-- Email Details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="getStatusColor(email.status)"
              >
                {{ email.status }}
              </span>
              <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                {{ getTypeLabel(email.type) }}
              </span>
            </div>
            
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ email.subject }}
            </p>
            
            <p class="text-xs text-gray-500 mt-1">
              To: {{ email.recipientEmail }} • {{ formatDate(email.sentAt || email.createdAt) }}
            </p>
            
            <p v-if="email.errorMessage" class="text-xs text-red-600 mt-1">
              Error: {{ email.errorMessage }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
