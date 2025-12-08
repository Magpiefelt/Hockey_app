<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
          <Icon name="mdi:lock-reset" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p class="text-slate-400">Enter your email and we'll send you a reset link</p>
      </div>

      <!-- Success Message -->
      <div v-if="submitted && !error" class="mb-6 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/50">
        <div class="flex items-start gap-3">
          <Icon name="mdi:check-circle" class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-green-400 font-bold mb-1">Check Your Email</h4>
            <p class="text-slate-300 text-sm">
              If an account exists with this email, you will receive a password reset link shortly.
            </p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 rounded-lg bg-red-500/10 border-2 border-red-500/50">
        <div class="flex items-start gap-3">
          <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-red-400 font-bold mb-1">Error</h4>
            <p class="text-slate-300 text-sm">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Form Card -->
      <div v-if="!submitted" class="card p-8">
        <form @submit.prevent="handleSubmit">
          <div class="space-y-6">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="your@email.com"
                class="w-full px-4 py-3 bg-dark-secondary border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                :disabled="loading"
              />
            </div>

            <!-- Submit Button -->
            <UiButton
              type="submit"
              variant="primary"
              size="lg"
              full-width
              :disabled="loading || !email"
            >
              <Icon v-if="loading" name="mdi:loading" class="w-5 h-5 animate-spin" />
              <span v-else>Send Reset Link</span>
            </UiButton>
          </div>
        </form>

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <NuxtLink
            to="/login"
            class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
          >
            <Icon name="mdi:arrow-left" class="w-4 h-4" />
            Back to Login
          </NuxtLink>
        </div>
      </div>

      <!-- Return to Login (after submission) -->
      <div v-else class="text-center mt-6">
        <NuxtLink
          to="/login"
          class="inline-flex items-center gap-2 px-6 py-3 bg-dark-secondary hover:bg-dark-secondary/80 text-white font-medium rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all"
        >
          <Icon name="mdi:arrow-left" class="w-5 h-5" />
          Return to Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: []
})

useHead({
  title: 'Forgot Password - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Reset your password for Elite Sports DJ Services' }
  ]
})

const { $client } = useNuxtApp()
const router = useRouter()

const email = ref('')
const loading = ref(false)
const submitted = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!email.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const result = await $client.auth.forgotPassword.mutate({
      email: email.value
    })
    
    if (result.success) {
      submitted.value = true
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
