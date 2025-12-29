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
        <div class="calendar-outer-container">
          <div class="calendar-card">
            <!-- Calendar -->
            <div class="calendar-wrapper">
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
                :action-row="{ showNow: false, showPreview: false, showSelect: false, showCancel: false }"
                @update:model-value="handleDateSelect"
              />
            </div>

            <!-- Legend -->
            <div class="calendar-legend">
              <div class="legend-item">
                <div class="legend-dot legend-today"></div>
                <span>Today</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot legend-available"></div>
                <span>Available</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot legend-unavailable"></div>
                <span>Unavailable</span>
              </div>
            </div>

            <!-- Selected Date Info -->
            <div v-if="selectedDate" class="selected-date-info">
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
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false
  }
  const dateStr = formatDateISO(date)
  return !unavailableDates.value.some(d => formatDateISO(d) === dateStr)
}

const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid date'
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatDateISO = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped>
/* Outer container - centers and constrains max width */
.calendar-outer-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Calendar card styling */
.calendar-card {
  width: 100%;
  border-radius: 1rem;
  border: 2px solid rgba(59, 130, 246, 0.3);
  background: linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.1);
}

@media (min-width: 640px) {
  .calendar-card {
    padding: 2rem;
  }
}

@media (min-width: 768px) {
  .calendar-card {
    padding: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .calendar-card {
    padding: 3rem;
  }
}

/* Calendar wrapper - ensures calendar fills width */
.calendar-wrapper {
  width: 100%;
}

/* Legend styling */
.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 640px) {
  .calendar-legend {
    gap: 2rem;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.legend-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 0.375rem;
}

.legend-today {
  background-color: #06b6d4;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
}

.legend-available {
  background-color: #475569;
}

.legend-unavailable {
  background-color: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
}

/* Selected date info */
.selected-date-info {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

/* ========================================
   VUE DATEPICKER OVERRIDES
   ======================================== */

/* Main container - MUST fill width */
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

/* Override the inline style div that sets --dp-menu-width */
:deep(.dp__outer_menu_wrap > .dp__menu) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.dp__menu > div[style*="--dp-menu-width"]) {
  width: 100% !important;
  max-width: 100% !important;
  --dp-menu-width: 100% !important;
}

/* Menu container */
:deep(.dp__menu) {
  width: 100% !important;
  max-width: 100% !important;
  border: none !important;
  background: transparent !important;
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

/* Hide the empty first child div (input wrapper in inline mode) */
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

/* Calendar rows - flexbox for equal distribution */
:deep(.dp__calendar_row) {
  display: flex !important;
  width: 100% !important;
  margin: 0 !important;
  gap: 6px;
}

/* Calendar items - equal flex sizing */
:deep(.dp__calendar_item) {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  max-width: none !important;
  padding: 3px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
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
  gap: 6px;
  margin-bottom: 12px;
}

:deep(.dp__calendar_header_item) {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  max-width: none !important;
  padding: 0.75rem 0 !important;
  text-align: center !important;
}

/* Cell inner styling - LARGER cells */
:deep(.dp__cell_inner) {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 1 / 1;
  min-height: 44px;
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
  width: 100%;
  margin-bottom: 1rem;
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
  font-size: 1.25rem;
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
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.dp__inner_nav:hover) {
  background-color: #334155;
}

:deep(.dp__inner_nav svg) {
  width: 24px;
  height: 24px;
}

/* Dark theme color overrides */
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

/* COMPLETELY HIDE TIME PICKER AND ACTION ELEMENTS */
:deep(.dp__action_row),
:deep(.dp__selection_preview),
:deep(.dp__action_buttons),
:deep(.dp--tp-wrap),
:deep(.dp__time_display),
:deep(.dp__button),
:deep(.dp__overlay_action),
:deep(.dp__time_input),
:deep(.dp__time_col),
:deep([aria-label="Open time picker"]) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  pointer-events: none !important;
}

/* ========================================
   RESPONSIVE ADJUSTMENTS
   ======================================== */

/* Mobile - smaller cells */
@media (max-width: 480px) {
  :deep(.dp__cell_inner) {
    min-height: 36px;
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
    font-size: 0.7rem;
    padding: 0.5rem 0 !important;
  }
  
  :deep(.dp__calendar_row) {
    gap: 3px;
  }
  
  :deep(.dp__calendar_header) {
    gap: 3px;
  }
}

/* Tablet */
@media (min-width: 640px) {
  :deep(.dp__cell_inner) {
    min-height: 52px;
    font-size: 1.125rem;
  }
  
  :deep(.dp__calendar_row) {
    gap: 8px;
  }
  
  :deep(.dp__calendar_header) {
    gap: 8px;
  }
}

/* Desktop */
@media (min-width: 768px) {
  :deep(.dp__cell_inner) {
    min-height: 60px;
    font-size: 1.25rem;
  }
  
  :deep(.dp__calendar_header_item) {
    font-size: 0.9rem;
  }
  
  :deep(.dp__calendar_row) {
    gap: 10px;
  }
  
  :deep(.dp__calendar_header) {
    gap: 10px;
  }
}

/* Large desktop */
@media (min-width: 1024px) {
  :deep(.dp__cell_inner) {
    min-height: 68px;
    font-size: 1.375rem;
  }
}
</style>
