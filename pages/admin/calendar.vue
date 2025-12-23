<template>
  <div class="min-h-screen px-4 py-12 bg-dark-primary">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Calendar <span class="gradient-text">Management</span>
        </h1>
        <p class="text-lg text-slate-400">
          Manage availability and block dates for your business
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 rounded-xl border border-error-500/30 bg-error-500/10 text-center">
        <p class="text-error-400 text-lg mb-4">{{ error }}</p>
        <UiButton 
          @click="fetchOverrides"
          variant="outline"
        >
          Try Again
        </UiButton>
      </div>

      <!-- Calendar Management Content -->
      <div v-else class="space-y-6">
        <!-- Calendar Manager Component -->
        <AdminCalendarManager 
          :overrides="overrides"
          @refresh="fetchOverrides"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
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
