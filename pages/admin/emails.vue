<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Emails</h1>
      <p class="text-slate-400">Monitor email delivery, resend failures, and manage template overrides</p>
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
              <option value="quote_enhanced">Enhanced Quote</option>
              <option value="quote_revision">Quote Revision</option>
              <option value="quote_reminder">Quote Reminder</option>
              <option value="invoice">Invoice</option>
              <option value="payment_receipt">Payment Receipt</option>
              <option value="manual_completion">Completion</option>
              <option value="contact_notification">Contact Form</option>
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

    <!-- Template Manager -->
    <div class="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 lg:p-6" @keydown="handleTemplateKeydown">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-white">Template Manager</h2>
          <p class="text-sm text-slate-400 mt-1">
            Edit customer-facing email copy with preview and test tools.
          </p>
        </div>
        <button
          @click="refreshTemplates"
          :disabled="templateLoading"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-sm transition-colors"
        >
          <Icon :name="templateLoading ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': templateLoading }" class="w-4 h-4 inline mr-1" />
          Refresh
        </button>
      </div>

      <div class="mb-6 border border-slate-700/70 rounded-xl bg-slate-950/50 p-4">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <h3 class="text-sm font-semibold text-slate-200">How to use the template manager</h3>
          <span class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {{ templatesUsingOverrideCount }}/{{ templates.length }} overrides active
          </span>
          <span v-if="templatesWithFailuresCount > 0" class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
            {{ templatesWithFailuresCount }} templates with recent failures
          </span>
        </div>
        <ol class="grid md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400 list-decimal list-inside">
          <li>Select the email type you want to edit.</li>
          <li>Update subject/body and click variables to insert placeholders.</li>
          <li>Render preview and send a test to yourself.</li>
          <li>Save override when ready. You can reset to default anytime.</li>
        </ol>
      </div>

      <div v-if="templateLoading" class="flex items-center justify-center py-10">
        <div class="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>

      <div v-else-if="templates.length === 0" class="text-center py-10">
        <p class="text-slate-400">No managed templates available.</p>
      </div>

      <div v-else class="grid lg:grid-cols-3 gap-6">
        <div class="space-y-3">
          <div class="relative">
            <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              v-model="templateSearch"
              type="text"
              placeholder="Search templates..."
              class="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            v-for="template in filteredTemplates"
            :key="template.key"
            @click="selectTemplate(template.key)"
            class="w-full text-left p-3 rounded-xl border transition-all"
            :class="selectedTemplateKey === template.key ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-white">{{ template.label }}</p>
              <span
                class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                :class="template.isUsingOverride ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'"
              >
                {{ template.isUsingOverride ? 'Override' : 'Default' }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">{{ template.description }}</p>
            <div v-if="template.stats" class="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span>Sent {{ template.stats.sent }}</span>
              <span>Failed {{ template.stats.failed }}</span>
              <span
                v-if="template.stats.failed > 0"
                class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 uppercase tracking-wide text-[10px]"
              >
                Needs review
              </span>
            </div>
          </button>
          <p v-if="filteredTemplates.length === 0" class="text-xs text-slate-500 py-2 px-1">
            No templates match your search.
          </p>
        </div>

        <div class="lg:col-span-2 space-y-4" v-if="selectedTemplate">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold text-white">{{ selectedTemplate.label }}</h3>
            <span
              class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              :class="selectedTemplate.isUsingOverride ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'"
            >
              {{ selectedTemplate.isUsingOverride ? 'Override Active' : 'Using Default' }}
            </span>
            <span v-if="isTemplateDirty" class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              Unsaved Changes
            </span>
            <span v-if="templateLastUpdated" class="text-xs text-slate-500 ml-auto">
              Updated: {{ formatDate(templateLastUpdated) }}
            </span>
          </div>

          <div v-if="selectedTemplate.stats" class="grid sm:grid-cols-4 gap-2">
            <div class="bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
              <p class="text-[10px] uppercase text-slate-500">Total Sends</p>
              <p class="text-sm text-white font-semibold">{{ selectedTemplate.stats.total }}</p>
            </div>
            <div class="bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
              <p class="text-[10px] uppercase text-slate-500">Sent</p>
              <p class="text-sm text-emerald-300 font-semibold">{{ selectedTemplate.stats.sent }}</p>
            </div>
            <div class="bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
              <p class="text-[10px] uppercase text-slate-500">Failed</p>
              <p class="text-sm text-red-300 font-semibold">{{ selectedTemplate.stats.failed }}</p>
            </div>
            <div class="bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
              <p class="text-[10px] uppercase text-slate-500">Last Sent</p>
              <p class="text-sm text-slate-300 font-semibold">{{ selectedTemplate.stats.lastSentAt ? formatDate(selectedTemplate.stats.lastSentAt) : 'Never' }}</p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-2">Technical Template ID (read-only)</label>
              <input
                :value="selectedTemplate.key"
                readonly
                class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-2">Send Test To</label>
              <input
                v-model="testRecipient"
                type="email"
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="template-enabled"
              v-model="templateForm.enabled"
              type="checkbox"
              class="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30"
            />
            <label for="template-enabled" class="text-sm text-slate-300">
              Enable override for this template
            </label>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-400">Subject Template</label>
              <span class="text-xs text-slate-500">{{ subjectCharCount }}/200</span>
            </div>
            <input
              ref="subjectInputRef"
              v-model="templateForm.subject"
              @focus="activeTemplateField = 'subject'"
              @input="queueTemplateAnalysis"
              type="text"
              class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-400">Body Template (HTML supported)</label>
              <span class="text-xs text-slate-500">{{ bodyCharCount }}/20000</span>
            </div>
            <textarea
              ref="bodyTextareaRef"
              v-model="templateForm.body"
              @focus="activeTemplateField = 'body'"
              @input="queueTemplateAnalysis"
              rows="12"
              class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
            />
          </div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-2">
              <label class="block text-sm font-medium text-slate-400">Preview/Test Values</label>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  @click="loadSampleContext"
                  type="button"
                  class="px-2 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Use sample values
                </button>
                <button
                  @click="clearContextFields"
                  type="button"
                  class="px-2 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Clear all values
                </button>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-3">
              <div
                v-for="field in templateContextFields"
                :key="field.key"
                class="bg-slate-800/40 border border-slate-700 rounded-lg p-3"
              >
                <div class="flex items-center justify-between gap-2 mb-1">
                  <label class="text-xs font-medium text-slate-300">{{ field.label }}</label>
                  <span class="text-[10px] font-mono text-slate-500">{{ formatVariableToken(field.key) }}</span>
                </div>
                <input
                  v-if="field.inputType !== 'boolean'"
                  v-model="field.value"
                  :type="field.inputType"
                  class="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  :placeholder="field.sampleValue || 'Enter value'"
                />
                <select
                  v-else
                  v-model="field.value"
                  class="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="">Use default</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>
            <p v-if="templateContextFields.length === 0" class="text-xs text-slate-500">
              This template has no custom preview values. Default sample values will be used.
            </p>

            <p class="text-[11px] text-slate-500 mt-2">
              Values here are only for preview and test sends. They do not change customer data.
            </p>
            <p v-if="templateContextError" class="text-xs text-red-300 mt-1">
              {{ templateContextError }}
            </p>
          </div>

          <div>
            <p class="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Template Variables</p>
            <p class="text-[11px] text-slate-500 mb-2">Click a variable to insert it at your cursor.</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="variable in selectedTemplate.variables"
                :key="variable"
                @click="insertTemplateVariable(variable)"
                class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer text-slate-300 text-xs font-mono transition-colors"
              >
                {{ formatVariableToken(variable) }}
              </span>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Global Variables</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="variable in globalTemplateVariables"
                :key="variable"
                @click="insertTemplateVariable(variable)"
                class="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 hover:border-slate-600 cursor-pointer text-slate-400 text-xs font-mono transition-colors"
              >
                {{ formatVariableToken(variable) }}
              </span>
            </div>
          </div>

          <div v-if="templateAnalysis" class="border border-slate-700 rounded-xl p-3 bg-slate-950/60">
            <div class="flex items-center gap-2 mb-2">
              <Icon :name="templateAnalysis.isValid ? 'mdi:check-circle' : 'mdi:alert-circle'" :class="templateAnalysis.isValid ? 'text-emerald-400' : 'text-amber-400'" class="w-4 h-4" />
              <p class="text-sm text-slate-200 font-medium">Template Analysis</p>
              <span v-if="analyzingTemplate" class="text-xs text-slate-500 ml-auto">Analyzing…</span>
            </div>
            <p class="text-xs text-slate-400">Detected variables: {{ templateAnalysis.placeholders.length ? templateAnalysis.placeholders.join(', ') : 'None' }}</p>
            <p v-if="templateAnalysis.invalidVariables.length" class="text-xs text-red-300 mt-1">
              Invalid variables: {{ templateAnalysis.invalidVariables.join(', ') }}
            </p>
            <p v-if="templateAnalysis.hasUnsafeHtml" class="text-xs text-red-300 mt-1">
              Unsafe HTML was detected (script/iframe/javascript URLs are not allowed).
            </p>
            <p
              v-else-if="templateAnalysis.recommendedVariablesMissing.length"
              class="text-xs text-amber-300 mt-1"
            >
              Missing commonly used variables: {{ templateAnalysis.recommendedVariablesMissing.join(', ') }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="previewTemplate"
              :disabled="!canRenderTemplate"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-sm transition-colors"
            >
              Render Preview
            </button>
            <button
              @click="saveTemplate"
              :disabled="!canSaveTemplate"
              class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Save Override
            </button>
            <button
              @click="resetTemplate"
              :disabled="templateBusy"
              class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 rounded-lg text-sm transition-colors"
            >
              Reset to Default
            </button>
            <button
              @click="revertTemplateEdits"
              :disabled="templateBusy || !isTemplateDirty"
              class="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-sm transition-colors"
            >
              Revert Unsaved
            </button>
            <button
              @click="sendTestTemplate"
              :disabled="!canSendTestTemplate"
              class="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-300 rounded-lg text-sm transition-colors"
            >
              Send Test Email
            </button>
          </div>
          <p class="text-[11px] text-slate-500">
            Tip: press <span class="font-semibold text-slate-300">Ctrl/Cmd + S</span> to save your draft quickly.
          </p>

          <p v-if="templateValidationError" class="text-xs text-red-300">
            {{ templateValidationError }}
          </p>

          <div v-if="templatePreview" class="border border-slate-700 rounded-xl p-4 bg-slate-950/50">
            <p class="text-xs uppercase tracking-wide text-slate-500 mb-2">Rendered Preview</p>
            <p class="text-sm text-slate-300 mb-3"><span class="text-slate-400">Subject:</span> {{ templatePreview.subject }}</p>
            <div class="bg-white text-slate-800 rounded-lg p-4 max-h-72 overflow-auto text-sm" v-html="templatePreview.html"></div>
          </div>
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

    <!-- Discard Unsaved Template Changes -->
    <UiConfirmDialog
      :is-open="showTemplateDiscardConfirm"
      title="Discard unsaved changes?"
      message="You have unsaved template edits. If you continue, those edits will be lost."
      type="warning"
      confirm-text="Discard Changes"
      cancel-text="Keep Editing"
      @confirm="confirmTemplateDiscard"
      @cancel="cancelTemplateDiscard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

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
const showTemplateDiscardConfirm = ref(false)
const pendingTemplateKey = ref<string | null>(null)

const { showSuccess, showError } = useNotification()

type TemplateOverride = {
  enabled: boolean
  subject: string
  body: string
  updatedAt: string
  updatedBy: number | null
}

type ManagedTemplate = {
  key: string
  label: string
  description: string
  variables: string[]
  sampleData?: Record<string, unknown>
  defaultSubject: string
  defaultBody: string
  override: TemplateOverride | null
  effectiveSubject: string
  effectiveBody: string
  isUsingOverride: boolean
  stats?: TemplateStats | null
}

type TemplateStats = {
  template: string
  sent: number
  failed: number
  total: number
  lastSentAt: string | null
}

type TemplateAnalysis = {
  templateKey: string
  placeholders: string[]
  allowedVariables: string[]
  invalidVariables: string[]
  recommendedVariablesMissing: string[]
  hasUnsafeHtml: boolean
  isValid: boolean
}

type TemplateContextField = {
  key: string
  label: string
  value: string
  sampleValue: string
  inputType: 'text' | 'number' | 'boolean'
}

// Filters
const filters = ref({
  status: 'all',
  template: '',
  search: ''
})

// Template management
const templateLoading = ref(false)
const templateBusy = ref(false)
const templates = ref<ManagedTemplate[]>([])
const templateSearch = ref('')
const globalTemplateVariables = ref<string[]>([])
const selectedTemplateKey = ref('')
const testRecipient = ref('')
const templateContextFields = ref<TemplateContextField[]>([])
const templateContextDraftByKey = ref<Record<string, Record<string, string>>>({})
const templatePreview = ref<{ subject: string; html: string } | null>(null)
const templateAnalysis = ref<TemplateAnalysis | null>(null)
const analyzingTemplate = ref(false)
const templateForm = ref({
  enabled: false,
  subject: '',
  body: ''
})
const subjectInputRef = ref<HTMLInputElement | null>(null)
const bodyTextareaRef = ref<HTMLTextAreaElement | null>(null)
const activeTemplateField = ref<'subject' | 'body'>('body')

// Computed
const totalPages = computed(() => Math.ceil(totalEmails.value / pageSize))
const hasActiveFilters = computed(() => {
  return filters.value.status !== 'all' || filters.value.template !== '' || filters.value.search !== ''
})
const selectedTemplate = computed(() => {
  return templates.value.find(template => template.key === selectedTemplateKey.value) || null
})
const filteredTemplates = computed(() => {
  const search = templateSearch.value.trim().toLowerCase()
  if (!search) return templates.value
  return templates.value.filter((template) =>
    template.label.toLowerCase().includes(search) ||
    template.key.toLowerCase().includes(search) ||
    template.description.toLowerCase().includes(search)
  )
})
const subjectCharCount = computed(() => templateForm.value.subject.length)
const bodyCharCount = computed(() => templateForm.value.body.length)
const templateLastUpdated = computed(() => selectedTemplate.value?.override?.updatedAt || null)
const templatesUsingOverrideCount = computed(() => templates.value.filter((template) => template.isUsingOverride).length)
const templatesWithFailuresCount = computed(() => templates.value.filter((template) => (template.stats?.failed || 0) > 0).length)
const isTemplateDirty = computed(() => {
  if (!selectedTemplate.value) return false
  const baselineEnabled = selectedTemplate.value.override?.enabled ?? false
  const baselineSubject = selectedTemplate.value.override?.subject || selectedTemplate.value.defaultSubject
  const baselineBody = selectedTemplate.value.override?.body || selectedTemplate.value.defaultBody
  return (
    templateForm.value.enabled !== baselineEnabled ||
    templateForm.value.subject !== baselineSubject ||
    templateForm.value.body !== baselineBody
  )
})
const templateValidationError = computed(() => {
  if (templateForm.value.enabled && !templateForm.value.subject.trim()) {
    return 'Enabled overrides require a subject.'
  }
  if (templateForm.value.enabled && !templateForm.value.body.trim()) {
    return 'Enabled overrides require a body.'
  }
  if (templateAnalysis.value?.invalidVariables?.length) {
    return `Unknown variables: ${templateAnalysis.value.invalidVariables.join(', ')}`
  }
  if (templateAnalysis.value?.hasUnsafeHtml) {
    return 'Unsafe HTML detected in body.'
  }
  return ''
})
const templateContextError = computed(() => {
  for (const field of templateContextFields.value) {
    if (field.inputType === 'number' && field.value.trim() && Number.isNaN(Number(field.value))) {
      return `Value for "${field.label}" must be a valid number.`
    }
  }
  return ''
})
const canRenderTemplate = computed(() => !templateBusy.value && !templateValidationError.value && !templateContextError.value)
const canSaveTemplate = computed(() => !templateBusy.value && isTemplateDirty.value && !templateValidationError.value)
const canSendTestTemplate = computed(() => !templateBusy.value && !!testRecipient.value && !templateValidationError.value && !templateContextError.value)

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

function getTemplateSampleContext(template: ManagedTemplate) {
  if (!template.sampleData || typeof template.sampleData !== 'object' || Array.isArray(template.sampleData)) {
    return {} as Record<string, unknown>
  }
  return template.sampleData as Record<string, unknown>
}

function formatVariableLabel(variable: string) {
  return variable
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())
}

function buildTemplateContextFields(
  template: ManagedTemplate,
  existingDraft: Record<string, string> = {}
): TemplateContextField[] {
  const sampleData = getTemplateSampleContext(template)
  return template.variables.map((variable) => {
    const sampleValue = sampleData[variable]
    const inputType: TemplateContextField['inputType'] =
      typeof sampleValue === 'number'
        ? 'number'
        : typeof sampleValue === 'boolean'
          ? 'boolean'
          : 'text'

    const sampleValueString =
      sampleValue === undefined || sampleValue === null
        ? ''
        : typeof sampleValue === 'object'
          ? JSON.stringify(sampleValue)
          : String(sampleValue)

    return {
      key: variable,
      label: formatVariableLabel(variable),
      inputType,
      sampleValue: sampleValueString,
      value: existingDraft[variable] ?? sampleValueString
    }
  })
}

function buildTemplateContextPayload() {
  const context: Record<string, unknown> = {}
  for (const field of templateContextFields.value) {
    const raw = field.value.trim()
    if (!raw) continue

    if (field.inputType === 'number') {
      const numericValue = Number(raw)
      if (Number.isNaN(numericValue)) {
        throw new Error(`Value for "${field.label}" must be a valid number.`)
      }
      context[field.key] = numericValue
      continue
    }

    if (field.inputType === 'boolean') {
      context[field.key] = raw === 'true'
      continue
    }

    context[field.key] = raw
  }
  return context
}

function applyTemplateToForm(template: ManagedTemplate) {
  templateForm.value = {
    enabled: template.override?.enabled ?? false,
    subject: template.override?.subject || template.defaultSubject,
    body: template.override?.body || template.defaultBody
  }
  templateContextFields.value = buildTemplateContextFields(
    template,
    templateContextDraftByKey.value[template.key] || {}
  )
  templatePreview.value = null
  templateAnalysis.value = null
}

function applySelectedTemplate(templateKey: string) {
  selectedTemplateKey.value = templateKey
  const template = templates.value.find(item => item.key === templateKey)
  if (template) {
    applyTemplateToForm(template)
    queueTemplateAnalysis()
  }
}

function selectTemplate(templateKey: string) {
  if (templateKey === selectedTemplateKey.value) return
  if (isTemplateDirty.value) {
    pendingTemplateKey.value = templateKey
    showTemplateDiscardConfirm.value = true
    return
  }
  applySelectedTemplate(templateKey)
}

function confirmTemplateDiscard() {
  showTemplateDiscardConfirm.value = false
  if (!pendingTemplateKey.value) return
  applySelectedTemplate(pendingTemplateKey.value)
  pendingTemplateKey.value = null
}

function cancelTemplateDiscard() {
  showTemplateDiscardConfirm.value = false
  pendingTemplateKey.value = null
}

async function refreshTemplates() {
  if (isTemplateDirty.value && typeof window !== 'undefined') {
    const shouldRefresh = window.confirm('You have unsaved template changes. Refresh and discard current edits?')
    if (!shouldRefresh) return
  }
  await fetchTemplates()
}

async function fetchTemplates() {
  templateLoading.value = true
  try {
    const result = await trpc.admin.emails.templates.list.query()
    const templateStats = (result.templateStats || []) as TemplateStats[]
    const statsByKey = Object.fromEntries(templateStats.map(item => [item.template, item]))
    globalTemplateVariables.value = (result.globalVariables || []) as string[]
    templates.value = (result.templates as ManagedTemplate[]).map(template => ({
      ...template,
      stats: statsByKey[template.key] || null
    }))

    if (!templates.value.length) {
      selectedTemplateKey.value = ''
      return
    }

    if (!selectedTemplateKey.value || !templates.value.find(t => t.key === selectedTemplateKey.value)) {
      selectedTemplateKey.value = templates.value[0].key
    }

    const currentTemplate = templates.value.find(t => t.key === selectedTemplateKey.value)
    if (currentTemplate) {
      applyTemplateToForm(currentTemplate)
      await refreshTemplateAnalysis()
    }
  } catch (err: any) {
    showError(err.message || 'Failed to load template settings')
  } finally {
    templateLoading.value = false
  }
}

async function refreshTemplateAnalysis() {
  if (!selectedTemplate.value) {
    templateAnalysis.value = null
    return
  }

  analyzingTemplate.value = true
  try {
    templateAnalysis.value = await trpc.admin.emails.templates.analyze.query({
      templateKey: selectedTemplate.value.key,
      subject: templateForm.value.subject,
      body: templateForm.value.body
    })
  } catch (err: any) {
    templateAnalysis.value = null
    showError(err.message || 'Failed to analyze template draft')
  } finally {
    analyzingTemplate.value = false
  }
}

let analyzeTimeout: NodeJS.Timeout
function queueTemplateAnalysis() {
  clearTimeout(analyzeTimeout)
  analyzeTimeout = setTimeout(() => {
    refreshTemplateAnalysis()
  }, 250)
}

function insertTemplateVariable(variable: string) {
  const token = `{{${variable}}}`
  const target = activeTemplateField.value === 'subject' ? subjectInputRef.value : bodyTextareaRef.value
  if (!target) return

  const selectionStart = target.selectionStart ?? 0
  const selectionEnd = target.selectionEnd ?? selectionStart
  const currentValue = activeTemplateField.value === 'subject' ? templateForm.value.subject : templateForm.value.body
  const nextValue = `${currentValue.slice(0, selectionStart)}${token}${currentValue.slice(selectionEnd)}`
  const cursorPosition = selectionStart + token.length

  if (activeTemplateField.value === 'subject') {
    templateForm.value.subject = nextValue
  } else {
    templateForm.value.body = nextValue
  }

  nextTick(() => {
    target.focus()
    target.setSelectionRange(cursorPosition, cursorPosition)
  })

  queueTemplateAnalysis()
}

function formatVariableToken(variable: string) {
  return `{{${variable}}}`
}

function revertTemplateEdits() {
  if (!selectedTemplate.value) return
  applyTemplateToForm(selectedTemplate.value)
  queueTemplateAnalysis()
}

function loadSampleContext() {
  if (!selectedTemplate.value) return
  templateContextFields.value = buildTemplateContextFields(selectedTemplate.value, {})
}

function clearContextFields() {
  templateContextFields.value = templateContextFields.value.map((field) => ({
    ...field,
    value: ''
  }))
}

async function previewTemplate() {
  if (!selectedTemplate.value) return

  templateBusy.value = true
  try {
    if (templateValidationError.value) {
      throw new Error(templateValidationError.value)
    }
    const context = buildTemplateContextPayload()
    templatePreview.value = await trpc.admin.emails.templates.preview.query({
      templateKey: selectedTemplate.value.key,
      subject: templateForm.value.subject,
      body: templateForm.value.body,
      context
    })
  } catch (err: any) {
    showError(err.message || 'Failed to render template preview')
  } finally {
    templateBusy.value = false
  }
}

async function saveTemplate() {
  if (!selectedTemplate.value) return

  templateBusy.value = true
  try {
    if (templateValidationError.value) {
      throw new Error(templateValidationError.value)
    }
    await trpc.admin.emails.templates.save.mutate({
      templateKey: selectedTemplate.value.key,
      enabled: templateForm.value.enabled,
      subject: templateForm.value.subject,
      body: templateForm.value.body
    })

    await fetchTemplates()
    showSuccess('Template override saved')
  } catch (err: any) {
    showError(err.message || 'Failed to save template')
  } finally {
    templateBusy.value = false
  }
}

async function resetTemplate() {
  if (!selectedTemplate.value) return
  if (typeof window !== 'undefined' && !window.confirm('Reset this template override and return to default behavior?')) {
    return
  }

  templateBusy.value = true
  try {
    await trpc.admin.emails.templates.reset.mutate({
      templateKey: selectedTemplate.value.key
    })

    await fetchTemplates()
    showSuccess('Template reset to default')
  } catch (err: any) {
    showError(err.message || 'Failed to reset template')
  } finally {
    templateBusy.value = false
  }
}

async function sendTestTemplate() {
  if (!selectedTemplate.value || !testRecipient.value) return

  templateBusy.value = true
  try {
    if (templateValidationError.value) {
      throw new Error(templateValidationError.value)
    }
    const context = buildTemplateContextPayload()
    const result = await trpc.admin.emails.templates.sendTest.mutate({
      templateKey: selectedTemplate.value.key,
      to: testRecipient.value,
      subject: templateForm.value.subject,
      body: templateForm.value.body,
      context
    })

    if (result.preview) {
      templatePreview.value = result.preview
    }

    showSuccess(`Test email sent to ${testRecipient.value}`)
  } catch (err: any) {
    showError(err.message || 'Failed to send test email')
  } finally {
    templateBusy.value = false
  }
}

watch(selectedTemplateKey, () => {
  queueTemplateAnalysis()
})
watch(
  templateContextFields,
  (fields) => {
    if (!selectedTemplateKey.value) return
    templateContextDraftByKey.value[selectedTemplateKey.value] = Object.fromEntries(
      fields.map((field) => [field.key, field.value])
    )
  },
  { deep: true }
)

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

function handleTemplateKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey)) return
  if (event.key.toLowerCase() !== 's') return
  if (!selectedTemplate.value) return

  event.preventDefault()
  if (!canSaveTemplate.value) return
  saveTemplate()
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isTemplateDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave((to, from, next) => {
  if (!isTemplateDirty.value || typeof window === 'undefined') {
    next()
    return
  }
  const shouldLeave = window.confirm('You have unsaved template changes. Leave this page and discard edits?')
  next(shouldLeave)
})

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
    quote_enhanced: 'mdi:currency-usd',
    quote_revision: 'mdi:file-refresh',
    quote_reminder: 'mdi:bell-ring',
    invoice: 'mdi:file-document',
    payment_receipt: 'mdi:receipt',
    receipt: 'mdi:receipt',
    manual_completion: 'mdi:check-all',
    admin_notification: 'mdi:shield-account',
    contact_notification: 'mdi:message-text',
    custom: 'mdi:email-edit'
  }
  return icons[template] || 'mdi:email'
}

function formatTemplate(template: string) {
  const names: Record<string, string> = {
    order_confirmation: 'Order Confirmation',
    quote: 'Quote',
    quote_enhanced: 'Enhanced Quote',
    quote_revision: 'Quote Revision',
    quote_reminder: 'Quote Reminder',
    invoice: 'Invoice',
    payment_receipt: 'Payment Receipt',
    receipt: 'Receipt',
    manual_completion: 'Completion',
    admin_notification: 'Admin Notification',
    contact_notification: 'Contact Form',
    custom: 'Custom'
  }
  return names[template] || template
}

// Lifecycle
onMounted(() => {
  Promise.all([fetchEmails(), fetchStats(), fetchTemplates()])
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
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
