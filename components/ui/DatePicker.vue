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
      :disabled="disabled"
      :class="customClass"
      @update:model-value="handleUpdate"
    >
      <template #input-icon>
        <Icon name="mdi:calendar" class="w-5 h-5" />
      </template>
    </VueDatePicker>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

interface Props {
  modelValue?: string | Date | null
  placeholder?: string
  format?: string
  minDate?: Date | null
  required?: boolean
  disabled?: boolean
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date',
  format: 'MM/dd/yyyy',
  minDate: null,
  required: false,
  disabled: false,
  customClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localDate = ref<Date | null>(
  props.modelValue ? new Date(props.modelValue) : null
)

const handleUpdate = (value: Date | null) => {
  if (value) {
    // Convert to YYYY-MM-DD format for HTML date inputs compatibility
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    emit('update:modelValue', `${year}-${month}-${day}`)
  } else {
    emit('update:modelValue', '')
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localDate.value = new Date(newValue)
  } else {
    localDate.value = null
  }
})
</script>

<style scoped>
.date-picker-wrapper {
  width: 100%;
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
</style>
