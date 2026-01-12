<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoadingTransitions" class="flex items-center gap-2 text-slate-400">
      <Icon name="mdi:loading" class="w-5 h-5 animate-spin" />
      <span>Loading status options...</span>
    </div>

    <!-- Status Selector -->
    <div v-else class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <label for="status-select" class="block text-sm font-medium text-slate-300 mb-2">
          Change Status
        </label>
        <select
          id="status-select"
          v-model="selectedStatus"
          class="w-full px-4 py-2.5 bg-dark-primary border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          :disabled="isUpdating || isTerminalStatus"
        >
          <option :value="currentStatus" disabled>
            Current: {{ currentStatusLabel }}
          </option>
          <option
            v-for="transition in allowedTransitions"
            :key="transition.status"
            :value="transition.status"
          >
            {{ transition.label }}
          </option>
        </select>
        <p v-if="isTerminalStatus" class="mt-1 text-xs text-slate-500">
          This is a terminal status and cannot be changed.
        </p>
      </div>

      <div class="flex items-end">
        <button
          @click="handleStatusChange"
          :disabled="!canUpdate || isUpdating"
          class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          <Icon v-if="isUpdating" name="mdi:loading" class="w-5 h-5 animate-spin" />
          <span>{{ isUpdating ? 'Updating...' : 'Update Status' }}</span>
        </button>
      </div>
    </div>

    <!-- Status Change Notes (optional) -->
    <div v-if="selectedStatus !== currentStatus && !isLoadingTransitions">
      <label for="status-notes" class="block text-sm font-medium text-slate-300 mb-2">
        Notes (Optional)
        <span class="text-slate-500 font-normal ml-1">Explain the reason for this change</span>
      </label>
      <textarea
        id="status-notes"
        v-model="statusNotes"
        rows="2"
        :disabled="isUpdating"
        class="w-full px-4 py-2.5 bg-dark-primary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 resize-none"
        placeholder="e.g., Customer requested changes, Payment received, etc."
      ></textarea>
    </div>

    <!-- Transition Warning -->
    <div
      v-if="selectedStatus !== currentStatus && !isValidTransition && !isLoadingTransitions"
      class="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
    >
      <Icon name="mdi:alert" class="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 class="text-yellow-400 font-semibold mb-1">Invalid Transition</h4>
        <p class="text-sm text-slate-300">
          Cannot change from "{{ currentStatusLabel }}" to "{{ getStatusLabel(selectedStatus) }}".
          Please select a valid status transition.
        </p>
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="showSuccess"
      class="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3"
    >
      <Icon name="mdi:check-circle" class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 class="text-green-400 font-semibold mb-1">Status Updated</h4>
        <p class="text-sm text-slate-300">
          Order status successfully changed to "{{ currentStatusLabel }}".
        </p>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
    >
      <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <h4 class="text-red-400 font-semibold mb-1">Error</h4>
        <p class="text-sm text-slate-300">{{ error }}</p>
      </div>
      <button @click="error = ''" class="text-red-400 hover:text-red-300">
        <Icon name="mdi:close" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  orderId: number
  currentStatus: string
}

interface Emits {
  (e: 'statusChanged', newStatus: string): void
}

interface StatusTransition {
  status: string
  label: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const trpc = useTrpc()

const selectedStatus = ref(props.currentStatus)
const statusNotes = ref('')
const isUpdating = ref(false)
const isLoadingTransitions = ref(true)
const error = ref('')
const showSuccess = ref(false)

// Dynamic transitions from backend
const allowedTransitions = ref<StatusTransition[]>([])
const currentStatusLabel = ref(props.currentStatus)
const isTerminalStatus = ref(false)

// Fetch allowed transitions from backend
async function fetchAllowedTransitions() {
  isLoadingTransitions.value = true
  try {
    const result = await trpc.admin.getAllowedTransitions.query({
      currentStatus: props.currentStatus
    })
    
    allowedTransitions.value = result.allowedTransitions
    currentStatusLabel.value = result.currentStatusLabel
    isTerminalStatus.value = result.isTerminal
  } catch (err: any) {
    console.error('Failed to fetch status transitions:', err)
    // Fallback to hardcoded transitions if backend fails
    allowedTransitions.value = getFallbackTransitions(props.currentStatus)
    currentStatusLabel.value = formatStatus(props.currentStatus)
    isTerminalStatus.value = allowedTransitions.value.length === 0
  } finally {
    isLoadingTransitions.value = false
  }
}

// Fallback transitions in case backend is unavailable
function getFallbackTransitions(status: string): StatusTransition[] {
  const transitions: Record<string, string[]> = {
    'pending': ['submitted', 'cancelled'],
    'submitted': ['in_progress', 'quoted', 'cancelled'],
    'in_progress': ['quoted', 'cancelled'],
    'quoted': ['invoiced', 'in_progress', 'cancelled'],
    'quote_viewed': ['invoiced', 'in_progress', 'cancelled'],
    'quote_accepted': ['invoiced', 'in_progress', 'cancelled'],
    'invoiced': ['paid', 'cancelled'],
    'paid': ['completed', 'delivered'],
    'completed': ['delivered'],
    'delivered': [],
    'cancelled': []
  }
  
  return (transitions[status] || []).map(s => ({
    status: s,
    label: formatStatus(s)
  }))
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'submitted': 'Submitted',
    'quoted': 'Quoted',
    'quote_viewed': 'Quote Viewed',
    'quote_accepted': 'Quote Accepted',
    'invoiced': 'Invoiced',
    'paid': 'Paid',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || status
}

function getStatusLabel(status: string): string {
  const found = allowedTransitions.value.find(t => t.status === status)
  return found?.label || formatStatus(status)
}

// Check if selected transition is valid
const isValidTransition = computed(() => {
  if (selectedStatus.value === props.currentStatus) return true
  return allowedTransitions.value.some(t => t.status === selectedStatus.value)
})

// Can update if status changed and transition is valid
const canUpdate = computed(() => {
  return selectedStatus.value !== props.currentStatus && isValidTransition.value && !isTerminalStatus.value
})

// Fetch transitions on mount and when status changes
onMounted(() => {
  fetchAllowedTransitions()
})

// Reset and refetch when current status changes
watch(() => props.currentStatus, (newStatus) => {
  selectedStatus.value = newStatus
  statusNotes.value = ''
  error.value = ''
  showSuccess.value = false
  fetchAllowedTransitions()
})

async function handleStatusChange() {
  if (!canUpdate.value) return

  isUpdating.value = true
  error.value = ''
  showSuccess.value = false

  try {
    await trpc.admin.orders.update.mutate({
      id: props.orderId,
      status: selectedStatus.value,
      adminNotes: statusNotes.value || undefined
    })

    // Emit success
    emit('statusChanged', selectedStatus.value)
    
    // Show success message
    showSuccess.value = true
    statusNotes.value = ''
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.message || 'Failed to update status. Please try again.'
    selectedStatus.value = props.currentStatus // Reset to current status
  } finally {
    isUpdating.value = false
  }
}
</script>
