# Manual Integration Testing Guide

## Step 5: Manual Integration Testing

This guide will help you test the countdown timer application manually to ensure all features work correctly.

## Prerequisites

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Ensure your browser supports Web Speech API (most modern browsers do)
3. Make sure your system volume is turned on to hear voice announcements

## Test Plan

### Test 1: Basic Timer Functionality ✓

**Objective**: Verify the timer counts down correctly

**Steps**:
1. Open `index.html` in your browser
2. Set timer to 0 hours, 0 minutes, 10 seconds
3. Click "Start"
4. Watch the timer countdown
5. Observe that it counts from 00:00:10 to 00:00:00

**Expected Results**:
- Timer starts at 00:00:10
- Each second decrements by 1
- Timer stops at 00:00:00
- Display shows "Time's up!" message

---

### Test 2: Time Input Validation ✓

**Objective**: Verify input validation works

**Steps**:
1. Try entering 25 in hours field → Should cap at 23
2. Try entering 65 in minutes field → Should cap at 59
3. Try entering 75 in seconds field → Should cap at 59
4. Try entering negative numbers → Should reset to 0

**Expected Results**:
- All inputs respect min/max constraints
- Invalid inputs are automatically corrected

---

### Test 3: Preset Buttons ✓

**Objective**: Verify preset time buttons work

**Steps**:
1. Click "1 min" button
2. Verify timer shows 00:01:00
3. Click "5 min" button
4. Verify timer shows 00:05:00
5. Try clicking presets while timer is running → Should show error

**Expected Results**:
- Each preset button sets the correct time
- Presets are disabled while timer is running
- Error message appears if trying to change time during countdown

---

### Test 4: Start/Pause/Resume ✓

**Objective**: Verify pause and resume functionality

**Steps**:
1. Set timer to 00:01:00
2. Click "Start"
3. Wait until timer shows 00:00:50
4. Click "Pause"
5. Wait 5 real seconds
6. Verify timer is still at 00:00:50
7. Click "Resume"
8. Verify timer continues from 00:00:50

**Expected Results**:
- Timer pauses correctly
- Timer doesn't count while paused
- Timer resumes from paused time
- Button text changes between "Pause" and "Resume"

---

### Test 5: Reset Functionality ✓

**Objective**: Verify reset button works correctly

**Steps**:
1. Set timer to 00:02:00
2. Click "Start"
3. Wait until timer shows 00:01:30
4. Click "Reset"
5. Verify timer returns to 00:02:00
6. Verify inputs are enabled again

**Expected Results**:
- Timer resets to initial set time
- Timer stops running
- Input fields become enabled
- Buttons return to initial state

---

### Test 6: Voice Announcements - Every Minute ✓

**Objective**: Verify voice announces every minute

**Steps**:
1. Set timer to 00:05:00
2. Ensure "Voice Announcements" toggle is ON
3. Click "Start"
4. Listen for announcements at:
   - 5:00 → "5 minutes remaining"
   - 4:00 → "4 minutes remaining"
   - 3:00 → "3 minutes remaining"
   - 2:00 → "2 minutes remaining"
   - 1:00 → "1 minute remaining"

**Expected Results**:
- Voice announces at every full minute
- Singular "minute" used for 1 minute
- Plural "minutes" used for 2+ minutes

---

### Test 7: Voice Announcement - 30 Seconds ✓

**Objective**: Verify announcement at 30 seconds

**Steps**:
1. Set timer to 00:00:35
2. Ensure voice is enabled
3. Click "Start"
4. Listen at 30 seconds mark

**Expected Results**:
- Voice says "30 seconds remaining" at exactly 30 seconds

---

### Test 8: Voice Announcement - 10 Second Countdown ✓

**Objective**: Verify final 10 second countdown

**Steps**:
1. Set timer to 00:00:15
2. Ensure voice is enabled
3. Click "Start"
4. Listen carefully from 10 seconds to 1 second

**Expected Results**:
- Voice announces: "10, 9, 8, 7, 6, 5, 4, 3, 2, 1"
- Each number is announced at the correct second
- No other announcements overlap

---

### Test 9: Voice Toggle ✓

**Objective**: Verify voice can be disabled

**Steps**:
1. Set timer to 00:01:00
2. Toggle "Voice Announcements" OFF
3. Click "Start"
4. Listen at 1 minute mark

**Expected Results**:
- No voice announcement is made
- Timer still counts down visually
- Status message shows "Voice announcements disabled"

---

### Test 10: Timer Completion ✓

**Objective**: Verify behavior when timer reaches zero

**Steps**:
1. Set timer to 00:00:05
2. Click "Start"
3. Wait for completion

**Expected Results**:
- Voice says "Time's up!"
- Display shows red color and pulses
- Status message shows "⏰ Time's up!"
- Timer stops at 00:00:00
- Input fields become enabled

