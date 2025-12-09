# Issues Identified in Hockey App

## Date: December 8, 2024

## Summary
Three main categories of issues have been identified:
1. **Admin/Order Screen Routing Issues** - Missing middleware
2. **Package "Get Started" Button Routing** - Working correctly (no issue found)
3. **Resolution/Responsive Design Issues** - Multiple breakpoint problems

---

## Issue 1: Admin Middleware Missing ❌ CRITICAL

### Problem
All admin pages reference a middleware called "admin" but this middleware doesn't exist in the codebase.

### Location
- `/pages/admin/index.vue` (line 150): `middleware: 'admin'`
- Likely other admin pages have the same issue

### Impact
- Admin pages cannot be accessed after login
- Users get blocked/redirected when trying to access `/admin` routes
- The login page redirects to `/admin` for admin users (line 124 in `/pages/login.vue`)

### Root Cause
The middleware file should exist at `/middleware/admin.ts` or `/middleware/admin.js` but is completely missing.

### Solution Required
Create the missing admin middleware file that:
1. Checks if user is authenticated
2. Verifies user has admin role
3. Redirects to login if not authenticated
4. Redirects to home/orders if authenticated but not admin

---

## Issue 2: Package "Get Started" Button Routing ✅ WORKING

### Investigation Results
The "Get Started" buttons on packages are correctly configured:
- Using `UiButton` component with `to` prop
- Component properly renders as `NuxtLink` when `to` is provided
- Routes point to `/request?package=player-intros-basic` (and variants)
- The `/pages/request.vue` page exists and is properly configured

### Locations Checked
- `/pages/index.vue` lines 488-493, 528-533, 573-578
- `/components/ui/Button.vue` lines 2-4 (dynamic component rendering)
- `/pages/request.vue` exists and handles package query params

### Conclusion
**No issue found** - This may be related to the middleware problem or a deployment-specific issue.

---

## Issue 3: Resolution/Responsive Design Issues 📱 NEEDS IMPROVEMENT

### Problems Identified

#### 3.1 Hero Section Badge Overflow
**Location**: `/pages/index.vue` line 86-92

The "Professional Game Day Entertainment" badge with sports icons:
- Text is too long for mobile screens
- Icons + text create horizontal overflow
- No responsive text truncation or wrapping

**Affected Breakpoints**: `< 640px` (mobile)

#### 3.2 Hero Headline Text Sizing
**Location**: `/pages/index.vue` line 96

```vue
class="hero-headline mb-8 text-6xl font-black leading-tight text-white md:text-7xl lg:text-8xl xl:text-9xl"
```

- `text-6xl` (3.75rem/60px) is too large for small mobile screens
- Should start at `text-4xl` or `text-5xl` for mobile
- Needs better scaling between breakpoints

**Affected Breakpoints**: `< 768px` (mobile and small tablets)

#### 3.3 Trust Badge Responsiveness
**Location**: `/pages/index.vue` line 67-72

The trust badge with "Trusted by 50+ Teams • 500+ Events":
- May wrap awkwardly on very small screens
- Text size is fixed at `text-sm`
- Needs testing on screens < 375px width

#### 3.4 Logo Sizing
**Location**: `/pages/index.vue` line 80

```vue
class="h-64 w-auto object-contain sm:h-72 md:h-80 lg:h-96 hero-logo-animate"
```

- `h-64` (256px) is quite large for mobile
- Could be reduced to `h-48` or `h-56` for better mobile experience

#### 3.5 CTA Buttons Layout
**Location**: `/pages/index.vue` line 114

The buttons stack vertically on mobile but could be improved:
- Button text size (`text-xl`) might be too large on small screens
- Padding (`px-10 py-5`) is generous - could be reduced for mobile

#### 3.6 Container Padding
**Location**: `/assets/css/main.css` line 169-173

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem; /* 24px fixed padding */
}
```

- Fixed `1.5rem` padding may be too much on very small screens
- Should use responsive padding: `px-4 sm:px-6 lg:px-8`

#### 3.7 Missing Viewport Meta Tag Verification
Need to ensure proper viewport configuration in `nuxt.config.ts`:
- Currently set: `{ name: 'viewport', content: 'width=device-width, initial-scale=1' }`
- This is correct, but need to verify it's not being overridden

---

## Recommended Fixes Priority

### High Priority (Blocking)
1. **Create admin middleware** - Prevents admin access entirely

### Medium Priority (UX Issues)
2. **Fix hero headline sizing** - Text too large on mobile
3. **Fix badge overflow** - Horizontal scroll on mobile
4. **Adjust logo sizing** - Takes too much vertical space on mobile

### Low Priority (Polish)
5. **Optimize button sizing** - Better mobile touch targets
6. **Improve container padding** - Better use of small screen space
7. **Test trust badge** - Verify on very small screens

---

## Testing Checklist

After fixes are applied, test on:
- [ ] iPhone SE (375x667) - Smallest common mobile
- [ ] iPhone 12/13/14 (390x844) - Common mobile
- [ ] iPad Mini (768x1024) - Small tablet
- [ ] iPad Pro (1024x1366) - Large tablet
- [ ] Desktop (1280px+) - Standard desktop

---

## Files to Modify

1. **NEW FILE**: `/middleware/admin.ts` - Create admin middleware
2. **MODIFY**: `/pages/index.vue` - Fix responsive design issues
3. **MODIFY**: `/assets/css/main.css` - Fix container padding
4. **VERIFY**: All admin pages have correct middleware reference

---

## Additional Notes

- The Button component is well-designed and working correctly
- The request page is properly set up with package selection
- The auth store and login flow are correctly implemented
- The issue is specifically the missing middleware that blocks admin access
