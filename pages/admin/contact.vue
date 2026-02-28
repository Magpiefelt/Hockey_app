<template>
  <div class="px-6 py-8">
    <div class="container mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Contact <span class="gradient-text">Submissions</span>
        </h1>
        <p class="text-lg text-slate-400">
          View and manage contact form submissions from website visitors
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card p-4">
          <p class="text-sm text-slate-400 mb-1">Total</p>
          <p class="text-2xl font-bold text-white">{{ stats.total }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-slate-400 mb-1">New</p>
          <p class="text-2xl font-bold text-cyan-400">{{ stats.new }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-slate-400 mb-1">Read</p>
          <p class="text-2xl font-bold text-blue-400">{{ stats.read }}</p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-slate-400 mb-1">Replied</p>
          <p class="text-2xl font-bold text-green-400">{{ stats.replied }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-6 mb-6">
        <div class="grid md:grid-cols-3 gap-4">
          <UiSelect
            v-model="filters.status"
            label="Status"
            :options="statusOptions"
          />
          
          <UiInput
            v-model="filters.search"
            label="Search"
            type="text"
            placeholder="Email or name..."
          />
          
          <div class="flex items-end">
            <UiButton
              @click="resetFilters"
              variant="outline"
              full-width
            >
              Reset Filters
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 rounded-xl border border-error-500/30 bg-error-500/10 text-center">
        <p class="text-error-400 text-lg mb-4">{{ error }}</p>
        <UiButton 
          @click="fetchSubmissions"
          variant="outline"
        >
          Try Again
        </UiButton>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredSubmissions.length === 0" class="card p-12 text-center">
        <Icon name="mdi:email-outline" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-white mb-2">No Submissions Found</h3>
        <p class="text-slate-400">
          {{ filters.status || filters.search ? 'Try adjusting your filters' : 'Contact form submissions will appear here' }}
        </p>
      </div>

      <!-- Submissions Table -->
      <div v-else class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Status</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Name</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Email</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Subject</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Date</th>
                <th class="text-left py-4 px-6 text-slate-200 font-semibold text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="submission in filteredSubmissions" 
                :key="submission.id"
                class="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                @click="openSubmission(submission)"
              >
                <td class="py-4 px-6">
                  <span 
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                    :class="getStatusClass(submission.status)"
                  >
                    {{ submission.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-white font-medium">{{ submission.name }}</td>
                <td class="py-4 px-6 text-slate-300">{{ submission.email }}</td>
                <td class="py-4 px-6 text-slate-300 max-w-xs truncate">{{ submission.subject }}</td>
                <td class="py-4 px-6 text-slate-400 text-sm">{{ formatDate(submission.createdAt) }}</td>
                <td class="py-4 px-6">
                  <div class="flex gap-2">
                    <button
                      v-if="submission.status === 'new'"
                      @click.stop="markAsRead(submission.id)"
                      class="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Mark as Read"
                    >
                      <Icon name="mdi:eye" class="w-4 h-4" />
                    </button>
                    <a
                      :href="`mailto:${submission.email}?subject=Re: ${submission.subject}`"
                      @click.stop="markAsReplied(submission.id)"
                      class="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                      title="Reply via Email (marks as replied)"
                    >
                      <Icon name="mdi:reply" class="w-4 h-4" />
                    </a>
                    <button
                      v-if="submission.status !== 'archived'"
                      @click.stop="archiveSubmission(submission.id)"
                      class="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                      title="Archive"
                    >
                      <Icon name="mdi:archive" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail Modal -->
      <UiModal v-model="showDetailModal" title="Contact Submission" size="lg">
        <div v-if="selectedSubmission" class="space-y-6">
          <!-- Header Info -->
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-slate-400">Name</label>
              <p class="text-white font-medium">{{ selectedSubmission.name }}</p>
            </div>
            <div>
              <label class="text-sm text-slate-400">Email</label>
              <p class="text-white font-medium">
                <a :href="`mailto:${selectedSubmission.email}`" class="text-cyan-400 hover:underline">
                  {{ selectedSubmission.email }}
                </a>
              </p>
            </div>
            <div v-if="selectedSubmission.phone">
              <label class="text-sm text-slate-400">Phone</label>
              <p class="text-white font-medium">{{ selectedSubmission.phone }}</p>
            </div>
            <div>
              <label class="text-sm text-slate-400">Submitted</label>
              <p class="text-white font-medium">{{ formatDate(selectedSubmission.createdAt) }}</p>
            </div>
          </div>

          <!-- Subject -->
          <div>
            <label class="text-sm text-slate-400">Subject</label>
            <p class="text-white font-medium">{{ selectedSubmission.subject }}</p>
          </div>

          <!-- Message -->
          <div>
            <label class="text-sm text-slate-400">Message</label>
            <div class="mt-2 p-4 bg-dark-tertiary rounded-lg">
              <p class="text-slate-200 whitespace-pre-wrap">{{ selectedSubmission.message }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-white/10">
            <UiButton
              v-if="selectedSubmission.status === 'new'"
              @click="markAsRead(selectedSubmission.id)"
              variant="secondary"
            >
              <Icon name="mdi:eye" class="w-4 h-4 mr-2" />
              Mark as Read
            </UiButton>
            <a
              :href="`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`"
              @click="markAsReplied(selectedSubmission.id)"
              class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Icon name="mdi:reply" class="w-4 h-4 mr-2" />
              Reply via Email
            </a>
            <UiButton
              v-if="selectedSubmission.status !== 'archived'"
              @click="archiveSubmission(selectedSubmission.id)"
              variant="outline"
            >
              <Icon name="mdi:archive" class="w-4 h-4 mr-2" />
              Archive
            </UiButton>
          </div>
        </div>
      </UiModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

interface ContactSubmission {
  id: number
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: string
  readAt?: string
}

const trpc = useTrpc()
const { showSuccess, showError } = useNotification()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const submissions = ref<ContactSubmission[]>([])
const showDetailModal = ref(false)
const selectedSubmission = ref<ContactSubmission | null>(null)

// Filters
const filters = ref({
  status: '',
  search: ''
})

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' }
]

// Computed
const stats = computed(() => {
  return {
    total: submissions.value.length,
    new: submissions.value.filter(s => s.status === 'new').length,
    read: submissions.value.filter(s => s.status === 'read').length,
    replied: submissions.value.filter(s => s.status === 'replied').length,
    archived: submissions.value.filter(s => s.status === 'archived').length
  }
})

const filteredSubmissions = computed(() => {
  let result = [...submissions.value]
  
  if (filters.value.status) {
    result = result.filter(s => s.status === filters.value.status)
  }
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search) ||
      s.subject.toLowerCase().includes(search)
    )
  }
  
  return result
})

// Methods
async function fetchSubmissions() {
  loading.value = true
  error.value = null
  
  try {
    const response = await trpc.contact.list.query({ limit: 100 })
    submissions.value = response.submissions
  } catch (err: any) {
    console.error('Failed to fetch submissions:', err)
    error.value = err.message || 'Failed to load contact submissions'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = {
    status: '',
    search: ''
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'new':
      return 'bg-cyan-500/20 text-cyan-400'
    case 'read':
      return 'bg-blue-500/20 text-blue-400'
    case 'replied':
      return 'bg-green-500/20 text-green-400'
    case 'archived':
      return 'bg-slate-500/20 text-slate-400'
    default:
      return 'bg-slate-500/20 text-slate-400'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openSubmission(submission: ContactSubmission) {
  selectedSubmission.value = submission
  showDetailModal.value = true
  
  // Auto-mark as read when opened
  if (submission.status === 'new') {
    markAsRead(submission.id)
  }
}

async function markAsRead(id: number) {
  try {
    await trpc.contact.markAsRead.mutate({ id })
    
    // Update local state
    const submission = submissions.value.find(s => s.id === id)
    if (submission) {
      submission.status = 'read'
    }
    
    showSuccess('Marked as read')
  } catch (err: any) {
    console.error('Failed to mark as read:', err)
    showError('Failed to update status')
  }
}

async function markAsReplied(id: number) {
  try {
    await trpc.contact.markAsReplied.mutate({ id })
    
    const submission = submissions.value.find(s => s.id === id)
    if (submission) {
      submission.status = 'replied'
    }
    if (selectedSubmission.value?.id === id) {
      selectedSubmission.value.status = 'replied'
    }
  } catch (err: any) {
    console.error('Failed to mark as replied:', err)
  }
}

async function archiveSubmission(id: number) {
  try {
    await trpc.contact.archive.mutate({ id })
    
    const submission = submissions.value.find(s => s.id === id)
    if (submission) {
      submission.status = 'archived'
    }
    if (selectedSubmission.value?.id === id) {
      selectedSubmission.value.status = 'archived'
    }
    
    showSuccess('Submission archived')
  } catch (err: any) {
    console.error('Failed to archive:', err)
    showError('Failed to archive submission')
  }
}

// Lifecycle
onMounted(() => {
  fetchSubmissions()
})
</script>

<style scoped>
.gradient-text {
  background: linear-gradient(to right, rgb(96, 165, 250), rgb(34, 211, 238));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card {
  background: linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59));
  border-radius: 1rem;
  border: 2px solid rgba(59, 130, 246, 0.2);
}
</style>
