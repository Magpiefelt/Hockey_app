<template>
  <div class="bg-dark-primary min-h-screen">
    <!-- Skip to Content Link for Accessibility -->
    <a
      href="#main-content"
      class="skip-to-content sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-600 focus:px-6 focus:py-3 focus:font-bold focus:text-white focus:shadow-xl"
    >
      Skip to main content
    </a>
    
    <!-- Scroll Progress Indicator -->
    <ScrollProgress />
    
    <!-- Sticky CTA Bar -->
    <StickyCTABar />
    <!-- Hero Section - Enhanced Split-Screen Design with Video Carousel -->
    <section id="main-content" class="hero-section relative min-h-screen overflow-hidden">
      <!-- Animated Background Layers -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"></div>
      
      <!-- Ice Rink Texture Overlay -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="
          background-image: 
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.3) 2px, rgba(59, 130, 246, 0.3) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59, 130, 246, 0.3) 2px, rgba(59, 130, 246, 0.3) 4px);
          background-size: 100px 100px;
        "></div>
      </div>
      
      <!-- Hockey Puck Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
          background-size: 50px 50px;
        "></div>
      </div>
      
      <!-- Animated Gradient Orbs -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      
      <!-- Diagonal Stripes (Hockey Jersey Style) -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 80px,
            rgba(59, 130, 246, 0.5) 80px,
            rgba(59, 130, 246, 0.5) 160px
          );
        "></div>
      </div>
      
      <!-- Split-Screen Content Container -->
      <div class="container relative z-10 flex min-h-screen items-center px-4 py-12 md:py-16 lg:py-20">
        <div class="grid w-full grid-cols-1 gap-8 md:gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          
          <!-- LEFT COLUMN: Branding & Text (55%) -->
          <div class="flex items-center justify-center lg:col-span-6">
            <RevealOnScroll animation="fade-right">
              <div class="max-w-3xl text-center lg:text-left">
                
                <!-- Trust Badge -->
                <div class="mb-6 flex justify-center lg:justify-start">
                  <div class="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-cyan-400/30 bg-slate-900/50 px-3 sm:px-4 py-2 backdrop-blur-sm">
                    <Icon name="mdi:star" class="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                    <span class="text-xs sm:text-sm font-semibold text-slate-200">Trusted by 50+ Teams</span>
                    <span class="text-xs sm:text-sm text-slate-400">•</span>
                    <span class="text-xs sm:text-sm font-semibold text-slate-200">500+ Events</span>
                  </div>
                </div>
                
                <!-- Logo -->
                <div class="mb-12 flex justify-center lg:justify-start">
                  <img 
                    src="/logo.png" 
                    alt="Elite Sports DJ" 
                    class="h-64 w-auto object-contain sm:h-80 md:h-96 lg:h-112 xl:h-128 2xl:h-144 hero-logo-animate" 
                  />
                </div>
                
                <!-- Dynamic Badge with Sports Icons -->
                <div class="mb-8 flex justify-center lg:justify-start">
                  <div class="badge-sports inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-full border-2 border-cyan-400/50 bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-blue-600/30 px-4 sm:px-6 py-2 sm:py-3 backdrop-blur-md max-w-full">
                    <Icon name="mdi:hockey-sticks" class="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0s;" />
                    <Icon name="mdi:basketball" class="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0.2s;" />
                    <span class="text-xs sm:text-sm md:text-base font-bold tracking-wider text-white uppercase text-center">Professional Game Day Entertainment</span>
                    <Icon name="mdi:baseball" class="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0.4s;" />
                    <Icon name="mdi:football" class="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 animate-bounce hidden sm:inline-block" style="animation-delay: 0.6s;" />
                  </div>
                </div>
                
                <!-- Main Headline -->
                <h1 class="hero-headline mb-6 md:mb-8 text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
                  <span class="block mb-2">ELEVATE YOUR</span>
                  <span class="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-gradient">
                    GAME DAY
                  </span>
                  <span class="block mt-2">EXPERIENCE</span>
                </h1>
                
                <!-- Subheadline -->
                <p class="mb-8 md:mb-10 lg:mb-12 max-w-3xl text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl leading-relaxed text-slate-200 font-medium mx-auto lg:mx-0">
                  Professional DJ services, player introductions, and event hosting for 
                  <span class="text-cyan-300 font-bold">hockey</span>, 
                  <span class="text-blue-300 font-bold">lacrosse</span>, 
                  <span class="text-cyan-300 font-bold">baseball</span>, 
                  <span class="text-blue-300 font-bold">basketball</span>, and more.
                </p>
                
                <!-- CTA Buttons -->
                <div class="flex flex-col items-center justify-center gap-4 sm:gap-6 sm:flex-row lg:justify-start">                  <NuxtLink
                    to="/request"
                    class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl font-bold text-white shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-cyan-500/50 rounded-lg inline-flex items-center justify-center w-full sm:w-auto"
                  >
                    <span class="relative z-10 flex items-center gap-3">
                      Get Started
                      <Icon name="mdi:arrow-right" class="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div class="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                  </NuxtLink>
                  
                  <a
                    href="#packages"
                    @click.prevent="scrollToPackages"
                    class="group border-2 border-cyan-400/50 bg-slate-900/50 px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl font-bold text-white backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400 hover:bg-slate-800/50 rounded-lg inline-flex items-center justify-center cursor-pointer w-full sm:w-auto"
                  >
                    <span class="flex items-center gap-3">
                      View Packages
                      <Icon name="mdi:package-variant" class="h-6 w-6" />
                    </span>
                  </a>
                </div>
                
              </div>
            </RevealOnScroll>
          </div>
          
          <!-- RIGHT COLUMN: Video Carousel (45%) -->
          <div class="flex items-center justify-center lg:justify-end lg:col-span-6 lg:pt-0 lg:pl-8 xl:pl-12 2xl:pl-16">
            <RevealOnScroll animation="fade-left">
              <div class="w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
                <HeroVideoCarousel 
                  :videos="heroVideos"
                  :scroll-speed="25"
                  :show-video-info="true"
                  :is-modal-open="isVideoModalOpen"
                  @video-clicked="openVideoModal"
                />
              </div>
            </RevealOnScroll>
          </div>
          
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div class="absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
        <a href="#stats" class="block" aria-label="Scroll down to view statistics">
          <div class="animate-bounce">
            <Icon name="mdi:chevron-down" class="h-12 w-12 text-cyan-400 opacity-70" />
          </div>
        </a>
      </div>
      
      <!-- Bottom Gradient Fade -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-primary to-transparent"></div>
    </section>

    <!-- Stats Section - Enhanced with Context -->
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
                <Icon name="mdi:clock-outline" class="h-8 w-8 text-white" />
              </div>
              <div class="mb-2 text-3xl md:text-4xl lg:text-5xl font-black text-white">
                <AnimatedCounter :end-value="10" suffix="+" />
              </div>
              <div class="mb-1 text-base font-bold text-cyan-300 uppercase tracking-wide">Years Experience</div>
              <p class="text-xs text-slate-400">Industry veterans</p>
            </div>
            
            <div class="stat-card group rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6 lg:p-8 text-center transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
                <Icon name="mdi:star" class="h-8 w-8 text-white" />
              </div>
              <div class="mb-2 text-3xl md:text-4xl lg:text-5xl font-black text-white">
                <AnimatedCounter :end-value="100" suffix="%" />
              </div>
              <div class="mb-1 text-base font-bold text-cyan-300 uppercase tracking-wide">Satisfaction</div>
              <p class="text-xs text-slate-400">Client approval rate</p>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>

    <!-- Availability Calendar Section -->
    <HomeAvailabilityCalendar />

    <!-- How It Works Section - NEW -->
    <section class="section relative bg-dark-primary overflow-hidden">
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px);
          background-size: 40px 40px;
        "></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              How It <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p class="text-xl text-slate-300 font-medium">
              Simple process from booking to game day
            </p>
          </div>
        </RevealOnScroll>

        <div class="mx-auto max-w-5xl">
          <div class="grid gap-8 md:grid-cols-3">
            <RevealOnScroll animation="fade-up" :delay="0">
              <div class="relative text-center">
                <!-- Step Number -->
                <div class="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl shadow-blue-500/30">
                  <span class="text-3xl font-black text-white">1</span>
                </div>
                <!-- Connector Line (hidden on mobile) - positioned behind the circle -->
                <div class="absolute left-[calc(50%+2.5rem)] right-0 top-10 hidden h-1 bg-gradient-to-r from-cyan-500/50 to-transparent md:block" style="z-index: 0;"></div>
                
                <h3 class="mb-4 text-2xl font-bold text-white">Request a Quote</h3>
                <p class="text-slate-300 leading-relaxed">
                  Fill out our simple form with your event details, date, and requirements. Get a custom quote within 24 hours.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" :delay="100">
              <div class="relative text-center">
                <!-- Step Number -->
                <div class="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl shadow-blue-500/30">
                  <span class="text-3xl font-black text-white">2</span>
                </div>
                <!-- Connector Lines (hidden on mobile) - positioned behind the circle -->
                <div class="absolute left-0 right-[calc(50%+2.5rem)] top-10 hidden h-1 bg-gradient-to-l from-cyan-500/50 to-transparent md:block" style="z-index: 0;"></div>
                <div class="absolute left-[calc(50%+2.5rem)] right-0 top-10 hidden h-1 bg-gradient-to-r from-cyan-500/50 to-transparent md:block" style="z-index: 0;"></div>
                
                <h3 class="mb-4 text-2xl font-bold text-white">Plan Together</h3>
                <p class="text-slate-300 leading-relaxed">
                  We'll work with you to customize music, player intros, and special moments to match your team's style.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" :delay="200">
              <div class="relative text-center">
                <!-- Step Number -->
                <div class="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl shadow-blue-500/30">
                  <span class="text-3xl font-black text-white">3</span>
                </div>
                <!-- Connector Line (hidden on mobile) - positioned behind the circle -->
                <div class="absolute left-0 right-[calc(50%+2.5rem)] top-10 hidden h-1 bg-gradient-to-l from-cyan-500/50 to-transparent md:block" style="z-index: 0;"></div>
                
                <h3 class="mb-4 text-2xl font-bold text-white">Game Day Magic</h3>
                <p class="text-slate-300 leading-relaxed">
                  We arrive early, set up professionally, and deliver an unforgettable experience for your players and fans.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section - Enhanced -->
    <section id="services" class="section relative bg-dark-secondary overflow-hidden">
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px);
          background-size: 40px 40px;
        "></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              Our <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Services</span>
            </h2>
            <p class="text-xl text-slate-300 font-medium">
              Comprehensive entertainment solutions for every sports event
            </p>
          </div>
        </RevealOnScroll>

        <div class="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          <RevealOnScroll animation="fade-up" :delay="0">
            <div class="service-card group rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
              <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Icon name="mdi:music-note" class="h-10 w-10 text-white" />
              </div>
              <h3 class="mb-4 text-2xl font-bold text-white">Game Day DJ</h3>
              <p class="mb-6 text-slate-300 leading-relaxed">
                Professional DJ services with high-energy music selection to pump up your crowd and create an electric atmosphere.
              </p>
              <ul class="mb-6 space-y-2 text-slate-400">
                <li class="flex items-center gap-2">
                  <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                  <span>Custom playlists</span>
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                  <span>Professional sound system</span>
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                  <span>Crowd engagement</span>
                </li>
              </ul>
              <div class="text-sm text-cyan-400 font-semibold mb-4">
                Starting at $299/event
              </div>
              <NuxtLink to="/request" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Request Quote
                <Icon name="mdi:arrow-right" class="h-4 w-4" />
              </NuxtLink>
            </div>
          </RevealOnScroll>

          <RevealOnScroll animation="fade-up" :delay="100">
            <div class="service-card group rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 transition-all duration-300 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
              <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Icon name="mdi:microphone" class="h-10 w-10 text-white" />
              </div>
              <h3 class="mb-4 text-2xl font-bold text-white">Player Introductions</h3>
              <p class="mb-6 text-slate-300 leading-relaxed">
                Dynamic player introductions that get your team fired up and your fans on their feet with professional announcing.
              </p>
              <ul class="mb-6 space-y-2 text-slate-400">
                <li class="flex items-center gap-2">
                  <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                  <span>Custom intro music</span>
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                  <span>Professional announcing</span>
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="mdi:check-circle" class="h-5 w-5 text-cyan-400" />
                  <span>Hype videos</span>
                </li>
              </ul>
              <div class="text-sm text-cyan-400 font-semibold mb-4">
                Included in Professional & Premium packages
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

    <!-- Packages Section - Dynamic from Database -->
    <section id="packages" class="section relative bg-dark-primary overflow-hidden">
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(59, 130, 246, 0.3) 50px, rgba(59, 130, 246, 0.3) 100px);
        "></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Elite</span> Packages
            </h2>
            <p class="text-xl text-slate-300 font-medium">
              Choose the perfect package for your event
            </p>
          </div>
        </RevealOnScroll>

        <!-- Loading State -->
        <div v-if="packagesLoading" class="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          <div v-for="i in 3" :key="i" class="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-6 lg:p-8 animate-pulse">
            <div class="h-6 w-32 bg-slate-700 rounded-full mb-8 mt-4"></div>
            <div class="h-8 w-48 bg-slate-700 rounded mb-4"></div>
            <div class="h-12 w-28 bg-slate-700 rounded mb-4"></div>
            <div class="h-4 w-56 bg-slate-700 rounded mb-8"></div>
            <div class="space-y-3 mb-8">
              <div class="h-4 w-full bg-slate-700/50 rounded"></div>
              <div class="h-4 w-5/6 bg-slate-700/50 rounded"></div>
              <div class="h-4 w-4/6 bg-slate-700/50 rounded"></div>
            </div>
            <div class="h-12 w-full bg-slate-700 rounded-lg"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="packagesError" class="mx-auto max-w-lg text-center py-16">
          <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
          </div>
          <p class="text-red-400 text-lg mb-2">Unable to load packages</p>
          <p class="text-slate-400 text-sm mb-6">Please try refreshing the page.</p>
          <UiButton @click="refreshHomePackages" variant="primary" class="bg-gradient-to-r from-blue-600 to-cyan-600">
            <Icon name="mdi:refresh" class="w-5 h-5 mr-2" />
            Try Again
          </UiButton>
        </div>

        <!-- Empty State (no visible packages) -->
        <div v-else-if="homePackages.length === 0" class="mx-auto max-w-lg text-center py-16">
          <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Icon name="mdi:package-variant" class="w-8 h-8 text-slate-500" />
          </div>
          <p class="text-slate-300 text-lg mb-2">Packages coming soon</p>
          <p class="text-slate-400 text-sm mb-6">We're preparing our service offerings. Check back shortly.</p>
          <UiButton to="/request" variant="primary" class="bg-gradient-to-r from-blue-600 to-cyan-600">
            <Icon name="mdi:email" class="w-5 h-5 mr-2" />
            Contact Us
          </UiButton>
        </div>

        <!-- Dynamic Package Cards -->
        <div v-else class="grid gap-6 md:gap-8 max-w-7xl mx-auto"
          :class="{
            'md:grid-cols-1 max-w-xl': homePackages.length === 1,
            'md:grid-cols-2 max-w-4xl': homePackages.length === 2,
            'md:grid-cols-2 lg:grid-cols-3': homePackages.length >= 3
          }"
        >
          <RevealOnScroll
            v-for="(pkg, index) in homePackages"
            :key="pkg.slug"
            animation="fade-up"
            :delay="index * 100"
            class="h-full"
          >
            <div
              class="package-card group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 lg:p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
              :class="pkg.popular
                ? 'border-cyan-400 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30'
                : 'border-blue-500/30 hover:border-cyan-400 hover:shadow-cyan-500/20'"
            >
              <!-- Most Popular Badge (top-right, gradient pill) -->
              <div v-if="pkg.popular" class="absolute right-4 top-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-cyan-500/20">
                MOST POPULAR
              </div>

              <!-- Contextual Badge (top-left, subtle) -->
              <div v-if="!pkg.popular && pkg.badgeText" class="absolute left-4 top-4 rounded-full border border-white/10 bg-slate-800/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300 backdrop-blur-sm">
                {{ pkg.badgeText }}
              </div>

              <!-- Package Info -->
              <div class="mb-6 mt-8">
                <h3 class="mb-3 text-2xl font-black leading-tight text-white lg:text-3xl">{{ pkg.name }}</h3>
                <div class="mb-4 flex items-baseline gap-2">
                  <template v-if="pkg.price_cents === 0">
                    <span class="text-2xl font-black text-cyan-400 lg:text-3xl">Contact Us</span>
                  </template>
                  <template v-else>
                    <span class="text-4xl font-black text-cyan-400 lg:text-5xl">{{ formatPackagePrice(pkg.price_cents) }}</span>
                    <span class="text-base text-slate-400">{{ pkg.priceSuffix || '/game' }}</span>
                  </template>
                </div>
                <p class="text-sm leading-relaxed text-slate-300 lg:text-base">{{ pkg.description }}</p>
              </div>

              <!-- Features List -->
              <ul v-if="pkg.features && pkg.features.length > 0" class="mb-8 flex-1 space-y-3">
                <li v-for="(feature, fIdx) in pkg.features" :key="fIdx" class="flex items-start gap-2 text-slate-300">
                  <Icon name="mdi:check-circle" class="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
                  <span class="text-sm lg:text-base">{{ feature }}</span>
                </li>
              </ul>

              <!-- CTA Button (always at bottom) -->
              <NuxtLink
                :to="`/request?package=${pkg.slug}`"
                class="mt-auto block w-full rounded-xl px-6 py-3.5 text-center text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-lg lg:text-base"
                :class="pkg.popular
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/30'"
              >
                Get Started
              </NuxtLink>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>

    <!-- Testimonials Section - NEW -->
    <section class="section relative bg-dark-secondary overflow-hidden">
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.3) 35px, rgba(59, 130, 246, 0.3) 70px);
        "></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              What Teams <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Say</span>
            </h2>
            <p class="text-xl text-slate-300 font-medium">
              Real feedback from coaches, players, and event organizers
            </p>
          </div>
        </RevealOnScroll>

        <div class="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          <RevealOnScroll animation="fade-up" :delay="0">
            <div class="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 backdrop-filter backdrop-blur-10">
              <div class="mb-4 flex gap-1">
                <Icon v-for="i in 5" :key="i" name="mdi:star" class="h-5 w-5 text-yellow-400" />
              </div>
              <p class="mb-6 text-slate-300 leading-relaxed italic">
                "Elite Sports DJ transformed our home games! The energy in the arena has never been better. Players love their custom intros and fans are more engaged than ever."
              </p>
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
                  <span class="text-lg font-bold text-white">MJ</span>
                </div>
                <div>
                  <div class="font-bold text-white">Mike Johnson</div>
                  <div class="text-sm text-slate-400">Head Coach, Thunder Hockey</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll animation="fade-up" :delay="100">
            <div class="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 backdrop-filter backdrop-blur-10">
              <div class="mb-4 flex gap-1">
                <Icon v-for="i in 5" :key="i" name="mdi:star" class="h-5 w-5 text-yellow-400" />
              </div>
              <p class="mb-6 text-slate-300 leading-relaxed italic">
                "Professional, reliable, and always on point. They know exactly what music works for sports crowds. Worth every penny!"
              </p>
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
                  <span class="text-lg font-bold text-white">SC</span>
                </div>
                <div>
                  <div class="font-bold text-white">Sarah Chen</div>
                  <div class="text-sm text-slate-400">Event Director, City Sports Complex</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll animation="fade-up" :delay="200">
            <div class="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 backdrop-filter backdrop-blur-10">
              <div class="mb-4 flex gap-1">
                <Icon v-for="i in 5" :key="i" name="mdi:star" class="h-5 w-5 text-yellow-400" />
              </div>
              <p class="mb-6 text-slate-300 leading-relaxed italic">
                "Our lacrosse tournament was a huge success thanks to Elite Sports DJ. They kept the energy high all weekend long. Highly recommend!"
              </p>
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600">
                  <span class="text-lg font-bold text-white">TR</span>
                </div>
                <div>
                  <div class="font-bold text-white">Tom Rodriguez</div>
                  <div class="text-sm text-slate-400">Tournament Organizer</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="section relative bg-dark-primary overflow-hidden">
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px);
          background-size: 30px 30px;
        "></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              Event <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Gallery</span>
            </h2>
            <p class="text-xl text-slate-300 font-medium">
              See us in action at sports events across the region
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll animation="fade-up">
          <ImageGallery :images="galleryImages" />
        </RevealOnScroll>
      </div>
    </section>

    <!-- FAQ Section - NEW -->
    <section class="section relative bg-dark-secondary overflow-hidden">
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="
          background-image: repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(59, 130, 246, 0.3) 50px, rgba(59, 130, 246, 0.3) 100px);
        "></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              Frequently Asked <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
            </h2>
            <p class="text-xl text-slate-300 font-medium">
              Everything you need to know about our services
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll animation="fade-up">
          <div class="mx-auto max-w-4xl">
            <FAQAccordion :items="faqItems" />
          </div>
        </RevealOnScroll>
      </div>
    </section>

    <!-- CTA Section - Enhanced -->
    <section class="section relative bg-dark-primary overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-950/50 to-cyan-950/50"></div>
      
      <!-- Animated Elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-blue-500 blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full bg-cyan-500 blur-3xl" style="animation-delay: 1.5s;"></div>
      </div>
      
      <div class="container relative z-10">
        <RevealOnScroll animation="fade-up">
          <div class="mx-auto max-w-4xl text-center">
            <h2 class="mb-6 text-5xl font-black text-white md:text-6xl">
              Ready to <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Elevate</span> Your Event?
            </h2>
            <p class="mb-10 text-xl text-slate-300 font-medium">
              Get a custom quote for your next game or event. We'll work with you to create an unforgettable experience.
            </p>
            <div class="flex justify-center">
              <UiButton 
                to="/request"
                class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 px-12 py-6 text-2xl font-bold text-white shadow-2xl shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-cyan-500/50"
              >
                <span class="relative z-10 flex items-center gap-3">
                  Request a Quote
                  <Icon name="mdi:arrow-right" class="h-7 w-7 transition-transform group-hover:translate-x-1" />
                </span>
                <div class="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </UiButton>
            </div>
            
            <!-- Trust Indicators -->
            <div class="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-400">
              <div class="flex items-center gap-2">
                <Icon name="mdi:shield-check" class="h-5 w-5 text-cyan-400" />
                <span class="text-sm">Fully Insured</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="mdi:clock-fast" class="h-5 w-5 text-cyan-400" />
                <span class="text-sm">24hr Response</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="mdi:thumb-up" class="h-5 w-5 text-cyan-400" />
                <span class="text-sm">100% Satisfaction</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
    
    <!-- Video Player Modal -->
    <VideoPlayerModal
      :is-open="isVideoModalOpen"
      :video-src="selectedVideo?.src || ''"
      :category="selectedVideo?.category"
      :title="selectedVideo?.title"
      :orientation="selectedVideo?.orientation"
      @close="closeVideoModal"
      @video-ended="onVideoEnded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default'
})

