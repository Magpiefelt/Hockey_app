<template>
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-sm mb-6">
      <NuxtLink to="/orders" class="text-slate-500 hover:text-slate-900 transition-colors">
        My Orders
      </NuxtLink>
      <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="text-slate-900 font-medium">Order #{{ orderId }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin h-12 w-12 text-cyan-600">
        <svg fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Order Details -->
    <div v-else-if="orderData" class="space-y-6">
      <!-- Status Banner - Enhanced with icon and better visual hierarchy -->
      <div 
        :class="[
          'rounded-xl overflow-hidden shadow-sm',
          getStatusBannerClass(orderData.order.status)
        ]"
      >
        <!-- Status Header Bar -->
        <div :class="['px-6 py-3 flex items-center gap-3', getStatusHeaderClass(orderData.order.status)]">
          <Icon :name="getStatusIcon(orderData.order.status)" class="w-5 h-5" />
          <span class="font-bold text-sm uppercase tracking-wide">
            {{ getStatusLabel(orderData.order.status) }}
          </span>
        </div>
        
        <div class="p-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-slate-900 mb-2">Order #{{ orderData.order.id }}</h1>
              <p class="text-slate-600 leading-relaxed">{{ getStatusDescription(orderData.order.status) }}</p>
              
              <!-- Next action hint -->
              <div v-if="getNextActionHint(orderData.order.status)" class="mt-4 flex items-center gap-2 text-sm">
                <Icon name="mdi:arrow-right-circle" class="w-4 h-4 text-cyan-600" />
                <span class="text-slate-700 font-medium">{{ getNextActionHint(orderData.order.status) }}</span>
              </div>
            </div>
            
            <div v-if="orderData.order.quotedAmount" class="text-right bg-white/50 rounded-lg p-4 border border-slate-200">
              <p class="text-sm text-slate-500 mb-1">Quote Amount</p>
              <p class="text-3xl font-bold text-cyan-600">{{ formatPrice(orderData.order.quotedAmount) }}</p>
              <p v-if="orderData.order.eventDate" class="text-xs text-slate-400 mt-2">
                Event: {{ formatDate(orderData.order.eventDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Progress Timeline -->
      <div class="bg-white border border-slate-200 rounded-lg p-6 md:p-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Order Progress</h2>
        <div class="relative">
          <!-- Progress Line -->
          <div class="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200"></div>
          <div 
            class="absolute left-6 top-6 w-0.5 bg-cyan-500 transition-all duration-500"
            :style="{ height: getProgressHeight(orderData.order.status) }"
          ></div>
          
          <div class="space-y-6 relative">
            <!-- Step 1: Submitted -->
            <div class="flex items-start gap-4">
              <div class="relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-cyan-500 text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 class="font-bold text-slate-900">Order Submitted</h3>
                <p class="text-sm text-slate-600">{{ formatDateTime(orderData.order.createdAt) }}</p>
              </div>
            </div>

            <!-- Step 2: In Review -->
            <div class="flex items-start gap-4">
              <div 
                :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  isStepComplete('quoted') ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-500'
                ]"
              >
                <svg v-if="isStepComplete('quoted')" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 :class="['font-bold', isStepComplete('quoted') ? 'text-slate-900' : 'text-slate-500']">Quote Prepared</h3>
                <p class="text-sm text-slate-600">
                  <span v-if="!isStepComplete('quoted')">We're reviewing your request...</span>
                  <span v-else>Quote sent</span>
                </p>
              </div>
            </div>

            <!-- Step 3: In Progress -->
            <div class="flex items-start gap-4">
              <div 
                :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  isStepComplete('in_progress') ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-500'
                ]"
              >
                <svg v-if="isStepComplete('in_progress')" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 :class="['font-bold', isStepComplete('in_progress') ? 'text-slate-900' : 'text-slate-500']">In Production</h3>
                <p class="text-sm text-slate-600">
                  <span v-if="orderData.order.status === 'in_progress'">We're preparing your order...</span>
                  <span v-else-if="isStepComplete('in_progress')">Production complete</span>
                  <span v-else>Awaiting payment</span>
                </p>
              </div>
            </div>

            <!-- Step 4: Ready/Delivered -->
            <div class="flex items-start gap-4">
              <div 
                :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  isStepComplete('delivered') ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'
                ]"
              >
                <svg v-if="isStepComplete('delivered')" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 :class="['font-bold', isStepComplete('delivered') ? 'text-slate-900' : 'text-slate-500']">Ready for Download</h3>
                <p class="text-sm text-slate-600">
                  <span v-if="isStepComplete('delivered')">Your files are ready!</span>
                  <span v-else>Files will be available here</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Information -->
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Order Information</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-slate-500 mb-1">Customer Name</p>
            <p class="text-slate-900 font-medium">{{ orderData.order.name }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1">Email</p>
            <p class="text-slate-900 font-medium">{{ orderData.order.emailSnapshot }}</p>
          </div>
          <div v-if="orderData.order.packageId">
            <p class="text-sm text-slate-500 mb-1">Package</p>
            <p class="text-slate-900 font-medium">{{ getPackageName(orderData.order.packageId) }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1">Submitted</p>
            <p class="text-slate-900 font-medium">{{ formatDate(orderData.order.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Customer Notes -->
      <div v-if="orderData.order.notes" class="bg-white border border-slate-200 rounded-lg p-6">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Your Notes</h2>
        <p class="text-slate-600 whitespace-pre-wrap">{{ orderData.order.notes }}</p>
      </div>

      <!-- Admin Notes (if quoted) -->
      <div v-if="orderData.order.adminNotes" class="bg-cyan-500/5 border border-cyan-500/50 rounded-lg p-6">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Quote Notes</h2>
        <p class="text-slate-600 whitespace-pre-wrap">{{ orderData.order.adminNotes }}</p>
      </div>

      <!-- Payment Section - Enhanced -->
      <div v-if="showPaymentSection" class="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/50 rounded-lg p-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-4">
            <Icon name="mdi:receipt-text" class="w-8 h-8 text-cyan-600" />
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-2">Payment Required</h3>
          <p class="text-slate-600 mb-6 max-w-md mx-auto">
            Your quote is ready. Complete payment to proceed with your order.
          </p>
          
          <!-- Enhanced Payment Button Component -->
          <CustomerPaymentButton
            :order-id="orderId"
            :amount="orderData.order.quotedAmount"
            @payment-started="onPaymentStarted"
            @payment-error="onPaymentError"
            @payment-redirecting="onPaymentRedirecting"
          />
        </div>
      </div>

      <!-- Payment Status -->
      <div v-if="orderData.payment" class="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <Icon name="mdi:check-circle" class="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Payment Received</h3>
            <p class="text-slate-600">Amount: {{ formatPrice(orderData.payment.amount) }}</p>
            <p class="text-slate-500 text-sm">Paid on {{ formatDateTime(orderData.payment.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Files Section -->
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Files</h2>
        
        <!-- Uploaded Files -->
        <div v-if="uploadedFiles.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-3">Your Uploads</h3>
          <div class="space-y-2">
            <div
              v-for="file in uploadedFiles"
              :key="file.id"
              class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <Icon name="mdi:file-document" class="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-slate-900 text-sm truncate">{{ file.filename }}</p>
                  <p class="text-slate-500 text-xs">{{ formatFileSize(file.fileSize) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Deliverable Files -->
        <div v-if="deliverableFiles.length > 0">
          <h3 class="text-lg font-semibold text-slate-900 mb-3">Deliverables</h3>
          <div class="space-y-2">
            <div
              v-for="file in deliverableFiles"
              :key="file.id"
              class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md hover:border-cyan-500 transition-colors"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <Icon name="mdi:file-music" class="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-slate-900 text-sm truncate">{{ file.filename }}</p>
                  <p class="text-slate-500 text-xs">{{ formatFileSize(file.fileSize) }}</p>
                </div>
              </div>
              <button
                @click="downloadFile(file.id, file.filename)"
                :disabled="downloadingFileId === file.id"
                class="ml-2 px-4 py-2 bg-cyan-500 text-white hover:bg-cyan-600 rounded-md transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              >
                <Icon 
                  :name="downloadingFileId === file.id ? 'mdi:loading' : 'mdi:download'" 
                  :class="['w-4 h-4', downloadingFileId === file.id ? 'animate-spin' : '']" 
                />
                {{ downloadingFileId === file.id ? 'Downloading...' : 'Download' }}
              </button>
            </div>
          </div>
        </div>

        <!-- No Files -->
        <div v-if="uploadedFiles.length === 0 && deliverableFiles.length === 0" class="text-center py-8 text-slate-500">
          <Icon name="mdi:folder-open" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No files attached to this order</p>
        </div>
      </div>

      <!-- Cancel Order Section -->
      <div v-if="canCancelOrder" class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-1">Need to Cancel?</h3>
            <p class="text-slate-600 text-sm">You can cancel this order before payment is completed.</p>
          </div>
          <button
            @click="openCancelDialog"
            class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon name="mdi:close-circle" class="w-5 h-5" />
            Cancel Order
          </button>
        </div>
      </div>

      <!-- Cancel Confirmation Dialog -->
      <UiConfirmDialog
        :is-open="showCancelDialog"
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        type="danger"
        confirm-text="Yes, Cancel Order"
        cancel-text="Keep Order"
        :loading="isCancelling"
        @confirm="confirmCancelOrder"
        @cancel="closeCancelDialog"
      >
        <template #content>
          <div class="mt-4">
            <label for="cancel-reason" class="block text-sm font-medium text-slate-700 mb-2">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancel-reason"
              v-model="cancelReason"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="Let us know why you're cancelling..."
            ></textarea>
          </div>
        </template>
      </UiConfirmDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const route = useRoute()
const config = useRuntimeConfig()
const trpc = useTrpc()
const { formatPrice, formatDate, formatDateTime, formatFileSize, getStatusColor, getStatusLabel } = useUtils()
const { showError, showSuccess } = useNotification()

const orderId = computed(() => parseInt(route.params.id as string))

// Load packages from content
const { data: packagesData } = await useAsyncData('packages', () => 
  queryContent('/packages').findOne()
)
const packages = computed(() => packagesData.value?.body || [])

const getPackageName = (packageId: string) => {
  const pkg = packages.value.find((p: any) => p.id === packageId)
  return pkg?.name || packageId
}

const ordersStore = useOrdersStore()

const orderData = computed(() => ordersStore.currentOrder)
const loading = computed(() => ordersStore.isLoading)
const error = computed(() => ordersStore.error)
const downloadingFileId = ref<number | null>(null)
const showCancelDialog = ref(false)
const cancelReason = ref('')
const isCancelling = ref(false)

const uploadedFiles = computed(() => {
  return orderData.value?.files?.filter((f: any) => f.kind === 'upload') || []
})

const deliverableFiles = computed(() => {
  return orderData.value?.files?.filter((f: any) => f.kind === 'deliverable') || []
})

// Show payment section only when quote exists and not yet paid
const showPaymentSection = computed(() => {
  return orderData.value?.order?.quotedAmount && 
         !orderData.value?.payment &&
         !['paid', 'completed', 'delivered', 'cancelled'].includes(orderData.value?.order?.status)
})

// Show cancel button only for cancellable statuses
const canCancelOrder = computed(() => {
  const status = orderData.value?.order?.status
  const cancellableStatuses = ['submitted', 'quoted', 'quote_viewed', 'quote_accepted', 'invoiced']
  return status && cancellableStatuses.includes(status)
})

// Status-based helpers
const statusOrder = ['pending', 'submitted', 'quoted', 'quote_viewed', 'quote_accepted', 'invoiced', 'paid', 'in_progress', 'completed', 'delivered']

function isStepComplete(targetStatus: string): boolean {
  const currentStatus = orderData.value?.order?.status
  if (!currentStatus) return false
  
  // Map target status to check
  const statusMapping: Record<string, string[]> = {
    'quoted': ['quoted', 'quote_viewed', 'quote_accepted', 'invoiced', 'paid', 'in_progress', 'completed', 'delivered'],
    'in_progress': ['in_progress', 'completed', 'delivered'],
    'delivered': ['completed', 'delivered']
  }
  
  return statusMapping[targetStatus]?.includes(currentStatus) || false
}

function getStatusBannerClass(status: string): string {
  const classes: Record<string, string> = {
    'pending': 'bg-blue-50 border border-blue-200',
    'submitted': 'bg-blue-50 border border-blue-200',
    'quoted': 'bg-purple-50 border border-purple-200',
    'quote_viewed': 'bg-purple-50 border border-purple-200',
    'quote_accepted': 'bg-emerald-50 border border-emerald-200',
    'invoiced': 'bg-orange-50 border border-orange-200',
    'paid': 'bg-emerald-50 border border-emerald-200',
    'in_progress': 'bg-amber-50 border border-amber-200',
    'completed': 'bg-emerald-50 border border-emerald-200',
    'delivered': 'bg-slate-50 border border-slate-200',
    'cancelled': 'bg-red-50 border border-red-200'
  }
  return classes[status] || 'bg-slate-50 border border-slate-200'
}

function getStatusHeaderClass(status: string): string {
  const classes: Record<string, string> = {
    'pending': 'bg-blue-500 text-white',
    'submitted': 'bg-blue-500 text-white',
    'quoted': 'bg-purple-500 text-white',
    'quote_viewed': 'bg-purple-500 text-white',
    'quote_accepted': 'bg-emerald-500 text-white',
    'invoiced': 'bg-orange-500 text-white',
    'paid': 'bg-emerald-500 text-white',
    'in_progress': 'bg-amber-500 text-white',
    'completed': 'bg-emerald-600 text-white',
    'delivered': 'bg-slate-600 text-white',
    'cancelled': 'bg-red-500 text-white'
  }
  return classes[status] || 'bg-slate-500 text-white'
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'pending': 'mdi:clock-outline',
    'submitted': 'mdi:send-check',
    'quoted': 'mdi:file-document-outline',
    'quote_viewed': 'mdi:eye-outline',
    'quote_accepted': 'mdi:check-circle-outline',
    'invoiced': 'mdi:receipt-text-outline',
    'paid': 'mdi:credit-card-check-outline',
    'in_progress': 'mdi:progress-wrench',
    'completed': 'mdi:check-decagram',
    'delivered': 'mdi:package-variant-closed-check',
    'cancelled': 'mdi:close-circle-outline'
  }
  return icons[status] || 'mdi:help-circle-outline'
}

function getNextActionHint(status: string): string | null {
  const hints: Record<string, string> = {
    'pending': 'We will review your request and send a quote soon.',
    'submitted': 'Your request is being processed.',
    'quoted': 'Review your quote and proceed to payment when ready.',
    'quote_viewed': 'Click the payment button below to proceed.',
    'quote_accepted': 'Complete payment to start production.',
    'invoiced': 'Pay your invoice to begin work on your order.',
    'in_progress': 'We are working on your order. Check back for updates.',
    'completed': 'Your files are ready for download below.',
    'delivered': null,
    'cancelled': null
  }
  return hints[status] || null
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    'pending': 'bg-blue-100 text-blue-700',
    'submitted': 'bg-blue-100 text-blue-700',
    'quoted': 'bg-purple-100 text-purple-700',
    'quote_viewed': 'bg-purple-100 text-purple-700',
    'quote_accepted': 'bg-green-100 text-green-700',
    'invoiced': 'bg-orange-100 text-orange-700',
    'paid': 'bg-green-100 text-green-700',
    'in_progress': 'bg-yellow-100 text-yellow-700',
    'completed': 'bg-green-100 text-green-700',
    'delivered': 'bg-slate-100 text-slate-700',
    'cancelled': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'pending': 'Your order has been received and is awaiting review. We\'ll send you a quote within 24 hours.',
    'submitted': 'Your order has been submitted and is being reviewed.',
    'quoted': 'Your quote is ready! Please review and proceed with payment.',
    'quote_viewed': 'You\'ve viewed your quote. Ready to proceed?',
    'quote_accepted': 'Great! You\'ve accepted the quote. Awaiting payment.',
    'invoiced': 'Your invoice is ready. Please complete payment to proceed.',
    'paid': 'Payment received! We\'re starting work on your order.',
    'in_progress': 'Your order is being prepared. We\'ll notify you when it\'s ready.',
    'completed': 'Your order is complete! Download your files below.',
    'delivered': 'This order has been completed and delivered.',
    'cancelled': 'This order has been cancelled.'
  }
  return descriptions[status] || 'Order status unknown.'
}

const fetchOrder = async () => {
  await ordersStore.fetchOrderById(orderId.value)
  if (ordersStore.error) {
    showError('Failed to load order details')
  }
}

// Payment event handlers
function onPaymentStarted() {
  // Payment process initiated
}

function onPaymentError(error: string) {
  showError(`Payment error: ${error}`)
}

function onPaymentRedirecting(url: string) {
  // Redirecting to payment provider
}

const getProgressHeight = (status: string) => {
  const progressMap: Record<string, string> = {
    'pending': '0%',
    'submitted': '0%',
    'quoted': '25%',
    'quote_viewed': '25%',
    'quote_accepted': '25%',
    'invoiced': '25%',
    'paid': '50%',
    'in_progress': '66%',
    'completed': '100%',
    'delivered': '100%'
  }
  return progressMap[status] || '0%'
}

const downloadFile = async (fileId: number, filename: string) => {
  try {
    downloadingFileId.value = fileId
    const { url } = await trpc.files.getDownloadUrl.query({ fileId })
    
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    showSuccess('Download started')
  } catch (err: any) {
    showError(`Failed to download file: ${err.message || 'Unknown error'}`)
  } finally {
    downloadingFileId.value = null
  }
}

// Cancel order functions
function openCancelDialog() {
  cancelReason.value = ''
  showCancelDialog.value = true
}

function closeCancelDialog() {
  showCancelDialog.value = false
  cancelReason.value = ''
}

async function confirmCancelOrder() {
  isCancelling.value = true
  try {
    await trpc.orders.cancel.mutate({
      orderId: orderId.value,
      reason: cancelReason.value || undefined
    })
    showSuccess('Order cancelled successfully')
    closeCancelDialog()
    // Refresh order data
    await fetchOrder()
  } catch (err: any) {
    showError(err.message || 'Failed to cancel order')
  } finally {
    isCancelling.value = false
  }
}

// Fetch order on mount
onMounted(() => {
  fetchOrder()
})

useHead({
  title: () => `Order #${orderId.value} - Elite Sports DJ`,
  meta: [
    { name: 'description', content: 'View order details' }
  ]
})
</script>
