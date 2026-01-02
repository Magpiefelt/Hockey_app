<script setup lang="ts">
/**
 * Order Email History Component
 * Shows email communication history for an order
 */

const props = defineProps<{
  orderId: number
}>()

const trpc = useTrpc()
const { showError, showSuccess } = useNotification()

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
    emails.value = await trpc.adminEnhancements.getEmailHistory.query({
      orderId: props.orderId
    })
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
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
    await trpc.adminEnhancements.resendEmailByType.mutate({
      orderId: props.orderId,
      emailType: type
    })
    
    showSuccess(`${type === 'quote' ? 'Quote' : 'Reminder'} email sent`)
    // Reload emails
    await loadEmails()
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(handleTrpcError(err))
  } finally {
    isResending.value = null
    resendType.value = null
  }
}

// Helpers
function getStatusVariant(status: string): 'success' | 'error' | 'warning' | 'brand' {
  const variants: Record<string, 'success' | 'error' | 'warning' | 'brand'> = {
    'sent': 'success',
    'failed': 'error',
    'bounced': 'warning',
    'queued': 'brand'
  }
  return variants[status] || 'brand'
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
  <UiCard variant="default" :hover="false" padding="none">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
      <h3 class="font-semibold text-white">Email History</h3>
      
      <!-- Quick Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="resendEmail('quote')"
          :disabled="isResending !== null"
          class="px-3 py-1 text-xs bg-brand-500/20 text-brand-400 rounded-full hover:bg-brand-500/30 disabled:opacity-50 transition-colors border border-brand-500/30"
        >
          {{ isResending === -1 && resendType === 'quote' ? 'Sending...' : 'Resend Quote' }}
        </button>
        <button
          @click="resendEmail('reminder')"
          :disabled="isResending !== null"
          class="px-3 py-1 text-xs bg-warning-500/20 text-warning-400 rounded-full hover:bg-warning-500/30 disabled:opacity-50 transition-colors border border-warning-500/30"
        >
          {{ isResending === -1 && resendType === 'reminder' ? 'Sending...' : 'Send Reminder' }}
        </button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="p-4">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <UiLoadingSpinner />
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="text-error-400 text-sm py-4 text-center">
        {{ error }}
      </div>
      
      <!-- Empty -->
      <div v-else-if="emails.length === 0" class="text-slate-500 text-sm py-8 text-center">
        No emails sent yet
      </div>
      
      <!-- Email List -->
      <div v-else class="space-y-3 max-h-64 overflow-y-auto">
        <div 
          v-for="email in emails" 
          :key="email.id"
          class="flex items-start gap-3 p-3 bg-dark-tertiary border border-white/5 rounded-lg"
        >
          <!-- Status Icon -->
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="email.status === 'sent' ? 'bg-success-500/20' : 'bg-error-500/20'"
          >
            <svg 
              v-if="email.status === 'sent'" 
              class="w-4 h-4 text-success-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg 
              v-else 
              class="w-4 h-4 text-error-400" 
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
              <UiBadge :variant="getStatusVariant(email.status)" size="sm">
                {{ email.status }}
              </UiBadge>
              <span class="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                {{ getTypeLabel(email.type) }}
              </span>
            </div>
            
            <p class="text-sm font-medium text-white truncate">
              {{ email.subject }}
            </p>
            
            <p class="text-xs text-slate-500 mt-1">
              To: {{ email.recipientEmail }} • {{ formatDate(email.sentAt || email.createdAt) }}
            </p>
            
            <p v-if="email.errorMessage" class="text-xs text-error-400 mt-1">
              Error: {{ email.errorMessage }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UiCard>
</template>