// ============================================
// Dynamic Package Data (from database via tRPC)
// ============================================
interface HomePackage {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  price_cents: number
  currency: string
  popular: boolean
  features: string[]
  icon: string | null
  displayOrder: number
  badgeText: string | null
  isVisible: boolean
  priceSuffix: string
}

const trpc = useTrpc()
const packagesLoading = ref(true)
const packagesError = ref(false)
const homePackagesRaw = ref<HomePackage[]>([])

// homePackagesRaw already contains only visible packages (from getVisible endpoint)
const homePackages = computed(() => homePackagesRaw.value)

const formatPackagePrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cents / 100)
}

const fetchHomePackages = async () => {
  packagesLoading.value = true
  packagesError.value = false
  try {
    const data = await trpc.packages.getVisible.query()
    homePackagesRaw.value = data as HomePackage[]
  } catch (err) {
    console.error('Failed to load packages for home page:', err)
    packagesError.value = true
  } finally {
    packagesLoading.value = false
  }
}

const refreshHomePackages = () => {
  fetchHomePackages()
}

// Fetch packages on mount
onMounted(() => {
  fetchHomePackages()
})

// ============================================
// Video Modal State & Handlers
// ============================================
interface VideoData {
  src: string
  posterSrc?: string
  category?: string
  title?: string
  orientation?: 'landscape' | 'portrait' | 'auto'
}

