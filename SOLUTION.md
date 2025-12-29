# Date Picker Width Issue - Complete Analysis & Solution

## Root Cause Identified

After thorough investigation of the live site and code, I've identified the **actual root cause**:

### The Problem: `min-width: 260px` on `.dp__menu`

The VueDatePicker library sets a **`min-width: 260px`** on the `.dp__menu` element. From the downloaded CSS:

```css
.dp__menu {
  background: var(--dp-background-color);
  border: 1px solid var(--dp-menu-border-color);
  border-radius: 4px;
  border-radius: var(--dp-border-radius);
  font-family: -apple-system, blinkmacsystemfont, Segoe UI, roboto, oxygen, ubuntu, cantarell, Open Sans, Helvetica Neue, sans-serif;
  font-family: var(--dp-font-family);
  font-size: 1rem;
  font-size: var(--dp-font-size);
  min-width: 260px;           /* ← THIS IS THE CONSTRAINT */
  min-width: var(--dp-menu-min-width);
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
```

### Why This Causes the 578px Width

The VueDatePicker component internally calculates a width based on:
1. The calendar grid layout (7 columns for days of the week)
2. Cell sizes and spacing
3. This calculation results in ~578px as the "natural" width

When the component tries to shrink below this calculated width, the `min-width: 260px` doesn't help because 578px > 260px. The issue is that the component is **not respecting the parent container's width** and instead using its internal calculated width.

### DOM Structure Analysis

From browser inspection:
```
.calendar-outer-container (width: 900px, max-width: 900px)
  └─ .calendar-card (width: 868px - includes padding)
      └─ .calendar-wrapper (width: 768px)
          └─ .dp__main (width: 768px, max-width: 100%)
              └─ .dp__outer_menu_wrap (width: 578px) ← STUCK HERE
                  └─ .dp__menu (width: 578px, min-width: 260px)
                      └─ div[style="--dp-menu-width: 578px;"] (width: 578px)
```

The `.dp__outer_menu_wrap` and its children are stuck at 578px even though:
- The parent `.dp__main` is 768px wide
- We've set `width: 100% !important` on multiple elements
- We've overridden the CSS variable `--dp-menu-width`

### Why Previous Fixes Failed

1. **Commit 4cc9f17**: Targeted the CSS variable and the div, but didn't address the `min-width` constraint
2. **Commit 8aab438**: Targeted `.dp__outer_menu_wrap`, but the element still respects its internal width calculation

The real issue is that VueDatePicker's internal width calculation is happening at the **component level** (likely in JavaScript), and it's setting an explicit width that overrides the CSS percentage widths.

## The Solution

We need to override the `min-width` on `.dp__menu` and force all parent containers to use `width: 100%` with `!important`, while also ensuring no `min-width` constraints exist.

### Required CSS Changes

```css
/* Force the menu to respect container width */
:deep(.dp__menu) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;  /* ← KEY FIX: Remove the 260px min-width */
}

/* Ensure outer wrap doesn't constrain */
:deep(.dp__outer_menu_wrap) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

/* Target the div with inline CSS variable */
:deep(.dp__menu > div[style*="--dp-menu-width"]) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}
```

The critical addition is **`min-width: 0 !important`** which removes the library's default `min-width: 260px` constraint.

## Implementation Plan

1. Update `components/home/AvailabilityCalendar.vue` with the fix
2. Update `components/admin/CalendarManager.vue` with the same fix
3. Test on live site to verify the calendar now fills the container properly
