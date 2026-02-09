<template>
  <div class="date-picker-wrapper">
    <VueDatePicker 
      v-model="localDate"
      :dark="true"
      :min-date="minDate || new Date()"
      :placeholder="placeholder"
      :format="format"
      :enable-time-picker="false"
      auto-apply
      :required="required"
      :disabled="disabled || isLoadingAvailability"
      :loading="isLoadingAvailability"
      :disabled-dates="disabledDatesFunction"
      :class="customClass"
      @update:model-value="handleUpdate"
    >
      <template #dp-input="{ value }">
        <div class="dp-custom-input" :class="{ 'dp-custom-input--loading': isLoadingAvailability }">
          <Icon v-if="!isLoadingAvailability" name="mdi:calendar" class="w-5 h-5 text-slate-400" />
          <Icon v-else name="mdi:loading" class="w-5 h-5 animate-spin text-cyan-400" />
          <span :class="value ? 'text-white' : 'text-slate-500'">
            {{ value || placeholder }}
          </span>
          <!-- Small loading indicator when fetching availability -->
          <span v-if="isLoadingAvailability" class="ml-auto text-xs text-cyan-400/70">
            Loading dates...
          </span>
        </div>
      </template>
    </VueDatePicker>
    
    <!-- Availability status indicator -->
    <div v-if="showAvailabilityStatus && localDate" class="mt-2 text-sm">
      <div v-if="isLoadingAvailability" class="flex items-center gap-2 text-slate-400">
        <Icon name="mdi:loading" class="w-4 h-4 animate-spin" />
        <span>Checking availability...</span>
      </div>
      <div v-else-if="isSelectedDateAvailable" class="flex items-center gap-2 text-green-400">
        <Icon name="mdi:check-circle" class="w-4 h-4" />
        <span>This date is available</span>
      </div>
      <div v-else class="flex items-center gap-2 text-red-400">
        <Icon name="mdi:alert-circle" class="w-4 h-4" />
        <span>This date is unavailable — please choose another date</span>
      </div>
    </div>

    <!-- Calendar store error indicator -->
    <div v-if="checkAvailability && calendarStore.error && !isLoadingAvailability" class="mt-2 text-sm">
      <div class="flex items-center gap-2 text-amber-400">
        <Icon name="mdi:alert" class="w-4 h-4" />
        <span>Could not load availability — some dates may be unavailable</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useCalendarStore } from '~/stores/calendar'
import { storeToRefs } from 'pinia'

interface Props {
  modelValue?: string | Date | null
  placeholder?: string
  format?: string
  minDate?: Date | null
  required?: boolean
  disabled?: boolean
  customClass?: string
  /** Whether to check calendar availability (default: true) */
  checkAvailability?: boolean
  /** Whether to show availability status below the picker */
  showAvailabilityStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date',
  format: 'MM/dd/yyyy',
  minDate: null,
  required: false,
  disabled: false,
  customClass: '',
  checkAvailability: true,
  showAvailabilityStatus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'availability-change': [available: boolean]
}>()

// Calendar store integration
const calendarStore = useCalendarStore()
const { isLoading: isLoadingAvailability } = storeToRefs(calendarStore)

/**
 * FIX: Parse a date string (YYYY-MM-DD) into a local Date object correctly.
 * Using `new Date("2026-03-15")` parses as UTC midnight, which can display as
 * the previous day in timezones behind UTC (e.g., MST, PST).
 * Instead, we parse the parts manually and create a local date.
 */
const parseDateStringToLocal = (dateStr: string): Date | null => {
  if (!dateStr) return null
  
  // If it's already a Date object somehow
  if (dateStr instanceof Date) {
    return isNaN((dateStr as Date).getTime()) ? null : dateStr as unknown as Date
  }
  
  const str = String(dateStr)
  
  // Handle YYYY-MM-DD format (most common from our forms)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10)
    const month = parseInt(isoMatch[2], 10) - 1 // JS months are 0-indexed
    const day = parseInt(isoMatch[3], 10)
    const d = new Date(year, month, day)
    return isNaN(d.getTime()) ? null : d
  }
  
  // Handle ISO datetime strings (e.g., "2026-03-15T12:00:00Z")
  if (str.includes('T')) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      // Convert to local date (strip time)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
    return null
  }
  
  // Fallback: try native parsing but create local date from result
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  
  return null
}

/**
 * Format a local Date object to YYYY-MM-DD string using local date parts.
 */
const formatLocalDateToISO = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Local state - initialize with proper timezone handling
const localDate = ref<Date | null>(
  props.modelValue ? parseDateStringToLocal(props.modelValue as string) : null
)

