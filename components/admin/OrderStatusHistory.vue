<template>
  <div class="space-y-4">
    <h4 class="text-lg font-bold text-white flex items-center gap-2">
      <Icon name="mdi:history" class="w-5 h-5 text-cyan-400" />
      Status History
    </h4>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <Icon name="mdi:loading" class="w-8 h-8 text-cyan-400 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
      <p class="text-sm text-red-400 flex items-center gap-2">
        <Icon name="mdi:alert-circle" class="w-5 h-5" />
        {{ error }}
      </p>
    </div>

    <!-- Timeline -->
    <div v-else-if="history && history.length > 0" class="relative">
      <!-- Timeline Line -->
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" aria-hidden="true"></div>

      <!-- Timeline Items -->
      <div class="space-y-6">
        <div
          v-for="(item, index) in history"
          :key="item.id"
          class="relative pl-12"
        >
          <!-- Timeline Dot -->
          <div
            :class="[
              'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
              getStatusColor(item.new_status).bg,
              getStatusColor(item.new_status).border
            ]"
          >
            <Icon
              :name="getStatusIcon(item.new_status)"
              class="w-4 h-4 text-white"
            />
          </div>

          <!-- Timeline Content -->
          <div class="p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div class="flex items-start justify-between mb-2">
              <div>
                <span
                  :class="[
                    'inline-block px-3 py-1 rounded-full text-xs font-semibold',
                    getStatusColor(item.new_status).badge
                  ]"
                >
                  {{ formatStatus(item.new_status) }}
                </span>
              </div>
              <time class="text-xs text-slate-300" :datetime="item.created_at">
                {{ formatDate(item.created_at) }}
              </time>
            </div>

            <p v-if="item.notes" class="text-sm text-slate-300 mt-2">
              {{ item.notes }}
            </p>

            <div v-if="item.changed_by_name" class="mt-2 text-xs text-slate-400">
              Changed by: {{ item.changed_by_name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <Icon name="mdi:timeline-clock-outline" class="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p class="text-slate-400">No status history available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface StatusHistoryItem {
  id: number
  quote_id: number
  old_status: string | null
  new_status: string
  notes: string | null
  changed_by: number | null
  changed_by_name: string | null
  created_at: string
}

interface Props {
  orderId: number
}

const props = defineProps<Props>()

const history = ref<StatusHistoryItem[]>([])
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  await loadHistory()
})

async function loadHistory() {
  isLoading.value = true
  error.value = ''

  try {
    const trpc = useTrpc()
    const result = await trpc.admin.getOrderStatusHistory.query({ orderId: props.orderId })
    history.value = result
  } catch (err: any) {
    error.value = err.message || 'Failed to load status history'
  } finally {
    isLoading.value = false
  }
}

const { getStatusLabel: formatStatus, getStatusColors: getStatusColor } = useOrderStatus()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    'submitted': 'mdi:email-send',
    'quoted': 'mdi:file-document-edit',
    'invoiced': 'mdi:receipt',
    'paid': 'mdi:cash-check',
    'in_progress': 'mdi:progress-clock',
    'completed': 'mdi:check-circle',
    'cancelled': 'mdi:close-circle'
  }
  return iconMap[status] || 'mdi:circle'
}



defineExpose({
  refresh: loadHistory
})
</script>
