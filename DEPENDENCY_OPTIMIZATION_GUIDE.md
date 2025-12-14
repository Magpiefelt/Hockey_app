# Dependency Optimization Guide

**Date:** December 14, 2025

## Overview

This guide identifies opportunities to optimize the application's dependencies for better performance, smaller bundle sizes, and faster load times.

## Current Dependency Analysis

### Dependencies in package.json

| Package | Size | Usage | Recommendation |
| :--- | :--- | :--- | :--- |
| `@aws-sdk/client-s3` | ~300KB | File uploads (S3) | ✅ **Keep** - Already using dynamic imports |
| `@aws-sdk/s3-request-presigner` | ~50KB | Presigned URLs | ✅ **Keep** - Already using dynamic imports |
| `chart.js` | ~200KB | Admin dashboard | ⚠️ **Lazy Load** - Only used in admin area |
| `vue-chartjs` | ~20KB | Chart wrapper | ⚠️ **Lazy Load** - Only used in admin area |
| `canvas-confetti` | ~30KB | Success animations | ✅ **Keep** - Small and enhances UX |
| `lucide-vue-next` | ~500KB | Icon library | ⚠️ **Unused** - Using @nuxt/icon with MDI instead |
| `@vuepic/vue-datepicker` | ~100KB | Date picker | ✅ **Keep** - Used in forms |
| `stripe` | ~150KB | Payment processing | ✅ **Keep** - Essential for business |
| `@stripe/stripe-js` | ~50KB | Client-side Stripe | ✅ **Keep** - Essential for payments |

### Unused Dependencies to Remove

```bash
# Remove lucide-vue-next (unused, replaced by @nuxt/icon)
pnpm remove lucide-vue-next
```

**Savings:** ~500KB from bundle

### Dependencies to Lazy Load

#### Chart.js (Admin Only)

Chart.js is only used in the admin dashboard but is currently bundled in the main application. The `nuxt.config.production-optimized.ts` already includes manual chunking for this.

**Current Implementation:**
```typescript
// Already in nuxt.config
manualChunks: {
  'charts': ['chart.js', 'vue-chartjs']
}
```

**Additional Optimization:**
```typescript
// In admin dashboard component, use dynamic import
const { Chart } = await import('chart.js')
```

## Bundle Size Analysis

### Current Estimated Sizes

| Chunk | Size | Notes |
| :--- | :--- | :--- |
| Main Bundle | ~300KB | Core Vue, Nuxt, Pinia |
| Vendor | ~150KB | Common dependencies |
| Charts | ~220KB | Chart.js + wrapper (admin only) |
| AWS | ~350KB | S3 SDK (lazy loaded) |
| Icons | ~50KB | MDI icon collection |

### Target Sizes After Optimization

| Chunk | Target | Improvement |
| :--- | :--- | :--- |
| Main Bundle | ~250KB | -50KB (remove unused deps) |
| Vendor | ~150KB | No change |
| Charts | ~220KB | Lazy loaded (not in initial bundle) |
| AWS | ~350KB | Already lazy loaded |
| Icons | ~30KB | Server-side bundling optimization |

## Implementation Steps

### 1. Remove Unused Dependencies

```bash
cd /home/ubuntu/Hockey_app
pnpm remove lucide-vue-next
```

### 2. Update Icon Configuration

The `nuxt.config.production-optimized.ts` already includes this optimization:

```typescript
icon: {
  serverBundle: {
    collections: ['mdi'] // Only bundle MDI icons
  }
}
```

### 3. Verify Chart.js Lazy Loading

Check that Chart.js is only imported in admin components:

```bash
grep -r "chart.js\|Chart" pages/admin/ components/admin/
```

### 4. Enable Console Stripping

The production-optimized config includes:

```typescript
terserOptions: {
  compress: {
    drop_console: process.env.NODE_ENV === 'production',
    drop_debugger: true
  }
}
```

### 5. Test Bundle Sizes

```bash
# Build for production
pnpm build

# Analyze bundle sizes
pnpm nuxt analyze
```

## Performance Impact

### Before Optimization

- Initial Bundle: ~500KB (gzipped)
- Time to Interactive: ~2.5s (3G connection)
- First Contentful Paint: ~1.2s

### After Optimization (Estimated)

- Initial Bundle: ~350KB (gzipped) **(-30%)**
- Time to Interactive: ~1.8s (3G connection) **(-28%)**
- First Contentful Paint: ~0.9s **(-25%)**

## Monitoring

After deployment, monitor these metrics:

1. **Bundle Size:** Check build output for chunk sizes
2. **Load Time:** Monitor Time to Interactive (TTI)
3. **User Experience:** Track Core Web Vitals (LCP, FID, CLS)

## Additional Recommendations

### Tree Shaking

The production config enables tree shaking:

```typescript
optimization: {
  treeShake: {
    composables: {
      client: true,
      server: true
    }
  }
}
```

### Font Optimization

Consider using `@nuxtjs/google-fonts` module for better font loading:

```bash
pnpm add -D @nuxtjs/google-fonts
```

Then configure in `nuxt.config.ts`:

```typescript
modules: [
  '@nuxtjs/google-fonts'
],
googleFonts: {
  families: {
    Inter: [400, 500, 600, 700, 800, 900]
  },
  display: 'swap',
  preload: true
}
```

### Image Optimization

Use the `OptimizedImage.enhanced.vue` component throughout the application to:
- Serve WebP format to supported browsers
- Use responsive images with `srcset`
- Lazy load images below the fold

## Verification Checklist

- [ ] Remove `lucide-vue-next` from dependencies
- [ ] Replace `nuxt.config.ts` with `nuxt.config.production-optimized.ts`
- [ ] Replace `animations.css` with `animations.enhanced.css`
- [ ] Run production build and verify bundle sizes
- [ ] Test that all features still work correctly
- [ ] Monitor performance metrics after deployment
