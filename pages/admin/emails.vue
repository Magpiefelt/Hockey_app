<template>
  <div class="min-h-screen px-4 py-12 bg-dark-primary">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Email <span class="gradient-text">Management</span>
        </h1>
        <p class="text-lg text-slate-400">
          Monitor email delivery and manage communications
        </p>
      </div>

      <!-- Stats Summary -->
      <div v-if="stats" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-dark-secondary border border-white/10 rounded-lg p-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-slate-400 text-sm font-medium">Total Emails</p>
            <Icon name="mdi:email-multiple" class="w-6 h-6 text-brand-500" />
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.total }}</p>
        </div>

        <div class="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-slate-400 text-sm font-medium">Sent</p>
            <Icon name="mdi:check-circle" class="w-6 h-6 text-green-400" />
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.sent }}</p>
        </div>

        <div class="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg p-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-slate-400 text-sm font-medium">Failed</p>
            <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400" />
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.failed }}</p>
        </div>

        <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-slate-400 text-sm font-medium">Success Rate</p>
            <Icon name="mdi:chart-line" class="w-6 h-6 text-blue-400" />
          </div>
          <p class="text-3xl font-bold text-white">{{ stats.successRate }}%</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-dark-secondary border border-white/10 rounded-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Status Filter -->
          <div>
            <label for="status-filter" class="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              v-model="filters.status"
              @change="fetchEmails"
              class="w-full px-4 py-2.5 bg-dark-primary border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
          </div>

          <!-- Template Filter -->
          <div>
            <label for="template-filter" class="block text-sm font-medium text-slate-300 mb-2">
              Template
            </label>
            <select
              id="template-filter"
              v-model="filters.template"
              @change="fetchEmails"
              class="w-full px-4 py-2.5 bg-dark-primary border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
          <div class="md:col-span-2">
            <label for="search" class="block text-sm font-medium text-slate-300 mb-2">
              Search
            </label>
            <div class="relative">
              <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="search"
                v-model="filters.search"
                @input="debouncedSearch"
                type="text"
                placeholder="Search by email or subject..."
                class="w-full pl-10 pr-4 py-2.5 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <span class="text-sm text-slate-400">Active filters:</span>
          <button
            v-if="filters.status !== 'all'"
            @click="clearFilter('status')"
            class="px-3 py-1 bg-brand-600/20 text-brand-400 text-sm rounded-full flex items-center gap-1 hover:bg-brand-600/30 transition-colors"
          >
            Status: {{ filters.status }}
            <Icon name="mdi:close" class="w-4 h-4" />
          </button>
          <button
            v-if="filters.template"
            @click="clearFilter('template')"
            class="px-3 py-1 bg-brand-600/20 text-brand-400 text-sm rounded-full flex items-center gap-1 hover:bg-brand-600/30 transition-colors"
          >
            Template: {{ filters.template }}
            <Icon name="mdi:close" class="w-4 h-4" />
          </button>
          <button
            v-if="filters.search"
            @click="clearFilter('search')"
            class="px-3 py-1 bg-brand-600/20 text-brand-400 text-sm rounded-full flex items-center gap-1 hover:bg-brand-600/30 transition-colors"
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
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
        <Icon name="mdi:alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="text-red-400 text-lg mb-4">{{ error }}</p>
        <button
          @click="fetchEmails"
          class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Email Logs Table -->
      <div v-else class="bg-dark-secondary border border-white/10 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">ID</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Recipient</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Subject</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Template</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Status</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Date</th>
                <th class="text-left py-4 px-6 text-slate-400 font-semibold text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="emails.length === 0">
                <td colspan="7" class="py-12 text-center text-slate-400">
                  <Icon name="mdi:email-off" class="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No emails found</p>
                </td>
              </tr>
              <tr
                v-for="email in emails"
                :key="email.id"
                class="border-b border-white/5 hover:bg-dark-primary/50 transition-colors"
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
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md">
                    <Icon :name="getTemplateIcon(email.template)" class="w-3 h-3" />
                    {{ formatTemplate(email.template) }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md',
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
                  <div class="flex items-center gap-2">
                    <button
                      @click="viewEmail(email)"
                      class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-1"
                      title="View details"
                    >
                      <Icon name="mdi:eye" class="w-4 h-4" />
                      View
                    </button>
                    <button
                      v-if="email.status === 'failed'"
                      @click="resendEmail(email)"
                      :disabled="resending === email.id"
                      class="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                      title="Resend email"
                    >
                      <Icon :name="resending === email.id ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': resending === email.id }" class="w-4 h-4" />
                      Resend
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalEmails > pageSize" class="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <div class="text-slate-400 text-sm">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalEmails) }} of {{ totalEmails }} emails
          </div>
          <div class="flex gap-2">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
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

// Resend email
async function resendEmail(email: any) {
  if (!confirm('Are you sure you want to resend this email?')) return

  resending.value = email.id

  try {
    await trpc.admin.emails.resend.mutate({ id: email.id })
    
    // Refresh emails and stats
    await Promise.all([fetchEmails(), fetchStats()])
    
    alert('Email resent successfully!')
  } catch (err: any) {
    // Error logged: 'Failed to resend email:', err)
    alert(`Failed to resend email: ${err.message}`)
  } finally {
    resending.value = null
  }
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
