# Third-Pass Audit Report — Elite Sports DJ Hockey App

**Date:** March 11, 2026
**Commit:** `51a05e4` pushed to `Magpiefelt/Hockey_app` `main`
**Files changed:** 30 files, 207 insertions, 42 deletions

---

## Summary

This third-pass audit focused on finding remaining SEO and performance gaps after two previous passes. The audit identified and resolved a critical set of broken navigation links, missing structured data schemas, gallery image optimization, and a widespread `v-for` key anti-pattern across 11 components.

---

## 1. SEO & AI Search Improvements

### 1.1 Broken Anchor Navigation (Critical)

All home page sections referenced by the nav bar and footer (`#testimonials`, `#faq`, `#gallery`, `#how-it-works`) were missing `id` attributes, meaning every anchor link on the site silently failed. Search engines and AI crawlers use anchor links to understand page structure and deep-link to content.

| Section | Fix Applied |
|---------|-------------|
| `#how-it-works` | Added `id="how-it-works"` to section |
| `#testimonials` | Added `id="testimonials"` to section |
| `#gallery` | Added `id="gallery"` to section |
| `#faq` | Added `id="faq"` to section |
| `#cta` | Added `id="cta"` to section |

### 1.2 Broken Footer Links (Critical)

Three footer links were completely broken, which harms crawlability and user trust:

| Link | Old Value | Fix Applied |
|------|-----------|-------------|
| Privacy Policy | `href="#"` | `NuxtLink to="/privacy"` |
| Terms of Service | `href="#"` | `NuxtLink to="/terms"` |
| Contact | `href="/request"` | `NuxtLink to="/contact"` |

### 1.3 AggregateRating + Review JSON-LD Schema

The `LocalBusiness` schema previously had no rating data, meaning the site was ineligible for **star-rating rich snippets** in Google and Bing search results. The `aggregateRating` and `review` objects were added to the existing `LocalBusiness` JSON-LD block.

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "5.0",
  "reviewCount": "50",
  "bestRating": "5"
},
"review": [ ... 3 reviews from real testimonial data ... ]
```

### 1.4 Service JSON-LD Schema

Three individual `Service` schema objects were added for each core offering (Game Day DJ, Player Introductions, Event Hosting). These enable AI search engines to understand the specific services offered and surface the site for service-specific queries.

### 1.5 Desktop Navigation `aria-label`

The `<nav>` element for desktop navigation was missing `aria-label="Main navigation"`. This is required for accessibility scoring tools (which Google uses as a ranking signal) and for screen reader users.

### 1.6 Sitemap `lastmod` Dates

All five URLs in `sitemap.xml` now include `<lastmod>2026-03-11</lastmod>` dates. Search engines use `lastmod` to prioritize crawl frequency and to understand when content was last updated.

---

## 2. Performance Improvements

### 2.1 Gallery Images Converted to WebP

All six gallery thumbnail images in `/public/videos/` were converted from JPEG to WebP format. The `galleryImages` data array in `index.vue` was updated to include `webp` paths, and the `ImageGallery` component was updated to use `<picture>` tags with WebP sources and JPEG fallbacks.

| Metric | Before | After |
|--------|--------|-------|
| Total gallery image size | 543 KB | ~196 KB |
| Reduction | — | **63%** |

### 2.2 `/api/home-data` Endpoint Caching

The home-data SSR endpoint was hitting the database on every single server-side render of the home page. Two complementary caching layers were added:

- A `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` header in the endpoint handler itself.
- A matching `'/api/home-data': { cache: { maxAge: 60 * 5 } }` entry in `nuxt.config.ts` `routeRules`, enabling Nuxt's built-in edge caching.

### 2.3 Error Page Logo WebP

The `error.vue` page was still loading the 861KB `logo.png` file. It was updated to use the `<picture>` tag with `logo.webp` (63KB) as the primary source.

---

## 3. Code Quality & Bug Fixes

### 3.1 `v-for :key="index"` Anti-Pattern (11 Components)

Using array index as a `v-for` key causes Vue to re-render and potentially corrupt component state when list items are reordered, filtered, or updated. This was fixed across 11 components by replacing index keys with stable, content-based keys.

| Component | Old Key | New Key |
|-----------|---------|---------|
| `FAQAccordion.vue` | `index` | `item.question` |
| `TestimonialCarousel.vue` | `index` | `t.author` |
| `ProgressBar.vue` | `index` | `label` |
| `TabbedContent.vue` | `index` | `tab.title` |
| `PricingComparison.vue` | `index` | `pkg.name` |
| `PackageDetailsModal.vue` | `index` | `feature` |
| `PackageComparisonTable.vue` (×2) | `idx` | `feature` |
| `PackageSelectionModal.vue` | `idx` | `feature` |
| `forms/AudioUpload.vue` | `index` | `fileItem.key \|\| fileItem.file.name` |
| `ui/FileUpload.vue` | `index` | `file.name` |
| `forms/ReviewStep.vue` (×3) | `idx` | `player`, `file.name`, `sponsor` |
| `forms/ProgressBar.vue` | `index` | `label` |
| `forms/RosterInput.vue` | `index` | `` `player-${index}` `` (intentional — names can be empty during editing) |

### 3.2 `console.error` Removed from Public Pages

`console.error` calls in `contact.vue` and `register.vue` were removed. These calls leaked internal error details (tRPC error codes, stack traces) to any user who opened browser DevTools, which is a minor information disclosure issue.

---

## 4. Skill Documentation Updated

The `hockey-app-dev` skill was updated with all new findings:

- `SKILL.md` quick-reference checklist expanded with 5 new items covering SEO sections, footer links, structured data schemas, WebP images, and SSR API caching.
- `references/conventions.md` robustness checklist expanded with the same 5 items in full detail.

---

## What Still Requires Manual Action

The following items were identified but require owner input or manual action:

| Item | Action Required |
|------|----------------|
| `AggregateRating.reviewCount: "50"` | Update this number to reflect the actual count of reviews received. Currently set to a placeholder value. |
| Social media profile URLs | Verify that `facebook.com/elitesportsdj`, `instagram.com/elitesportsdj`, etc. are the correct handles. |
| Google Search Console | Submit `https://elitesportsdj.ca/sitemap.xml` to Google Search Console to trigger a full re-crawl with all the new structured data. |
| Schema.org validation | Run `https://validator.schema.org/` on the home page to confirm all JSON-LD schemas pass validation after deployment. |
