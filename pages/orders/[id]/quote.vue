<script setup lang="ts">
/**
 * Customer Quote View Page
 * Allows customers to view, accept, or decline quotes
 */

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { $trpc } = useNuxtApp()

const orderId = computed(() => parseInt(route.params.id as string))

// State
const loading = ref(true)
const error = ref<string | null>(null)
const isAccepting = ref(false)
const isDeclining = ref(false)
const showDeclineModal = ref(false)
const declineReason = ref('')

const quote = ref<{
  id: string
  customerName: string
  status: string
  quotedAmount: number
  packageName: string
  packageDescription: string | null
  teamName: string | null
  sportType: string | null
  eventDate: string | null
  expiresAt: string | null
  isExpired: boolean
  version: number
} | null>(null)

const revisions = ref<Array<{
  version: number
  amount: number
  notes: string
  createdAt: string
}>>([])

// Load quote data
async function loadQuote() {
  loading.value = true
  error.value = null
  
  try {
    // Get quote details
    quote.value = await $trpc.quote.getQuote.query({
      orderId: orderId.value
    })
    
    // Record view event
    await $trpc.quote.recordQuoteView.mutate({
      orderId: orderId.value
    })
    
    // Load revision history if authenticated
    try {
      revisions.value = await $trpc.quote.getRevisionHistory.query({
        orderId: orderId.value
      })
    } catch {
      // Not authenticated or no access - ignore
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load quote'
  } finally {
    loading.value = false
  }
}

onMounted(loadQuote)

// Accept quote
async function acceptQuote() {
  if (isAccepting.value || !quote.value) return
  
  isAccepting.value = true
  
  try {
    await $trpc.quote.acceptQuote.mutate({
      orderId: orderId.value
    })
    
    // Redirect to payment or order page
    router.push(`/orders/${orderId.value}`)
  } catch (err: any) {
    error.value = err.message || 'Failed to accept quote'
  } finally {
    isAccepting.value = false
  }
}

// Decline quote
async function declineQuote() {
  if (isDeclining.value || !quote.value) return
  
  isDeclining.value = true
  
  try {
    await $trpc.quote.declineQuote.mutate({
      orderId: orderId.value,
      reason: declineReason.value || undefined
    })
    
    showDeclineModal.value = false
    router.push('/orders')
  } catch (err: any) {
    error.value = err.message || 'Failed to decline quote'
  } finally {
    isDeclining.value = false
  }
}

// Helpers
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Check if quote can be acted upon
const canAct = computed(() => {
  if (!quote.value) return false
  const actableStatuses = ['quoted', 'quote_viewed']
  return actableStatuses.includes(quote.value.status) && !quote.value.isExpired
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p class="text-gray-500">Loading your quote...</p>
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Unable to Load Quote</h2>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <NuxtLink 
            to="/orders" 
            class="inline-block px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            View My Orders
          </NuxtLink>
        </div>
      </div>
      
      <!-- Quote Content -->
      <div v-else-if="quote" class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-8 text-white text-center">
          <h1 class="text-2xl font-bold mb-2">Your Custom Quote</h1>
          <p class="text-cyan-100">Order #{{ quote.id }}</p>
        </div>
        
        <!-- Expired Warning -->
        <div v-if="quote.isExpired" class="bg-red-50 border-b border-red-100 px-8 py-4">
          <div class="flex items-center gap-3 text-red-700">
            <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-semibold">This quote has expired</p>
              <p class="text-sm">Please contact us for an updated quote.</p>
            </div>
          </div>
        </div>
        
        <!-- Already Accepted -->
        <div v-else-if="quote.status === 'quote_accepted'" class="bg-green-50 border-b border-green-100 px-8 py-4">
          <div class="flex items-center gap-3 text-green-700">
            <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-semibold">Quote Accepted</p>
              <p class="text-sm">Thank you! We'll be in touch with next steps.</p>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="px-8 py-8">
          <!-- Quote Amount -->
          <div class="text-center mb-8">
            <p class="text-sm text-gray-500 uppercase tracking-wide mb-2">Quote Amount</p>
            <p class="text-5xl font-bold text-cyan-600">{{ formatCurrency(quote.quotedAmount) }}</p>
            <p v-if="quote.expiresAt && !quote.isExpired" class="text-sm text-gray-500 mt-2">
              Valid until {{ formatDate(quote.expiresAt) }}
            </p>
          </div>
          
          <!-- Order Details -->
          <div class="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 class="font-semibold text-gray-900 mb-4">Order Details</h3>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-gray-500">Package</dt>
                <dd class="font-medium text-gray-900">{{ quote.packageName }}</dd>
              </div>
              <div v-if="quote.teamName" class="flex justify-between">
                <dt class="text-gray-500">Team</dt>
                <dd class="font-medium text-gray-900">{{ quote.teamName }}</dd>
              </div>
              <div v-if="quote.sportType" class="flex justify-between">
                <dt class="text-gray-500">Sport</dt>
                <dd class="font-medium text-gray-900">{{ quote.sportType }}</dd>
              </div>
              <div v-if="quote.eventDate" class="flex justify-between">
                <dt class="text-gray-500">Event Date</dt>
                <dd class="font-medium text-gray-900">{{ formatDate(quote.eventDate) }}</dd>
              </div>
            </dl>
          </div>
          
          <!-- What's Included -->
          <div class="mb-8">
            <h3 class="font-semibold text-gray-900 mb-4">What's Included</h3>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600">Professional DJ services for your event</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600">Custom music selection and mixing</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600">High-quality audio production</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-600">Unlimited revisions until you're satisfied</span>
              </li>
            </ul>
          </div>
          
          <!-- Quote History -->
          <div v-if="revisions.length > 1" class="mb-8">
            <h3 class="font-semibold text-gray-900 mb-4">Quote History</h3>
            <div class="space-y-2">
              <div 
                v-for="rev in revisions" 
                :key="rev.version"
                class="flex items-center justify-between py-2 px-3 rounded-lg"
                :class="rev.version === quote.version ? 'bg-cyan-50' : 'bg-gray-50'"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-gray-500">v{{ rev.version }}</span>
                  <span 
                    class="font-medium"
                    :class="rev.version === quote.version ? 'text-cyan-700' : 'text-gray-600'"
                  >
                    {{ formatCurrency(rev.amount) }}
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ new Date(rev.createdAt).toLocaleDateString() }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div v-if="canAct" class="flex flex-col sm:flex-row gap-4">
            <button
              @click="acceptQuote"
              :disabled="isAccepting"
              class="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
            >
              <span v-if="isAccepting" class="flex items-center justify-center gap-2">
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
              <span v-else>Accept Quote</span>
            </button>
            
            <button
              @click="showDeclineModal = true"
              class="px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
          </div>
          
          <!-- Contact Info -->
          <div class="mt-8 pt-8 border-t border-gray-200 text-center">
            <p class="text-gray-500 mb-2">Questions about this quote?</p>
            <p class="text-gray-700">
              📞 (555) 123-4567 &nbsp;|&nbsp; 📧 info@elitesportsdj.com
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Decline Modal -->
    <Teleport to="body">
      <div v-if="showDeclineModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-bold text-gray-900">Decline Quote</h3>
          </div>
          
          <div class="p-6">
            <p class="text-gray-600 mb-4">
              Are you sure you want to decline this quote? This action cannot be undone.
            </p>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                v-model="declineReason"
                rows="3"
                placeholder="Let us know why you're declining..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
          </div>
          
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              @click="showDeclineModal = false"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="declineQuote"
              :disabled="isDeclining"
              class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {{ isDeclining ? 'Declining...' : 'Decline Quote' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
