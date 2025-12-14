<template>
  <section id="services" class="section relative bg-dark-secondary overflow-hidden">
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="
        background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.3) 35px, rgba(59, 130, 246, 0.3) 70px);
      "></div>
    </div>
    
    <div class="container relative z-10">
      <RevealOnScroll animation="fade-up">
        <div class="mx-auto mb-16 max-w-3xl text-center">
          <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
            Our <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Services</span>
          </h2>
          <p class="text-xl text-slate-300 font-medium">
            Comprehensive game day entertainment solutions
          </p>
        </div>
      </RevealOnScroll>

      <div class="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        <RevealOnScroll animation="fade-up">
          <div class="service-card group rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Icon name="mdi:account-multiple" class="h-10 w-10 text-white" />
            </div>
            <h3 class="mb-4 text-2xl font-bold text-white">Player Introductions</h3>
            <p class="mb-6 text-slate-300 leading-relaxed">
              Professional player introductions with custom music, lighting coordination, and crowd engagement.
            </p>
            <ul class="mb-6 space-y-2 text-slate-400">
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Custom intro music</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Pronunciation support</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Warmup songs</span>
              </li>
            </ul>
            <NuxtLink to="/request" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Learn More
              <Icon name="mdi:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </RevealOnScroll>

        <RevealOnScroll animation="fade-up" :delay="100">
          <div class="service-card group rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Icon name="mdi:music" class="h-10 w-10 text-white" />
            </div>
            <h3 class="mb-4 text-2xl font-bold text-white">Game Day DJ</h3>
            <p class="mb-6 text-slate-300 leading-relaxed">
              Full game entertainment with music, sound effects, and crowd engagement throughout the entire event.
            </p>
            <ul class="mb-6 space-y-2 text-slate-400">
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Curated playlists</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Sound effects</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Hype videos</span>
              </li>
            </ul>
            <div class="text-sm text-cyan-400 font-semibold mb-4">
              Most popular service
            </div>
            <NuxtLink to="/request" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Request Quote
              <Icon name="mdi:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </RevealOnScroll>

        <RevealOnScroll animation="fade-up" :delay="200">
          <div class="service-card group rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Icon name="mdi:account-voice" class="h-10 w-10 text-white" />
            </div>
            <h3 class="mb-4 text-2xl font-bold text-white">Event Hosting</h3>
            <p class="mb-6 text-slate-300 leading-relaxed">
              Complete event hosting services including announcements, contests, and fan engagement activities throughout the game.
            </p>
            <ul class="mb-6 space-y-2 text-slate-400">
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Live announcements</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Contest hosting</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                <span>Fan interaction</span>
              </li>
            </ul>
            <div class="text-sm text-cyan-400 font-semibold mb-4">
              Premium package exclusive
            </div>
            <NuxtLink to="/request" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Request Quote
              <Icon name="mdi:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </RevealOnScroll>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// No props needed for this component
</script>

<style scoped>
.service-card {
  backdrop-filter: blur(10px);
}
</style>
