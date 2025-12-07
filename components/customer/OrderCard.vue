<template>
  <div
    class="bg-white border border-slate-200 hover:border-cyan-400 rounded-lg p-6 transition-all cursor-pointer shadow-sm hover:shadow-md"
    @click="$emit('click')"
    role="article"
    :aria-label="`Order ${order.id} - ${getStatusLabel(order.status)}`"
  >
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <h3 class="text-xl font-bold text-slate-900">Order #{{ order.id }}</h3>
            <span 
              :class="[
                'px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1',
                getStatusColor(order.status).badge
              ]"
            >
              <Icon :name="getStatusIcon(order.status)" class="w-3 h-3" />
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
          
          <!-- Package Info -->
          <div class="space-y-1 text-sm">
            <p v-if="order.service_name || order.packageId" class="text-slate-700">
              <Icon name="mdi:package-variant" class="w-4 h-4 inline-block mr-1 text-cyan-500" />
              <span class="font-medium">Package:</span> 
              {{ order.service_name || getPackageName(order.packageId) }}
            </p>
            <p class="text-slate-600">
              <Icon name="mdi:calendar" class="w-4 h-4 inline-block mr-1 text-slate-400" />
              <span class="font-medium">Submitted:</span> 
              {{ formatDate(order.created_at || order.createdAt) }}
            </p>
            <p v-if="order.event_date" class="text-slate-600">
              <Icon name="mdi:calendar-star" class="w-4 h-4 inline-block mr-1 text-slate-400" />
              <span class="font-medium">Event Date:</span> 
              {{ formatDate(order.event_date) }}
            </p>
          </div>
        </div>

        <!-- Price Display -->
        <div v-if="order.quoted_amount || order.quotedAmount" class="text-right flex-shrink-0">
          <p class="text-sm text-slate-500 mb-1">
            {{ order.status === 'paid' || order.status === 'completed' ? 'Paid' : 'Quote' }}
          </p>
          <p class="text-2xl font-bold text-cyan-600">
            {{ formatPrice(order.quoted_amount || order.quotedAmount) }}
          </p>
        </div>
      </div>

      <!-- Progress Timeline (Mini) -->
      <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
        <div
          v-for="step in statusSteps"
          :key="step.status"
          :class="[
            'flex-1 h-2 rounded-full transition-all',
            isStepCompleted(step.status, order.status) 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
              : 'bg-slate-200'
          ]"
          :title="step.label"
          :aria-label="`${step.label} - ${isStepCompleted(step.status, order.status) ? 'completed' : 'pending'}`"
        />
      </div>

      <!-- Status Steps Labels (Mobile Hidden) -->
      <div class="hidden md:flex items-center justify-between text-xs text-slate-500">
        <span
          v-for="step in statusSteps"
          :key="step.status"
          :class="[
            'flex-1 text-center',
            isStepCompleted(step.status, order.status) ? 'text-cyan-600 font-semibold' : ''
          ]"
        >
          {{ step.label }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-100">
        <div class="flex gap-2">
          <button
            v-if="order.status === 'quoted' || order.status === 'invoiced'"
            @click.stop="$emit('pay', order)"
            class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
            aria-label="Pay now"
          >
            <Icon name="mdi:credit-card" class="w-4 h-4 inline-block mr-1" />
            Pay Now
          </button>
          
          <button
            v-if="order.status === 'completed' && order.deliverable_url"
            @click.stop="downloadDeliverable(order)"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
            aria-label="Download deliverable"
          >
            <Icon name="mdi:download" class="w-4 h-4 inline-block mr-1" />
            Download
          </button>
        </div>

        <button
          class="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          aria-label="View order details"
        >
          View Details
          <Icon name="mdi:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Order {
  id: number
  status: string
  packageId?: string
  service_name?: string
  quoted_amount?: number
  quotedAmount?: number
  created_at?: string
  createdAt?: string
  event_date?: string
  deliverable_url?: string
}

interface Props {
  order: Order
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  pay: [order: Order]
}>()

const statusSteps = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'quoted', label: 'Quoted' },
  { status: 'paid', label: 'Paid' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' }
]

const statusOrder = ['submitted', 'quoted', 'invoiced', 'paid', 'in_progress', 'completed', 'delivered']

function isStepCompleted(stepStatus: string, currentStatus: string): boolean {
  const stepIndex = statusOrder.indexOf(stepStatus)
  const currentIndex = statusOrder.indexOf(currentStatus)
  return currentIndex >= stepIndex
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'submitted': 'Submitted',
    'quoted': 'Quoted',
    'invoiced': 'Invoiced',
    'paid': 'Paid',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  }
  return labels[status] || status
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'submitted': 'mdi:email-send',
    'quoted': 'mdi:file-document-edit',
    'invoiced': 'mdi:receipt',
    'paid': 'mdi:cash-check',
    'in_progress': 'mdi:progress-clock',
    'completed': 'mdi:check-circle',
    'delivered': 'mdi:package-variant-closed',
    'cancelled': 'mdi:close-circle'
  }
  return icons[status] || 'mdi:circle'
}

function getStatusColor(status: string) {
  const colors: Record<string, { badge: string }> = {
    'submitted': { badge: 'bg-blue-100 text-blue-700 border border-blue-200' },
    'quoted': { badge: 'bg-purple-100 text-purple-700 border border-purple-200' },
    'invoiced': { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    'paid': { badge: 'bg-green-100 text-green-700 border border-green-200' },
    'in_progress': { badge: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
    'completed': { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    'delivered': { badge: 'bg-teal-100 text-teal-700 border border-teal-200' },
    'cancelled': { badge: 'bg-red-100 text-red-700 border border-red-200' }
  }
  return colors[status] || { badge: 'bg-slate-100 text-slate-700 border border-slate-200' }
}

function getPackageName(packageId?: string): string {
  if (!packageId) return 'Custom Package'
  
  const names: Record<string, string> = {
    'game-day-dj': 'Game Day DJ',
    'player-intros-basic': 'Player Intros - Basic',
    'player-intros-warmup': 'Player Intros - Warmup',
    'player-intros-ultimate': 'Player Intros - Ultimate',
    'event-hosting': 'Event Hosting'
  }
  return names[packageId] || packageId
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function downloadDeliverable(order: Order) {
  if (order.deliverable_url) {
    window.open(order.deliverable_url, '_blank')
  }
}
</script>
