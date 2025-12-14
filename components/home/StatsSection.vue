<template>
  <section id="stats" class="section relative bg-dark-secondary overflow-hidden">
    <!-- Texture Background -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="
        background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.3) 35px, rgba(59, 130, 246, 0.3) 70px);
      "></div>
    </div>
    
    <div class="container relative z-10">
      <!-- Section Header -->
      <RevealOnScroll animation="fade-up">
        <div class="mx-auto mb-12 max-w-3xl text-center">
          <h2 class="mb-4 text-4xl font-black text-white md:text-5xl">
            Proven <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Results</span>
          </h2>
          <p class="text-lg text-slate-300">
            Numbers that speak to our commitment and experience
          </p>
        </div>
      </RevealOnScroll>

      <RevealOnScroll animation="fade-up">
        <div class="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          <div class="stat-card group rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6 lg:p-8 text-center transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
              <Icon name="mdi:calendar-check" class="h-8 w-8 text-white" />
            </div>
            <div class="mb-2 text-3xl md:text-4xl lg:text-5xl font-black text-white">
              <AnimatedCounter :end-value="500" suffix="+" />
            </div>
            <div class="mb-1 text-base font-bold text-cyan-300 uppercase tracking-wide">Events Covered</div>
            <p class="text-xs text-slate-400">Across all major sports</p>
          </div>
          
          <div class="stat-card group rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6 lg:p-8 text-center transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
              <Icon name="mdi:account-group" class="h-8 w-8 text-white" />
            </div>
            <div class="mb-2 text-3xl md:text-4xl lg:text-5xl font-black text-white">
              <AnimatedCounter :end-value="50" suffix="+" />
            </div>
            <div class="mb-1 text-base font-bold text-cyan-300 uppercase tracking-wide">Teams Served</div>
            <p class="text-xs text-slate-400">Professional & amateur</p>
          </div>
          
          <div class="stat-card group rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6 lg:p-8 text-center transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
              <Icon name="mdi:trophy" class="h-8 w-8 text-white" />
            </div>
            <div class="mb-2 text-3xl md:text-4xl lg:text-5xl font-black text-white">
              <AnimatedCounter :end-value="10" suffix="+" />
            </div>
            <div class="mb-1 text-base font-bold text-cyan-300 uppercase tracking-wide">Years Experience</div>
            <p class="text-xs text-slate-400">Industry expertise</p>
          </div>
          
          <div class="stat-card group rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6 lg:p-8 text-center transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
              <Icon name="mdi:star" class="h-8 w-8 text-white" />
            </div>
            <div class="mb-2 text-3xl md:text-4xl lg:text-5xl font-black text-white">
              <AnimatedCounter :end-value="100" suffix="%" />
            </div>
            <div class="mb-1 text-base font-bold text-cyan-300 uppercase tracking-wide">Satisfaction</div>
            <p class="text-xs text-slate-400">Client retention rate</p>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  </section>
</template>

<script setup lang="ts">
// No props needed for this component
</script>

<style scoped>
.stat-card {
  backdrop-filter: blur(10px);
}
</style>
