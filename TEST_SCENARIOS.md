# Test Scenarios for Hockey App Fixes

## Critical Fix #1: Async Email Sending

### Scenario 1: Normal Email Delivery
**Steps:**
1. Fill out a form and submit
2. Observe the navigation to thank you page

**Expected Result:**
- User is immediately redirected to /thanks page (< 1 second)
- Email is sent in the background
- No 2-minute delay

**How to Verify:**
- Check server logs for "Order created successfully" followed by "Order confirmation email sent"
- Time the submission to thank you page transition

### Scenario 2: Email Failure
**Steps:**
1. Misconfigure SMTP settings or disconnect from email server
2. Submit a form

**Expected Result:**
- User still gets redirected immediately to /thanks page
- Order is saved in database
- Error is logged but doesn't affect user experience

**How to Verify:**
- Check database for the order record
- Check server logs for "Failed to send order confirmation email"

---

## Critical Fix #2: Dropdown Data Cleaning

### Scenario 1: Switch from YouTube to Spotify
**Steps:**
1. Select Package 2 or 3 (has intro song dropdown)
2. Select "YouTube Link" method
3. Enter a YouTube URL: https://youtube.com/watch?v=abc123
4. Switch method to "Spotify Link"
5. Enter a Spotify URL: https://open.spotify.com/track/xyz789
6. Submit the form

**Expected Result:**
- Only the Spotify URL should be in the submitted data
- YouTube URL should be cleared

**How to Verify:**
- Check browser console for submitted data
- Check database record - intro_song should only have {method: 'spotify', spotify: 'url'}

### Scenario 2: Switch from Spotify to Text
**Steps:**
1. Select "Spotify Link" and enter URL
2. Switch to "Song Name/Artist"
3. Enter song name
4. Submit

**Expected Result:**
- Only the text field should be populated
- Spotify URL should be cleared

---

## Critical Fix #3: Form State Management

### Scenario 1: Add and Remove Players
**Steps:**
1. Select Package 1, 2, or 3
2. Click "Add Player" multiple times
3. Fill in player names
4. Remove some players
5. Submit

**Expected Result:**
- No console errors about computed property mutations
- Player list updates correctly
- Only non-empty player names are submitted

**How to Verify:**
- Check browser console for Vue warnings
- Verify submitted data has correct player array

---

## Edge Cases to Test

### Edge Case 1: Rapid Method Switching
**Steps:**
1. Rapidly switch between YouTube/Spotify/Text methods
2. Observe behavior

**Expected Result:**
- No race conditions
- Final method selection is preserved
- Old data is cleared

### Edge Case 2: Empty Submission
**Steps:**
1. Select a method but don't enter any data
2. Try to submit

**Expected Result:**
- Validation catches empty required fields
- Backend cleanSongObject returns null for empty data

### Edge Case 3: Form Persistence
**Steps:**
1. Fill out form partially
2. Refresh page
3. Check if data is restored

**Expected Result:**
- Form data is restored from localStorage
- Dropdown selections are preserved correctly

---

## Regression Tests

### Test 1: Existing Functionality
- Verify all three packages still work
- Verify roster upload (PDF, manual, web link) still works
- Verify contact form still works

### Test 2: Navigation
- Verify back button works
- Verify progress through steps works
- Verify review step shows correct data

### Test 3: Error Handling
- Verify network errors are handled
- Verify validation errors are shown
- Verify user can recover from errors
