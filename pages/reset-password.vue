<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
          <Icon name="mdi:lock-reset" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Create New Password</h1>
        <p class="text-slate-400">Enter your new password below</p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mb-6 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/50">
        <div class="flex items-start gap-3">
          <Icon name="mdi:check-circle" class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-green-400 font-bold mb-1">Password Reset Successful</h4>
            <p class="text-slate-300 text-sm">
              Your password has been reset successfully. You can now log in with your new password.
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

      <!-- No Token Error -->
      <div v-if="!token && !loading" class="mb-6 p-4 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/50">
        <div class="flex items-start gap-3">
          <Icon name="mdi:alert" class="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-yellow-400 font-bold mb-1">Invalid Link</h4>
            <p class="text-slate-300 text-sm">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
        </div>
      </div>

      <!-- Form Card -->
      <div v-if="token && !success" class="card p-8">
        <form @submit.prevent="handleSubmit">
          <div class="space-y-6">
            <!-- New Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  placeholder="Enter new password"
                  class="w-full px-4 py-3 bg-dark-secondary border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors pr-12"
                  :disabled="loading"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  tabindex="-1"
                >
                  <Icon :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
                </button>
              </div>
              <p class="mt-2 text-xs text-slate-500">
                Password must be at least 8 characters long and include uppercase, lowercase, number, and special character
              </p>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  placeholder="Confirm new password"
                  class="w-full px-4 py-3 bg-dark-secondary border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors pr-12"
                  :disabled="loading"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  tabindex="-1"
                >
                  <Icon :name="showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Password Mismatch Warning -->
            <div v-if="password && confirmPassword && password !== confirmPassword" class="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
              <p class="text-sm text-yellow-400 flex items-center gap-2">
                <Icon name="mdi:alert" class="w-4 h-4" />
                Passwords do not match
              </p>
            </div>

            <!-- Submit Button -->
            <UiButton
              type="submit"
              variant="primary"
              size="lg"
              full-width
              :disabled="loading || !password || !confirmPassword || password !== confirmPassword"
            >
              <Icon v-if="loading" name="mdi:loading" class="w-5 h-5 animate-spin" />
              <span v-else>Reset Password</span>
            </UiButton>
          </div>
        </form>
      </div>

      <!-- Action Buttons -->
      <div class="text-center mt-6">
        <NuxtLink
          v-if="!token || success"
          to="/login"
          class="inline-flex items-center gap-2 px-6 py-3 bg-dark-secondary hover:bg-dark-secondary/80 text-white font-medium rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all"
        >
          <Icon name="mdi:arrow-left" class="w-5 h-5" />
          {{ success ? 'Go to Login' : 'Return to Login' }}
        </NuxtLink>
        <NuxtLink
          v-else-if="!success"
          to="/forgot-password"
          class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
        >
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Request New Link
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: []
})

useHead({
  title: 'Reset Password - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Reset your password for Elite Sports DJ Services' }
  ]
})

const { $client } = useNuxtApp()
const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const success = ref(false)
const error = ref('')

onMounted(() => {
  // Get token from URL query parameter
  token.value = (route.query.token as string) || ''
})

const handleSubmit = async () => {
  if (!password.value || !confirmPassword.value || password.value !== confirmPassword.value) {
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const result = await $client.auth.resetPassword.mutate({
      token: token.value,
      newPassword: password.value
    })
    
    if (result.success) {
      success.value = true
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
