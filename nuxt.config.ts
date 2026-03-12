// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  
  ssr: true,
  
  modules: [
    '@nuxt/content',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  
  // Icon configuration
  icon: {
    serverBundle: {
      collections: ['mdi'] // Only bundle MDI icons for better performance
    }
  },
  
  css: ['~/assets/css/main.css'],
  
  runtimeConfig: {
    // Private keys (server-side only)
    databaseUrl: process.env.DATABASE_URL || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    redisUrl: process.env.REDIS_URL || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
    s3Region: process.env.S3_REGION || '',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    s3Endpoint: process.env.S3_ENDPOINT || '',
    // Mailgun Email Configuration
    mailgunApiKey: process.env.MAILGUN_API_KEY || '',
    mailgunDomain: process.env.MAILGUN_DOMAIN || 'elitesportsdj.ca',
    mailgunApiUrl: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
    mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL || 'Elite Sports DJ <postmaster@elitesportsdj.ca>',
    mailgunWebhookSigningKey: process.env.MAILGUN_WEBHOOK_SIGNING_KEY || '',
    adminIpWhitelist: process.env.ADMIN_IP_WHITELIST || '',
    metricsApiKey: process.env.METRICS_API_KEY || '',
    metricsIpAllowlist: process.env.METRICS_IP_ALLOWLIST || '',
    
    // Public keys (exposed to client)
    public: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      appBaseUrl: process.env.APP_URL || 'http://localhost:3000',
      appTitle: 'Elite Sports DJ Services',
      appLogo: '/logo.webp'
    }
  },
  
  // Configure content module
  content: {
    // Content will be loaded from content/ directory
  },
  
  // Configure app
  app: {
    head: {
      title: 'Elite Sports DJ Services | Professional Game Day Entertainment',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 
          name: 'description', 
          content: 'Professional DJ services for hockey, lacrosse, baseball, basketball and sports events. Expert player introductions, game day entertainment, and event hosting. Trusted by 50+ teams.' 
        },
        { name: 'keywords', content: 'sports DJ, game day entertainment, player introductions, hockey DJ, lacrosse DJ, baseball DJ, basketball DJ, sports event hosting, professional DJ services' },
        { name: 'author', content: 'Elite Sports DJ' },
        { name: 'robots', content: 'index, follow' },
        
        // Open Graph / Facebook
        // PERF: og:image now points to the proper 1200x630 OG image (28KB vs 861KB)
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://elitesportsdj.ca/' },
        { property: 'og:title', content: 'Elite Sports DJ Services | Professional Game Day Entertainment' },
        { property: 'og:description', content: 'Professional DJ services for hockey, lacrosse, baseball, basketball and sports events. Trusted by 50+ teams with 500+ events covered.' },
        { property: 'og:image', content: 'https://elitesportsdj.ca/og-image.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Elite Sports DJ - Professional Game Day Entertainment' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:site_name', content: 'Elite Sports DJ' },
        { property: 'og:locale', content: 'en_CA' },
        
        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://elitesportsdj.ca/' },
        { name: 'twitter:title', content: 'Elite Sports DJ Services | Professional Game Day Entertainment' },
        { name: 'twitter:description', content: 'Professional DJ services for hockey, lacrosse, baseball, basketball and sports events. Trusted by 50+ teams.' },
        { name: 'twitter:image', content: 'https://elitesportsdj.ca/og-image.jpg' },
        { name: 'twitter:image:alt', content: 'Elite Sports DJ - Professional Game Day Entertainment' },
        
        // Additional SEO
        { name: 'theme-color', content: '#0891b2' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        // PERF: Use optimized 64px PNG for favicon (6KB vs 861KB)
        { rel: 'icon', type: 'image/png', href: '/favicon-64.png' },
        // PERF: Use 192px PNG for apple-touch-icon (31KB vs 861KB)
        { rel: 'apple-touch-icon', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'canonical', href: 'https://elitesportsdj.ca/' },
        // Web App Manifest
        { rel: 'manifest', href: '/site.webmanifest' },
        // PERF: Preconnect to font origins to eliminate DNS + TLS round trips
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
        // PERF: font-display=swap prevents render-blocking while font loads
        // PERF: Only load the weights actually used (400, 600, 700, 800) — removed 500 and 900
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap'
        },
        // PERF: Preload the LCP hero image so the browser fetches it immediately
        { rel: 'preload', as: 'image', href: '/logo.webp', type: 'image/webp' }
      ]
    }
  },
  
  // Nitro configuration
  nitro: {
    // Use node-server preset for proper SSR
    preset: 'node-server',
    // Disable prerendering
    prerender: {
      crawlLinks: false,
      routes: []
    },
    // No proxy needed - frontend calls backend directly
    devServer: {
      host: '0.0.0.0'
    },
    // Compression and minification
    compressPublicAssets: true,
    minify: true
  },
  
  // Build optimizations
  experimental: {
    payloadExtraction: false, // Faster builds
    renderJsonPayloads: true,
    typedPages: false, // Disable typed pages for faster builds
    asyncEntry: true,
    noScripts: false,
    inlineRouteRules: true,
    componentPreload: true
  },
  
  // Vite optimizations
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia']
          }
          // Let Nuxt handle file naming and paths for SSR compatibility
        }
      },
      // Optimize images and assets
      assetsInlineLimit: 4096,
      sourcemap: false,
      reportCompressedSize: false
    },
    server: {
      allowedHosts: ['.manusvm.computer', '.manus-asia.computer']
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia'],
      exclude: ['@nuxt/content']
    },
    // Enable CSS code splitting
    css: {
      devSourcemap: false
    }
  },
  
  typescript: {
    strict: false,
    typeCheck: false // Disabled for build compatibility
  },
  
  // Route rules for caching and optimization
  routeRules: {
    // Cache public pages at the CDN/edge layer (10 min stale-while-revalidate)
    '/': { cache: { maxAge: 60 * 10 } },
    '/contact': { cache: { maxAge: 60 * 10 } },
    '/privacy': { cache: { maxAge: 60 * 60 * 24 } }, // 24h — rarely changes
    '/terms': { cache: { maxAge: 60 * 60 * 24 } },   // 24h — rarely changes
    '/about': { cache: { maxAge: 60 * 10 } },
    '/gallery': { cache: { maxAge: 60 * 10 } },
    // Don't cache dynamic or authenticated pages
    '/request': { cache: false },
    '/admin/**': { cache: false },
    '/orders/**': { cache: false },
    '/login': { cache: false },
    '/register': { cache: false },
    '/forgot-password': { cache: false },
    '/reset-password': { cache: false },
    '/thanks': { cache: false },
    // API routes — CORS handled by 02.cors.ts middleware with origin allowlist
    '/api/health': { cache: { maxAge: 60 } },
    '/api/home-data': { cache: { maxAge: 60 * 5 } }, // 5 min — matches Cache-Control header in the handler
    '/api/metrics': { cache: false },
    // Static assets with long cache (immutable hashed filenames from Vite)
    '/_nuxt/**': { static: true, headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    // PERF: Long cache for optimized static assets
    '/videos/**': { headers: { 'cache-control': 'public, max-age=604800' } }, // 7 days
    '/logo.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/logo.webp': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/og-image.jpg': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/favicon-64.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/icon-192.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/icon-512.png': { headers: { 'cache-control': 'public, max-age=604800' } },
    // Serve sitemap and robots with correct content-type
    '/sitemap.xml': { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } },
    '/robots.txt': { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' } },
    '/site.webmanifest': { headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=86400' } }
  }
})