const isVideoModalOpen = ref(false)
const selectedVideo = ref<VideoData | null>(null)

const openVideoModal = (videoData: VideoData) => {
  selectedVideo.value = videoData
  isVideoModalOpen.value = true
}

const closeVideoModal = () => {
  isVideoModalOpen.value = false
  // Clear selected video after transition completes
  setTimeout(() => {
    selectedVideo.value = null
  }, 300)
}

const onVideoEnded = () => {
  // Optional: Auto-close modal when video ends, or do nothing
  // closeVideoModal()
}

// ============================================
// Page Navigation
// ============================================

// Smooth scroll to packages section
const scrollToPackages = () => {
  const packagesSection = document.getElementById('packages')
  if (packagesSection) {
    packagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ============================================
// Hero Video Carousel Data
// ============================================

// Define video data for the hero carousel
const heroVideos = ref([
  {
    src: '/videos/07465b89-b98e-424d-a378-76da8baa0202.mp4',
    category: 'HOCKEY',
    title: 'Ice Hockey Game Day',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/502b2929-babc-4672-89b4-28b76582173e.mp4',
    category: 'PLAYER INTRO',
    title: 'Dynamic Player Introductions',
    orientation: 'portrait' as const
  },
  {
    src: '/videos/a389a0ea-f77c-4324-9cea-a12632bbfb5f.mp4',
    category: 'ARENA ENTERTAINMENT',
    title: 'Arena DJ Services',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/e889cdc0-d53e-42da-bf1f-6818e675148e.mp4',
    category: 'EVENT HOSTING',
    title: 'Professional Event Hosting',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/eb33f3d7-190c-4ec1-8864-beac99ac6b23.mp4',
    category: 'GAME DAY',
    title: 'Complete Game Day Experience',
    orientation: 'landscape' as const
  },
  {
    src: '/videos/f9a10068-aa48-4f4d-9826-1bc443978fee.mp4',
    category: 'SPORTS ENTERTAINMENT',
    title: 'Multi-Sport Events',
    orientation: 'landscape' as const
  }
])

// Gallery images with loading states
const galleryImagesLoading = ref<Record<number, boolean>>({})
const galleryImagesError = ref<Record<number, boolean>>({})

const galleryImages = ref([
  {
    url: '/videos/07465b89-b98e-424d-a378-76da8baa0202.jpg',
    thumbnail: '/videos/07465b89-b98e-424d-a378-76da8baa0202.jpg',
    alt: 'Ice Hockey Game Day',
    caption: 'Ice Hockey Game Day'
  },
  {
    url: '/videos/502b2929-babc-4672-89b4-28b76582173e.jpg',
    thumbnail: '/videos/502b2929-babc-4672-89b4-28b76582173e.jpg',
    alt: 'Dynamic Player Introductions',
    caption: 'Dynamic Player Introductions'
  },
  {
    url: '/videos/a389a0ea-f77c-4324-9cea-a12632bbfb5f.jpg',
    thumbnail: '/videos/a389a0ea-f77c-4324-9cea-a12632bbfb5f.jpg',
    alt: 'Arena DJ Services',
    caption: 'Arena DJ Services'
  },
  {
    url: '/videos/e889cdc0-d53e-42da-bf1f-6818e675148e.jpg',
    thumbnail: '/videos/e889cdc0-d53e-42da-bf1f-6818e675148e.jpg',
    alt: 'Professional Event Hosting',
    caption: 'Professional Event Hosting'
  },
  {
    url: '/videos/eb33f3d7-190c-4ec1-8864-beac99ac6b23.jpg',
    thumbnail: '/videos/eb33f3d7-190c-4ec1-8864-beac99ac6b23.jpg',
    alt: 'Complete Game Day Experience',
    caption: 'Complete Game Day Experience'
  },
  {
    url: '/videos/f9a10068-aa48-4f4d-9826-1bc443978fee.jpg',
    thumbnail: '/videos/f9a10068-aa48-4f4d-9826-1bc443978fee.jpg',
    alt: 'Multi-Sport Events',
    caption: 'Multi-Sport Events'
  }
])

const handleImageLoad = (index: number) => {
  galleryImagesLoading.value[index] = false
}

const handleImageError = (index: number) => {
  galleryImagesError.value[index] = true
  galleryImagesLoading.value[index] = false
}

// FAQ items
const faqItems = ref([
  {
    question: 'How far in advance should I book?',
    answer: 'We recommend booking at least 2-4 weeks in advance for regular season games. For playoffs, tournaments, or special events, booking 4-6 weeks ahead ensures availability. However, we often accommodate last-minute requests when possible.'
  },
  {
    question: 'What equipment do you provide?',
    answer: 'We bring all necessary professional-grade equipment including sound systems, microphones, mixing equipment, and backup gear. For Premium packages, we also include lighting equipment. You just need to provide power access and a designated setup area.'
  },
  {
    question: 'Can you customize music for our team?',
    answer: 'Absolutely! We work with you to create custom playlists that match your team\'s style and preferences. We can incorporate team songs, player-specific intro music, and any special requests you have.'
  },
  {
    question: 'Do you travel to different venues?',
    answer: 'Yes! We serve teams and events throughout the region. Travel fees may apply for venues outside our standard service area, which will be clearly outlined in your quote.'
  },
  {
    question: 'What happens if you have technical issues during the event?',
    answer: 'We always bring backup equipment and have contingency plans in place. In our 10+ years of service, we\'ve maintained a 100% reliability record. We arrive early to set up and test everything thoroughly before the event starts.'
  },
  {
    question: 'Can we request specific songs or avoid certain music?',
    answer: 'Yes! We\'re happy to accommodate song requests and any music you\'d prefer to avoid. We work with you during the planning phase to ensure the music selection aligns perfectly with your event and audience.'
  }
])
</script>


<style scoped>
/* Hero Logo Animation */
@keyframes hero-logo-pulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 20px rgba(34, 211, 238, 0.4)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.3));
  }
  50% {
    transform: scale(1.05) rotate(2deg);
    filter: drop-shadow(0 0 30px rgba(34, 211, 238, 0.6)) drop-shadow(0 0 60px rgba(59, 130, 246, 0.5));
  }
}

