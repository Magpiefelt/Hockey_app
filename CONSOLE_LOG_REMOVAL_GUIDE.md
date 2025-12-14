# Console.log Removal Guide

**Date:** December 14, 2025

## Overview

The application currently contains **22 console.log/console.warn statements** in the frontend code. While these are useful for debugging during development, they should be removed or replaced with proper logging in production for better performance and security.

## Files Affected

### Primary File: `pages/request.vue`

This file contains **20 console.log statements** used for debugging the form submission process. These are located in:

- Lines 428-432: Form step completion debugging
- Lines 446-459: Form data merging debugging  
- Lines 486-500: Submission debugging
- Line 572: Order data submission logging

### Other Files

- `utils/requestOptimization.ts`: 2 console statements for search/scroll error handling

## Recommended Approach

### Option 1: Conditional Logging (Recommended)

Replace console.log statements with a conditional logger that only runs in development:

```typescript
// Add to utils/logger.ts or create new file
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

// Then replace:
console.log('Debug info:', data)

// With:
devLog('Debug info:', data)
```

### Option 2: Complete Removal

For production builds, you can configure Vite to automatically remove console statements:

```typescript
// In nuxt.config.ts, add to vite.build:
build: {
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  }
}
```

### Option 3: Replace with Proper Error Tracking

For critical paths, replace console statements with proper error tracking:

```typescript
// Instead of:
console.error('Search error:', error)

// Use:
logger.error('Search error', { error, context: 'debouncedSearch' })
```

## Implementation Steps

1. **Create a dev logger utility** in `utils/devLog.ts`
2. **Replace all console.log** in `pages/request.vue` with the dev logger
3. **Configure Vite** to strip console statements in production builds
4. **Test** that debugging still works in development
5. **Verify** that console statements are removed in production build

## Performance Impact

Removing console statements in production:
- **Reduces bundle size** by ~1-2KB
- **Improves runtime performance** (console operations are slow)
- **Enhances security** (prevents leaking sensitive debug information)
- **Cleans up browser console** for end users

## Files to Modify

```
pages/request.vue (20 statements)
utils/requestOptimization.ts (2 statements)
```

## Verification

After implementation, verify by:

1. Running a production build: `pnpm build`
2. Checking the built files for console statements
3. Testing in production mode to ensure no console output
