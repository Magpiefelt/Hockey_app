<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Calendar</h1>
        <p class="text-slate-400">Manage availability and block dates for your business</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl">
          <span class="text-sm text-slate-400">
            <span class="font-semibold text-white">{{ overrides.length }}</span> blocked dates
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p class="text-slate-400">Loading calendar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
      </div>
      <p class="text-red-400 text-lg mb-4">{{ error }}</p>
      <button 
        @click="fetchOverrides"
        class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
      >
        Try Again
      </button>
    </div>

    <!-- Calendar Management Content -->
    <div v-else class="space-y-6">
      <!-- Calendar Manager Component -->
      <AdminCalendarManager 
        :overrides="overrides"
        @refresh="fetchOverrides"
      />
    </div>

    <!-- Info Section -->
    <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
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
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const trpc = useTrpc()
const { showError, showSuccess } = useNotification()

const loading = ref(true)
const error = ref<string | null>(null)
const overrides = ref<any[]>([])

const fetchOverrides = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await trpc.calendar.getOverrides.query()
    overrides.value = data
    
    // Also refresh the centralized calendar store so the public-facing
    // AvailabilityCalendar component stays in sync with admin changes
    try {
      const { useCalendarStore } = await import('~/stores/calendar')
      const calendarStore = useCalendarStore()
      await calendarStore.refresh()
    } catch (storeErr) {
      // Non-critical - public calendar will refresh on its own schedule
      console.warn('Calendar store refresh failed:', storeErr)
    }
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    error.value = handleTrpcError(err)
    showError('Failed to load calendar overrides')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOverrides()
})

useHead({
  title: 'Calendar Management - Elite Sports DJ Admin',
  meta: [
    { name: 'description', content: 'Manage calendar availability and blocked dates' }
  ]
})
</script>
