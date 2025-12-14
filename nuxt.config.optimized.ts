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
    emailFrom: process.env.EMAIL_FROM || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpSecure: process.env.SMTP_SECURE || 'false',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'Elite Sports DJ <noreply@elitesportsdj.com>',
    adminIpWhitelist: process.env.ADMIN_IP_WHITELIST || '',
    metricsApiKey: process.env.METRICS_API_KEY || '',
    metricsIpAllowlist: process.env.METRICS_IP_ALLOWLIST || '',
    
    // Public keys (exposed to client)
    public: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      appBaseUrl: process.env.APP_URL || 'http://localhost:3000',
      appTitle: 'Elite Sports DJ Services',
      appLogo: '/logo.png'
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
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://elitesportsdj.com/' },
        { property: 'og:title', content: 'Elite Sports DJ Services | Professional Game Day Entertainment' },
        { property: 'og:description', content: 'Professional DJ services for hockey, lacrosse, baseball, basketball and sports events. Trusted by 50+ teams with 500+ events covered.' },
        { property: 'og:image', content: '/logo.png' },
        { property: 'og:site_name', content: 'Elite Sports DJ' },
        
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://elitesportsdj.com/' },
        { name: 'twitter:title', content: 'Elite Sports DJ Services | Professional Game Day Entertainment' },
        { name: 'twitter:description', content: 'Professional DJ services for hockey, lacrosse, baseball, basketball and sports events. Trusted by 50+ teams.' },
        { name: 'twitter:image', content: '/logo.png' },
        
        // Additional SEO
        { name: 'theme-color', content: '#0891b2' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
        { rel: 'canonical', href: 'https://elitesportsdj.com/' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://images.unsplash.com' },
        { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
        }
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
    componentPreload: true,
    // NEW: Enable view transitions for smoother navigation
    viewTransition: true
  },
  
  // Vite optimizations
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code
            'vendor': ['vue', 'vue-router', 'pinia'],
            // Split chart library separately (it's large)
            'charts': ['chart.js', 'vue-chartjs'],
            // Split AWS SDK separately (it's large)
            'aws': ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner']
          }
        }
      },
      // Optimize images and assets
      assetsInlineLimit: 4096, // 4KB
      sourcemap: false,
      reportCompressedSize: false,
      // NEW: Increase chunk size warning limit for better splitting
      chunkSizeWarningLimit: 1000
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
    // Cache static pages with stale-while-revalidate
    '/': { 
      cache: { 
        maxAge: 60 * 10, // 10 minutes
        swr: true 
      } 
    },
    '/about': { cache: { maxAge: 60 * 10, swr: true } },
    '/gallery': { cache: { maxAge: 60 * 10, swr: true } },
    // Don't cache dynamic pages
    '/request': { cache: false },
    '/admin/**': { cache: false },
    '/orders/**': { cache: false },
    // API routes
    '/api/**': { cors: true },
    '/api/health': { cache: { maxAge: 60 } },
    '/api/metrics': { cache: false },
    // Static assets with long cache and immutable
    '/_nuxt/**': { 
      static: true, 
      headers: { 
        'cache-control': 'public, max-age=31536000, immutable' 
      } 
    },
    // Videos with shorter cache (they might be updated)
    '/videos/**': { 
      headers: { 
        'cache-control': 'public, max-age=86400', // 1 day
        // NEW: Add content-type hint for better handling
        'content-type': 'video/mp4'
      } 
    },
    '/logo.png': { 
      headers: { 
        'cache-control': 'public, max-age=86400',
        'content-type': 'image/png'
      } 
    }
  },
  
  // NEW: Performance optimizations
  optimization: {
    // Enable tree shaking
    treeShake: {
      composables: {
        client: true,
        server: true
      }
    }
  }
})
