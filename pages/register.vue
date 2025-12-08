<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md">
      <!-- Header -->
      <RevealOnScroll animation="fade-up">
        <div class="text-center mb-8">
          <NuxtLink to="/" class="inline-block mb-6">
            <img 
              src="/logo.png" 
              alt="Elite Sports DJ" 
              class="h-24 w-auto mx-auto"
            />
          </NuxtLink>
          
          <h1 class="text-4xl font-bold text-white mb-2">
            Create Account
          </h1>
          <p class="text-slate-400">
            Join Elite Sports DJ to manage your bookings
          </p>
        </div>
      </RevealOnScroll>

      <!-- Success Message -->
      <div v-if="showSuccess" class="mb-6 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/50 flex items-start gap-3">
        <Icon name="mdi:check-circle" class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-green-400 font-bold mb-1">Account Created!</h4>
          <p class="text-slate-300 text-sm mb-3">Your account has been created successfully. Redirecting to login...</p>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="mb-6 p-4 rounded-lg bg-red-500/10 border-2 border-red-500/50 flex items-start gap-3">
        <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-red-400 font-bold mb-1">Error</h4>
          <p class="text-slate-300 text-sm">{{ errorMessage }}</p>
        </div>
        <button @click="errorMessage = ''" class="text-red-400 hover:text-red-300">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Registration Form -->
      <RevealOnScroll animation="fade-up">
        <div class="card p-8">
          <form @submit.prevent="handleRegister" class="space-y-5">
            <!-- Full Name -->
            <div>
              <label for="name" class="block text-sm font-semibold text-slate-200 mb-2">
                Full Name <span class="text-red-400">*</span>
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="John Doe"
                class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                :class="{ 'border-red-500': errors.name, 'border-slate-700': !errors.name }"
                @blur="validateField('name')"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-400">{{ errors.name }}</p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-semibold text-slate-200 mb-2">
                Email Address <span class="text-red-400">*</span>
              </label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="john@example.com"
                class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                :class="{ 'border-red-500': errors.email, 'border-slate-700': !errors.email }"
                @blur="validateField('email')"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-semibold text-slate-200 mb-2">
                Password <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors pr-12"
                  :class="{ 'border-red-500': errors.password, 'border-slate-700': !errors.password }"
                  @blur="validateField('password')"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <Icon :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
                </button>
              </div>
              <p v-if="errors.password" class="mt-1 text-sm text-red-400">{{ errors.password }}</p>
              <p v-else class="mt-1 text-xs text-slate-400">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-semibold text-slate-200 mb-2">
                Confirm Password <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors pr-12"
                  :class="{ 'border-red-500': errors.confirmPassword, 'border-slate-700': !errors.confirmPassword }"
                  @blur="validateField('confirmPassword')"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <Icon :name="showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-400">{{ errors.confirmPassword }}</p>
            </div>

            <!-- Terms Agreement -->
            <div class="flex items-start gap-3">
              <input
                id="terms"
                v-model="formData.agreeToTerms"
                type="checkbox"
                class="mt-1 w-4 h-4 rounded border-slate-700 bg-dark-secondary text-cyan-600 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-0"
              />
              <label for="terms" class="text-sm text-slate-300">
                I agree to the 
                <a href="/terms" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline">Terms of Service</a>
                and 
                <a href="/privacy" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</a>
                <span class="text-red-400">*</span>
              </label>
            </div>
            <p v-if="errors.agreeToTerms" class="text-sm text-red-400">{{ errors.agreeToTerms }}</p>

            <!-- Submit Button -->
            <UiButton
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105"
            >
              <span v-if="!isSubmitting" class="flex items-center justify-center gap-2">
                Create Account
                <Icon name="mdi:account-plus" class="w-5 h-5" />
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <Icon name="mdi:loading" class="w-5 h-5 animate-spin" />
                Creating Account...
              </span>
            </UiButton>
          </form>

          <!-- Login Link -->
          <div class="mt-6 text-center">
            <p class="text-slate-400">
              Already have an account?
              <NuxtLink to="/login" class="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign In
              </NuxtLink>
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({
  title: 'Register - Elite Sports DJ',
  description: 'Create an account to manage your bookings with Elite Sports DJ.'
})

const router = useRouter()

const formData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: ''
})

const isSubmitting = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const validateField = (field: keyof typeof formData) => {
  errors[field as keyof typeof errors] = ''

  if (field === 'name') {
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
  }

  if (field === 'email') {
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
  }

  if (field === 'password') {
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number'
    }
  }

  if (field === 'confirmPassword') {
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
  }

  if (field === 'agreeToTerms') {
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions'
    }
  }
}

const validateForm = () => {
  validateField('name')
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  validateField('agreeToTerms')

  return !errors.name && !errors.email && !errors.password && 
         !errors.confirmPassword && !errors.agreeToTerms
}

const handleRegister = async () => {
  if (!validateForm()) {
    errorMessage.value = 'Please fix the errors above before submitting.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // TODO: Replace with actual registration API call when backend is ready
    // const response = await $fetch('/api/auth/register', {
    //   method: 'POST',
    //   body: {
    //     name: formData.name,
    //     email: formData.email,
    //     password: formData.password
    //   }
    // })

    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Show success message
    showSuccess.value = true
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login?registered=true')
    }, 2000)
  } catch (error: any) {
    console.error('Registration error:', error)
    errorMessage.value = error.data?.message || 'Registration failed. Please try again or contact support.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.card {
  background: linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59));
  border-radius: 1rem;
  border: 2px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}
</style>
