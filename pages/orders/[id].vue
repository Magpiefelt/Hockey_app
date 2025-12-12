<template>
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-sm mb-6">
      <NuxtLink to="/orders" class="text-text-tertiary hover:text-text-primary transition-colors">
        My Orders
      </NuxtLink>
      <svg class="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="text-text-primary font-medium">Order #{{ orderId }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin h-12 w-12 text-brand-primary">
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
      <!-- Status Banner -->
      <div 
        :class="[
          'border-l-4 rounded-lg p-6',
          orderData.order.status === 'pending' ? 'bg-blue-50 border-blue-500' : '',
          orderData.order.status === 'in_progress' ? 'bg-yellow-50 border-yellow-500' : '',
          orderData.order.status === 'ready' ? 'bg-green-50 border-green-500' : '',
          orderData.order.status === 'completed' ? 'bg-slate-50 border-slate-400' : ''
        ]"
      >
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span 
                :class="[
                  'px-3 py-1 text-sm font-bold rounded-full',
                  orderData.order.status === 'pending' ? 'bg-blue-100 text-blue-700' : '',
                  orderData.order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : '',
                  orderData.order.status === 'ready' ? 'bg-green-100 text-green-700' : '',
                  orderData.order.status === 'completed' ? 'bg-slate-100 text-slate-700' : ''
                ]"
              >
                {{ getStatusLabel(orderData.order.status) }}
              </span>
            </div>
            <h1 class="text-2xl font-bold text-text-primary mb-2">Order #{{ orderData.order.id }}</h1>
            <p class="text-text-secondary">
              <span v-if="orderData.order.status === 'pending'">Your order has been received and is awaiting review. We'll send you a quote within 24 hours.</span>
              <span v-else-if="orderData.order.status === 'in_progress'">Your order is being prepared. We'll notify you when it's ready.</span>
              <span v-else-if="orderData.order.status === 'ready'">Your order is complete! Download your files below.</span>
              <span v-else-if="orderData.order.status === 'completed'">This order has been completed and delivered.</span>
            </p>
          </div>
          <div v-if="orderData.order.quotedAmount" class="text-right">
            <p class="text-sm text-text-tertiary mb-1">Quote Amount</p>
            <p class="text-3xl font-bold text-brand-primary">{{ formatPrice(orderData.order.quotedAmount) }}</p>
          </div>
        </div>
      </div>

      <!-- Order Progress Timeline -->
      <div class="bg-white border border-brand-border rounded-lg p-6 md:p-8">
        <h2 class="text-xl font-bold text-text-primary mb-6">Order Progress</h2>
        <div class="relative">
          <!-- Progress Line -->
          <div class="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200"></div>
          <div 
            class="absolute left-6 top-6 w-0.5 bg-brand-primary transition-all duration-500"
            :style="{ height: getProgressHeight(orderData.order.status) }"
          ></div>
          
          <div class="space-y-6 relative">
            <!-- Step 1: Submitted -->
            <div class="flex items-start gap-4">
              <div class="relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-brand-primary text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 class="font-bold text-text-primary">Order Submitted</h3>
                <p class="text-sm text-text-secondary">{{ formatDateTime(orderData.order.createdAt) }}</p>
              </div>
            </div>

            <!-- Step 2: In Review -->
            <div class="flex items-start gap-4">
              <div 
                :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  orderData.order.status !== 'pending' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500'
                ]"
              >
                <svg v-if="orderData.order.status !== 'pending'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 :class="['font-bold', orderData.order.status !== 'pending' ? 'text-text-primary' : 'text-text-tertiary']">Quote Prepared</h3>
                <p class="text-sm text-text-secondary">
                  <span v-if="orderData.order.status === 'pending'">We're reviewing your request...</span>
                  <span v-else>Quote sent</span>
                </p>
              </div>
            </div>

            <!-- Step 3: In Progress -->
            <div class="flex items-start gap-4">
              <div 
                :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  orderData.order.status === 'in_progress' || orderData.order.status === 'ready' || orderData.order.status === 'completed' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500'
                ]"
              >
                <svg v-if="orderData.order.status === 'in_progress' || orderData.order.status === 'ready' || orderData.order.status === 'completed'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 :class="['font-bold', orderData.order.status === 'in_progress' || orderData.order.status === 'ready' || orderData.order.status === 'completed' ? 'text-text-primary' : 'text-text-tertiary']">In Production</h3>
                <p class="text-sm text-text-secondary">
                  <span v-if="orderData.order.status === 'in_progress'">We're preparing your order...</span>
                  <span v-else-if="orderData.order.status === 'ready' || orderData.order.status === 'completed'">Production complete</span>
                  <span v-else>Awaiting payment</span>
                </p>
              </div>
            </div>

            <!-- Step 4: Ready/Delivered -->
            <div class="flex items-start gap-4">
              <div 
                :class="[
                  'relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  orderData.order.status === 'ready' || orderData.order.status === 'completed' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'
                ]"
              >
                <svg v-if="orderData.order.status === 'ready' || orderData.order.status === 'completed'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div class="flex-1 pt-2">
                <h3 :class="['font-bold', orderData.order.status === 'ready' || orderData.order.status === 'completed' ? 'text-text-primary' : 'text-text-tertiary']">Ready for Download</h3>
                <p class="text-sm text-text-secondary">
                  <span v-if="orderData.order.status === 'ready' || orderData.order.status === 'completed'">Your files are ready!</span>
                  <span v-else>Files will be available here</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Information -->
      <div class="bg-white border border-brand-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-text-primary mb-4">Order Information</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-text-tertiary mb-1">Customer Name</p>
            <p class="text-text-primary font-medium">{{ orderData.order.name }}</p>
          </div>
          <div>
            <p class="text-sm text-text-tertiary mb-1">Email</p>
            <p class="text-text-primary font-medium">{{ orderData.order.emailSnapshot }}</p>
          </div>
          <div v-if="orderData.order.packageId">
            <p class="text-sm text-text-tertiary mb-1">Package</p>
            <p class="text-text-primary font-medium">{{ getPackageName(orderData.order.packageId) }}</p>
          </div>
          <div>
            <p class="text-sm text-text-tertiary mb-1">Submitted</p>
            <p class="text-text-primary font-medium">{{ formatDate(orderData.order.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Customer Notes -->
      <div v-if="orderData.order.notes" class="bg-white border border-brand-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-text-primary mb-4">Your Notes</h2>
        <p class="text-text-secondary whitespace-pre-wrap">{{ orderData.order.notes }}</p>
      </div>

      <!-- Admin Notes (if quoted) -->
      <div v-if="orderData.order.adminNotes" class="bg-brand-primary/5 border border-brand-primary/50 rounded-lg p-6">
        <h2 class="text-2xl font-bold text-text-primary mb-4">Quote Notes</h2>
        <p class="text-text-secondary whitespace-pre-wrap">{{ orderData.order.adminNotes }}</p>
      </div>

      <!-- Payment Section -->
      <div v-if="orderData.order.quotedAmount && !orderData.payment" class="bg-brand-primary/5 border border-brand-primary/50 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <svg class="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-text-primary mb-2">Payment Required</h3>
            <p class="text-text-secondary mb-4">Your quote is ready. Complete payment to proceed with your order.</p>
            <button
              @click="handlePayment"
              :disabled="paymentLoading"
              class="px-8 py-3 bg-brand-primary hover:bg-brand-primary-600 text-white font-bold rounded-md shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="!paymentLoading">Pay Now - {{ formatPrice(orderData.order.quotedAmount) }}</span>
              <span v-else class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Payment Status -->
      <div v-if="orderData.payment" class="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <svg class="h-6 w-6 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-xl font-bold text-text-primary mb-2">Payment Received</h3>
            <p class="text-text-secondary">Amount: {{ formatPrice(orderData.payment.amount) }}</p>
            <p class="text-text-tertiary text-sm">Paid on {{ formatDateTime(orderData.payment.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Files Section -->
      <div class="bg-white border border-brand-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-text-primary mb-4">Files</h2>
        
        <!-- Uploaded Files -->
        <div v-if="uploadedFiles.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-text-primary mb-3">Your Uploads</h3>
          <div class="space-y-2">
            <div
              v-for="file in uploadedFiles"
              :key="file.id"
              class="flex items-center justify-between p-3 bg-slate-50 border border-brand-border rounded-md"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <svg class="h-5 w-5 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-text-primary text-sm truncate">{{ file.filename }}</p>
                  <p class="text-text-tertiary text-xs">{{ formatFileSize(file.fileSize) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Deliverable Files -->
        <div v-if="deliverableFiles.length > 0">
          <h3 class="text-lg font-semibold text-text-primary mb-3">Deliverables</h3>
          <div class="space-y-2">
            <div
              v-for="file in deliverableFiles"
              :key="file.id"
              class="flex items-center justify-between p-3 bg-slate-50 border border-brand-border rounded-md hover:border-brand-primary transition-colors"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <svg class="h-5 w-5 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-text-primary text-sm truncate">{{ file.filename }}</p>
                  <p class="text-text-tertiary text-xs">{{ formatFileSize(file.fileSize) }}</p>
                </div>
              </div>
              <button
                @click="downloadFile(file.id, file.filename)"
                class="ml-2 px-4 py-2 bg-brand-primary text-white hover:bg-brand-primary-600 rounded-md transition-colors flex items-center gap-2 font-medium"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>

        <!-- No Files -->
        <div v-if="uploadedFiles.length === 0 && deliverableFiles.length === 0" class="text-center py-8 text-text-tertiary">
          <p>No files attached to this order</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js'

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
const paymentLoading = ref(false)

const uploadedFiles = computed(() => {
  return orderData.value?.files?.filter((f: any) => f.kind === 'upload') || []
})

const deliverableFiles = computed(() => {
  return orderData.value?.files?.filter((f: any) => f.kind === 'deliverable') || []
})

const fetchOrder = async () => {
  await ordersStore.fetchOrderById(orderId.value)
  if (ordersStore.error) {
    showError('Failed to load order details')
  }
}

const handlePayment = async () => {
  if (!orderData.value?.order?.quotedAmount) return
  
  try {
    paymentLoading.value = true
    
    // Create Stripe checkout session
    const { url } = await trpc.payments.createCheckout.mutate({
      orderId: orderId.value
    })
    
    // Redirect to Stripe checkout
    window.location.href = url
  } catch (err: any) {
    // Error logged: 'Payment error:', err)
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(`Failed to initiate payment: ${handleTrpcError(err)}`)
  } finally {
    paymentLoading.value = false
  }
}

const getProgressHeight = (status: string) => {
  switch (status) {
    case 'pending':
      return '0%'
    case 'in_progress':
      return '33%'
    case 'ready':
      return '66%'
    case 'completed':
      return '100%'
    default:
      return '0%'
  }
}

const downloadFile = async (fileId: number, filename: string) => {
  try {
    const { url } = await trpc.files.getDownloadUrl.query({ fileId })
    
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  } catch (err: any) {
    // Error logged: 'Download error:', err)
    showError(`Failed to download file: ${handleTrpcError(err)}`)
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