/**
 * FIX: Use a function-based disabled dates check instead of an array.
 * This avoids the mismatch between UTC-noon Date objects in the store
 * and local Date objects used by VueDatePicker.
 * VueDatePicker calls this function with each date cell's local Date object.
 */
const disabledDatesFunction = computed(() => {
  if (!props.checkAvailability) {
    return undefined
  }
  
  // If no unavailable dates loaded yet, don't disable anything
  // (the loading state will indicate data is being fetched)
  if (!calendarStore.hasData || calendarStore.unavailableDateStrings.length === 0) {
    return undefined
  }
  
  // Return a function that VueDatePicker will call for each date cell
  // This compares using YYYY-MM-DD strings which avoids all timezone issues
  return (date: Date): boolean => {
    const dateStr = formatLocalDateToISO(date)
    return calendarStore.unavailableDateStrings.includes(dateStr)
  }
})

// Computed: Check if the currently selected date is available
const isSelectedDateAvailable = computed(() => {
  if (!localDate.value) return true
  return calendarStore.isDateAvailable(localDate.value)
})

// Fetch availability data on mount if checking is enabled
onMounted(async () => {
  if (props.checkAvailability) {
    await calendarStore.fetchUnavailableDates()
    
    // After data loads, re-check the currently selected date's availability
    if (localDate.value) {
      const isAvailable = calendarStore.isDateAvailable(localDate.value)
      emit('availability-change', isAvailable)
    }
  }
})

const handleUpdate = (value: Date | null) => {
  if (value) {
    // FIX: Use local date parts to create the YYYY-MM-DD string
    // VueDatePicker returns a local Date object, so getFullYear/getMonth/getDate are correct
    const dateString = formatLocalDateToISO(value)
    emit('update:modelValue', dateString)
    
    // Emit availability status
    const isAvailable = calendarStore.isDateAvailable(dateString)
    emit('availability-change', isAvailable)
  } else {
    emit('update:modelValue', '')
    emit('availability-change', true)
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // FIX: Use our timezone-safe parser instead of raw new Date()
    const newDate = parseDateStringToLocal(newValue as string)
    if (newDate) {
      // Only update if the date is actually different (compare by date string to avoid timezone issues)
      const newStr = formatLocalDateToISO(newDate)
      const currentStr = localDate.value ? formatLocalDateToISO(localDate.value) : ''
      if (newStr !== currentStr) {
        localDate.value = newDate
      }
    }
  } else {
    localDate.value = null
  }
})

// Watch for availability check prop changes
watch(() => props.checkAvailability, (shouldCheck) => {
  if (shouldCheck) {
    calendarStore.fetchUnavailableDates()
  }
})
</script>

<style scoped>
.date-picker-wrapper {
  width: 100%;
}

/* Custom input styling */
.dp-custom-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.dp-custom-input:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.dp-custom-input--loading {
  border-color: rgba(6, 182, 212, 0.3);
}

/* Override default vue-datepicker styles for dark theme */
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
  --dp-success-color: #10b981;
  --dp-success-color-disabled: #065f46;
  --dp-icon-color: #94a3b8;
  --dp-danger-color: #ef4444;
  --dp-highlight-color: rgba(6, 182, 212, 0.1);
}

:deep(.dp__input) {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.2s;
}

:deep(.dp__input:hover) {
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.dp__input:focus) {
  outline: none;
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
}

:deep(.dp__input::placeholder) {
  color: #64748b;
}

/* Hide the default VueDatePicker input icon since we use a custom #dp-input slot */
:deep(.dp__input_icon) {
  display: none;
}

:deep(.dp__calendar) {
  font-family: inherit;
}

:deep(.dp__calendar_header) {
  font-weight: 600;
}

:deep(.dp__today) {
  border: 1px solid #06b6d4;
}

:deep(.dp__active_date) {
  background-color: #06b6d4;
  color: #ffffff;
}

:deep(.dp__overlay) {
  background-color: rgba(15, 23, 42, 0.8);
}

/* Disabled dates styling - make them clearly unavailable */
:deep(.dp__cell_disabled) {
  opacity: 0.4;
  text-decoration: line-through;
  background-color: rgba(239, 68, 68, 0.1);
  color: #94a3b8 !important;
  cursor: not-allowed;
}

:deep(.dp__cell_disabled:hover) {
  background-color: rgba(239, 68, 68, 0.2);
}

/* Loading state */
:deep(.dp__input_wrap[aria-disabled="true"]) {
  opacity: 0.7;
  cursor: wait;
}
</style>
