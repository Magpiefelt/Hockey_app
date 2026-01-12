<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Emails</h1>
      <p class="text-slate-400">Monitor email delivery and manage communications</p>
    </div>

    <!-- Stats Summary -->
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="mdi:email-multiple" class="w-6 h-6 text-cyan-400" />
          </div>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
        </div>
        <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ stats.total }}</p>
        <p class="text-sm text-slate-400">Emails</p>
      </div>

      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="mdi:check-circle" class="w-6 h-6 text-emerald-400" />
          </div>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Sent</span>
        </div>
        <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ stats.sent }}</p>
        <p class="text-sm text-slate-400">Delivered</p>
      </div>

      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400" />
          </div>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Failed</span>
        </div>
        <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ stats.failed }}</p>
        <p class="text-sm text-slate-400">Errors</p>
      </div>

      <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6 hover:border-slate-700 transition-all group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="mdi:chart-line" class="w-6 h-6 text-blue-400" />
          </div>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Rate</span>
        </div>
        <p class="text-2xl lg:text-3xl font-bold text-white mb-1">{{ stats.successRate }}%</p>
        <p class="text-sm text-slate-400">Success Rate</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mb-6">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Status Filter -->
        <div>
          <label for="status-filter" class="block text-sm font-medium text-slate-400 mb-2">
            Status
          </label>
          <select
            id="status-filter"
            v-model="filters.status"
            @change="fetchEmails"
            class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>

        <!-- Template Filter -->
        <div>
          <label for="template-filter" class="block text-sm font-medium text-slate-400 mb-2">
            Template
          </label>
          <select
            id="template-filter"
            v-model="filters.template"
            @change="fetchEmails"
            class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">All Templates</option>
              <option value="order_confirmation">Order Confirmation</option>
              <option value="quote">Quote</option>
              <option value="invoice">Invoice</option>
              <option value="payment_receipt">Payment Receipt</option>
              <option value="custom">Custom</option>
          </select>
        </div>

        <!-- Search -->
        <div class="lg:col-span-2">
          <label for="search" class="block text-sm font-medium text-slate-400 mb-2">
            Search
          </label>
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              id="search"
              v-model="filters.search"
              @input="debouncedSearch"
              type="text"
              placeholder="Search by email or subject..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Active Filters -->
      <div v-if="hasActiveFilters" class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
        <span class="text-sm text-slate-400">Active filters:</span>
        <button
          v-if="filters.status !== 'all'"
          @click="clearFilter('status')"
          class="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full flex items-center gap-1 hover:bg-cyan-500/30 transition-colors"
        >
          Status: {{ filters.status }}
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
        <button
          v-if="filters.template"
          @click="clearFilter('template')"
          class="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full flex items-center gap-1 hover:bg-cyan-500/30 transition-colors"
        >
          Template: {{ filters.template }}
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
        <button
          v-if="filters.search"
          @click="clearFilter('search')"
          class="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full flex items-center gap-1 hover:bg-cyan-500/30 transition-colors"
        >
          Search: "{{ filters.search }}"
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
        <button
          @click="clearAllFilters"
          class="ml-auto px-3 py-1 text-slate-400 text-sm hover:text-white transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading emails...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button
        @click="fetchEmails"
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Email Logs Table -->
    <div v-else class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-800/30">
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">ID</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Recipient</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Subject</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Template</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Status</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Date</th>
              <th class="text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="emails.length === 0">
              <td colspan="7" class="py-16 text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Icon name="mdi:email-off" class="w-8 h-8 text-slate-600" />
                </div>
                <p class="text-slate-400 mb-1">No emails found</p>
                <p class="text-sm text-slate-500">Try adjusting your filters</p>
              </td>
            </tr>
            <tr
              v-for="email in emails"
              :key="email.id"
              class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
            >
              <td class="py-4 px-6 text-white font-mono text-sm">#{{ email.id }}</td>
              <td class="py-4 px-6">
                <div>
                  <p class="text-white font-medium">{{ email.toEmail }}</p>
                  <p v-if="email.contactName" class="text-slate-400 text-sm">{{ email.contactName }}</p>
                </div>
              </td>
              <td class="py-4 px-6 text-slate-300 max-w-xs truncate">{{ email.subject }}</td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">
                  <Icon :name="getTemplateIcon(email.template)" class="w-3 h-3" />
                  {{ formatTemplate(email.template) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg',
                    getStatusClass(email.status)
                  ]"
                >
                  <Icon :name="getStatusIcon(email.status)" class="w-3 h-3" />
                  {{ email.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-slate-400 text-sm">
                {{ formatDate(email.createdAt) }}
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="viewEmail(email)"
                    class="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="View details"
                  >
                    <Icon name="mdi:eye" class="w-4 h-4" />
                  </button>
                  <button
                    v-if="email.status === 'failed'"
                    @click="resendEmail(email)"
                    :disabled="resending === email.id"
                    class="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Resend email"
                  >
                    <Icon :name="resending === email.id ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': resending === email.id }" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalEmails > pageSize" class="flex items-center justify-between px-6 py-4 border-t border-slate-800">
        <div class="text-slate-400 text-sm">
          Showing <span class="font-medium text-white">{{ (currentPage - 1) * pageSize + 1 }}</span> to <span class="font-medium text-white">{{ Math.min(currentPage * pageSize, totalEmails) }}</span> of <span class="font-medium text-white">{{ totalEmails }}</span> emails
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg transition-all text-sm font-medium flex items-center gap-1"
          >
            <Icon name="mdi:chevron-left" class="w-4 h-4" />
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg transition-all text-sm font-medium flex items-center gap-1"
          >
            Next
            <Icon name="mdi:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Email Detail Modal -->
    <EmailDetailModal
      v-if="selectedEmail"
      v-model="showDetailModal"
      :email="selectedEmail"
      @resend="handleResend"
    />

    <!-- Resend Confirmation Dialog -->
    <UiConfirmDialog
      :is-open="showResendConfirm"
      title="Resend Email"
      :message="`Are you sure you want to resend this email to ${emailToResend?.toEmail || 'the recipient'}?`"
      type="info"
      confirm-text="Resend"
      cancel-text="Cancel"
      @confirm="confirmResend"
      @cancel="cancelResend"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const trpc = useTrpc()
const { formatDate } = useUtils()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const emails = ref<any[]>([])
const stats = ref<any>(null)
const totalEmails = ref(0)
const currentPage = ref(1)
const pageSize = 50
const resending = ref<number | null>(null)
const selectedEmail = ref<any>(null)
const showDetailModal = ref(false)
const showResendConfirm = ref(false)
const emailToResend = ref<any>(null)

const { showSuccess, showError } = useNotification()

// Filters
const filters = ref({
  status: 'all',
  template: '',
  search: ''
})

// Computed
const totalPages = computed(() => Math.ceil(totalEmails.value / pageSize))
const hasActiveFilters = computed(() => {
  return filters.value.status !== 'all' || filters.value.template !== '' || filters.value.search !== ''
})

// Fetch emails
async function fetchEmails() {
  loading.value = true
  error.value = null

  try {
    const result = await trpc.admin.emails.list.query({
      status: filters.value.status as any,
      template: filters.value.template || undefined,
      search: filters.value.search || undefined,
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize
    })

    emails.value = result.emails
    totalEmails.value = result.total
  } catch (err: any) {
    // Error logged: 'Failed to fetch emails:', err)
    error.value = err.message || 'Failed to load emails'
  } finally {
    loading.value = false
  }
}

// Fetch stats
async function fetchStats() {
  try {
    stats.value = await trpc.admin.emails.stats.query()
  } catch (err: any) {
    // Error logged: 'Failed to fetch email stats:', err)
  }
}

// Debounced search
let searchTimeout: NodeJS.Timeout
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchEmails()
  }, 300)
}

