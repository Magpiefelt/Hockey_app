<template>
  <div class="min-h-screen bg-dark-primary px-4 py-16">
    <div class="container max-w-4xl">
      <!-- Header -->
      <RevealOnScroll animation="fade-up">
        <div class="text-center mb-12 space-y-4">
          <div class="badge-brand mx-auto w-fit mb-4">
            <Icon name="mdi:email-fast" class="w-4 h-4" />
            <span class="uppercase tracking-wider">Get In Touch</span>
          </div>
          
          <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight">
            Contact <span class="gradient-text">Us</span>
          </h1>
          
          <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Have a question or want to discuss your event? We're here to help!
          </p>
        </div>
      </RevealOnScroll>

      <!-- Success Message -->
      <div v-if="showSuccess" class="mb-6 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/50 flex items-start gap-3">
        <Icon name="mdi:check-circle" class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-green-400 font-bold mb-1">Message Sent!</h4>
          <p class="text-slate-300 text-sm">Thank you for contacting us. We'll get back to you within 24 hours.</p>
        </div>
        <button @click="showSuccess = false" class="text-green-400 hover:text-green-300">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
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

      <!-- Contact Form -->
      <RevealOnScroll animation="fade-up">
        <div class="card p-8 md:p-10">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-semibold text-slate-200 mb-2">
                Your Name <span class="text-red-400">*</span>
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="John Doe"
                required
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
                required
                class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                :class="{ 'border-red-500': errors.email, 'border-slate-700': !errors.email }"
                @blur="validateField('email')"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-semibold text-slate-200 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                v-model="formData.phone"
                type="tel"
                placeholder="(555) 123-4567"
                class="w-full px-4 py-3 bg-dark-secondary border-2 border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <!-- Subject -->
            <div>
              <label for="subject" class="block text-sm font-semibold text-slate-200 mb-2">
                Subject <span class="text-red-400">*</span>
              </label>
              <input
                id="subject"
                v-model="formData.subject"
                type="text"
                placeholder="How can we help you?"
                class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                :class="{ 'border-red-500': errors.subject, 'border-slate-700': !errors.subject }"
                @blur="validateField('subject')"
              />
              <p v-if="errors.subject" class="mt-1 text-sm text-red-400">{{ errors.subject }}</p>
            </div>

            <!-- Message -->
            <div>
              <label for="message" class="block text-sm font-semibold text-slate-200 mb-2">
                Message <span class="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                v-model="formData.message"
                rows="6"
                placeholder="Tell us about your event or question..."
                class="w-full px-4 py-3 bg-dark-secondary border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                :class="{ 'border-red-500': errors.message, 'border-slate-700': !errors.message }"
                @blur="validateField('message')"
              ></textarea>
              <p v-if="errors.message" class="mt-1 text-sm text-red-400">{{ errors.message }}</p>
            </div>

            <!-- Submit Button -->
            <div class="flex flex-col sm:flex-row gap-4">
              <UiButton
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                <span v-if="!isSubmitting" class="flex items-center justify-center gap-2">
                  Send Message
                  <Icon name="mdi:send" class="w-5 h-5" />
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <Icon name="mdi:loading" class="w-5 h-5 animate-spin" />
                  Sending...
                </span>
              </UiButton>
              
              <NuxtLink
                to="/request"
                class="flex items-center justify-center gap-2 px-8 py-4 border-2 border-cyan-400/50 bg-slate-900/50 rounded-lg font-bold text-white backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400 hover:bg-slate-800/50"
              >
                Request Quote Instead
                <Icon name="mdi:arrow-right" class="w-5 h-5" />
              </NuxtLink>
            </div>
          </form>
        </div>
      </RevealOnScroll>

      <!-- Contact Info -->
      <RevealOnScroll animation="fade-up">
        <div class="mt-12 grid gap-6 md:grid-cols-3">
          <div class="card p-6 text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
              <Icon name="mdi:email" class="h-6 w-6 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Email Us</h3>
            <p class="text-slate-300 text-sm">info@elitesportsdj.com</p>
          </div>

          <div class="card p-6 text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
              <Icon name="mdi:phone" class="h-6 w-6 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Call Us</h3>
            <p class="text-slate-300 text-sm">(555) 123-4567</p>
          </div>

          <div class="card p-6 text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
              <Icon name="mdi:clock-outline" class="h-6 w-6 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Response Time</h3>
            <p class="text-slate-300 text-sm">Within 24 hours</p>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

definePageMeta({
  title: 'Contact Us - Elite Sports DJ',
  description: 'Get in touch with Elite Sports DJ for questions about our services or to discuss your event.'
})

const trpc = useTrpc()
const { showSuccess: showSuccessToast, showError: showErrorToast } = useNotification()

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const isSubmitting = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')

const validateField = (field: keyof typeof formData) => {
  errors[field as keyof typeof errors] = ''

  if (field === 'name' && !formData.name.trim()) {
    errors.name = 'Name is required'
  }

  if (field === 'email') {
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
  }

  if (field === 'subject' && !formData.subject.trim()) {
    errors.subject = 'Subject is required'
  }

  if (field === 'message') {
    if (!formData.message.trim()) {
      errors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }
  }
}

const validateForm = () => {
  validateField('name')
  validateField('email')
  validateField('subject')
  validateField('message')

  return !errors.name && !errors.email && !errors.subject && !errors.message
}

const handleSubmit = async () => {
  if (!validateForm()) {
    errorMessage.value = 'Please fill in all required fields correctly.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Submit to backend via tRPC
    const result = await trpc.contact.submit.mutate({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      subject: formData.subject.trim(),
      message: formData.message.trim()
    })

    // Show success message
    showSuccess.value = true
    showSuccessToast('Message sent successfully!')
    
    // Reset form to empty values
    Object.assign(formData, {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })

    // Clear any validation errors
    Object.assign(errors, {
      name: '',
      email: '',
      subject: '',
      message: ''
    })

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      showSuccess.value = false
    }, 5000)
  } catch (error: any) {
    console.error('Contact form submission error:', error)
    
    // Extract error message from tRPC error
    const message = error.data?.message || error.message || 'Failed to send message. Please try again or email us directly.'
    errorMessage.value = message
    showErrorToast(message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.badge-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 2px solid rgba(34, 211, 238, 0.3);
  background: rgba(8, 145, 178, 0.1);
  color: rgb(34, 211, 238);
  font-size: 0.875rem;
  font-weight: 600;
}

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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}
</style>
