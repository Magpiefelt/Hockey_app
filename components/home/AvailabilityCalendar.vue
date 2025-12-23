<template>
  <section id="availability" class="section relative bg-dark-primary overflow-hidden">
    <!-- Texture Background -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="
        background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(6, 182, 212, 0.3) 35px, rgba(6, 182, 212, 0.3) 70px);
      "></div>
    </div>
    
    <div class="container relative z-10">
      <!-- Section Header -->
      <RevealOnScroll animation="fade-up">
        <div class="mx-auto mb-12 max-w-3xl text-center">
          <h2 class="mb-4 text-4xl font-black text-white md:text-5xl">
            Check Our <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Availability</span>
          </h2>
          <p class="text-lg text-slate-300">
            See when we're available for your next event
          </p>
        </div>
      </RevealOnScroll>

      <RevealOnScroll animation="fade-up">
        <div class="mx-auto max-w-4xl">
          <div class="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 backdrop-blur-sm">
            <!-- Calendar -->
            <div class="calendar-container mb-6">
              <VueDatePicker 
                v-model="selectedDate"
                :dark="true"
                inline
                auto-apply
                :enable-time-picker="false"
                :disabled-dates="unavailableDates"
                :min-date="new Date()"
                @update:model-value="handleDateSelect"
              />
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 rounded bg-cyan-500"></div>
                <span class="text-slate-300">Today</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 rounded bg-slate-600"></div>
                <span class="text-slate-300">Available</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 rounded bg-slate-800 opacity-50"></div>
                <span class="text-slate-300">Unavailable</span>
              </div>
            </div>

            <!-- Selected Date Info -->
            <div v-if="selectedDate" class="mt-6 text-center">
              <p class="text-slate-300">
                Selected: <span class="font-semibold text-white">{{ formatDate(selectedDate) }}</span>
              </p>
              <p v-if="isDateAvailable(selectedDate)" class="mt-2 text-green-400">
                ✓ This date is available
              </p>
              <p v-else class="mt-2 text-red-400">
                ✗ This date is unavailable
              </p>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const trpc = useTrpc()
const selectedDate = ref<Date | null>(null)
const unavailableDates = ref<Date[]>([])

// Fetch unavailable dates from API
onMounted(async () => {
  try {
    const dates = await trpc.calendar.getUnavailableDates.query()
    unavailableDates.value = dates.map((dateStr: string) => new Date(dateStr))
  } catch (error) {
    console.error('Failed to load unavailable dates:', error)
  }
})

const handleDateSelect = (date: Date | null) => {
  selectedDate.value = date
}

const isDateAvailable = (date: Date): boolean => {
  const dateStr = formatDateISO(date)
  return !unavailableDates.value.some(d => formatDateISO(d) === dateStr)
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatDateISO = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  max-width: 400px;
  margin: 0 auto;
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

:deep(.dp__cell_disabled) {
  opacity: 0.3;
  text-decoration: line-through;
}

:deep(.dp__calendar_item) {
  padding: 0.75rem;
}

@media (max-width: 640px) {
  :deep(.dp__calendar) {
    max-width: 100%;
  }
}
</style>
