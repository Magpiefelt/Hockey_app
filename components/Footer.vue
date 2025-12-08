<template>
  <footer class="relative bg-gradient-to-b from-slate-950 to-slate-900 border-t border-cyan-400/20">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="
        background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.3) 35px, rgba(59, 130, 246, 0.3) 70px);
      "></div>
    </div>
    
    <div class="container relative z-10 px-4 py-12">
      <div class="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        
        <!-- Brand Column -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="relative h-12 w-12 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Elite Sports DJ" 
                class="h-full w-auto object-contain"
              />
            </div>
          </div>
          <p class="text-sm leading-relaxed text-slate-400">
            Professional game day entertainment for hockey, lacrosse, baseball, basketball, and more.
          </p>
          
          <!-- Social Media Links -->
          <div class="flex gap-3 pt-2">
            <a
              href="https://facebook.com/elitesportsdj"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500/30 bg-slate-800/50 transition-all hover:border-cyan-400 hover:bg-slate-700/50 hover:scale-110"
              aria-label="Follow us on Facebook"
            >
              <Icon name="mdi:facebook" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-cyan-400" />
            </a>
            
            <a
              href="https://instagram.com/elitesportsdj"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500/30 bg-slate-800/50 transition-all hover:border-cyan-400 hover:bg-slate-700/50 hover:scale-110"
              aria-label="Follow us on Instagram"
            >
              <Icon name="mdi:instagram" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-cyan-400" />
            </a>
            
            <a
              href="https://twitter.com/elitesportsdj"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500/30 bg-slate-800/50 transition-all hover:border-cyan-400 hover:bg-slate-700/50 hover:scale-110"
              aria-label="Follow us on Twitter"
            >
              <Icon name="mdi:twitter" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-cyan-400" />
            </a>
            
            <a
              href="https://youtube.com/@elitesportsdj"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500/30 bg-slate-800/50 transition-all hover:border-cyan-400 hover:bg-slate-700/50 hover:scale-110"
              aria-label="Subscribe on YouTube"
            >
              <Icon name="mdi:youtube" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-cyan-400" />
            </a>
            
            <a
              href="https://linkedin.com/company/elitesportsdj"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500/30 bg-slate-800/50 transition-all hover:border-cyan-400 hover:bg-slate-700/50 hover:scale-110"
              aria-label="Connect on LinkedIn"
            >
              <Icon name="mdi:linkedin" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-cyan-400" />
            </a>
          </div>
        </div>
        
        <!-- Services Column -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-white">Services</h3>
          <ul class="space-y-2">
            <li>
              <a href="#services" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Game Day DJ
              </a>
            </li>
            <li>
              <a href="#services" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Player Introductions
              </a>
            </li>
            <li>
              <a href="#services" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Event Hosting
              </a>
            </li>
            <li>
              <a href="#packages" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                View All Packages
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Quick Links Column -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-white">Quick Links</h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Home
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/request" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Request Quote
              </NuxtLink>
            </li>
            <li>
              <a href="/#testimonials" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Testimonials
              </a>
            </li>
            <li>
              <a href="/#stats" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                About Us
              </a>
            </li>
            <li>
              <a href="/request" class="text-sm text-slate-400 transition-colors hover:text-cyan-400">
                Contact
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Contact Column -->
        <div class="space-y-4">
          <h3 class="text-lg font-bold text-white">Get In Touch</h3>
          <ul class="space-y-3">
            <li class="flex items-start gap-2 text-sm text-slate-400">
              <Icon name="mdi:email" class="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <a href="mailto:info@elitesportsdj.com" class="transition-colors hover:text-cyan-400">
                info@elitesportsdj.com
              </a>
            </li>
            <li class="flex items-start gap-2 text-sm text-slate-400">
              <Icon name="mdi:map-marker" class="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <span>Serving teams across the region</span>
            </li>
          </ul>
          
          <div class="pt-4">
            <NuxtLink
              to="/request"
              class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105"
            >
              Request a Quote
              <Icon name="mdi:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
        
      </div>
      
      <!-- Bottom Bar -->
      <div class="mt-12 border-t border-slate-800 pt-8">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p class="text-sm text-slate-500">
            © {{ currentYear }} Elite Sports DJ. All rights reserved.
          </p>
          
          <div class="flex flex-wrap gap-6 text-sm">
            <a href="#" class="text-slate-500 transition-colors hover:text-cyan-400">
              Privacy Policy
            </a>
            <a href="#" class="text-slate-500 transition-colors hover:text-cyan-400">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* Smooth link transitions */
a {
  transition: color 0.2s ease;
}
</style>
