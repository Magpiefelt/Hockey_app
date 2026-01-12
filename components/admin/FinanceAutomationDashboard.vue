<script setup lang="ts">
/**
 * Finance Automation Dashboard
 * Provides a comprehensive view of automated financial management
 */

const { $client } = useNuxtApp()

// State
const activeTab = ref<'overview' | 'invoices' | 'reminders' | 'reports' | 'settings'>('overview')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Data
const taxSettings = ref<any>(null)
const invoiceSettings = ref<any>(null)
const reminderSettings = ref<any>(null)
const reminderStats = ref<any>(null)
const overdueInvoices = ref<any[]>([])
const pendingReminders = ref<any[]>([])
const agingSummary = ref<any>(null)
const taxDeadlines = ref<any[]>([])
const cashFlowProjection = ref<any[]>([])

// Date range for reports
const reportYear = ref(new Date().getFullYear())
const reportQuarter = ref<number | undefined>(undefined)

// Fetch all data
async function fetchData() {
  isLoading.value = true
  error.value = null
  
  try {
    const [
      taxSettingsData,
      invoiceSettingsData,
      reminderSettingsData,
      reminderStatsData,
      overdueData,
      pendingData,
      agingData,
      deadlinesData,
      cashFlowData
    ] = await Promise.all([
      $client.financeAutomation.getTaxSettings.query(),
      $client.financeAutomation.getInvoiceSettings.query(),
      $client.financeAutomation.getReminderSettings.query(),
      $client.financeAutomation.getReminderStats.query(),
      $client.financeAutomation.getOverdueInvoices.query(),
      $client.financeAutomation.getPendingReminders.query(),
      $client.financeAutomation.getInvoiceAgingSummary.query(),
      $client.financeAutomation.getTaxFilingDeadlines.query(),
      $client.financeAutomation.getCashFlowProjection.query()
    ])
    
    taxSettings.value = taxSettingsData
    invoiceSettings.value = invoiceSettingsData
    reminderSettings.value = reminderSettingsData
    reminderStats.value = reminderStatsData
    overdueInvoices.value = overdueData
    pendingReminders.value = pendingData
    agingSummary.value = agingData
    taxDeadlines.value = deadlinesData
    cashFlowProjection.value = cashFlowData
  } catch (e: any) {
    error.value = e.message || 'Failed to load finance data'
    console.error('Finance dashboard error:', e)
  } finally {
    isLoading.value = false
  }
}

// Process all reminders
async function processReminders() {
  try {
    const result = await $client.financeAutomation.processAllReminders.mutate()
    alert(`Reminders processed: ${result.sent} sent, ${result.failed} failed`)
    await fetchData()
  } catch (e: any) {
    alert('Failed to process reminders: ' + e.message)
  }
}

// Send individual reminder
async function sendReminder(orderId: number) {
  try {
    await $client.financeAutomation.sendReminder.mutate({ orderId })
    alert('Reminder sent successfully')
    await fetchData()
  } catch (e: any) {
    alert('Failed to send reminder: ' + e.message)
  }
}

// Mark invoice as paid
async function markAsPaid(orderId: number) {
  if (!confirm('Mark this invoice as paid?')) return
  
  try {
    await $client.financeAutomation.markInvoiceAsPaid.mutate({ orderId })
    alert('Invoice marked as paid')
    await fetchData()
  } catch (e: any) {
    alert('Failed to mark as paid: ' + e.message)
  }
}

