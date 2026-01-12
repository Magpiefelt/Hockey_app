# UI/UX Improvement Notes

## Design System Patterns (from packages.vue and dashboard.vue)

### Container
- `max-w-7xl mx-auto` for main content wrapper

### Header Pattern
```html
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
  <div>
    <h1 class="text-2xl lg:text-3xl font-bold text-white mb-1">Title</h1>
    <p class="text-slate-400">Description</p>
  </div>
  <!-- Action button -->
</div>
```

### Card/Panel Pattern
- `bg-slate-900/50 border border-slate-800 rounded-2xl`
- Hover: `hover:border-slate-700 transition-all`

### Table Pattern
- Container: `bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden`
- Header row: `border-b border-slate-800 bg-slate-800/30`
- Header cell: `text-left py-4 px-6 text-slate-300 font-semibold text-xs uppercase tracking-wide`
- Body row: `border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group`
- Row actions: `opacity-0 group-hover:opacity-100 transition-opacity`

### Loading State
```html
<div class="flex justify-center items-center py-20">
  <div class="flex flex-col items-center gap-4">
    <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    <p class="text-slate-400">Loading...</p>
  </div>
</div>
```

### Error State
```html
<div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
  <div class="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
    <Icon name="mdi:alert-circle" class="w-8 h-8 text-red-400" />
  </div>
  <p class="text-red-400 text-lg mb-4">{{ error }}</p>
  <button class="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all">
    Try Again
  </button>
</div>
```

### Empty State
```html
<td colspan="X" class="py-16 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
    <Icon name="mdi:icon-name" class="w-8 h-8 text-slate-600" />
  </div>
  <p class="text-slate-400 mb-1">No items found</p>
  <p class="text-sm text-slate-500">Helpful suggestion text</p>
</td>
```

### Button Patterns
- Primary: `px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20`
- Secondary: `px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all font-medium`
- Icon button: `p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors`

### Filter Section
```html
<div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mb-6">
  <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Filter inputs -->
  </div>
</div>
```

### Input Pattern
- `w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all`

### Badge/Status Pattern
- Use UiBadge component with variants

### Info Section
```html
<div class="mt-6 card p-6 bg-blue-500/10 border-blue-500/30">
  <div class="flex gap-3">
    <Icon name="mdi:information" class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
    <div class="text-sm text-slate-300 space-y-2">
      <p><strong class="text-white">Note:</strong> Content here</p>
    </div>
  </div>
</div>
```

## Issues Identified

### Orders Index Page
1. Uses inconsistent styling (mix of old and new patterns)
2. Table header styling inconsistent (`text-slate-200` vs `text-slate-300`)
3. Pagination could use the UiPagination component
4. Missing info section at bottom

### Order Detail Page ([id].vue)
1. Uses `px-6 py-8 max-w-6xl` instead of `max-w-7xl mx-auto`
2. Uses old card styling (`bg-dark-secondary border border-white/10`)
3. Breadcrumb uses inline SVG instead of Icon component
4. Loading spinner uses old pattern
5. Error state uses old pattern
6. Overall layout is cluttered and hard to scan

### Calendar Page
1. Page structure is good but CalendarManager component could be improved
2. VueDatePicker styling may not match the design system

### Finance Dashboard
1. Uses `px-6 py-8` wrapper instead of consistent pattern
2. Uses old `card` class instead of explicit styling
3. Loading spinner uses old pattern
4. Table styling is inconsistent
5. Missing modern stat card styling

## Components Available
- UiBadge
- UiBreadcrumb
- UiButton
- UiCard
- UiConfirmDialog
- UiDataTable
- UiDatePicker
- UiEmptyState
- UiFileUpload
- UiInput
- UiLoadingSpinner
- UiPagination
- UiSection
- UiSelect
- UiSkeleton
- UiSortableHeader
- UiStatusIndicator
- UiTextarea
- UiToastContainer