// Clear filter
function clearFilter(key: 'status' | 'template' | 'search') {
  if (key === 'status') filters.value.status = 'all'
  else if (key === 'template') filters.value.template = ''
  else if (key === 'search') filters.value.search = ''
  
  currentPage.value = 1
  fetchEmails()
}

// Clear all filters
function clearAllFilters() {
  filters.value = {
    status: 'all',
    template: '',
    search: ''
  }
  currentPage.value = 1
  fetchEmails()
}

// Pagination
function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchEmails()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchEmails()
  }
}

// View email
function viewEmail(email: any) {
  selectedEmail.value = email
  showDetailModal.value = true
}

// Resend email - show confirmation dialog
function resendEmail(email: any) {
  emailToResend.value = email
  showResendConfirm.value = true
}

// Handle resend confirmation
async function confirmResend() {
  if (!emailToResend.value) return
  
  const email = emailToResend.value
  showResendConfirm.value = false
  resending.value = email.id

  try {
    await trpc.admin.emails.resend.mutate({ id: email.id })
    
    // Refresh emails and stats
    await Promise.all([fetchEmails(), fetchStats()])
    
    showSuccess('Email resent successfully!')
  } catch (err: any) {
    showError(`Failed to resend email: ${err.message}`)
  } finally {
    resending.value = null
    emailToResend.value = null
  }
}

// Cancel resend
function cancelResend() {
  showResendConfirm.value = false
  emailToResend.value = null
}

// Handle resend from modal
function handleResend(emailId: number) {
  const email = emails.value.find(e => e.id === emailId)
  if (email) {
    showDetailModal.value = false
    resendEmail(email)
  }
}

// Helpers
function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    sent: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    queued: 'bg-yellow-500/20 text-yellow-400'
  }
  return classes[status] || 'bg-slate-500/20 text-slate-400'
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    sent: 'mdi:check-circle',
    failed: 'mdi:alert-circle',
    queued: 'mdi:clock-outline'
  }
  return icons[status] || 'mdi:email'
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
    custom: 'Custom'
  }
  return names[template] || template
}

// Lifecycle
onMounted(() => {
  Promise.all([fetchEmails(), fetchStats()])
})

useHead({
  title: 'Email Management - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Manage email communications and view email logs' }
  ]
})
</script>

<style scoped>
.gradient-text {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
