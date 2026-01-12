<template>
  <div class="px-6 py-8 max-w-6xl">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-sm mb-6">
      <NuxtLink to="/admin" class="text-slate-400 hover:text-white transition-colors">
        Dashboard
      </NuxtLink>
      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <NuxtLink to="/admin/orders" class="text-slate-400 hover:text-white transition-colors">
        Orders
      </NuxtLink>
      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="text-white font-medium">Order #{{ orderId }}</span>
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
      <!-- Header with Quick Actions -->
      <div class="bg-dark-secondary border border-white/10 rounded-lg p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Order #{{ orderData.order.id }}</h1>
            <p class="text-slate-400">{{ formatDateTime(orderData.order.createdAt) }}</p>
          </div>
          
          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-3">
            <button
              v-if="canSubmitQuote"
              @click="showEnhancedQuoteModal = true"
              class="px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-lg hover:from-brand-600 hover:to-accent-600 transition-all shadow-lg"
            >
              {{ orderData.order.quotedAmount ? 'Revise Quote' : 'Submit Quote' }}
            </button>
            
            <button
              @click="showCustomerDrawer = true"
              class="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              View Customer
            </button>
          </div>
        </div>
        
        <!-- Status Changer -->
        <OrderStatusChanger
          :order-id="orderData.order.id"
          :current-status="orderData.order.status"
          @status-changed="handleStatusChanged"
        />
      </div>

      <!-- Two Column Layout for Key Info -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left Column - Customer & Order Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Information -->
          <div class="bg-dark-secondary border border-white/10 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-white">Customer Information</h2>
              <button
                @click="showCustomerDrawer = true"
                class="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
              >
                View Full Profile →
              </button>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-slate-400 mb-1">Name</p>
                <p class="text-white font-medium">{{ orderData.order.name }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Email</p>
                <p class="text-white font-medium">{{ orderData.order.emailSnapshot }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Package</p>
                <p class="text-white font-medium">
                  {{ orderData.order.serviceType || (orderData.order.packageId ? getPackageName(orderData.order.packageId) : 'Custom') }}
                </p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Status</p>
                <span 
                  :class="[
                    'inline-block px-3 py-1 text-xs font-semibold rounded-full',
                    getStatusColor(orderData.order.status),
                    'text-white'
                  ]"
                >
                  {{ getStatusLabel(orderData.order.status) }}
                </span>
              </div>
              <div v-if="orderData.order.eventDate">
                <p class="text-sm text-slate-400 mb-1">Event Date</p>
                <p class="text-white font-medium">{{ formatDate(orderData.order.eventDate) }}</p>
              </div>
              <div v-if="orderData.order.formData?.teamName">
                <p class="text-sm text-slate-400 mb-1">Team Name</p>
                <p class="text-white font-medium">{{ orderData.order.formData.teamName }}</p>
              </div>
            </div>
          </div>

          <!-- Quote Section - Enhanced -->
          <div class="bg-gradient-to-br from-[#5BA3D0]/10 to-[#4A90BA]/10 border border-brand-primary/50 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-white">Quote Management</h2>
              <div class="flex items-center gap-2">
                <span 
                  v-if="orderData.order.quotedAmount"
                  class="text-2xl font-bold text-brand-400"
                >
                  {{ formatPrice(orderData.order.quotedAmount) }}
                </span>
                <span v-else class="text-slate-400">Not quoted yet</span>
              </div>
            </div>
            
            <!-- Quote Status Indicators -->
            <div v-if="orderData.order.quotedAmount" class="grid grid-cols-3 gap-4 mb-4">
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <p class="text-xs text-slate-400 mb-1">Version</p>
                <p class="text-lg font-bold text-white">v{{ orderData.order.currentQuoteVersion || 1 }}</p>
              </div>
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <p class="text-xs text-slate-400 mb-1">Viewed</p>
                <p class="text-lg font-bold" :class="orderData.order.quoteViewedAt ? 'text-green-400' : 'text-slate-500'">
                  {{ orderData.order.quoteViewedAt ? '✓' : '—' }}
                </p>
              </div>
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <p class="text-xs text-slate-400 mb-1">Accepted</p>
                <p class="text-lg font-bold" :class="orderData.order.quoteAcceptedAt ? 'text-green-400' : 'text-slate-500'">
                  {{ orderData.order.quoteAcceptedAt ? '✓' : '—' }}
                </p>
              </div>
            </div>
            
            <!-- Quote Actions -->
            <div class="flex gap-3">
              <button
                v-if="!orderData.order.quotedAmount"
                @click="showEnhancedQuoteModal = true"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-bold rounded-lg hover:from-brand-600 hover:to-accent-600 transition-all"
              >
                Submit Quote
              </button>
              <template v-else>
                <button
                  @click="showRevisionModal = true"
                  class="flex-1 px-6 py-3 bg-amber-500/20 text-amber-400 font-semibold rounded-lg hover:bg-amber-500/30 transition-colors"
                >
                  Revise Quote
                </button>
                <button
                  @click="resendQuoteEmail"
                  :disabled="resendingEmail"
                  class="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {{ resendingEmail ? 'Sending...' : 'Resend Email' }}
                </button>
              </template>
            </div>
          </div>

          <!-- Customer Notes -->
          <div v-if="orderData.order.notes" class="bg-dark-secondary border border-white/10 rounded-lg p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Customer Notes</h2>
            <p class="text-slate-200 whitespace-pre-wrap">{{ orderData.order.notes }}</p>
          </div>

          <!-- Form Submission Details -->
          <div v-if="orderData.order.formData" class="bg-dark-secondary border border-white/10 rounded-lg p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Form Details</h2>
            <div class="space-y-4">
              <div v-if="orderData.order.formData.teamName">
                <h3 class="text-lg font-semibold text-white mb-2">Team Information</h3>
                <p class="text-slate-200"><strong>Team Name:</strong> {{ orderData.order.formData.teamName }}</p>
              </div>
              
              <div v-if="orderData.order.formData.rosterPlayers">
                <h3 class="text-lg font-semibold text-white mb-2">Roster</h3>
                <p class="text-slate-200 mb-2"><strong>Method:</strong> {{ orderData.order.formData.rosterMethod || 'Manual' }}</p>
                <ul v-if="Array.isArray(orderData.order.formData.rosterPlayers)" class="list-disc list-inside text-slate-200">
                  <li v-for="(player, idx) in orderData.order.formData.rosterPlayers" :key="idx">{{ player }}</li>
                </ul>
              </div>
              
              <div v-if="orderData.order.formData.introSong">
                <h3 class="text-lg font-semibold text-white mb-2">Intro Song</h3>
                <p class="text-slate-200">{{ formatSongInfo(orderData.order.formData.introSong) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.warmupSongs">
                <h3 class="text-lg font-semibold text-white mb-2">Warmup Songs</h3>
                <p class="text-slate-200">{{ formatSongInfo(orderData.order.formData.warmupSongs) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.goalHorn">
                <h3 class="text-lg font-semibold text-white mb-2">Goal Horn</h3>
                <p class="text-slate-200">{{ formatSongInfo(orderData.order.formData.goalHorn) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.goalSong">
                <h3 class="text-lg font-semibold text-white mb-2">Goal Song</h3>
                <p class="text-slate-200">{{ formatSongInfo(orderData.order.formData.goalSong) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.winSong">
                <h3 class="text-lg font-semibold text-white mb-2">Win Song</h3>
                <p class="text-slate-200">{{ formatSongInfo(orderData.order.formData.winSong) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.sponsors">
                <h3 class="text-lg font-semibold text-white mb-2">Sponsors</h3>
                <p class="text-slate-200">{{ formatSongInfo(orderData.order.formData.sponsors) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.includeSample">
                <p class="text-slate-200"><strong>Sample Requested:</strong> Yes</p>
              </div>
            </div>
          </div>

          <!-- Payment Status -->
          <div v-if="orderData.payment" class="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Payment Received</h2>
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <p class="text-sm text-slate-400 mb-1">Amount</p>
                <p class="text-white font-medium">{{ formatPrice(orderData.payment.amount) }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Stripe Payment ID</p>
                <p class="text-white font-medium text-sm">{{ orderData.payment.stripePaymentId }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Date</p>
                <p class="text-white font-medium">{{ formatDateTime(orderData.payment.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- File Upload for Deliverables -->
          <div class="bg-dark-secondary border border-white/10 rounded-lg p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Upload Deliverables</h2>
            <div class="border-2 border-dashed border-white/10 rounded-md p-6 text-center hover:border-brand-primary transition-colors mb-4">
              <input
                ref="deliverableInputRef"
                type="file"
                multiple
                class="hidden"
                @change="handleDeliverableSelect"
              />
              <button
                type="button"
                @click="deliverableInputRef?.click()"
                class="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary rounded-md transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose Files to Upload
              </button>
              <p class="text-slate-400 text-sm mt-2">Upload completed work for the customer</p>
            </div>

            <!-- Deliverable Upload Queue -->
            <div v-if="deliverableQueue.length > 0" class="space-y-2 mb-4">
              <div
                v-for="(file, index) in deliverableQueue"
                :key="index"
                class="flex items-center justify-between p-3 bg-dark-tertiary border border-white/10 rounded-md"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div v-if="file.uploading" class="animate-spin h-5 w-5 text-brand-primary">
                    <svg fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <svg v-else-if="file.uploaded" class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm truncate">{{ file.file.name }}</p>
                    <p class="text-slate-400 text-xs">{{ formatFileSize(file.file.size) }}</p>
                  </div>
                </div>
                <button
                  v-if="!file.uploading && !file.uploaded"
                  type="button"
                  @click="removeDeliverable(index)"
                  class="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              v-if="deliverableQueue.length > 0 && !deliverableQueue.some(f => f.uploading)"
              @click="uploadDeliverables"
              class="w-full px-6 py-3 bg-brand-primary hover:bg-brand-primary-600 text-white font-semibold rounded-md transition-colors"
            >
              Upload All Deliverables
            </button>
          </div>

          <!-- Files List -->
          <div class="bg-dark-secondary border border-white/10 rounded-lg p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Files</h2>
            
            <!-- Customer Uploads -->
            <div v-if="uploadedFiles.length > 0" class="mb-6">
              <h3 class="text-lg font-semibold text-white mb-3">Customer Uploads</h3>
              <div class="space-y-2">
                <div
                  v-for="file in uploadedFiles"
                  :key="file.id"
                  class="flex items-center justify-between p-3 bg-dark-tertiary border border-white/10 rounded-md"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <svg class="h-5 w-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-sm truncate">{{ file.filename }}</p>
                      <p class="text-slate-400 text-xs">{{ formatFileSize(file.fileSize) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Deliverables -->
            <div v-if="deliverableFiles.length > 0">
              <h3 class="text-lg font-semibold text-white mb-3">Deliverables</h3>
              <div class="space-y-2">
                <div
                  v-for="file in deliverableFiles"
                  :key="file.id"
                  class="flex items-center justify-between p-3 bg-dark-tertiary border border-white/10 rounded-md"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <svg class="h-5 w-5 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-sm truncate">{{ file.filename }}</p>
                      <p class="text-slate-400 text-xs">{{ formatFileSize(file.fileSize) }} • {{ formatDateTime(file.createdAt) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Files -->
            <div v-if="uploadedFiles.length === 0 && deliverableFiles.length === 0" class="text-center py-8 text-slate-400">
              <p>No files attached to this order</p>
            </div>
          </div>
        </div>

        <!-- Right Column - Email History & Status -->
        <div class="space-y-6">
          <!-- Email History -->
          <AdminOrderEmailHistory :order-id="orderId" />
          
          <!-- Status History -->
          <div class="bg-dark-secondary border border-white/10 rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">Status History</h3>
            <OrderStatusHistory :order-id="orderData.order.id" />
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Quote Modal -->
    <AdminEnhancedQuoteModal
      v-if="showEnhancedQuoteModal && orderData"
      :order-id="orderId"
      :customer-name="orderData.order.name"
      :customer-email="orderData.order.emailSnapshot"
      :package-name="orderData.order.serviceType || 'Custom'"
      :event-date="orderData.order.eventDate"
      :team-name="orderData.order.formData?.teamName"
      :sport-type="orderData.order.sportType"
      :current-quote="orderData.order.quotedAmount"
      @close="showEnhancedQuoteModal = false"
      @submitted="handleQuoteSubmitted"
    />

    <!-- Quote Revision Modal -->
    <AdminQuoteRevisionModal
      v-if="showRevisionModal && orderData && orderData.order.quotedAmount"
      :order-id="orderId"
      :customer-name="orderData.order.name"
      :current-amount="orderData.order.quotedAmount"
      :package-name="orderData.order.serviceType || 'Custom'"
      @close="showRevisionModal = false"
      @revised="handleQuoteRevised"
    />

    <!-- Customer Detail Drawer -->
    <AdminCustomerDetailDrawer
      v-if="showCustomerDrawer && orderData"
      :email="orderData.order.emailSnapshot"
      @close="showCustomerDrawer = false"
      @view-order="navigateToOrder"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const route = useRoute()
const router = useRouter()
const trpc = useTrpc()
const { formatPrice, formatDate, formatDateTime, formatFileSize, getStatusColor, getStatusLabel } = useUtils()
const { uploadFile } = useUpload()
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

const formatSongInfo = (songData: any) => {
  if (!songData) return 'N/A'
  if (typeof songData === 'string') return songData
  if (songData.url) return songData.url
  if (songData.title && songData.artist) return `${songData.title} by ${songData.artist}`
  if (songData.title) return songData.title
  return JSON.stringify(songData)
}

// State
const orderData = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const resendingEmail = ref(false)

// Modal states
const showEnhancedQuoteModal = ref(false)
const showRevisionModal = ref(false)
const showCustomerDrawer = ref(false)

// File upload
const deliverableInputRef = ref<HTMLInputElement | null>(null)
const deliverableQueue = ref<any[]>([])

// Computed
const uploadedFiles = computed(() => {
  return orderData.value?.files?.filter((f: any) => f.kind === 'upload') || []
})

const deliverableFiles = computed(() => {
  return orderData.value?.files?.filter((f: any) => f.kind === 'deliverable') || []
})

const canSubmitQuote = computed(() => {
  if (!orderData.value) return false
  const status = orderData.value.order.status
  return ['submitted', 'in_progress'].includes(status)
})

// Methods
const fetchOrder = async () => {
  try {
    loading.value = true
    error.value = null
    orderData.value = await trpc.admin.orders.get.query({ id: orderId.value })
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
  } finally {
    loading.value = false
  }
}

const handleStatusChanged = (newStatus: string) => {
  if (orderData.value) {
    orderData.value.order.status = newStatus
  }
  fetchOrder()
}

const handleQuoteSubmitted = (data: { orderId: number; amount: number; version: number }) => {
  showSuccess(`Quote v${data.version} submitted successfully`)
  fetchOrder()
}

const handleQuoteRevised = (data: { orderId: number; previousAmount: number; newAmount: number; version: number }) => {
  showSuccess(`Quote updated to v${data.version}`)
  fetchOrder()
}

const resendQuoteEmail = async () => {
  resendingEmail.value = true
  try {
    await trpc.adminEnhancements.resendEmailByType.mutate({
      orderId: orderId.value,
      emailType: 'quote'
    })
    showSuccess('Quote email resent successfully')
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(handleTrpcError(err) || 'Failed to resend email')
  } finally {
    resendingEmail.value = false
  }
}

const navigateToOrder = (id: string) => {
  showCustomerDrawer.value = false
  if (id !== orderId.value.toString()) {
    router.push(`/admin/orders/${id}`)
  }
}

const handleDeliverableSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  
  const newFiles = selectedFiles.map(file => ({
    file,
    uploading: false,
    uploaded: false,
  }))
  deliverableQueue.value = [...deliverableQueue.value, ...newFiles]
  
  target.value = ''
}

const removeDeliverable = (index: number) => {
  deliverableQueue.value = deliverableQueue.value.filter((_, i) => i !== index)
}

const uploadDeliverables = async () => {
  for (let i = 0; i < deliverableQueue.value.length; i++) {
    const fileUpload = deliverableQueue.value[i]
    if (fileUpload.uploaded) continue

    deliverableQueue.value[i].uploading = true
    
    try {
      const result = await uploadFile(fileUpload.file, { 
        orderId: orderId.value,
        kind: 'deliverable' 
      })
      
      if (result.fileId) {
        await trpc.orders.attachFile.mutate({
          orderId: orderId.value,
          fileId: result.fileId
        })
      }
      
      deliverableQueue.value[i].uploading = false
      deliverableQueue.value[i].uploaded = true
    } catch (err: any) {
      deliverableQueue.value[i].uploading = false
      const { handleTrpcError } = await import('~/composables/useTrpc')
      showError(`Failed to upload ${fileUpload.file.name}: ${handleTrpcError(err)}`)
      return
    }
  }

  await fetchOrder()
  deliverableQueue.value = []
  showSuccess('All deliverables uploaded successfully')
}

// Fetch order on mount
onMounted(() => {
  fetchOrder()
})

useHead({
  title: () => `Order #${orderId.value} - Admin - Elite Sports DJ`,
  meta: [
    { name: 'description', content: 'Manage order details' }
  ]
})
</script>
