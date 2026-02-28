<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-primary">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="mb-6 flex justify-center">
          <img 
            src="/logo.png" 
            alt="Elite Sports DJ" 
            class="h-20 w-auto object-contain logo-float" 
          />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p class="text-slate-400">Sign in to your account</p>
      </div>

      <!-- Login Form -->
      <div class="card p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div>
            <UiInput
              v-model="form.email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              :disabled="isLoading"
            />
            <p v-if="fieldErrors.email" class="mt-1 text-xs text-error-400">{{ fieldErrors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-slate-300">Password</label>
              <NuxtLink 
                to="/forgot-password" 
                class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </NuxtLink>
            </div>
            <UiInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
              :disabled="isLoading"
            />
            <p v-if="fieldErrors.password" class="mt-1 text-xs text-error-400">{{ fieldErrors.password }}</p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-error-500/10 border border-error-500/30 rounded-lg">
            <p class="text-error-400 text-sm">{{ error }}</p>
          </div>

          <!-- Submit Button -->
          <UiButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :disabled="isLoading"
          >
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign In</span>
          </UiButton>
        </form>

        <!-- Registration Link -->
        <div class="mt-6 text-center">
          <p class="text-slate-400 text-sm">
            Don't have an account?
            <NuxtLink to="/register" class="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Create Account
            </NuxtLink>
          </p>
        </div>

        <!-- Back to Home -->
        <div class="mt-4 text-center">
          <NuxtLink to="/" class="text-brand-400 hover:text-brand-300 text-sm transition-colors">
            ← Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError } = useNotification()
const isLoading = ref(false)

const form = ref({
  email: '',
  password: ''
})

const error = ref<string | null>(null)
const fieldErrors = ref<{ email?: string; password?: string }>({})

/**
 * Validate the redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with "/" that don't contain "//".
 */
function getSafeRedirect(redirect: unknown): string | null {
  if (typeof redirect !== 'string') return null
  const trimmed = redirect.trim()
  // Must start with "/" and must NOT start with "//" (protocol-relative URL)
  // Must not contain backslashes (encoded redirect tricks)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed
  }
  return null
}

/**
 * Client-side validation before submitting to the server.
 */
function validateForm(): boolean {
  fieldErrors.value = {}
  let valid = true

  const email = form.value.email.trim()
  if (!email) {
    fieldErrors.value.email = 'Email is required'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.value.email = 'Please enter a valid email address'
    valid = false
  }

  if (!form.value.password) {
    fieldErrors.value.password = 'Password is required'
    valid = false
  }

  return valid
}

const handleLogin = async () => {
  error.value = null

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.login(form.value.email.trim(), form.value.password)

    if (result.success) {
      showSuccess('Login successful!')
      
      // Redirect — validate the path to prevent open redirect attacks
      const safeRedirect = getSafeRedirect(route.query.redirect)
      if (safeRedirect) {
        router.push(safeRedirect)
      } else {
        router.push(authStore.isAdmin ? '/admin' : '/orders')
      }
    } else {
      error.value = result.error || 'Login failed. Please check your credentials.'
      showError(error.value)
    }
  } catch (e: any) {
    // Show a user-friendly message, not raw server errors
    error.value = 'Unable to sign in. Please check your credentials and try again.'
    showError(error.value)
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: 'Login - Elite Sports DJ',
  meta: [
    { name: 'description', content: 'Sign in to your Elite Sports DJ account' }
  ]
})
</script>
