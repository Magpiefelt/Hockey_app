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
        <div>
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
              multi-calendars
            />
          </div>
        </div>

        <!-- Block Details Form -->
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

          <div class="flex gap-3">
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

          <div v-if="selectedDates" class="text-sm text-slate-400">
            <p v-if="Array.isArray(selectedDates) && selectedDates.length === 2">
              Blocking: {{ formatDate(selectedDates[0]) }} to {{ formatDate(selectedDates[1]) }}
            </p>
            <p v-else-if="selectedDates">
              Blocking: {{ formatDate(selectedDates) }}
            </p>
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

const selectedDates = ref<Date | Date[] | null>(null)
const blockForm = ref({
  reason: '',
  description: ''
})
const formErrors = ref({
  reason: ''
})
const isAdding = ref(false)
const removingId = ref<number | null>(null)

const canAddBlock = computed(() => {
  return selectedDates.value && blockForm.value.reason.trim().length > 0
})

const sortedOverrides = computed(() => {
  return [...props.overrides].sort((a, b) => {
    return new Date(a.date_from).getTime() - new Date(b.date_from).getTime()
  })
})

const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d)
}

const formatDateRange = (dateFrom: string, dateTo: string): string => {
  const from = new Date(dateFrom)
  const to = new Date(dateTo)
  
  // Check if it's a single day
  if (dateFrom === dateTo) {
    return formatDate(from)
  }
  
  return `${formatDate(from)} - ${formatDate(to)}`
}

const formatDateISO = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const validateForm = (): boolean => {
  formErrors.value = { reason: '' }
  
  if (!blockForm.value.reason.trim()) {
    formErrors.value.reason = 'Reason is required'
    return false
  }
  
  if (!selectedDates.value) {
    showError('Please select a date or date range')
    return false
  }
  
  return true
}

const addBlock = async () => {
  if (!validateForm()) return
  
  isAdding.value = true
  
  try {
    let dateFrom: string
    let dateTo: string
    
    if (Array.isArray(selectedDates.value) && selectedDates.value.length === 2) {
      // Date range
      dateFrom = formatDateISO(selectedDates.value[0])
      dateTo = formatDateISO(selectedDates.value[1])
    } else if (selectedDates.value) {
      // Single date
      const date = Array.isArray(selectedDates.value) ? selectedDates.value[0] : selectedDates.value
      dateFrom = formatDateISO(date)
      dateTo = dateFrom
    } else {
      showError('Invalid date selection')
      return
    }
    
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
    const { handleTrpcError } = await import('~/composables/useTrpc')
    const errorMessage = handleTrpcError(err)
    showError(errorMessage || 'Failed to add date block')
  } finally {
    isAdding.value = false
  }
}

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
    const { handleTrpcError } = await import('~/composables/useTrpc')
    const errorMessage = handleTrpcError(err)
    showError(errorMessage || 'Failed to remove date block')
  } finally {
    removingId.value = null
  }
}

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
.calendar-container {
  display: flex;
  justify-content: center;
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

:deep(.dp__calendar) {
  font-family: inherit;
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
  padding: 0.75rem;
}

@media (max-width: 768px) {
  :deep(.dp__calendar) {
    max-width: 100%;
  }
}
</style>
