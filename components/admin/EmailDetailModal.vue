<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-detail-title"
        >
          <!-- Header -->
          <div class="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-dark-secondary">
            <div class="flex-1">
              <h2 id="email-detail-title" class="text-2xl font-bold text-white mb-1">
                Email Details
              </h2>
              <p class="text-sm text-slate-400">
                ID: #{{ email.id }} • {{ formatDate(email.createdAt) }}
              </p>
            </div>
            <button
              @click="close"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <Icon name="mdi:close" class="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6">
            <!-- Status Banner -->
            <div
              :class="[
                'p-4 rounded-lg border flex items-start gap-3',
                getStatusBannerClass(email.status)
              ]"
            >
              <Icon :name="getStatusIcon(email.status)" class="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h3 class="font-semibold mb-1">
                  {{ getStatusTitle(email.status) }}
                </h3>
                <p class="text-sm opacity-90">
                  {{ getStatusMessage(email.status) }}
                </p>
                <p v-if="email.sentAt" class="text-xs mt-2 opacity-75">
                  Sent at: {{ formatDateTime(email.sentAt) }}
                </p>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="email.status === 'failed' && email.errorMessage"
              class="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <div class="flex items-start gap-3">
                <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h4 class="text-red-400 font-semibold mb-1">Error Details</h4>
                  <p class="text-sm text-slate-300 font-mono">{{ email.errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Email Information -->
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Recipient -->
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-2">Recipient</label>
                <div class="p-4 bg-dark-primary border border-white/10 rounded-lg">
                  <p class="text-white font-medium">{{ email.toEmail }}</p>
                  <p v-if="email.contactName" class="text-slate-400 text-sm mt-1">{{ email.contactName }}</p>
                </div>
              </div>

              <!-- Template -->
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-2">Template</label>
                <div class="p-4 bg-dark-primary border border-white/10 rounded-lg">
                  <div class="flex items-center gap-2">
                    <Icon :name="getTemplateIcon(email.template)" class="w-5 h-5 text-brand-400" />
                    <span class="text-white font-medium">{{ formatTemplate(email.template) }}</span>
                  </div>
                </div>
              </div>

              <!-- Order ID -->
              <div v-if="email.orderId">
                <label class="block text-sm font-medium text-slate-400 mb-2">Related Order</label>
                <div class="p-4 bg-dark-primary border border-white/10 rounded-lg">
                  <NuxtLink
                    :to="`/admin/orders/${email.orderId}`"
                    class="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-2"
                  >
                    Order #{{ email.orderId }}
                    <Icon name="mdi:open-in-new" class="w-4 h-4" />
                  </NuxtLink>
                  <p v-if="email.orderStatus" class="text-slate-400 text-sm mt-1">
                    Status: {{ email.orderStatus }}
                  </p>
                </div>
              </div>

              <!-- Created At -->
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-2">Created</label>
                <div class="p-4 bg-dark-primary border border-white/10 rounded-lg">
                  <p class="text-white">{{ formatDateTime(email.createdAt) }}</p>
                  <p class="text-slate-400 text-sm mt-1">{{ getRelativeTime(email.createdAt) }}</p>
                </div>
              </div>
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-2">Subject</label>
              <div class="p-4 bg-dark-primary border border-white/10 rounded-lg">
                <p class="text-white">{{ email.subject }}</p>
              </div>
            </div>

            <!-- Metadata -->
            <div v-if="email.metadataJson">
              <label class="block text-sm font-medium text-slate-400 mb-2">
                Email Data
                <button
                  @click="showMetadata = !showMetadata"
                  class="ml-2 text-xs text-brand-400 hover:text-brand-300"
                >
                  {{ showMetadata ? 'Hide' : 'Show' }}
                </button>
              </label>
              <div v-if="showMetadata" class="p-4 bg-dark-primary border border-white/10 rounded-lg overflow-x-auto">
                <pre class="text-sm text-slate-300 font-mono">{{ JSON.stringify(email.metadataJson, null, 2) }}</pre>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="sticky bottom-0 flex justify-between items-center gap-3 p-6 border-t border-white/10 bg-dark-secondary">
            <button
              @click="close"
              class="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
            <div class="flex gap-3">
              <button
                v-if="email.orderId"
                @click="goToOrder"
                class="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon name="mdi:open-in-new" class="w-5 h-5" />
                View Order
              </button>
              <button
                v-if="email.status === 'failed'"
                @click="handleResend"
                :disabled="isResending"
                class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Icon :name="isResending ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': isResending }" class="w-5 h-5" />
                {{ isResending ? 'Resending...' : 'Resend Email' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Email {
  id: number
  orderId?: number
  toEmail: string
  subject: string
  template: string
  status: string
  errorMessage?: string
  createdAt: string
  sentAt?: string
  contactName?: string
  orderStatus?: string
  metadataJson?: any
}

interface Props {
  modelValue: boolean
  email: Email
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'resend', emailId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showMetadata = ref(false)
const isResending = ref(false)

function close() {
  emit('update:modelValue', false)
  showMetadata.value = false
}

function goToOrder() {
  if (props.email.orderId) {
    navigateTo(`/admin/orders/${props.email.orderId}`)
    close()
  }
}

function handleResend() {
  emit('resend', props.email.id)
  isResending.value = true
  
  // Reset after 3 seconds
  setTimeout(() => {
    isResending.value = false
  }, 3000)
}

function getStatusBannerClass(status: string) {
  const classes: Record<string, string> = {
    sent: 'bg-green-500/10 border-green-500/30 text-green-400',
    failed: 'bg-red-500/10 border-red-500/30 text-red-400',
    queued: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  }
  return classes[status] || 'bg-slate-500/10 border-slate-500/30 text-slate-400'
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    sent: 'mdi:check-circle',
    failed: 'mdi:alert-circle',
    queued: 'mdi:clock-outline'
  }
  return icons[status] || 'mdi:email'
}

function getStatusTitle(status: string) {
  const titles: Record<string, string> = {
    sent: 'Email Sent Successfully',
    failed: 'Email Failed to Send',
    queued: 'Email Queued for Delivery'
  }
  return titles[status] || 'Email Status Unknown'
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    sent: 'This email was successfully delivered to the recipient.',
    failed: 'This email failed to send. Check the error details below and try resending.',
    queued: 'This email is queued and will be sent shortly.'
  }
  return messages[status] || 'No additional information available.'
}

function getTemplateIcon(template: string) {
  const icons: Record<string, string> = {
    order_confirmation: 'mdi:check-decagram',
    quote: 'mdi:currency-usd',
    invoice: 'mdi:file-document',
    payment_receipt: 'mdi:receipt',
    custom: 'mdi:email-edit'
  }
  return icons[template] || 'mdi:email'
}

function formatTemplate(template: string) {
  const names: Record<string, string> = {
    order_confirmation: 'Order Confirmation',
    quote: 'Quote',
    invoice: 'Invoice',
    payment_receipt: 'Payment Receipt',
    custom: 'Custom Email'
  }
  return names[template] || template
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

// Trap focus and handle escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

// Cleanup on component unmount to prevent memory leaks
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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

.modal-enter-active .bg-dark-secondary,
.modal-leave-active .bg-dark-secondary {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-dark-secondary,
.modal-leave-to .bg-dark-secondary {
  transform: scale(0.95);
}
</style>
