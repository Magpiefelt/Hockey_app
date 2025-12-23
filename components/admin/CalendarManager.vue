<template>
  <div class="space-y-6">
    <!-- Add Date Block Section -->
    <div class="card p-6">
      <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="mdi:calendar-plus" class="w-6 h-6 text-brand-500" />
        Block Dates
      </h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Calendar Selection -->
        <div class="calendar-section">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Select Date(s) to Block
          </label>
          <div class="calendar-container">
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
              :action-row="{ showNow: false, showPreview: false, showSelect: false, showCancel: false }"
              @update:model-value="handleDateChange"
            />
          </div>
        </div>

        <!-- Block Details Form -->
        <div class="form-section">
          <div class="space-y-4">
            <UiInput
              v-model="blockForm.reason"
              label="Reason *"
              placeholder="e.g., Vacation, Holiday, Personal"
              :error="formErrors.reason"
            />

            <UiTextarea
              v-model="blockForm.description"
              label="Description (Optional)"
              placeholder="Additional details about this block..."
              rows="4"
            />

            <!-- Date Selection Display -->
            <div v-if="dateSelectionDisplay" class="date-selection-info">
              <Icon name="mdi:calendar-range" class="w-4 h-4 text-brand-400" />
              <span>{{ dateSelectionDisplay }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="button-group">
              <UiButton
                @click="addBlock"
                :disabled="!canAddBlock || isAdding"
                :loading="isAdding"
                class="flex-1"
              >
                <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
                Add Block
              </UiButton>

              <UiButton
                @click="clearForm"
                variant="outline"
              >
                Clear
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Blocks Section -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="mdi:calendar-remove" class="w-6 h-6 text-accent-500" />
          Current Blocks
        </h2>
        <span class="text-sm text-slate-400">
          {{ overrides.length }} active block{{ overrides.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="overrides.length === 0" class="text-center py-12">
        <Icon name="mdi:calendar-check" class="w-16 h-16 text-slate-600 mx-auto mb-3" />
        <p class="text-slate-400">No dates are currently blocked</p>
        <p class="text-sm text-slate-500 mt-1">Use the form above to block dates</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="override in sortedOverrides"
          :key="override.id"
          class="flex items-center justify-between p-4 rounded-lg bg-dark-secondary border border-white/10 hover:border-brand-500/30 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <Icon name="mdi:calendar-blank" class="w-5 h-5 text-brand-400" />
              <span class="text-white font-semibold">
                {{ formatDateRange(override.date_from, override.date_to) }}
              </span>
            </div>
            <p class="text-sm text-slate-300 ml-8">
              <span class="font-medium">Reason:</span> {{ override.reason }}
            </p>
            <p v-if="override.description" class="text-sm text-slate-400 ml-8 mt-1">
              {{ override.description }}
            </p>
            <p class="text-xs text-slate-500 ml-8 mt-1">
              Added {{ formatDate(override.created_at) }}
              <span v-if="override.created_by_name"> by {{ override.created_by_name }}</span>
            </p>
          </div>

          <UiButton
            @click="removeBlock(override.id)"
            variant="outline"
            size="sm"
            :loading="removingId === override.id"
            :disabled="removingId !== null"
          >
            <Icon name="mdi:delete" class="w-4 h-4 mr-1" />
            Remove
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="card p-6 bg-blue-500/10 border-blue-500/30">
      <div class="flex gap-3">
        <Icon name="mdi:information" class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div class="text-sm text-slate-300 space-y-2">
          <p>
            <strong class="text-white">Note:</strong> Blocked dates will automatically appear as unavailable on the public calendar and in the booking system.
          </p>
          <p>
            Dates with confirmed orders are also automatically shown as unavailable and don't need to be manually blocked.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

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

const selectedDates = ref<Date[] | null>(null)
const blockForm = ref({
  reason: '',
  description: ''
})
const formErrors = ref({
  reason: ''
})
const isAdding = ref(false)
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
 */
const formatDate = (date: string | Date): string => {
  if (!date) return 'Invalid date'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
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
</script>

<style scoped>
/* Calendar section container */
.calendar-section {
  position: relative;
  z-index: 1;
}

/* Calendar container - constrain width and center */
.calendar-container {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  overflow: hidden;
}

/* Form section - ensure it's above calendar */
.form-section {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

/* Date selection info box */
.date-selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Button group */
.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Override vue-datepicker styles to match dark theme */
:deep(.dp__theme_dark) {
  --dp-background-color: #1e293b;
  --dp-text-color: #ffffff;
  --dp-hover-color: #334155;
  --dp-hover-text-color: #ffffff;
  --dp-hover-icon-color: #ffffff;
  --dp-primary-color: #06b6d4;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #475569;
  --dp-border-color: rgba(255, 255, 255, 0.1);
  --dp-menu-border-color: rgba(255, 255, 255, 0.1);
  --dp-border-color-hover: #06b6d4;
  --dp-disabled-color: #475569;
  --dp-scroll-bar-background: #334155;
  --dp-scroll-bar-color: #64748b;
  --dp-icon-color: #94a3b8;
  --dp-highlight-color: rgba(6, 182, 212, 0.1);
}

/* Ensure calendar fits within container */
:deep(.dp__main) {
  width: 100%;
  max-width: 320px;
}

:deep(.dp__instance_calendar) {
  width: 100%;
}

:deep(.dp__calendar) {
  font-family: inherit;
  width: 100%;
}

:deep(.dp__calendar_wrap) {
  width: 100%;
}

:deep(.dp__calendar_header) {
  font-weight: 600;
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

:deep(.dp__calendar_item) {
  padding: 0.5rem;
}

/* Hide time picker elements completely */
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

/* Ensure proper stacking context */
:deep(.dp__menu) {
  position: relative;
  z-index: 1;
  border: none !important;
  box-shadow: none !important;
}

:deep(.dp__menu_inner) {
  padding-bottom: 0 !important;
}

/* Hide any action row or button container */
:deep(.dp__action_row) {
  display: none !important;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .calendar-container {
    max-width: 100%;
  }
  
  :deep(.dp__main) {
    max-width: 100%;
  }
  
  :deep(.dp__calendar) {
    max-width: 100%;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group > * {
    width: 100%;
  }
}
</style>
