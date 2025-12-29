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
      :disabled-dates="disabledDates"
      :class="customClass"
      @update:model-value="handleUpdate"
    >
      <template #input-icon>
        <Icon v-if="!isLoadingAvailability" name="mdi:calendar" class="w-5 h-5" />
        <Icon v-else name="mdi:loading" class="w-5 h-5 animate-spin" />
      </template>
      <template #dp-input="{ value }">
        <div class="dp-custom-input">
          <Icon v-if="!isLoadingAvailability" name="mdi:calendar" class="w-5 h-5 text-slate-400" />
          <Icon v-else name="mdi:loading" class="w-5 h-5 animate-spin text-cyan-400" />
          <span :class="value ? 'text-white' : 'text-slate-500'">
            {{ value || placeholder }}
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
        <span>This date is unavailable</span>
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
const { unavailableDates, isLoading: isLoadingAvailability } = storeToRefs(calendarStore)

// Local state
const localDate = ref<Date | null>(
  props.modelValue ? new Date(props.modelValue) : null
)

// Computed: Disabled dates for the date picker
const disabledDates = computed(() => {
  if (!props.checkAvailability) {
    return []
  }
  return unavailableDates.value
})

// Computed: Check if the currently selected date is available
const isSelectedDateAvailable = computed(() => {
  if (!localDate.value) return true
  return calendarStore.isDateAvailable(localDate.value)
})

// Fetch availability data on mount if checking is enabled
onMounted(() => {
  if (props.checkAvailability) {
    calendarStore.fetchUnavailableDates()
  }
})

const handleUpdate = (value: Date | null) => {
  if (value) {
    // Convert to YYYY-MM-DD format for HTML date inputs compatibility
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
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
    const newDate = new Date(newValue)
    // Only update if the date is actually different
    if (!localDate.value || newDate.getTime() !== localDate.value.getTime()) {
      localDate.value = newDate
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

:deep(.dp__input_icon) {
  color: #94a3b8;
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
