# Video Modal Implementation - Complete Technical Changes

This document describes all the changes required to implement clickable video carousel items that open in a modal player.

## Summary of Changes

| File | Status | Description |
|------|--------|-------------|
| `components/VideoPlayerModal.vue` | **NEW** | New modal component for playing videos |
| `components/HeroVideoCarouselItem.vue` | **MODIFIED** | Added click handling and play overlay |
| `components/HeroVideoCarousel.vue` | **MODIFIED** | Added event propagation and modal state awareness |
| `components/home/HeroSection.vue` | **MODIFIED** | Added modal state management |
| `pages/index.vue` | **MODIFIED** | Added modal state management |

---

## File Details

### 1. NEW: `components/VideoPlayerModal.vue`

**Purpose:** A reusable modal component for playing videos with full controls.

**Key Features:**
- Teleport to body for proper z-index stacking
- Auto-play when modal opens
- Native video controls
- Loading and error states
- Retry functionality
- Keyboard support (Escape to close, Space to play/pause)
- Body scroll locking
- Smooth transitions
- Responsive design for landscape and portrait videos
- Accessibility features (ARIA labels, focus management)

**Props:**
```typescript
interface Props {
  isOpen: boolean          // Controls modal visibility
  videoSrc: string         // Video source URL
  category?: string        // Optional category label
  title?: string           // Optional video title
  orientation?: 'landscape' | 'portrait' | 'auto'  // Video orientation
  autoplay?: boolean       // Auto-play on open (default: true)
}
```

**Events:**
```typescript
emit('close')        // When modal should close
emit('videoEnded')   // When video playback ends
emit('videoPlay')    // When video starts playing
emit('videoPause')   // When video is paused
```

---

### 2. MODIFIED: `components/HeroVideoCarouselItem.vue`

**Changes Made:**

1. **Added click handling:**
   - Added `@click="handleClick"` to the root element
   - Added keyboard support (`@keydown.enter`, `@keydown.space.prevent`)
   - Added `role="button"` and `tabindex="0"` for accessibility
   - Added `aria-label` for screen readers

2. **Added visual affordances:**
   - Added `cursor-pointer` class
   - Added `group` class for hover state management
   - Added play button overlay that appears on hover
   - Added "Click to play" text hint

3. **Added event emission:**
   ```typescript
   const emit = defineEmits<{
     'video-clicked': [videoData: VideoData]
   }>()
   ```

4. **New styles:**
   - Play overlay with gradient background
   - Animated play button with glow effect
   - Hover transitions
   - Focus styles for keyboard navigation

---

### 3. MODIFIED: `components/HeroVideoCarousel.vue`

**Changes Made:**

1. **Added new prop:**
   ```typescript
   isModalOpen?: boolean  // Pause animation when modal is open
   ```

2. **Added event emission:**
   ```typescript
   const emit = defineEmits<{
     'video-clicked': [videoData: VideoClickedData]
   }>()
   ```

3. **Added event handler:**
   ```typescript
   const handleVideoClicked = (videoData: VideoClickedData) => {
     isPaused.value = true
     emit('video-clicked', videoData)
   }
   ```

4. **Added watcher for modal state:**
   - Pauses carousel animation when modal opens
   - Resumes animation when modal closes

5. **Updated template:**
   - Added `@video-clicked="handleVideoClicked"` to both sets of carousel items

---

### 4. MODIFIED: `components/home/HeroSection.vue`

**Changes Made:**

1. **Added video modal state:**
   ```typescript
   const isVideoModalOpen = ref(false)
   const selectedVideo = ref<VideoData | null>(null)
   ```

2. **Added handlers:**
   ```typescript
   const openVideoModal = (videoData: VideoData) => { ... }
   const closeVideoModal = () => { ... }
   const onVideoEnded = () => { ... }
   ```

