<script setup lang="ts">
/**
 * Bulk Actions Toolbar Component
 * For performing actions on multiple selected orders
 */

const props = defineProps<{
  selectedIds: number[]
  totalCount: number
}>()

const emit = defineEmits<{
  clearSelection: []
  selectAll: []
  actionComplete: [action: string, results: { success: number[]; failed: { id: number; error: string }[] }]
}>()

const trpc = useTrpc()
const { showError, showSuccess } = useNotification()

// State
const isProcessing = ref(false)
const showStatusModal = ref(false)
const showEmailModal = ref(false)
const selectedStatus = ref('')
const statusNotes = ref('')
const emailType = ref<'reminder' | 'status_update' | 'custom'>('reminder')
const customSubject = ref('')
const customBody = ref('')

// Available statuses for bulk update
const availableStatuses = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
]

// Methods
async function bulkUpdateStatus() {
  if (!selectedStatus.value || isProcessing.value) return
  
  isProcessing.value = true
  
  try {
    const results = await trpc.adminEnhancements.bulkUpdateStatus.mutate({
      orderIds: props.selectedIds,
      status: selectedStatus.value,
      notes: statusNotes.value || undefined
    })
    
    emit('actionComplete', 'status_update', results)
    showStatusModal.value = false
    selectedStatus.value = ''
    statusNotes.value = ''
    showSuccess(`Updated ${results.success.length} orders`)
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(handleTrpcError(err))
  } finally {
    isProcessing.value = false
  }
}

async function bulkSendEmail() {
  if (isProcessing.value) return
  
  isProcessing.value = true
  
  try {
    const results = await trpc.adminEnhancements.bulkSendEmail.mutate({
      orderIds: props.selectedIds,
      emailType: emailType.value,
      subject: emailType.value === 'custom' ? customSubject.value : undefined,
      body: emailType.value === 'custom' ? customBody.value : undefined
    })
    
    emit('actionComplete', 'email', { 
      success: Array(results.sent).fill(0), 
      failed: Array(results.failed).fill({ id: 0, error: 'Failed' }) 
    })
    showEmailModal.value = false
    customSubject.value = ''
    customBody.value = ''
    showSuccess(`Sent ${results.sent} emails`)
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(handleTrpcError(err))
  } finally {
    isProcessing.value = false
  }
}

async function exportSelected() {
  isProcessing.value = true
  
  try {
    const result = await trpc.adminEnhancements.exportOrders.mutate({
      orderIds: props.selectedIds
    })
    
    // Download CSV
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    emit('actionComplete', 'export', { success: props.selectedIds, failed: [] })
    showSuccess('Export downloaded')
  } catch (err: any) {
    const { handleTrpcError } = await import('~/composables/useTrpc')
    showError(handleTrpcError(err))
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="bg-brand-600 border border-brand-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="selectedIds.length === totalCount && totalCount > 0"
          :indeterminate="selectedIds.length > 0 && selectedIds.length < totalCount"
          @change="selectedIds.length === totalCount ? emit('clearSelection') : emit('selectAll')"
          class="w-5 h-5 rounded border-white/30 text-brand-500 bg-brand-700 focus:ring-brand-400 focus:ring-offset-0"
        />
        <span class="font-medium">
          {{ selectedIds.length }} selected
        </span>
      </div>
      
      <div class="h-6 w-px bg-white/30"></div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button
          @click="showStatusModal = true"
          :disabled="isProcessing"
          class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Update Status
        </button>
        
        <button
          @click="showEmailModal = true"
          :disabled="isProcessing"
          class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Send Email
        </button>
        
        <button
          @click="exportSelected"
          :disabled="isProcessing"
          class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>
    </div>
    
    <button
      @click="emit('clearSelection')"
      class="text-white/80 hover:text-white transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  
  <!-- Status Update Modal -->
  <Teleport to="body">
    <div v-if="showStatusModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-md w-full">
        <div class="px-6 py-4 border-b border-white/10">
          <h3 class="text-lg font-bold text-white">Bulk Update Status</h3>
          <p class="text-sm text-slate-400">Update {{ selectedIds.length }} orders</p>
        </div>
        
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-300 mb-2">New Status</label>
            <select
              v-model="selectedStatus"
              class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select status...</option>
              <option v-for="s in availableStatuses" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
            <textarea
              v-model="statusNotes"
              rows="2"
              placeholder="Add notes for this status change..."
              class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <UiButton
            @click="showStatusModal = false"
            variant="outline"
          >
            Cancel
          </UiButton>
          <UiButton
            @click="bulkUpdateStatus"
            :disabled="!selectedStatus || isProcessing"
            :loading="isProcessing"
            variant="primary"
          >
            Update All
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
  
  <!-- Email Modal -->
  <Teleport to="body">
    <div v-if="showEmailModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-dark-secondary border border-white/10 rounded-xl shadow-2xl max-w-md w-full">
        <div class="px-6 py-4 border-b border-white/10">
          <h3 class="text-lg font-bold text-white">Bulk Send Email</h3>
          <p class="text-sm text-slate-400">Send to {{ selectedIds.length }} customers</p>
        </div>
        
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-300 mb-2">Email Type</label>
            <select
              v-model="emailType"
              class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="reminder">Quote Reminder</option>
              <option value="status_update">Status Update</option>
              <option value="custom">Custom Email</option>
            </select>
          </div>
          
          <template v-if="emailType === 'custom'">
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input
                v-model="customSubject"
                type="text"
                placeholder="Email subject..."
                class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-300 mb-2">Body</label>
              <textarea
                v-model="customBody"
                rows="4"
                placeholder="Email body... Use {{name}} and {{orderId}} for personalization"
                class="w-full px-4 py-2.5 bg-dark-tertiary border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              ></textarea>
              <p class="text-xs text-slate-500 mt-1">Available variables: <code>&#123;&#123;name&#125;&#125;</code>, <code>&#123;&#123;orderId&#125;&#125;</code></p>
            </div>
          </template>
          
          <div v-else class="bg-dark-tertiary border border-white/5 rounded-lg p-4 text-sm text-slate-400">
            <p v-if="emailType === 'reminder'">
              Sends a reminder email to customers with pending quotes, encouraging them to respond.
            </p>
            <p v-else-if="emailType === 'status_update'">
              Notifies customers about their order status change.
            </p>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <UiButton
            @click="showEmailModal = false"
            variant="outline"
          >
            Cancel
          </UiButton>
          <UiButton
            @click="bulkSendEmail"
            :disabled="isProcessing || (emailType === 'custom' && (!customSubject || !customBody))"
            :loading="isProcessing"
            variant="primary"
          >
            Send Emails
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
