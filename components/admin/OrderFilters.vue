<template>
  <div class="space-y-4 p-6 rounded-lg bg-slate-900/50 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <Icon name="mdi:filter" class="w-5 h-5 text-cyan-400" />
        Filter Orders
      </h3>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="text-sm text-cyan-400 hover:text-cyan-300 underline"
        type="button"
      >
        Clear All
      </button>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Status Filter -->
      <div>
        <label for="filter-status" class="block text-sm font-semibold text-white mb-2">
          Status
        </label>
        <select
          id="filter-status"
          v-model="localFilters.status"
          @change="emitFilters"
          class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="quoted">Quoted</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <!-- Package Filter -->
      <div>
        <label for="filter-package" class="block text-sm font-semibold text-white mb-2">
          Package
        </label>
        <select
          id="filter-package"
          v-model="localFilters.packageId"
          @change="emitFilters"
          class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        >
          <option value="">All Packages</option>
          <option value="game-day-dj">Game Day DJ</option>
          <option value="player-intros-basic">Player Intros - Basic</option>
          <option value="player-intros-warmup">Player Intros - Warmup</option>
          <option value="player-intros-ultimate">Player Intros - Ultimate</option>
          <option value="event-hosting">Event Hosting</option>
        </select>
      </div>

      <!-- Date Range Filter -->
      <div>
        <label for="filter-date-from" class="block text-sm font-semibold text-white mb-2">
          Date From
        </label>
        <input
          id="filter-date-from"
          v-model="localFilters.dateFrom"
          @change="emitFilters"
          type="date"
          class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label for="filter-date-to" class="block text-sm font-semibold text-white mb-2">
          Date To
        </label>
        <input
          id="filter-date-to"
          v-model="localFilters.dateTo"
          @change="emitFilters"
          type="date"
          class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>

    <!-- Search -->
    <div>
      <label for="filter-search" class="block text-sm font-semibold text-white mb-2">
        <Icon name="mdi:magnify" class="w-4 h-4 inline-block mr-1" />
        Search
      </label>
      <input
        id="filter-search"
        v-model="localFilters.search"
        @input="debouncedEmit"
        type="text"
        placeholder="Search by name, email, or order ID..."
        class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
      />
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 pt-2">
      <span
        v-if="localFilters.status"
        class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm"
      >
        Status: {{ formatStatus(localFilters.status) }}
        <button @click="clearFilter('status')" class="hover:text-cyan-300" type="button">
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </span>
      <span
        v-if="localFilters.packageId"
        class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm"
      >
        Package: {{ formatPackage(localFilters.packageId) }}
        <button @click="clearFilter('packageId')" class="hover:text-blue-300" type="button">
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </span>
      <span
        v-if="localFilters.dateFrom || localFilters.dateTo"
        class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm"
      >
        Date Range
        <button @click="clearFilter('date')" class="hover:text-purple-300" type="button">
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

interface Filters {
  status: string
  packageId: string
  dateFrom: string
  dateTo: string
  search: string
}

interface Props {
  modelValue?: Filters
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Filters]
}>()

const localFilters = reactive<Filters>({
  status: props.modelValue?.status || '',
  packageId: props.modelValue?.packageId || '',
  dateFrom: props.modelValue?.dateFrom || '',
  dateTo: props.modelValue?.dateTo || '',
  search: props.modelValue?.search || ''
})

const hasActiveFilters = computed(() => {
  return !!(
    localFilters.status ||
    localFilters.packageId ||
    localFilters.dateFrom ||
    localFilters.dateTo ||
    localFilters.search
  )
})

let debounceTimeout: NodeJS.Timeout | null = null

function debouncedEmit() {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    emitFilters()
  }, 300)
}

function emitFilters() {
  emit('update:modelValue', { ...localFilters })
}

function clearFilters() {
  localFilters.status = ''
  localFilters.packageId = ''
  localFilters.dateFrom = ''
  localFilters.dateTo = ''
  localFilters.search = ''
  emitFilters()
}

function clearFilter(type: 'status' | 'packageId' | 'date') {
  if (type === 'status') {
    localFilters.status = ''
  } else if (type === 'packageId') {
    localFilters.packageId = ''
  } else if (type === 'date') {
    localFilters.dateFrom = ''
    localFilters.dateTo = ''
  }
  emitFilters()
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatPackage(packageId: string): string {
  const packages: Record<string, string> = {
    'game-day-dj': 'Game Day DJ',
    'player-intros-basic': 'Basic',
    'player-intros-warmup': 'Warmup',
    'player-intros-ultimate': 'Ultimate',
    'event-hosting': 'Event Hosting'
  }
  return packages[packageId] || packageId
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(localFilters, newValue)
  }
}, { deep: true })
</script>
