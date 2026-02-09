<template>
  <div class="space-y-6">
    <!-- Add Date Block Section -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Icon name="mdi:calendar-plus" class="w-6 h-6 text-cyan-400" />
        Block Dates
      </h2>
      
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Calendar Selection -->
        <div class="calendar-section">
          <label class="block text-sm font-medium text-slate-400 mb-3">
            Select Date(s) to Block
          </label>
          <div class="calendar-container bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <VueDatePicker 
              v-model="selectedDates"
              :dark="true"
              inline
              auto-apply
              :enable-time-picker="false"
              :min-date="new Date()"
              range
              :multi-calendars="false"
              :hide-navigation="['time']"
              :six-weeks="true"
              :month-change-on-scroll="false"
              month-name-format="long"
              :action-row="{ showNow: false, showPreview: false, showSelect: false, showCancel: false }"
              @update:model-value="handleDateChange"
            />
          </div>
        </div>

        <!-- Block Details Form -->
        <div class="form-section space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-2">Reason *</label>
            <input
              v-model="blockForm.reason"
              type="text"
              placeholder="e.g., Vacation, Holiday, Personal"
              class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              :class="{ 'border-red-500/50': formErrors.reason }"
            />
            <p v-if="formErrors.reason" class="mt-1 text-sm text-red-400">{{ formErrors.reason }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-400 mb-2">Description (Optional)</label>
            <textarea
              v-model="blockForm.description"
              placeholder="Additional details about this block..."
              rows="4"
              class="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Date Selection Display -->
          <div v-if="dateSelectionDisplay" class="flex items-center gap-2 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Icon name="mdi:calendar-range" class="w-5 h-5 text-cyan-400" />
            <span class="text-sm text-cyan-300">{{ dateSelectionDisplay }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="addBlock"
              :disabled="!canAddBlock || isAdding"
              class="flex-1 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <div v-if="isAdding" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <Icon v-else name="mdi:plus" class="w-5 h-5" />
              Add Block
            </button>

            <button
              @click="clearForm"
              class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium"
            >
              Clear
            </button>
          </div>

          <!-- Quick Block Section -->
          <div class="pt-5 border-t border-slate-800">
            <p class="text-sm font-medium text-slate-400 mb-3">Quick Actions</p>
            <div class="flex gap-3">
              <button
                @click="quickBlockToday"
                :disabled="isQuickBlocking"
                class="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Icon name="mdi:calendar-today" class="w-4 h-4" />
                Block Today
              </button>
              <button
                @click="quickBlockTomorrow"
                :disabled="isQuickBlocking"
                class="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Icon name="mdi:calendar-arrow-right" class="w-4 h-4" />
                Block Tomorrow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Blocks Section -->
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:calendar-remove" class="w-6 h-6 text-amber-400" />
          Current Blocks
        </h2>
        <span class="px-3 py-1 bg-slate-800 rounded-lg text-sm text-slate-400">
          {{ overrides.length }} active block{{ overrides.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="overrides.length === 0" class="text-center py-12">
        <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Icon name="mdi:calendar-check" class="w-8 h-8 text-slate-600" />
        </div>
        <p class="text-slate-400 mb-1">No dates are currently blocked</p>
        <p class="text-sm text-slate-500">Use the form above to block dates</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="override in sortedOverrides"
          :key="override.id"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="mdi:calendar-blank" class="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span class="text-white font-semibold">
                {{ formatDateRange(override.date_from, override.date_to) }}
              </span>
            </div>
            <div class="ml-8 space-y-1">
              <p class="text-sm text-slate-300">
                <span class="text-slate-500">Reason:</span> {{ override.reason }}
              </p>
              <p v-if="override.description" class="text-sm text-slate-400">
                {{ override.description }}
              </p>
              <p class="text-xs text-slate-500">
                Added {{ formatDate(override.created_at) }}
                <span v-if="override.created_by_name"> by {{ override.created_by_name }}</span>
              </p>
            </div>
          </div>

          <button
            @click="removeBlock(override.id)"
            :disabled="removingId !== null"
            class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            <div v-if="removingId === override.id" class="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
            <Icon v-else name="mdi:delete" class="w-4 h-4" />
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useCalendarStore } from '~/stores/calendar'

interface Override {
  id: number
  date_from: string
  date_to: string
  reason: string
  description?: string
  created_at: string
  created_by_name?: string
}

const props = defineProps<{
  overrides: Override[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const trpc = useTrpc()
const { showError, showSuccess } = useNotification()
const { formatDate: utilFormatDate } = useUtils()

// FIX: Get calendar store to sync public availability after admin changes
const calendarStore = useCalendarStore()

const selectedDates = ref<Date[] | null>(null)
const blockForm = ref({
  reason: '',
  description: ''
})
const formErrors = ref({
  reason: ''
})
const isAdding = ref(false)
const isQuickBlocking = ref(false)
const removingId = ref<number | null>(null)

/**
 * Helper function to check if a value is a valid Date object
 */
const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Handle date changes from the datepicker
 * VueDatePicker in range mode can return [Date, null] when user selects first date
 */
const handleDateChange = (value: Date | Date[] | null) => {
  if (!value) {
    selectedDates.value = null
    return
  }
  
  if (Array.isArray(value)) {
    // Filter to only valid dates
    const validDates = value.filter(d => isValidDate(d)) as Date[]
    
    if (validDates.length === 0) {
      selectedDates.value = null
    } else if (validDates.length === 1) {
      // Only start date selected - store as single-day range
      selectedDates.value = [validDates[0], validDates[0]]
    } else {
      // Both dates selected
      selectedDates.value = [validDates[0], validDates[1]]
    }
  } else if (isValidDate(value)) {
    // Single date - convert to range
    selectedDates.value = [value, value]
  } else {
    selectedDates.value = null
  }
}

/**
 * Check if we have a complete valid date range for submission
 */
const hasCompleteValidRange = computed(() => {
  if (!selectedDates.value || !Array.isArray(selectedDates.value)) {
    return false
  }
  return selectedDates.value.length === 2 && 
         isValidDate(selectedDates.value[0]) && 
         isValidDate(selectedDates.value[1])
})

/**
 * Determine if the Add Block button should be enabled
 */
const canAddBlock = computed(() => {
  return hasCompleteValidRange.value && blockForm.value.reason.trim().length > 0
})

/**
 * Display string for selected date range
 */
const dateSelectionDisplay = computed(() => {
  if (!selectedDates.value || !Array.isArray(selectedDates.value)) {
    return ''
  }
  
  const [start, end] = selectedDates.value
  
  if (!isValidDate(start)) {
    return ''
  }
  
  if (!isValidDate(end)) {
    return `Start date: ${formatDisplayDate(start)} (select end date)`
  }
  
  if (start.getTime() === end.getTime()) {
    return `Blocking: ${formatDisplayDate(start)}`
  }
  
  return `Blocking: ${formatDisplayDate(start)} to ${formatDisplayDate(end)}`
})

/**
 * Sort overrides by date
 */
const sortedOverrides = computed(() => {
  return [...props.overrides].sort((a, b) => {
    return new Date(a.date_from).getTime() - new Date(b.date_from).getTime()
  })
})

/**
 * Format a date for display (human readable)
 */
const formatDisplayDate = (date: Date): string => {
  if (!isValidDate(date)) {
    return 'Invalid date'
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * Format a date string or Date object for display
 * FIX: Handle YYYY-MM-DD strings with timezone-safe parsing
 */
const formatDate = (date: string | Date): string => {
  if (!date) return 'Invalid date'
  
  let d: Date
  if (typeof date === 'string') {
    // FIX: For YYYY-MM-DD strings, parse as local date to avoid timezone shift
    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) {
      d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  if (!isValidDate(d)) {
    return 'Invalid date'
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d)
}

/**
 * Format a date range for display
 */
const formatDateRange = (dateFrom: string, dateTo: string): string => {
  if (dateFrom === dateTo) {
    return formatDate(dateFrom)
  }
  return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 * Uses local date parts to avoid timezone issues.
 * Throws if date is invalid
 */
const formatDateISO = (date: Date): string => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to formatDateISO')
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validate the form before submission
 */
const validateForm = (): boolean => {
  formErrors.value = { reason: '' }
  
  if (!blockForm.value.reason.trim()) {
    formErrors.value.reason = 'Reason is required'
    return false
  }
  
  if (!selectedDates.value || !Array.isArray(selectedDates.value)) {
    showError('Please select a date or date range')
    return false
  }
  
  const [start, end] = selectedDates.value
  
  if (!isValidDate(start)) {
    showError('Please select a valid start date')
    return false
  }
  
  if (!isValidDate(end)) {
    showError('Please select a valid end date')
    return false
  }
  
  return true
}

/**
 * FIX: Refresh the centralized calendar store after any change.
 * This ensures the public-facing calendar and all UiDatePicker instances
 * across the app reflect the latest availability data.
 */
const refreshCalendarStore = async () => {
  try {
    await calendarStore.refresh()
  } catch (err) {
    // Non-critical - log but don't show error to admin
    console.warn('Failed to refresh public calendar store:', err)
  }
}

/**
 * Add a new date block
 */
const addBlock = async () => {
  if (!validateForm()) return
  
  isAdding.value = true
  
  try {
    // At this point we know selectedDates is valid due to validateForm
    const [start, end] = selectedDates.value as [Date, Date]
    
    const dateFrom = formatDateISO(start)
    const dateTo = formatDateISO(end)
    
    await trpc.calendar.addOverride.mutate({
      dateFrom,
      dateTo,
      reason: blockForm.value.reason.trim(),
      description: blockForm.value.description.trim() || undefined
    })
    
    showSuccess('Date block added successfully')
    clearForm()
    emit('refresh')
    
    // FIX: Also refresh the centralized calendar store
    await refreshCalendarStore()
  } catch (err: any) {
    console.error('Error adding date block:', err)
    const { handleTrpcError } = await import('~/composables/useTrpc')
    const errorMessage = handleTrpcError(err)
    showError(errorMessage || 'Failed to add date block')
  } finally {
    isAdding.value = false
  }
}

/**
 * Remove a date block
 */
const removeBlock = async (id: number) => {
  if (!confirm('Are you sure you want to remove this date block?')) {
    return
  }
  
  removingId.value = id
  
  try {
    await trpc.calendar.removeOverride.mutate({ id })
    showSuccess('Date block removed successfully')
    emit('refresh')
    
    // FIX: Also refresh the centralized calendar store
    await refreshCalendarStore()
  } catch (err: any) {
    console.error('Error removing date block:', err)
    const { handleTrpcError } = await import('~/composables/useTrpc')
    const errorMessage = handleTrpcError(err)
    showError(errorMessage || 'Failed to remove date block')
  } finally {
    removingId.value = null
  }
}

/**
 * Clear the form and reset state
 */
const clearForm = () => {
  selectedDates.value = null
  blockForm.value = {
    reason: '',
    description: ''
  }
  formErrors.value = { reason: '' }
}

/**
 * Quick block a specific date with default reason
 */
const quickBlock = async (date: Date, label: string) => {
  isQuickBlocking.value = true
  
  try {
    const dateStr = formatDateISO(date)
    
    await trpc.calendar.addOverride.mutate({
      dateFrom: dateStr,
      dateTo: dateStr,
      reason: `Quick Block - ${label}`,
      description: `Quickly blocked via admin dashboard`
    })
    
    showSuccess(`${label} blocked successfully`)
    emit('refresh')
    
    // FIX: Also refresh the centralized calendar store
    await refreshCalendarStore()
  } catch (err: any) {
    console.error('Error quick blocking date:', err)
    const { handleTrpcError } = await import('~/composables/useTrpc')
    const errorMessage = handleTrpcError(err)
    showError(errorMessage || 'Failed to block date')
  } finally {
    isQuickBlocking.value = false
  }
}

/**
 * Quick block today
 */
const quickBlockToday = () => {
  quickBlock(new Date(), 'Today')
}

/**
 * Quick block tomorrow
 */
const quickBlockTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  quickBlock(tomorrow, 'Tomorrow')
}
</script>

<style scoped>
/* Calendar section container */
.calendar-section {
  position: relative;
  z-index: 1;
}

/* Calendar container */
.calendar-container {
  display: flex;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

/* Form section */
.form-section {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

/* Override vue-datepicker styles to match dark theme */
:deep(.dp__theme_dark) {
  --dp-background-color: transparent;
  --dp-text-color: #ffffff;
  --dp-hover-color: #334155;
  --dp-hover-text-color: #ffffff;
  --dp-hover-icon-color: #ffffff;
  --dp-primary-color: #06b6d4;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #475569;
  --dp-border-color: transparent;
  --dp-menu-border-color: transparent;
  --dp-border-color-hover: #06b6d4;
  --dp-disabled-color: #475569;
  --dp-scroll-bar-background: #334155;
  --dp-scroll-bar-color: #64748b;
  --dp-icon-color: #94a3b8;
  --dp-highlight-color: rgba(6, 182, 212, 0.1);
}

/* Main container */
:deep(.dp__main) {
  width: 100% !important;
  max-width: 100% !important;
  --dp-menu-width: 100% !important;
}

/* Outer menu wrap */
:deep(.dp__outer_menu_wrap) {
  width: 100% !important;
  max-width: 100% !important;
}

/* Menu container */
:deep(.dp__menu) {
  width: 100% !important;
  max-width: 100% !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.dp__menu_inner) {
  width: 100% !important;
  padding: 0 !important;
}

/* Calendar instance */
:deep(.dp__instance_calendar) {
  width: 100% !important;
  max-width: 100% !important;
}

/* Flex display containers */
:deep(.dp__flex_display) {
  width: 100% !important;
}

/* Hide the empty first child div */
:deep(.dp__flex_display > div:first-child:not(.dp__outer_menu_wrap)) {
  display: none !important;
}

/* Make the calendar menu wrapper fill the container */
:deep(.dp__flex_display > .dp__outer_menu_wrap),
:deep(.dp__flex_display > div:last-child) {
  width: 100% !important;
  flex: 1 1 100% !important;
}

/* Calendar wrap */
:deep(.dp__calendar_wrap) {
  width: 100% !important;
}

/* Calendar grid */
:deep(.dp__calendar) {
  width: 100% !important;
  font-family: inherit;
}

/* Calendar rows */
:deep(.dp__calendar_row) {
  display: flex !important;
  width: 100% !important;
  margin: 0 !important;
  gap: 4px;
}

/* Calendar items */
:deep(.dp__calendar_item) {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  max-width: none !important;
  padding: 2px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* Calendar header row */
:deep(.dp__calendar_header) {
  display: flex !important;
  width: 100% !important;
  font-weight: 600;
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  gap: 4px;
  margin-bottom: 8px;
}

:deep(.dp__calendar_header_item) {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  max-width: none !important;
  padding: 0.5rem 0 !important;
  text-align: center !important;
}

/* Cell inner styling */
:deep(.dp__cell_inner) {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 1 / 1;
  min-height: 36px;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Month/Year header */
:deep(.dp__month_year_row) {
  width: 100%;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.dp__month_year_wrap) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.dp__month_year_select) {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}

:deep(.dp__month_year_select:hover) {
  background-color: #334155;
}

/* Navigation arrows */
:deep(.dp__inner_nav) {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.dp__inner_nav:hover) {
  background-color: #334155;
}

:deep(.dp__inner_nav svg) {
  width: 20px;
  height: 20px;
}

:deep(.dp__today) {
  border: 2px solid #06b6d4;
}

:deep(.dp__active_date) {
  background-color: #06b6d4;
  color: #ffffff;
}

:deep(.dp__range_start),
:deep(.dp__range_end) {
  background-color: #06b6d4;
}

:deep(.dp__range_between) {
  background-color: rgba(6, 182, 212, 0.2);
}

/* Hide time picker elements */
:deep(.dp__time_input),
:deep(.dp__time_col),
:deep(.dp__time_display),
:deep(.dp__action_row),
:deep(.dp__selection_preview),
:deep(.dp__action_buttons),
:deep(.dp__time_picker_overlay_container),
:deep(.dp__button),
:deep(.dp__overlay_container),
:deep([aria-label="Open time picker"]) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  overflow: hidden !important;
}

/* Mobile responsive */
@media (max-width: 1024px) {
  .calendar-container {
    max-width: 100%;
  }
}
</style>
