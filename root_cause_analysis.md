# Root Cause Analysis - Calendar Width Issue

## Problem Identified

The VueDatePicker component is creating a **nested div with an inline style** that sets `--dp-menu-width: 578px;`. This inline style is applied to a div that sits between `.dp__menu` and its children.

### DOM Structure
```
.dp__outer_menu_wrap (width: 578px)
  └─ .dp__menu (width: 578px)
      └─ div[style="--dp-menu-width: 578px;"] (width: 578px) ← PROBLEM ELEMENT
          └─ .dp__menu_inner
              └─ calendar content
```

## Why Current Fixes Don't Work

### Commit 4cc9f17 - Override CSS Variable
```css
:deep(.dp__main) {
  --dp-menu-width: 100% !important;
}

:deep(.dp__menu > div[style*="--dp-menu-width"]) {
  width: 100% !important;
  max-width: 100% !important;
  --dp-menu-width: 100% !important;
}
```

**Problem**: The CSS selector `:deep(.dp__menu > div[style*="--dp-menu-width"])` is correct, but:
1. The inline style `--dp-menu-width: 578px` has higher specificity than the scoped CSS
2. The div itself is using this CSS variable to calculate its width
3. Even with `!important`, the inline style on the element is being applied first

### Commit 8aab438 - Target Outer Wrap
```css
:deep(.dp__outer_menu_wrap) {
  width: 100% !important;
  max-width: 100% !important;
}
```

**Problem**: This targets the parent, but the child div with the inline style still constrains the width to 578px.

## The Real Issue

The problem is that VueDatePicker is **dynamically injecting an inline style** with a CSS variable. The CSS cascade works like this:

1. Inline styles have the highest specificity
2. The div has `style="--dp-menu-width: 578px;"`
3. This CSS variable is then used by the component's internal styles
4. The width calculation happens at the div level, not at the parent level

## Solution

We need to target the specific div with the inline style and override its width directly, not just the CSS variable. The key is to:

1. Target the div with `[style*="--dp-menu-width"]` more specifically
2. Force the width with `!important` at multiple levels
3. Ensure the parent containers don't constrain the width

The fix needs to be more aggressive and target the element more directly in the cascade.
