<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center px-4 py-20">
    <div class="container mx-auto max-w-4xl text-center">
      <RevealOnScroll animation="fade-up">
        <!-- Success Icon -->
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success-600 mb-8 animate-bounce-slow">
          <Icon name="mdi:check-circle" class="w-16 h-16 text-white" />
        </div>

        <!-- Heading -->
        <div class="space-y-6 mb-12">
          <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight">
            Request <span class="gradient-text">Received!</span>
          </h1>
          <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Thank you for your interest in Elite Sports DJ Services. We've received your request and will get back to you within 24 hours.
          </p>
        </div>
      </RevealOnScroll>

      <!-- Info Cards -->
      <RevealOnScroll animation="fade-up">
        <div class="grid md:grid-cols-3 gap-6 mb-12">
          <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-brand-500/30 transition-colors">
            <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-brand-600 flex items-center justify-center">
              <Icon name="mdi:email-check" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Check Your Email</h3>
            <p class="text-slate-400 text-sm">You'll receive a confirmation email shortly</p>
          </div>

          <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-accent-500/30 transition-colors">
            <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-accent-600 flex items-center justify-center">
              <Icon name="mdi:clock-fast" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Quick Response</h3>
            <p class="text-slate-400 text-sm">We'll contact you within 24 hours</p>
          </div>

          <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-success-500/30 transition-colors">
            <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-success-600 flex items-center justify-center">
              <Icon name="mdi:file-document-edit" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Custom Quote</h3>
            <p class="text-slate-400 text-sm">We'll prepare a tailored proposal for you</p>
          </div>
        </div>
      </RevealOnScroll>

      <!-- Next Steps -->
      <RevealOnScroll animation="fade-up">
        <div class="card p-8 mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-8">What Happens Next?</h2>
          <div class="grid md:grid-cols-3 gap-8 text-left">
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                1
              </div>
              <div>
                <h3 class="text-lg font-bold text-white mb-2">We Review Your Request</h3>
                <p class="text-slate-400 text-sm">Our team will carefully review your event details and requirements</p>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-accent-600 text-white font-bold flex items-center justify-center">
                2
              </div>
              <div>
                <h3 class="text-lg font-bold text-white mb-2">We Reach Out</h3>
                <p class="text-slate-400 text-sm">We'll contact you via email or phone to discuss your needs</p>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-success-600 text-white font-bold flex items-center justify-center">
                3
              </div>
              <div>
                <h3 class="text-lg font-bold text-white mb-2">We Create Magic</h3>
                <p class="text-slate-400 text-sm">Once booked, we'll work together to create an unforgettable experience</p>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <!-- CTA -->
      <RevealOnScroll animation="fade-up">
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <UiButton 
            to="/"
            variant="primary"
            size="lg"
          >
            <Icon name="mdi:home" class="w-5 h-5" />
            Return to Homepage
          </UiButton>
          
          <UiButton 
            to="/#packages"
            variant="outline"
            size="lg"
          >
            <Icon name="mdi:package-variant" class="w-5 h-5" />
            View Packages
          </UiButton>
        </div>
      </RevealOnScroll>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Thank You - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Thank you for your service request. We will be in touch soon!' }
  ]
})
</script>

<style scoped>
@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
</style>
