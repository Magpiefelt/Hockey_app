<template>
  <div class="max-w-7xl mx-auto">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-sm mb-6">
      <NuxtLink to="/admin" class="text-slate-400 hover:text-white transition-colors">
        Dashboard
      </NuxtLink>
      <Icon name="mdi:chevron-right" class="w-4 h-4 text-slate-600" />
      <NuxtLink to="/admin/orders" class="text-slate-400 hover:text-white transition-colors">
        Orders
      </NuxtLink>
      <Icon name="mdi:chevron-right" class="w-4 h-4 text-slate-600" />
      <span class="text-white font-medium">Order #{{ orderId }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading order details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button 
        @click="fetchOrder"
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Order Details -->
    <div v-else-if="orderData" class="space-y-6">
      <!-- Header Card -->
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
              <span class="text-lg font-bold text-slate-400">#{{ orderData.order.id }}</span>
            </div>
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ orderData.order.name }}</h1>
              <p class="text-slate-400">{{ orderData.order.emailSnapshot }}</p>
              <p class="text-sm text-slate-500 mt-1">Created {{ formatDateTime(orderData.order.createdAt) }}</p>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-3">
            <button
              v-if="canSubmitQuote"
              @click="showEnhancedQuoteModal = true"
              class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Icon name="mdi:currency-usd" class="w-5 h-5" />
              {{ orderData.order.quotedAmount ? 'Revise Quote' : 'Submit Quote' }}
            </button>
            
            <button
              @click="showCustomerDrawer = true"
              class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium flex items-center gap-2"
            >
              <Icon name="mdi:account" class="w-4 h-4" />
              View Customer
            </button>
          </div>
        </div>
        
        <!-- Status Changer -->
        <div class="mt-6 pt-6 border-t border-slate-800">
          <OrderStatusChanger
            :order-id="orderData.order.id"
            :current-status="orderData.order.status"
            @status-changed="handleStatusChanged"
          />
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left Column - Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer & Order Info -->
          <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="mdi:account-circle" class="w-6 h-6 text-cyan-400" />
                Customer Information
              </h2>
              <button
                @click="showCustomerDrawer = true"
                class="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors flex items-center gap-1"
              >
                View Full Profile
                <Icon name="mdi:arrow-right" class="w-4 h-4" />
              </button>
            </div>
            <div class="grid sm:grid-cols-2 gap-6">
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
                    getStatusClasses(orderData.order.status)
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

          <!-- Quote Management -->
          <div class="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="mdi:receipt-text" class="w-6 h-6 text-cyan-400" />
                Quote Management
              </h2>
              <div class="flex items-center gap-2">
                <span 
                  v-if="orderData.order.quotedAmount"
                  class="text-2xl font-bold text-cyan-400"
                >
                  {{ formatPrice(orderData.order.quotedAmount) }}
                </span>
                <span v-else class="text-slate-400">Not quoted yet</span>
              </div>
            </div>
            
            <!-- Quote Status Indicators -->
            <div v-if="orderData.order.quotedAmount" class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Version</p>
                <p class="text-xl font-bold text-white">v{{ orderData.order.currentQuoteVersion || 1 }}</p>
              </div>
              <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Viewed</p>
                <div class="flex items-center justify-center">
                  <Icon 
                    :name="orderData.order.quoteViewedAt ? 'mdi:check-circle' : 'mdi:clock-outline'" 
                    :class="orderData.order.quoteViewedAt ? 'w-6 h-6 text-emerald-400' : 'w-6 h-6 text-slate-500'" 
                  />
                </div>
              </div>
              <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Accepted</p>
                <div class="flex items-center justify-center">
                  <Icon 
                    :name="orderData.order.quoteAcceptedAt ? 'mdi:check-circle' : 'mdi:clock-outline'" 
                    :class="orderData.order.quoteAcceptedAt ? 'w-6 h-6 text-emerald-400' : 'w-6 h-6 text-slate-500'" 
                  />
                </div>
              </div>
            </div>
            
            <!-- Quote Actions -->
            <div class="flex flex-wrap gap-3">
              <button
                v-if="!orderData.order.quotedAmount"
                @click="showEnhancedQuoteModal = true"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Icon name="mdi:send" class="w-5 h-5" />
                Submit Quote
              </button>
              <template v-else>
                <button
                  @click="showRevisionModal = true"
                  class="flex-1 px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="mdi:pencil" class="w-5 h-5" />
                  Revise Quote
                </button>
                <button
                  @click="resendQuoteEmail"
                  :disabled="resendingEmail"
                  class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Icon :name="resendingEmail ? 'mdi:loading' : 'mdi:email-fast'" :class="resendingEmail ? 'w-5 h-5 animate-spin' : 'w-5 h-5'" />
                  {{ resendingEmail ? 'Sending...' : 'Resend Email' }}
                </button>
              </template>
            </div>
          </div>

          <!-- Customer Notes -->
          <div v-if="orderData.order.notes" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="mdi:note-text" class="w-6 h-6 text-purple-400" />
              Customer Notes
            </h2>
            <p class="text-slate-300 whitespace-pre-wrap leading-relaxed">{{ orderData.order.notes }}</p>
          </div>

          <!-- Form Submission Details -->
          <div v-if="orderData.order.formData" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Icon name="mdi:form-select" class="w-6 h-6 text-blue-400" />
              Form Details
            </h2>
            <div class="space-y-6">
              <div v-if="orderData.order.formData.teamName" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Team Information</h3>
                <p class="text-white">{{ orderData.order.formData.teamName }}</p>
              </div>
              
              <div v-if="orderData.order.formData.rosterPlayers" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Roster</h3>
                <p class="text-slate-400 text-sm mb-2">Method: {{ orderData.order.formData.rosterMethod || 'Manual' }}</p>
                <ul v-if="Array.isArray(orderData.order.formData.rosterPlayers)" class="grid sm:grid-cols-2 gap-2">
                  <li v-for="(player, idx) in orderData.order.formData.rosterPlayers" :key="idx" class="text-white bg-slate-800/50 px-3 py-2 rounded-lg text-sm">
                    {{ player }}
                  </li>
                </ul>
              </div>
              
              <div v-if="orderData.order.formData.introSong" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Intro Song</h3>
                <p class="text-white">{{ formatSongInfo(orderData.order.formData.introSong) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.warmupSongs" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Warmup Songs</h3>
                <p class="text-white">{{ formatSongInfo(orderData.order.formData.warmupSongs) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.goalHorn" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Goal Horn</h3>
                <p class="text-white">{{ formatSongInfo(orderData.order.formData.goalHorn) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.goalSong" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Goal Song</h3>
                <p class="text-white">{{ formatSongInfo(orderData.order.formData.goalSong) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.winSong" class="pb-4 border-b border-slate-800">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Win Song</h3>
                <p class="text-white">{{ formatSongInfo(orderData.order.formData.winSong) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.sponsors">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Sponsors</h3>
                <p class="text-white">{{ formatSongInfo(orderData.order.formData.sponsors) }}</p>
              </div>
              
              <div v-if="orderData.order.formData.includeSample" class="flex items-center gap-2 text-emerald-400">
                <Icon name="mdi:check-circle" class="w-5 h-5" />
                <span class="font-medium">Sample Requested</span>
              </div>
            </div>
          </div>

          <!-- Payment Status -->
          <div v-if="orderData.payment" class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="mdi:check-decagram" class="w-6 h-6 text-emerald-400" />
              Payment Received
            </h2>
            <div class="grid sm:grid-cols-3 gap-6">
              <div>
                <p class="text-sm text-slate-400 mb-1">Amount</p>
                <p class="text-white font-semibold text-lg">{{ formatPrice(orderData.payment.amount) }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Stripe Payment ID</p>
                <p class="text-white font-mono text-sm truncate">{{ orderData.payment.stripePaymentId }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-400 mb-1">Date</p>
                <p class="text-white font-medium">{{ formatDateTime(orderData.payment.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- File Upload for Deliverables -->
          <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="mdi:cloud-upload" class="w-6 h-6 text-cyan-400" />
              Upload Deliverables
            </h2>
            <div class="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 text-center transition-colors mb-4">
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
                class="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-colors font-medium"
              >
                <Icon name="mdi:upload" class="w-5 h-5" />
                Choose Files to Upload
              </button>
              <p class="text-slate-500 text-sm mt-3">Upload completed work for the customer</p>
            </div>

            <!-- Deliverable Upload Queue -->
            <div v-if="deliverableQueue.length > 0" class="space-y-2 mb-4">
              <div
                v-for="(file, index) in deliverableQueue"
                :key="index"
                class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div v-if="file.uploading" class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                  <Icon v-else-if="file.uploaded" name="mdi:check-circle" class="w-5 h-5 text-emerald-400" />
                  <Icon v-else name="mdi:file-document" class="w-5 h-5 text-slate-400" />
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm truncate">{{ file.file.name }}</p>
                    <p class="text-slate-500 text-xs">{{ formatFileSize(file.file.size) }}</p>
                  </div>
                </div>
                <button
                  v-if="!file.uploading && !file.uploaded"
                  type="button"
                  @click="removeDeliverable(index)"
                  class="ml-2 p-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Icon name="mdi:close" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              v-if="deliverableQueue.length > 0 && !deliverableQueue.some(f => f.uploading)"
              @click="uploadDeliverables"
              class="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
            >
              Upload All Deliverables
            </button>
          </div>

          <!-- Files List -->
          <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="mdi:folder-open" class="w-6 h-6 text-amber-400" />
              Files
            </h2>
            
            <!-- Customer Uploads -->
            <div v-if="uploadedFiles.length > 0" class="mb-6">
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Customer Uploads</h3>
              <div class="space-y-2">
                <div
                  v-for="file in uploadedFiles"
                  :key="file.id"
                  class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <Icon name="mdi:file-document" class="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-sm truncate">{{ file.filename }}</p>
                      <p class="text-slate-500 text-xs">{{ formatFileSize(file.fileSize) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Deliverables -->
            <div v-if="deliverableFiles.length > 0">
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Deliverables</h3>
              <div class="space-y-2">
                <div
                  v-for="file in deliverableFiles"
                  :key="file.id"
                  class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <Icon name="mdi:file-check" class="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-sm truncate">{{ file.filename }}</p>
                      <p class="text-slate-500 text-xs">{{ formatFileSize(file.fileSize) }} • {{ formatDateTime(file.createdAt) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Files -->
            <div v-if="uploadedFiles.length === 0 && deliverableFiles.length === 0" class="text-center py-8">
              <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Icon name="mdi:file-hidden" class="w-6 h-6 text-slate-600" />
              </div>
              <p class="text-slate-400">No files attached to this order</p>
            </div>
          </div>
        </div>

        <!-- Right Column - Sidebar -->
        <div class="space-y-6">
          <!-- Email History -->
          <AdminOrderEmailHistory :order-id="orderId" />
          
          <!-- Status History -->
          <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="mdi:history" class="w-5 h-5 text-purple-400" />
              Status History
            </h3>
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

const getStatusClasses = (status: string) => {
  const classes: Record<string, string> = {
    submitted: 'bg-amber-500/20 text-amber-400',
    pending: 'bg-amber-500/20 text-amber-400',
    quoted: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    paid: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    ready: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400',
    refunded: 'bg-red-500/20 text-red-400'
  }
  return classes[status] || 'bg-slate-500/20 text-slate-400'
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