// Format currency
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(cents / 100)
}

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get urgency class for deadlines
function getUrgencyClass(daysRemaining: number): string {
  if (daysRemaining <= 7) return 'text-red-600 bg-red-50'
  if (daysRemaining <= 30) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

// Initialize
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="finance-automation-dashboard">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Finance Automation</h1>
      <p class="text-gray-600">Automated invoicing, reminders, and financial reporting</p>
    </div>
    
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex space-x-8">
        <button
          v-for="tab in ['overview', 'invoices', 'reminders', 'reports', 'settings']"
          :key="tab"
          @click="activeTab = tab as any"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm capitalize',
            activeTab === tab
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab }}
        </button>
      </nav>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
      <button @click="fetchData" class="mt-2 text-red-600 underline">Try again</button>
    </div>
    
    <!-- Content -->
    <div v-else>
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Overdue Invoices</div>
            <div class="text-2xl font-bold text-red-600">{{ overdueInvoices.length }}</div>
            <div class="text-sm text-gray-500">
              {{ formatCurrency(overdueInvoices.reduce((sum, i) => sum + i.amount, 0)) }}
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Pending Reminders</div>
            <div class="text-2xl font-bold text-yellow-600">{{ pendingReminders.length }}</div>
            <div class="text-sm text-gray-500">To send today</div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Reminders Sent</div>
            <div class="text-2xl font-bold text-blue-600">{{ reminderStats?.sentThisMonth || 0 }}</div>
            <div class="text-sm text-gray-500">This month</div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">Avg Days to Payment</div>
            <div class="text-2xl font-bold text-green-600">{{ reminderStats?.avgDaysToPayment || 0 }}</div>
            <div class="text-sm text-gray-500">Days</div>
          </div>
        </div>
        
        <!-- Tax Deadlines -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Upcoming Tax Deadlines</h2>
          </div>
          <div class="p-4">
            <div v-if="taxDeadlines.length === 0" class="text-gray-500">
              No upcoming deadlines
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="deadline in taxDeadlines.slice(0, 3)"
                :key="deadline.type + deadline.period"
                class="flex justify-between items-center p-3 rounded-lg"
                :class="getUrgencyClass(deadline.daysRemaining)"
              >
                <div>
                  <div class="font-medium">{{ deadline.type }}</div>
                  <div class="text-sm">{{ deadline.period }}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium">{{ deadline.daysRemaining }} days</div>
                  <div class="text-sm">{{ formatDate(deadline.deadline) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Cash Flow Projection -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Cash Flow Projection</h2>
          </div>
          <div class="p-4 overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="text-left text-sm text-gray-500">
                  <th class="pb-2">Month</th>
                  <th class="pb-2">Confirmed</th>
                  <th class="pb-2">Pending</th>
                  <th class="pb-2">Expected</th>
                  <th class="pb-2">Net Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="month in cashFlowProjection" :key="month.month" class="border-t">
                  <td class="py-2 font-medium">{{ month.month }}</td>
                  <td class="py-2 text-green-600">{{ formatCurrency(month.confirmedRevenue) }}</td>
                  <td class="py-2 text-yellow-600">{{ formatCurrency(month.pendingRevenue) }}</td>
                  <td class="py-2">{{ formatCurrency(month.expectedRevenue) }}</td>
                  <td class="py-2" :class="month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatCurrency(month.netCashFlow) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Invoice Aging -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Invoice Aging</h2>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-sm text-gray-500">Current</div>
                <div class="text-xl font-bold">{{ agingSummary?.current?.count || 0 }}</div>
                <div class="text-sm text-green-600">{{ formatCurrency(agingSummary?.current?.amount || 0) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">30 Days</div>
                <div class="text-xl font-bold">{{ agingSummary?.thirtyDays?.count || 0 }}</div>
                <div class="text-sm text-yellow-600">{{ formatCurrency(agingSummary?.thirtyDays?.amount || 0) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">60 Days</div>
                <div class="text-xl font-bold">{{ agingSummary?.sixtyDays?.count || 0 }}</div>
                <div class="text-sm text-orange-600">{{ formatCurrency(agingSummary?.sixtyDays?.amount || 0) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">90+ Days</div>
                <div class="text-xl font-bold">{{ agingSummary?.ninetyPlus?.count || 0 }}</div>
                <div class="text-sm text-red-600">{{ formatCurrency(agingSummary?.ninetyPlus?.amount || 0) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Invoices Tab -->
      <div v-if="activeTab === 'invoices'" class="space-y-6">
        <div class="bg-white rounded-lg shadow">
          <div class="p-4 border-b flex justify-between items-center">
            <h2 class="text-lg font-semibold">Overdue Invoices</h2>
            <span class="text-sm text-gray-500">{{ overdueInvoices.length }} invoices</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Overdue</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="invoice in overdueInvoices" :key="invoice.orderId">
                  <td class="px-4 py-3 font-medium">{{ invoice.invoiceNumber }}</td>
                  <td class="px-4 py-3">
                    <div>{{ invoice.customerName }}</div>
                    <div class="text-sm text-gray-500">{{ invoice.customerEmail }}</div>
                  </td>
                  <td class="px-4 py-3">{{ formatCurrency(invoice.amount) }}</td>
                  <td class="px-4 py-3">{{ formatDate(invoice.dueDate) }}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      {{ invoice.daysOverdue }} days
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex space-x-2">
                      <button
                        @click="sendReminder(invoice.orderId)"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Send Reminder
                      </button>
                      <button
                        @click="markAsPaid(invoice.orderId)"
                        class="text-green-600 hover:text-green-800 text-sm"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="overdueInvoices.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    No overdue invoices
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Reminders Tab -->
      <div v-if="activeTab === 'reminders'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Payment Reminders</h2>
          <button
            @click="processReminders"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            :disabled="pendingReminders.length === 0"
          >
            Send All Pending ({{ pendingReminders.length }})
          </button>
        </div>
        
        <div class="bg-white rounded-lg shadow">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Sent</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="reminder in pendingReminders" :key="reminder.orderId">
                  <td class="px-4 py-3 font-medium">{{ reminder.invoiceNumber }}</td>
                  <td class="px-4 py-3">
                    <div>{{ reminder.customerName }}</div>
                    <div class="text-sm text-gray-500">{{ reminder.customerEmail }}</div>
                  </td>
                  <td class="px-4 py-3">{{ formatCurrency(reminder.amount) }}</td>
                  <td class="px-4 py-3">{{ formatDate(reminder.dueDate) }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="{
                        'bg-yellow-100 text-yellow-700': reminder.reminderType === 'upcoming',
                        'bg-orange-100 text-orange-700': reminder.reminderType === 'due_today',
                        'bg-red-100 text-red-700': reminder.reminderType === 'overdue'
                      }"
                    >
                      {{ reminder.reminderType.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-4 py-3">{{ reminder.remindersSent }}</td>
                  <td class="px-4 py-3">
                    <button
                      @click="sendReminder(reminder.orderId)"
                      class="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Send Now
                    </button>
                  </td>
                </tr>
                <tr v-if="pendingReminders.length === 0">
                  <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    No pending reminders
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Reports Tab -->
      <div v-if="activeTab === 'reports'" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-4">Generate Reports</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select v-model="reportYear" class="w-full border rounded-lg px-3 py-2">
                <option v-for="year in [2024, 2025, 2026]" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quarter (optional)</label>
              <select v-model="reportQuarter" class="w-full border rounded-lg px-3 py-2">
                <option :value="undefined">Full Year</option>
                <option :value="1">Q1 (Jan-Mar)</option>
                <option :value="2">Q2 (Apr-Jun)</option>
                <option :value="3">Q3 (Jul-Sep)</option>
                <option :value="4">Q4 (Oct-Dec)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2">Tax Report (CRA)</h3>
            <p class="text-sm text-gray-500 mb-4">Generate GST/HST report for tax filing</p>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate Tax Report
            </button>
          </div>
          
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2">Revenue Report</h3>
            <p class="text-sm text-gray-500 mb-4">Revenue breakdown by category and customer</p>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate Revenue Report
            </button>
          </div>
          
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2">Income Statement</h3>
            <p class="text-sm text-gray-500 mb-4">Profit and loss summary</p>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate Income Statement
            </button>
          </div>
          
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2">Customer Report</h3>
            <p class="text-sm text-gray-500 mb-4">Top customers and spending analysis</p>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate Customer Report
            </button>
          </div>
        </div>
      </div>
      
      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="space-y-6">
        <!-- Tax Settings -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-4">Tax Settings</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Default Province</label>
              <select class="w-full border rounded-lg px-3 py-2" :value="taxSettings?.defaultProvince">
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="ON">Ontario</option>
                <option value="QC">Quebec</option>
                <!-- Add more provinces -->
              </select>
            </div>
            <div class="flex items-center">
              <input type="checkbox" :checked="taxSettings?.autoApplyTax" class="mr-2">
              <label class="text-sm text-gray-700">Auto-apply tax to orders</label>
            </div>
          </div>
        </div>
        
        <!-- Invoice Settings -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-4">Invoice Settings</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                :value="invoiceSettings?.companyName"
                class="w-full border rounded-lg px-3 py-2"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
              <input
                type="number"
                :value="invoiceSettings?.paymentTermsDays"
                class="w-full border rounded-lg px-3 py-2"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                :value="invoiceSettings?.invoicePrefix"
                class="w-full border rounded-lg px-3 py-2"
              >
            </div>
            <div class="flex items-center">
              <input type="checkbox" :checked="invoiceSettings?.autoSendOnQuoteAccept" class="mr-2">
              <label class="text-sm text-gray-700">Auto-send invoice when quote accepted</label>
            </div>
          </div>
        </div>
        
        <!-- Reminder Settings -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-4">Reminder Settings</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Days Before Due</label>
              <input
                type="text"
                :value="reminderSettings?.daysBefore?.join(', ')"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="7, 3, 1"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Days After Due</label>
              <input
                type="text"
                :value="reminderSettings?.daysAfter?.join(', ')"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="1, 3, 7, 14"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Max Reminders</label>
              <input
                type="number"
                :value="reminderSettings?.maxReminders"
                class="w-full border rounded-lg px-3 py-2"
              >
            </div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finance-automation-dashboard {
  @apply max-w-7xl mx-auto;
}
</style>
