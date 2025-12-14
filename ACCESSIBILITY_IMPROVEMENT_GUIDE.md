# Accessibility Improvement Guide

**Date:** December 14, 2025

## Overview

This guide identifies opportunities to improve the accessibility of the application, ensuring a better experience for all users, including those with disabilities.

## Key Findings & Recommendations

### 1. Missing `alt` Attributes on Images

**Issue:** There are **10 `<img>` tags** missing the `alt` attribute. This is critical for screen readers, which use the `alt` text to describe the image to visually impaired users.

**Affected Components:**

- `components/AppHeader.vue`
- `components/Footer.vue`
- `components/HeroVideoCarouselItem.vue`
- `components/ImageGallery.vue`
- `components/OptimizedImage.vue`
- `components/home/HeroSection.vue`
- `components/OptimizedImage.enhanced.vue`
- `pages/login.vue`
- `pages/register.vue`

**Recommendation:**

Add a descriptive `alt` attribute to every `<img>` tag. For decorative images, use an empty `alt=""`.

**Example:**

```html
<!-- Before -->
<img src="/logo.png">

<!-- After -->
<img src="/logo.png" alt="Elite Sports DJ Logo">
```

### 2. Inline Styles

**Issue:** There are **10 instances of inline `style` attributes**. While not a direct accessibility violation, they can make the code harder to maintain and can be overridden by user-defined stylesheets, which are sometimes used for accessibility purposes.

**Recommendation:**

Extract inline styles into CSS classes where possible. This improves maintainability and separates concerns.

**Example:**

```html
<!-- Before -->
<div style="background-image: url(...)"></div>

<!-- After -->
<div class="hero-background"></div>

<style>
.hero-background {
  background-image: url(...);
}
</style>
```

### 3. Font Loading

**Issue:** Fonts are being loaded directly from Google Fonts in `nuxt.config.ts`. This can be a performance bottleneck and may not be the most optimal way to load fonts.

**Recommendation:**

Use the `@nuxtjs/google-fonts` module for better font loading performance and control.

**Implementation:**

1.  Install the module: `pnpm add -D @nuxtjs/google-fonts`
2.  Add to `nuxt.config.ts`:

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

### 4. TODO Comment

**Issue:** A `TODO` comment was found in `pages/contact.vue`:

```
pages/contact.vue:265:    // TODO: Replace with actual API call when backend endpoint is ready
```

**Recommendation:**

This indicates incomplete work that should be addressed. The contact form submission logic needs to be implemented.

## Implementation Checklist

- [ ] Add `alt` attributes to all 10 missing `<img>` tags.
- [ ] Refactor the 10 instances of inline styles into CSS classes.
- [ ] Implement the `@nuxtjs/google-fonts` module for optimized font loading.
- [ ] Implement the backend API call for the contact form in `pages/contact.vue`.

By addressing these accessibility and code quality issues, the application will be more robust, maintainable, and usable for a wider range of users.
