<template>
  <div class="min-h-screen bg-dark-primary flex items-center justify-center px-4 py-20 relative overflow-hidden">
    <!-- Confetti Canvas -->
    <canvas ref="confettiCanvas" class="fixed inset-0 pointer-events-none z-50"></canvas>
    
    <!-- Sports Celebration Icons -->
    <div class="sports-celebration">
      <Icon name="mdi:trophy" class="sport-icon trophy" />
      <Icon name="mdi:star" class="sport-icon star-1" />
      <Icon name="mdi:star" class="sport-icon star-2" />
      <Icon name="mdi:medal" class="sport-icon medal" />
      <Icon name="mdi:hockey-sticks" class="sport-icon hockey" />
    </div>

    <div class="container mx-auto max-w-4xl text-center relative z-10">
      <!-- Success Icon -->
      <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success-600 mb-8 animate-success-pop">
        <Icon name="mdi:check-circle" class="w-16 h-16 text-white" />
      </div>

      <!-- Heading -->
      <div class="space-y-6 mb-12 animate-fade-in-up delay-200">
        <h1 class="text-5xl md:text-6xl font-bold text-white leading-tight">
          Request <span class="gradient-text">Received!</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Thank you for your interest in Elite Sports DJ Services. We've received your request and will get back to you within 24 hours.
        </p>
      </div>

      <!-- Info Cards -->
      <div class="grid md:grid-cols-3 gap-6 mb-12">
        <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-brand-500/30 transition-colors animate-fade-in-up delay-300">
          <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-brand-600 flex items-center justify-center pulse-glow">
            <Icon name="mdi:email-check" class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Check Your Email</h3>
          <p class="text-slate-400 text-sm">You'll receive a confirmation email shortly</p>
        </div>

        <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-accent-500/30 transition-colors animate-fade-in-up delay-400">
          <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-accent-600 flex items-center justify-center pulse-glow">
            <Icon name="mdi:clock-fast" class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Quick Response</h3>
          <p class="text-slate-400 text-sm">We'll contact you within 24 hours</p>
        </div>

        <div class="p-6 rounded-xl bg-dark-secondary border border-white/10 hover:border-success-500/30 transition-colors animate-fade-in-up delay-500">
          <div class="w-14 h-14 mx-auto mb-4 rounded-lg bg-success-600 flex items-center justify-center pulse-glow">
            <Icon name="mdi:file-document-edit" class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Custom Quote</h3>
          <p class="text-slate-400 text-sm">We'll prepare a tailored proposal for you</p>
        </div>
      </div>

      <!-- Next Steps -->
      <div class="card p-8 mb-12 animate-fade-in-up delay-600">
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-8">What Happens Next?</h2>
        <div class="grid md:grid-cols-3 gap-8 text-left">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center animate-bounce-in delay-700">
              1
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">We Review Your Request</h3>
              <p class="text-slate-400 text-sm">Our team will carefully review your event details and requirements</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-accent-600 text-white font-bold flex items-center justify-center animate-bounce-in delay-800">
              2
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">We Reach Out</h3>
              <p class="text-slate-400 text-sm">We'll contact you via email or phone to discuss your needs</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-success-600 text-white font-bold flex items-center justify-center animate-bounce-in delay-900">
              3
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">We Create Magic</h3>
              <p class="text-slate-400 text-sm">Once booked, we'll work together to create an unforgettable experience</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-1000">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import confetti from 'canvas-confetti'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Thank You - Elite Sports DJ Services',
  meta: [
    { name: 'description', content: 'Thank you for your service request. We will be in touch soon!' }
  ]
})

const confettiCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (confettiCanvas.value) {
    const myConfetti = confetti.create(confettiCanvas.value, {
      resize: true,
      useWorker: true
    })
    
    // Fire confetti on page load - center burst
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#06b6d4', '#22d3ee', '#fbbf24', '#f59e0b', '#10b981']
    })
    
    // Fire from left side after 400ms
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#0ea5e9', '#06b6d4', '#22d3ee']
      })
    }, 400)
    
    // Fire from right side after 600ms
    setTimeout(() => {
      myConfetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#ef4444']
      })
    }, 600)
    
    // Final burst after 1s
    setTimeout(() => {
      myConfetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#10b981', '#22d3ee', '#fbbf24']
      })
    }, 1000)
  }
})
</script>

<style scoped>
/* Enhanced success icon animation */
@keyframes success-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-success-pop {
  animation: success-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Sports celebration icons */
.sports-celebration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;
}

.sport-icon {
  position: absolute;
  font-size: 2.5rem;
  opacity: 0;
  animation: float-up 4s ease-out forwards;
}

.trophy {
  left: 15%;
  top: 120px;
  color: #fbbf24;
  animation-delay: 0.3s;
}

.star-1 {
  left: 75%;
  top: 100px;
  color: #0ea5e9;
  animation-delay: 0.5s;
}

.star-2 {
  left: 85%;
  top: 150px;
  color: #22d3ee;
  animation-delay: 0.7s;
}

.medal {
  left: 10%;
  top: 180px;
  color: #ef4444;
  animation-delay: 0.9s;
}

.hockey {
  left: 80%;
  top: 200px;
  color: #10b981;
  animation-delay: 1.1s;
}

@keyframes float-up {
  0% {
    transform: translateY(100px) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(-300px) scale(1.5) rotate(360deg);
    opacity: 0;
  }
}

/* Fade in up animation */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out backwards;
}

/* Bounce in animation for step numbers */
@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) backwards;
}

/* Pulse glow effect for icons */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(6, 182, 212, 0.6);
  }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Animation delays */
.delay-200 {
  animation-delay: 0.2s;
}

.delay-300 {
  animation-delay: 0.3s;
}

.delay-400 {
  animation-delay: 0.4s;
}

.delay-500 {
  animation-delay: 0.5s;
}

.delay-600 {
  animation-delay: 0.6s;
}

.delay-700 {
  animation-delay: 0.7s;
}

.delay-800 {
  animation-delay: 0.8s;
}

.delay-900 {
  animation-delay: 0.9s;
}

.delay-1000 {
  animation-delay: 1s;
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
