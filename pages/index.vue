<template>
  <div class="bg-dark-primary min-h-screen">
    <!-- Skip to Content Link for Accessibility -->
    <a
      href="#main-content"
      class="skip-to-content sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-600 focus:px-6 py-3 font-bold text-white shadow-xl"
    >
      Skip to main content
    </a>
    
    <!-- Scroll Progress Indicator -->
    <ScrollProgress />
    
    <!-- Sticky CTA Bar -->
    <StickyCTABar />

    <!-- Hero Section (Eager Loaded) -->
    <HomeHeroSection id="main-content" @scroll-to-packages="scrollToPackages" />

    <!-- Stats Section (Eager Loaded - important social proof) -->
    <HomeStatsSection />

    <!-- How It Works Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="600px">
      <HomeHowItWorksSection />
    </LazySectionWrapper>

    <!-- Services Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="800px">
      <HomeServicesSection />
    </LazySectionWrapper>

    <!-- Packages Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="1000px">
      <HomePackagesSection id="packages" />
    </LazySectionWrapper>

    <!-- Testimonials Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="700px">
      <HomeTestimonialsSection />
    </LazySectionWrapper>

    <!-- Gallery Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="500px">
      <HomeGallerySection />
    </LazySectionWrapper>

    <!-- FAQ Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="600px">
      <HomeFAQSection />
    </LazySectionWrapper>

    <!-- CTA Section (Lazy Loaded) -->
    <LazySectionWrapper placeholder-height="500px" :show-placeholder="false">
      <HomeCTASection />
    </LazySectionWrapper>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Page metadata
useHead({
  title: 'Elite Sports DJ | Professional Game Day Entertainment',
  meta: [
    {
      name: 'description',
      content: 'Elevate your game day with professional DJ services, player introductions, and event hosting for hockey, lacrosse, and more. Trusted by over 50 teams.'
    }
  ]
})

// Smooth scroll to packages section
const scrollToPackages = () => {
  const packagesSection = document.getElementById('packages')
  if (packagesSection) {
    packagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

</script>