@keyframes hero-logo-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

.hero-logo-animate {
  animation: 
    hero-logo-pulse 4s ease-in-out infinite,
    hero-logo-float 6s ease-in-out infinite;
  transition: all 0.3s ease;
}

.hero-logo-animate:hover {
  animation-play-state: paused;
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(0 0 40px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 80px rgba(59, 130, 246, 0.6));
  cursor: pointer;
}

/* Float animation for logo */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* Gradient animation */
@keyframes gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

/* Hero headline text shadow for depth */
.hero-headline {
  text-shadow: 
    0 0 20px rgba(59, 130, 246, 0.5),
    0 0 40px rgba(6, 182, 212, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.5);
}

/* Logo container glow pulse */
.logo-container {
  filter: drop-shadow(0 0 40px rgba(59, 130, 246, 0.6));
}

/* Badge sports styling */
.badge-sports {
  box-shadow: 
    0 0 30px rgba(6, 182, 212, 0.4),
    inset 0 0 20px rgba(59, 130, 246, 0.2);
}

/* Stat card hover effects */
.stat-card {
  backdrop-filter: blur(10px);
}

/* Service card hover effects */
.service-card {
  backdrop-filter: blur(10px);
}

/* Package card hover effects */
.package-card {
  backdrop-filter: blur(10px);
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}
</style>
