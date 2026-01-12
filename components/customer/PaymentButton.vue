<template>
  <div class="payment-button-container">
    <!-- Main Payment Button -->
    <button
      @click="handlePayment"
      :disabled="isProcessing || disabled"
      :class="[
        'relative overflow-hidden px-8 py-4 font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-3 min-w-[200px]',
        isProcessing
          ? 'bg-slate-400 cursor-wait'
          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:scale-105',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        'text-white'
      ]"
    >
      <!-- Idle State -->
      <template v-if="!isProcessing">
        <Icon name="mdi:credit-card" class="w-5 h-5" />
        <span>Pay Now - {{ formattedAmount }}</span>
      </template>

      <!-- Processing States -->
      <template v-else>
        <!-- Step 1: Creating Session -->
        <template v-if="paymentStep === 'creating'">
          <Icon name="mdi:loading" class="w-5 h-5 animate-spin" />
          <span>Creating secure session...</span>
        </template>

        <!-- Step 2: Redirecting -->
        <template v-else-if="paymentStep === 'redirecting'">
          <Icon name="mdi:lock" class="w-5 h-5" />
          <span>Redirecting to payment...</span>
        </template>

        <!-- Step 3: Waiting -->
        <template v-else>
          <Icon name="mdi:loading" class="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </template>
      </template>

      <!-- Progress Bar -->
      <div
        v-if="isProcessing"
        class="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-500"
        :style="{ width: progressWidth }"
      ></div>
    </button>

    <!-- Security Badge -->
    <div class="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
      <Icon name="mdi:shield-check" class="w-4 h-4 text-green-500" />
      <span>Secure payment powered by Stripe</span>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
    >
      <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="text-sm text-red-400">{{ errorMessage }}</p>
        <button
          @click="retryPayment"
          class="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
      <button @click="errorMessage = ''" class="text-red-400 hover:text-red-300">
        <Icon name="mdi:close" class="w-4 h-4" />
      </button>
    </div>

    <!-- Timeout Warning -->
    <div
      v-if="showTimeoutWarning"
      class="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3"
    >
      <Icon name="mdi:clock-alert" class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="text-sm text-yellow-400">
          This is taking longer than expected. Please wait or try again.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface Props {
  orderId: number
  amount: number
  disabled?: boolean
}

interface Emits {
  (e: 'paymentStarted'): void
  (e: 'paymentError', error: string): void
  (e: 'paymentRedirecting', url: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const trpc = useTrpc()
const { showError } = useNotification()

const isProcessing = ref(false)
const paymentStep = ref<'idle' | 'creating' | 'redirecting'>('idle')
const errorMessage = ref('')
const showTimeoutWarning = ref(false)
const retryCount = ref(0)

let timeoutTimer: ReturnType<typeof setTimeout> | null = null
let warningTimer: ReturnType<typeof setTimeout> | null = null

const formattedAmount = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(props.amount / 100)
})

const progressWidth = computed(() => {
  switch (paymentStep.value) {
    case 'creating':
      return '40%'
    case 'redirecting':
      return '80%'
    default:
      return '0%'
  }
})

function clearTimers() {
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
  if (warningTimer) {
    clearTimeout(warningTimer)
    warningTimer = null
  }
}

async function handlePayment() {
  if (isProcessing.value || props.disabled) return

  isProcessing.value = true
  paymentStep.value = 'creating'
  errorMessage.value = ''
  showTimeoutWarning.value = false
  clearTimers()

  emit('paymentStarted')

  // Show warning after 10 seconds
  warningTimer = setTimeout(() => {
    showTimeoutWarning.value = true
  }, 10000)

  // Timeout after 30 seconds
  timeoutTimer = setTimeout(() => {
    if (isProcessing.value) {
      isProcessing.value = false
      paymentStep.value = 'idle'
      errorMessage.value = 'Payment request timed out. Please try again.'
      showTimeoutWarning.value = false
    }
  }, 30000)

  try {
    // Create Stripe checkout session
    const { url } = await trpc.payments.createCheckout.mutate({
      orderId: props.orderId
    })

    clearTimers()
    showTimeoutWarning.value = false
    paymentStep.value = 'redirecting'
    emit('paymentRedirecting', url)

    // Small delay to show redirecting state
    await new Promise(resolve => setTimeout(resolve, 500))

    // Redirect to Stripe checkout
    window.location.href = url
  } catch (err: any) {
    clearTimers()
    isProcessing.value = false
    paymentStep.value = 'idle'
    showTimeoutWarning.value = false

    const message = err.data?.message || err.message || 'Failed to initiate payment. Please try again.'
    errorMessage.value = message
    emit('paymentError', message)
    showError(message)
  }
}

function retryPayment() {
  retryCount.value++
  errorMessage.value = ''
  handlePayment()
}

onUnmounted(() => {
  clearTimers()
})
</script>

<style scoped>
.payment-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