3. **Updated HeroVideoCarousel usage:**
   ```vue
   <HeroVideoCarousel 
     :videos="heroVideos"
     :scroll-speed="25"
     :show-video-info="true"
     :is-modal-open="isVideoModalOpen"
     @video-clicked="openVideoModal"
   />
   ```

4. **Added VideoPlayerModal component:**
   ```vue
   <VideoPlayerModal
     :is-open="isVideoModalOpen"
     :video-src="selectedVideo?.src || ''"
     :category="selectedVideo?.category"
     :title="selectedVideo?.title"
     :orientation="selectedVideo?.orientation"
     @close="closeVideoModal"
     @video-ended="onVideoEnded"
   />
   ```

---

### 5. MODIFIED: `pages/index.vue`

**Changes Made:**

Same changes as `HeroSection.vue`:

1. **Added video modal state and handlers**
2. **Updated HeroVideoCarousel props and events**
3. **Added VideoPlayerModal component**

---

## Data Flow

```
User clicks video in carousel
        ↓
HeroVideoCarouselItem emits 'video-clicked' with video data
        ↓
HeroVideoCarousel receives event, pauses animation, emits 'video-clicked'
        ↓
Parent (index.vue or HeroSection.vue) receives event
        ↓
Parent sets selectedVideo and isVideoModalOpen = true
        ↓
VideoPlayerModal opens with video data
        ↓
User closes modal (X button, overlay click, or Escape key)
        ↓
Parent sets isVideoModalOpen = false
        ↓
HeroVideoCarousel resumes animation
```

---

## Styling Notes

### Color Scheme
All new styles follow the existing design system:
- Primary accent: `cyan-400` (#22d3ee)
- Secondary accent: `blue-600` (#2563eb)
- Background: `slate-900` to `slate-950`
- Gradients: Blue to cyan transitions

### Transitions
- Modal fade: 0.3s ease
- Modal scale: 0.3s ease
- Play overlay: 0.3s ease
- Play button hover: 0.3s ease

### Responsive Breakpoints
- Mobile: Full width, smaller padding
- Tablet: Adjusted container sizes
- Desktop: Max-width constraints

---

## Accessibility Features

1. **Keyboard Navigation:**
   - Tab to navigate to video items
   - Enter/Space to open modal
   - Escape to close modal
   - Space to play/pause video (when not focused on video controls)

2. **Screen Reader Support:**
   - `role="dialog"` on modal
   - `aria-modal="true"` on modal
   - `aria-label` on video items
   - `aria-labelledby` linking to video title

3. **Focus Management:**
   - Focus moves to close button when modal opens
   - Focus trap within modal (implicit via overlay click handling)

---

## Testing Checklist

- [ ] Click on carousel video opens modal
- [ ] Video auto-plays in modal
- [ ] Video controls work (play, pause, seek, volume)
- [ ] Close button closes modal
- [ ] Clicking overlay closes modal
- [ ] Escape key closes modal
- [ ] Carousel pauses when modal is open
- [ ] Carousel resumes when modal closes
- [ ] Portrait videos display correctly
- [ ] Landscape videos display correctly
- [ ] Loading state shows while video buffers
- [ ] Error state shows for failed videos
- [ ] Retry button works
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation works
- [ ] Body scroll is locked when modal is open

---

## Installation

No additional dependencies required. All components use:
- Vue 3 Composition API
- Nuxt 3 auto-imports
- Existing Icon component (mdi icons)
- Existing Teleport and Transition components

Simply copy the files to their respective locations and the components will be automatically registered by Nuxt.

---

## Future Enhancements

Consider adding these features in future iterations:

1. **Video Gallery Navigation:** Add prev/next buttons to browse through all videos
2. **Video Progress Memory:** Remember playback position
3. **Share Functionality:** Copy link to specific video
4. **Analytics Integration:** Track video engagement metrics
5. **Captions/Subtitles:** Add support for video captions
6. **Quality Selection:** Allow users to choose video quality
7. **Picture-in-Picture:** Enable PiP mode for continued viewing
