# Quick Testing Guide

## How to Test the Fixes

### 1. Start the Development Server
```bash
cd /home/ubuntu/Hockey_app
pnpm dev
```

### 2. Test Roster Input (Add Player Button Fix)
1. Go to `/request?package=player-intros-basic`
2. Scroll to "Player Roster" section
3. Click **"Add Player"** button multiple times
   - ✅ Should add new empty player fields
   - ✅ Should show player count (e.g., "5 players")
4. Click **"Remove Player"** (X button)
   - ✅ Should remove that specific player
5. Try the other input methods:
   - Click **"PDF Upload"** button
   - Click **"Web Link"** button
   - Click **"Manual Entry"** button
   - ✅ Should switch between methods smoothly

### 3. Test Song Selection (Synchronization Fix)
1. In the same form, scroll to "Team Intro Song"
2. Click **"YouTube"** button
   - ✅ Should show YouTube URL input
3. Type something in the YouTube field
4. Click **"Spotify"** button
   - ✅ YouTube data should be cleared
   - ✅ Should show Spotify URL input
5. Click **"Song Name/Artist"** button
   - ✅ Spotify data should be cleared
   - ✅ Should show text input for song name

### 4. Test Date Picker (Large Calendar Fix)
1. Scroll to "Event Date" field
2. Click on the date field
   - ✅ Should show a large, easy-to-see calendar popup
   - ✅ Should have dark theme styling
3. Try to click on a past date
   - ✅ Should be disabled/grayed out
4. Select a future date
   - ✅ Should populate the field

### 5. Test Thanks Page (Celebration Animations)
1. Fill out the form completely
2. Click "Continue to Review"
3. Click "Submit Request"
4. You should be redirected to `/thanks`
   - ✅ Confetti should burst from multiple directions
   - ✅ Trophy, stars, medal, and hockey icons should float up
   - ✅ All content should fade in with stagger effect
   - ✅ Info card icons should pulse/glow
   - ✅ Step numbers should bounce in

### 6. Test All Package Forms
Repeat tests 2-4 for:
- Package 1: `/request?package=player-intros-basic`
- Package 2: `/request?package=player-intros-warmup`
- Package 3: `/request?package=player-intros-ultimate`

---

## Quick Visual Verification

### ✅ What You Should See

**Roster Section:**
- Three buttons: "Manual Entry" | "PDF Upload" | "Web Link"
- Player count display (e.g., "5 players")
- Add Player button (with + icon)
- Remove buttons (X icons) on each player row

**Song Section:**
- Three buttons: "YouTube" | "Spotify" | "Song Name/Artist"
- Input field changes based on selection
- Placeholder text matches the selected method

**Date Field:**
- Large calendar popup (not tiny browser default)
- Dark theme styling
- Past dates are disabled

**Thanks Page:**
- Confetti animation on load
- Floating sports icons
- Smooth fade-in animations
- Pulsing icon backgrounds

---

## Common Issues & Solutions

### Issue: "Add Player" button still not working
**Solution:** Make sure you ran `pnpm install` to get the latest dependencies.

### Issue: Date picker not showing
**Solution:** Check browser console for errors. Make sure `@vuepic/vue-datepicker` is installed.

### Issue: No confetti on thanks page
**Solution:** Check browser console for errors. Make sure `canvas-confetti` is installed.

### Issue: Changes not appearing
**Solution:** 
1. Stop the dev server (Ctrl+C)
2. Run `pnpm install`
3. Clear browser cache
4. Restart dev server with `pnpm dev`

---

## Browser Testing

Test in multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Mobile browsers (responsive design)

---

## Performance Check

The thanks page has multiple animations. Check:
- ✅ Animations should be smooth (60fps)
- ✅ No lag or stuttering
- ✅ Page should load quickly

If performance is poor, we can reduce the number of confetti particles or animation complexity.

---

## Accessibility Check

- ✅ Date picker should be keyboard accessible
- ✅ Buttons should have proper focus states
- ✅ Form should be navigable with Tab key
- ✅ Screen readers should announce changes

---

**Ready to test!** 🚀

If you find any issues, note:
1. Which browser you're using
2. What you were doing when the issue occurred
3. Any error messages in the browser console (F12 → Console tab)