---

### Test 11: Progress Bar ✓

**Objective**: Verify progress bar updates correctly

**Steps**:
1. Set timer to 00:01:00
2. Click "Start"
3. Observe progress bar

**Expected Results**:
- Progress bar starts full (100%)
- Gradually decreases as timer counts down
- Changes color:
  - Blue/Purple: > 30 seconds
  - Orange: ≤ 30 seconds
  - Red: ≤ 10 seconds
- Reaches 0% when timer completes

---

### Test 12: Visual Feedback ✓

**Objective**: Verify visual color changes

**Steps**:
1. Set timer to 00:00:35
2. Click "Start"
3. Observe timer display color changes

**Expected Results**:
- Normal (black) from 35 to 31 seconds
- Orange (warning) from 30 to 11 seconds
- Red with pulse (danger) from 10 to 0 seconds

---

### Test 13: Multiple Runs ✓

**Objective**: Verify timer can be run multiple times

**Steps**:
1. Set timer to 00:00:10
2. Click "Start", let it complete
3. Click "Reset"
4. Click "Start" again
5. Repeat 3 times

**Expected Results**:
- Each run works correctly
- No memory leaks or errors
- Voice announcements work each time
- Display resets properly

---

### Test 14: Browser Compatibility ✓

**Objective**: Test across different browsers

**Steps**:
1. Open application in Chrome
2. Test basic functionality
3. Open in Firefox
4. Test basic functionality
5. Open in Safari (if available)
6. Test basic functionality

**Expected Results**:
- Works in all modern browsers
- Voice may not work in older browsers (should show warning)
- Layout is responsive and looks good

---

### Test 15: Mobile Responsiveness ✓

**Objective**: Verify mobile layout works

**Steps**:
1. Open browser DevTools
2. Toggle device toolbar (mobile view)
3. Test on various screen sizes:
   - iPhone SE (375px)
   - iPhone 12 (390px)
   - iPad (768px)

**Expected Results**:
- Layout adjusts for mobile screens
- Buttons stack vertically on mobile
- Text remains readable
- All features still work

---

## Quick Test Scenarios

### Scenario A: Quick 10 Second Test
1. Set to 00:00:10
2. Start timer
3. Listen for countdown from 10 to 1
4. Hear "Time's up!"

### Scenario B: 1 Minute Test with Pause
1. Click "1 min" preset
2. Start timer
3. Pause at 30 seconds
4. Hear "30 seconds remaining"
5. Resume
6. Let it complete

### Scenario C: Voice On/Off Test
1. Set to 00:01:00
2. Start with voice ON
3. Hear "1 minute remaining"
4. Pause
5. Toggle voice OFF
6. Resume
7. No announcements until complete

---

## Test Results Template

```
Date: ___________
Browser: ___________
OS: ___________

Test 1:  [ ] Pass  [ ] Fail  Notes: ___________
Test 2:  [ ] Pass  [ ] Fail  Notes: ___________
Test 3:  [ ] Pass  [ ] Fail  Notes: ___________
Test 4:  [ ] Pass  [ ] Fail  Notes: ___________
Test 5:  [ ] Pass  [ ] Fail  Notes: ___________
Test 6:  [ ] Pass  [ ] Fail  Notes: ___________
Test 7:  [ ] Pass  [ ] Fail  Notes: ___________
Test 8:  [ ] Pass  [ ] Fail  Notes: ___________
Test 9:  [ ] Pass  [ ] Fail  Notes: ___________
Test 10: [ ] Pass  [ ] Fail  Notes: ___________
Test 11: [ ] Pass  [ ] Fail  Notes: ___________
Test 12: [ ] Pass  [ ] Fail  Notes: ___________
Test 13: [ ] Pass  [ ] Fail  Notes: ___________
Test 14: [ ] Pass  [ ] Fail  Notes: ___________
Test 15: [ ] Pass  [ ] Fail  Notes: ___________

Overall Status: [ ] All Pass  [ ] Some Failures

Notes:
______________________________________
______________________________________
```

---

## Known Issues / Limitations

1. **Browser Support**: Web Speech API requires a modern browser with speech synthesis support
2. **Voice Quality**: Voice quality and availability depends on the operating system
3. **Accuracy**: Timer uses JavaScript intervals which may drift slightly over long periods
4. **Permissions**: Some browsers may require user interaction before enabling speech

---

## Automated Test Summary

Before manual testing, verify all automated tests pass:

```bash
node run-tests.js
```

Expected: **40/40 tests passing (100%)**

✅ Step 1: Project Structure (6 tests)
✅ Step 2: Time Validation (11 tests)
✅ Step 3: Countdown Mechanism (13 tests)
✅ Step 4: Voice Announcements (10 tests)
