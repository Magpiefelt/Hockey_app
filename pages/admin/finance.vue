<template>
  <div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">Finance Dashboard</h1>
        <p class="text-slate-400">Track revenue, taxes, and business performance</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="refreshData"
          :disabled="loading"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
        >
          <Icon :name="loading ? 'mdi:loading' : 'mdi:refresh'" :class="loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
          Refresh
        </button>
        <button
          @click="showTaxExport = true"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Icon name="mdi:file-export" class="w-4 h-4" />
          Export Tax Report
        </button>
        <button
          @click="showExpenseModal = true"
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Icon name="mdi:cash-plus" class="w-4 h-4" />
          Log Expense
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stats" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading finance data...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="stats" class="space-y-8">
      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <UiMetricCard
          icon="mdi:currency-usd"
          color="emerald"
          :value="stats.yearToDateRevenue"
          format="currency"
          title="Year to Date Revenue"
          label="YTD"
        />
        <UiMetricCard
          icon="mdi:trending-up"
          color="cyan"
          :value="stats.monthlyRevenue"
          format="currency"
          title="This Month"
          label="MTD"
          :trend="monthlyTrend"
          trend-label="vs last month"
        />
        <UiMetricCard
          icon="mdi:clock-outline"
          color="amber"
          :value="stats.pendingPayments"
          format="currency"
          title="Pending Payments"
          label="Outstanding"
        />
        <UiMetricCard
          icon="mdi:receipt"
          color="purple"
          :value="stats.taxCollected"
          format="currency"
          title="Tax Collected"
          label="Estimated"
        />
      </div>

      <!-- Expense and Net Revenue Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <UiMetricCard
          icon="mdi:cash-minus"
          color="red"
          :value="stats.monthlyExpenses || 0"
          format="currency"
          title="This Month Expenses"
          label="Tracked Spend"
          size="sm"
        />
        <UiMetricCard
          icon="mdi:chart-line-variant"
          color="emerald"
          :value="stats.monthlyNetRevenue || 0"
          format="currency"
          title="This Month Net"
          label="Revenue - Expenses"
          size="sm"
        />
      </div>

      <!-- Secondary Metrics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <UiMetricCard
          icon="mdi:cart-check"
          color="blue"
          :value="stats.paidOrderCount"
          format="number"
          title="Paid Orders"
          label="All Time"
          size="sm"
        />
        <UiMetricCard
          icon="mdi:cash-multiple"
          color="emerald"
          :value="stats.avgOrderValue"
          format="currency"
          title="Avg Order Value"
          label="Per Order"
          size="sm"
        />
        <UiMetricCard
          icon="mdi:percent"
          color="cyan"
          :value="stats.conversionRate + '%'"
          title="Conversion Rate"
          label="Quotes to Paid"
          size="sm"
        />
        <UiMetricCard
          icon="mdi:timer-sand"
          color="slate"
          :value="stats.averageDaysToPayment + ' days'"
          title="Avg Days to Payment"
          label="Quote to Paid"
          size="sm"
        />
      </div>

      <!-- Charts Row -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Revenue Trend Chart -->
        <UiDataCard
          title="Revenue Trend"
          icon="mdi:chart-line"
          icon-color="cyan"
        >
          <div class="p-5">
            <AdminTrendChart
              v-if="revenueTrend.length > 0"
              :data="revenueTrendData"
              type="line"
              :height="250"
              format-value="currency"
              label="Revenue"
              previous-label="Last Year"
            />
            <div v-else class="flex items-center justify-center h-64 text-slate-500">
              No revenue data available
            </div>
          </div>
        </UiDataCard>

        <!-- Order Pipeline -->
        <UiDataCard
          title="Order Pipeline"
          icon="mdi:funnel"
          icon-color="purple"
        >
          <div class="p-5">
            <AdminPipelineChart
              v-if="stats.ordersByStatus.length > 0"
              :stages="stats.ordersByStatus"
              :show-value="true"
            />
            <div v-else class="flex items-center justify-center h-64 text-slate-500">
              No orders to display
            </div>
          </div>
        </UiDataCard>
      </div>

      <!-- Tax & Outstanding Row -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Tax Summary -->
        <UiDataCard
          title="Tax Summary"
          icon="mdi:calculator"
          icon-color="emerald"
        >
          <template #action>
            <button
              @click="showTaxExport = true"
              class="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Export Report
              <Icon name="mdi:download" class="w-4 h-4" />
            </button>
          </template>
          <div class="p-5 space-y-4">
            <div v-if="taxSummary" class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-slate-800">
                <span class="text-slate-400">GST Collected (5%)</span>
                <span class="font-semibold text-white">{{ formatCurrency(taxSummary.totals.gst) }}</span>
              </div>
              <div v-if="taxSummary.totals.pst > 0" class="flex items-center justify-between py-2 border-b border-slate-800">
                <span class="text-slate-400">PST Collected</span>
                <span class="font-semibold text-white">{{ formatCurrency(taxSummary.totals.pst) }}</span>
              </div>
              <div v-if="taxSummary.totals.hst > 0" class="flex items-center justify-between py-2 border-b border-slate-800">
                <span class="text-slate-400">HST Collected</span>
                <span class="font-semibold text-white">{{ formatCurrency(taxSummary.totals.hst) }}</span>
              </div>
              <div class="flex items-center justify-between py-2 bg-emerald-500/10 rounded-lg px-3">
                <span class="font-medium text-emerald-400">Total Tax Collected</span>
                <span class="font-bold text-emerald-400 text-lg">{{ formatCurrency(taxSummary.totals.taxCollected) }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                Based on {{ taxSummary.totals.orderCount }} orders in {{ taxSummary.year }}
              </p>
            </div>
            <div v-else class="text-center py-8 text-slate-500">
              Loading tax data...
            </div>
          </div>
        </UiDataCard>

        <!-- Outstanding Invoices Aging -->
        <UiDataCard
          title="Outstanding Invoices"
          icon="mdi:file-clock"
          icon-color="amber"
        >
          <div class="p-5 space-y-4">
            <!-- Aging buckets -->
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span class="text-slate-300">Current (0-30 days)</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-white">{{ formatCurrency(stats.outstandingByAge.current.amount) }}</span>
                  <span class="text-xs text-slate-500 ml-2">({{ stats.outstandingByAge.current.count }} orders)</span>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span class="text-slate-300">31-60 days</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-white">{{ formatCurrency(stats.outstandingByAge.thirtyDays.amount) }}</span>
                  <span class="text-xs text-slate-500 ml-2">({{ stats.outstandingByAge.thirtyDays.count }} orders)</span>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-red-500"></div>
                  <span class="text-slate-300">60+ days</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-white">{{ formatCurrency(stats.outstandingByAge.sixtyPlus.amount) }}</span>
                  <span class="text-xs text-slate-500 ml-2">({{ stats.outstandingByAge.sixtyPlus.count }} orders)</span>
                </div>
              </div>
            </div>
            
            <!-- Total outstanding -->
            <div class="pt-3 border-t border-slate-800">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-300">Total Outstanding</span>
                <span class="font-bold text-xl text-white">{{ formatCurrency(totalOutstanding) }}</span>
              </div>
            </div>
          </div>
        </UiDataCard>
      </div>

      <!-- Expense Tracking & Budget Health -->
      <div class="grid lg:grid-cols-2 gap-6">
        <UiDataCard
          title="Expense & Budget Health"
          icon="mdi:wallet-outline"
          icon-color="red"
        >
          <div class="p-5 space-y-4">
            <div class="rounded-lg bg-slate-800/60 border border-slate-700 p-4">
              <p class="text-xs uppercase tracking-wide text-slate-400 mb-2">{{ currentMonthLabel }} Budget Progress</p>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-slate-400">Budget</p>
                  <p class="font-semibold text-white">{{ formatCurrency(budgetSnapshot?.totals?.budgetCents || 0) }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Actual</p>
                  <p class="font-semibold text-white">{{ formatCurrency(budgetSnapshot?.totals?.actualCents || 0) }}</p>
                </div>
              </div>
              <div class="mt-3">
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all"
                    :class="monthlyBudgetUtilization > 100 ? 'bg-red-500' : 'bg-emerald-500'"
                    :style="{ width: `${Math.min(monthlyBudgetUtilization, 100)}%` }"
                  ></div>
                </div>
                <p class="text-xs mt-2" :class="monthlyBudgetUtilization > 100 ? 'text-red-400' : 'text-slate-400'">
                  {{ monthlyBudgetUtilization.toFixed(1) }}% utilized
                </p>
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-slate-300 mb-2">Top Expense Categories (YTD)</p>
              <div class="space-y-2">
                <div
                  v-for="category in topExpenseCategories"
                  :key="category.category"
                  class="flex items-center justify-between text-sm border-b border-slate-800 pb-2"
                >
                  <span class="text-slate-300">{{ formatCategoryLabel(category.category) }}</span>
                  <span class="font-semibold text-white">
                    {{ formatCurrency(category.totalCents) }}
                    <span class="text-xs text-slate-500 ml-1">({{ category.percentage }}%)</span>
                  </span>
                </div>
                <p v-if="topExpenseCategories.length === 0" class="text-slate-500 text-sm">No expenses logged yet.</p>
              </div>
            </div>
          </div>
        </UiDataCard>

        <UiDataCard
          title="Recent Expenses"
          icon="mdi:receipt-text-clock"
          icon-color="amber"
        >
          <template #action>
            <button
              @click="showExpenseModal = true"
              class="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Log Expense
              <Icon name="mdi:plus" class="w-4 h-4" />
            </button>
          </template>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-800/50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr
                  v-for="expense in recentExpenses"
                  :key="expense.id"
                  class="hover:bg-slate-800/30 transition-colors"
                >
                  <td class="px-4 py-3 text-sm text-slate-300">{{ formatDate(expense.incurredOn) }}</td>
                  <td class="px-4 py-3 text-sm text-white">{{ expense.description }}</td>
                  <td class="px-4 py-3 text-sm text-slate-300">{{ formatCategoryLabel(expense.category) }}</td>
                  <td class="px-4 py-3 text-sm text-right font-semibold text-rose-400">{{ formatCurrency(expense.amountCents) }}</td>
                </tr>
                <tr v-if="recentExpenses.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-slate-500">No expenses logged yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiDataCard>
      </div>

      <!-- Revenue by Service & Top Customers -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Revenue by Service -->
        <UiDataCard
          title="Revenue by Package"
          icon="mdi:package-variant"
          icon-color="blue"
        >
          <div class="divide-y divide-slate-800">
            <div
              v-for="(service, index) in stats.revenueByService"
              :key="service.service"
              class="p-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="text-slate-500 text-sm w-6">{{ Number(index) + 1 }}.</span>
                <span class="text-white font-medium">{{ service.service }}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-white">{{ formatCurrency(service.revenue) }}</span>
                <span class="text-xs text-slate-500 ml-2">({{ service.orderCount }} orders)</span>
              </div>
            </div>
            <div v-if="stats.revenueByService.length === 0" class="p-8 text-center text-slate-500">
              No revenue data available
            </div>
          </div>
        </UiDataCard>

        <!-- Top Customers -->
        <UiDataCard
          title="Top Customers"
          icon="mdi:account-star"
          icon-color="amber"
          action-text="View All"
          action-to="/admin/customers"
        >
          <div class="divide-y divide-slate-800">
            <div
              v-for="(customer, index) in stats.topCustomers"
              :key="customer.email"
              class="p-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                  {{ Number(index) + 1 }}
                </div>
                <div>
                  <p class="text-white font-medium">{{ customer.name }}</p>
                  <p class="text-xs text-slate-500">{{ customer.orderCount }} orders</p>
                </div>
              </div>
              <span class="font-bold text-emerald-400">{{ formatCurrency(customer.totalSpent) }}</span>
            </div>
            <div v-if="stats.topCustomers.length === 0" class="p-8 text-center text-slate-500">
              No customer data available
            </div>
          </div>
        </UiDataCard>
      </div>

      <!-- Recent Transactions -->
      <UiDataCard
        title="Recent Transactions"
        icon="mdi:history"
        icon-color="cyan"
        action-text="View All Payments"
        action-to="/admin/payments"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Package</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr
                v-for="transaction in stats.recentTransactions"
                :key="transaction.id"
                class="hover:bg-slate-800/30 transition-colors"
              >
                <td class="px-4 py-3 text-sm text-slate-300">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-4 py-3 text-sm text-white font-medium">
                  {{ transaction.customerName }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-300">
                  {{ transaction.packageName }}
                </td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-emerald-400">
                  {{ formatCurrency(transaction.amount) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">
                    {{ transaction.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <NuxtLink
                    :to="`/admin/orders/${transaction.orderId}`"
                    class="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                  >
                    #{{ transaction.orderId }}
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="stats.recentTransactions.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                  No transactions yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiDataCard>
    </div>

    <!-- Tax Export Modal -->
    <div v-if="showTaxExport" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        <div class="p-6 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">Export Tax Report</h3>
          <p class="text-sm text-slate-400 mt-1">Generate a tax report for your records</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Year</label>
            <select
              v-model="exportYear"
              class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Quarter (Optional)</label>
            <select
              v-model="exportQuarter"
              class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option :value="null">Full Year</option>
              <option :value="1">Q1 (Jan - Mar)</option>
              <option :value="2">Q2 (Apr - Jun)</option>
              <option :value="3">Q3 (Jul - Sep)</option>
              <option :value="4">Q4 (Oct - Dec)</option>
            </select>
          </div>
        </div>
        <div class="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            @click="showTaxExport = false"
            class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="exportTaxReport"
            :disabled="exporting"
            class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon :name="exporting ? 'mdi:loading' : 'mdi:download'" :class="exporting ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
            {{ exporting ? 'Generating...' : 'Download Report' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Expense Modal -->
    <div v-if="showExpenseModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full">
        <div class="p-6 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">Log Expense</h3>
          <p class="text-sm text-slate-400 mt-1">Track real operating costs for accurate finance insights</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <input
              v-model="expenseForm.description"
              type="text"
              placeholder="e.g. Arena travel for away game"
              class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Amount (CAD)</label>
              <input
                v-model="expenseForm.amount"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                v-model="expenseForm.incurredOn"
                type="date"
                class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                v-model="expenseForm.category"
                class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option v-for="category in expenseCategories" :key="category" :value="category">
                  {{ formatCategoryLabel(category) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Vendor (Optional)</label>
              <input
                v-model="expenseForm.vendor"
                type="text"
                class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
            <textarea
              v-model="expenseForm.notes"
              rows="3"
              class="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
            ></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            @click="closeExpenseModal"
            class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveExpense"
            :disabled="savingExpense"
            class="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon :name="savingExpense ? 'mdi:loading' : 'mdi:content-save'" :class="savingExpense ? 'w-4 h-4 animate-spin' : 'w-4 h-4'" />
            {{ savingExpense ? 'Saving...' : 'Save Expense' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { showSuccess, showError } = useNotification()
const trpc = useTrpc()

// State
const loading = ref(true)
const stats = ref<any>(null)
const revenueTrend = ref<any[]>([])
const taxSummary = ref<any>(null)
const expenseSummary = ref<any>(null)
const budgetSnapshot = ref<any>(null)
const recentExpenses = ref<any[]>([])
const showTaxExport = ref(false)
const showExpenseModal = ref(false)
const exporting = ref(false)
const savingExpense = ref(false)
const exportYear = ref(new Date().getFullYear())
const exportQuarter = ref<number | null>(null)
const expenseCategories = ['travel', 'equipment', 'marketing', 'software', 'contractor', 'taxes_fees', 'office', 'other']

function defaultExpenseForm() {
  return {
    description: '',
    amount: '',
    category: 'other',
    incurredOn: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: ''
  }
}
const expenseForm = ref(defaultExpenseForm())

// Computed
const monthlyTrend = computed(() => {
  if (!stats.value) return undefined
  const { monthlyRevenue, lastMonthRevenue } = stats.value
  if (lastMonthRevenue === 0) return monthlyRevenue > 0 ? 100 : 0
  return Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
})

const totalOutstanding = computed(() => {
  if (!stats.value) return 0
  const { current, thirtyDays, sixtyPlus } = stats.value.outstandingByAge
  return current.amount + thirtyDays.amount + sixtyPlus.amount
})

const revenueTrendData = computed(() => {
  return revenueTrend.value.map(item => ({
    label: item.monthShort,
    value: item.revenue,
    previousValue: item.previousYearRevenue
  }))
})

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
})

const currentMonthLabel = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const topExpenseCategories = computed(() => {
  const categories = expenseSummary.value?.byCategory || []
  return categories.slice(0, 4)
})

const monthlyBudgetUtilization = computed(() => {
  const budget = budgetSnapshot.value?.totals?.budgetCents || 0
  const actual = budgetSnapshot.value?.totals?.actualCents || 0
  if (budget <= 0) return actual > 0 ? 100 : 0
  return (actual / budget) * 100
})

// Methods
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function closeExpenseModal() {
  showExpenseModal.value = false
  expenseForm.value = defaultExpenseForm()
}

async function fetchData() {
  loading.value = true
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const startOfYear = `${currentYear}-01-01`
    const today = now.toISOString().split('T')[0]

    // Fetch all data in parallel; expense widgets degrade gracefully if tracking tables are unavailable.
    const [
      statsResult,
      trendResult,
      taxResult,
      expenseSummaryResult,
      budgetResult,
      recentExpensesResult
    ] = await Promise.allSettled([
      trpc.finance.stats.query(),
      trpc.finance.revenueTrend.query({ months: 12 }),
      trpc.finance.taxSummary.query({ year: currentYear }),
      trpc.financeAutomation.getExpenseSummary.query({
        startDate: startOfYear,
        endDate: today
      }),
      trpc.financeAutomation.getBudgetVsActual.query({
        year: currentYear,
        month: currentMonth
      }),
      trpc.financeAutomation.listExpenses.query({
        page: 1,
        limit: 5
      })
    ])

    if (statsResult.status !== 'fulfilled' || trendResult.status !== 'fulfilled' || taxResult.status !== 'fulfilled') {
      const reason =
        statsResult.status === 'rejected' ? statsResult.reason
          : trendResult.status === 'rejected' ? trendResult.reason
          : taxResult.status === 'rejected' ? taxResult.reason
          : new Error('Unknown finance data error')
      throw reason
    }

    stats.value = statsResult.value
    revenueTrend.value = trendResult.value
    taxSummary.value = taxResult.value

    expenseSummary.value = expenseSummaryResult.status === 'fulfilled' ? expenseSummaryResult.value : null
    budgetSnapshot.value = budgetResult.status === 'fulfilled' ? budgetResult.value : null
    recentExpenses.value = recentExpensesResult.status === 'fulfilled'
      ? (recentExpensesResult.value.items || [])
      : []
  } catch (error: any) {
    console.error('Failed to fetch finance data:', error)
    showError('Failed to load finance data')
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  await fetchData()
  showSuccess('Data refreshed')
}

async function saveExpense() {
  const description = expenseForm.value.description.trim()
  const amount = Number(expenseForm.value.amount)

  if (!description) {
    showError('Expense description is required')
    return
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    showError('Enter a valid expense amount')
    return
  }

  savingExpense.value = true
  try {
    await trpc.financeAutomation.createExpense.mutate({
      description,
      category: expenseForm.value.category,
      amountCents: Math.round(amount * 100),
      incurredOn: expenseForm.value.incurredOn,
      vendor: expenseForm.value.vendor || undefined,
      notes: expenseForm.value.notes || undefined
    })

    closeExpenseModal()
    showSuccess('Expense logged')
    await fetchData()
  } catch (error: any) {
    console.error('Failed to save expense:', error)
    showError(error?.message || 'Failed to save expense')
  } finally {
    savingExpense.value = false
  }
}

async function exportTaxReport() {
  exporting.value = true
  try {
    const report = await trpc.finance.exportTaxReport.query({
      year: exportYear.value,
      quarter: exportQuarter.value || undefined,
      format: 'csv'
    })

    if (!report || !('content' in report) || typeof report.content !== 'string') {
      throw new Error('CSV export response was invalid')
    }

    const fileName = 'filename' in report && typeof report.filename === 'string' && report.filename.length > 0
      ? report.filename
      : `tax-report-${exportYear.value}${exportQuarter.value ? `-q${exportQuarter.value}` : ''}.csv`

    const mimeType = 'mimeType' in report && typeof report.mimeType === 'string'
      ? report.mimeType
      : 'text/csv'

    // Download file
    const blob = new Blob([report.content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    
    showSuccess('Tax report downloaded')
    showTaxExport.value = false
  } catch (error: any) {
    console.error('Failed to export tax report:', error)
    showError('Failed to generate tax report')
  } finally {
    exporting.value = false
  }
}

// Fetch data on mount
onMounted(() => {
  fetchData()
})

useHead({
  title: 'Finance Dashboard - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Track revenue, taxes, and business performance' }
  ]
})
</script>
