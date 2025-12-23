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
        <div class="mx-auto max-w-2xl">
          <div class="calendar-card rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-4 sm:p-6 md:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/10">
            <!-- Calendar -->
            <div class="calendar-container">
              <VueDatePicker 
                v-model="selectedDate"
                :dark="true"
                inline
                auto-apply
                :enable-time-picker="false"
                :disabled-dates="unavailableDates"
                :min-date="new Date()"
                :six-weeks="true"
                :month-change-on-scroll="false"
                month-name-format="long"
                @update:model-value="handleDateSelect"
              />
            </div>

            <!-- Legend -->
            <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-6 pt-6 border-t border-white/10">
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 rounded-md bg-cyan-500 shadow-sm shadow-cyan-500/50"></div>
                <span class="text-sm text-slate-300">Today</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 rounded-md bg-slate-600"></div>
                <span class="text-sm text-slate-300">Available</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 rounded-md bg-slate-800/80 border border-slate-700"></div>
                <span class="text-sm text-slate-300">Unavailable</span>
              </div>
            </div>

            <!-- Selected Date Info -->
            <div v-if="selectedDate" class="mt-6 pt-6 border-t border-white/10 text-center">
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
  width: 100%;
}

/* Force the datepicker to fill container width */
:deep(.dp__main) {
  width: 100% !important;
}

:deep(.dp__menu) {
  width: 100% !important;
  border: none !important;
  background: transparent !important;
}

:deep(.dp__menu_inner) {
  padding: 0 !important;
}

/* Make the calendar instance fill the width */
:deep(.dp__instance_calendar) {
  width: 100% !important;
}

:deep(.dp__flex_display) {
  width: 100% !important;
}

:deep(.dp__flex_display > div) {
  width: 100% !important;
}

/* Calendar grid should fill available space */
:deep(.dp__calendar) {
  width: 100% !important;
  font-family: inherit;
}

/* Calendar rows should use flexbox properly */
:deep(.dp__calendar_row) {
  display: flex !important;
  width: 100% !important;
  margin: 0 !important;
}

/* Each calendar item takes equal space */
:deep(.dp__calendar_item) {
  flex: 1 !important;
  padding: 2px !important;
  display: flex !important;
  justify-content: center !important;
}

/* Calendar header row */
:deep(.dp__calendar_header) {
  display: flex !important;
  width: 100% !important;
  font-weight: 600;
  font-size: 0.875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.dp__calendar_header_item) {
  flex: 1 !important;
  padding: 0.75rem 0 !important;
  text-align: center !important;
}

/* Cell styling */
:deep(.dp__cell_inner) {
  width: 100% !important;
  height: 48px !important;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Month/Year header */
:deep(.dp__month_year_row) {
  margin-bottom: 1rem;
  width: 100%;
}

:deep(.dp__month_year_select) {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

:deep(.dp__month_year_select:hover) {
  background-color: #334155;
}

/* Navigation arrows */
:deep(.dp__inner_nav) {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
}

:deep(.dp__inner_nav:hover) {
  background-color: #334155;
}

:deep(.dp__inner_nav svg) {
  width: 24px;
  height: 24px;
}

/* Dark theme overrides */
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
  --dp-disabled-color: #334155;
  --dp-disabled-color-text: #64748b;
  --dp-scroll-bar-background: #334155;
  --dp-scroll-bar-color: #64748b;
  --dp-icon-color: #94a3b8;
  --dp-highlight-color: rgba(6, 182, 212, 0.1);
  --dp-font-family: inherit;
}

/* Today styling */
:deep(.dp__today) {
  border: 2px solid #06b6d4 !important;
  background-color: rgba(6, 182, 212, 0.1) !important;
}

/* Active/Selected date */
:deep(.dp__active_date) {
  background-color: #06b6d4 !important;
  color: #ffffff !important;
}

/* Disabled dates */
:deep(.dp__cell_disabled) {
  opacity: 0.4;
  text-decoration: line-through;
  background-color: rgba(51, 65, 85, 0.3);
}

/* Hover state */
:deep(.dp__cell_inner:hover:not(.dp__cell_disabled)) {
  background-color: #334155;
}

/* COMPLETELY HIDE TIME PICKER ELEMENTS */
:deep(.dp__action_row),
:deep(.dp__selection_preview),
:deep(.dp__action_buttons),
:deep(.dp--tp-wrap),
:deep(.dp__time_display),
:deep(.dp__button),
:deep(.dp__overlay_action) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  overflow: hidden !important;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  :deep(.dp__cell_inner) {
    height: 40px !important;
    font-size: 0.875rem;
  }
  
  :deep(.dp__month_year_select) {
    font-size: 1rem;
    padding: 0.375rem 0.75rem;
  }
  
  :deep(.dp__inner_nav) {
    width: 36px;
    height: 36px;
  }
  
  :deep(.dp__calendar_header_item) {
    font-size: 0.75rem;
    padding: 0.5rem 0 !important;
  }
}

@media (min-width: 640px) {
  :deep(.dp__cell_inner) {
    height: 52px !important;
  }
}

@media (min-width: 768px) {
  :deep(.dp__cell_inner) {
    height: 56px !important;
    font-size: 1.125rem;
  }
}
</style>
