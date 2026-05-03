# Login Module — Manual Test Checklist

**Quick Reference for Manual QA Testing**  
**Print this checklist and mark off each item as you test**

---

## 🔐 PASSWORD LOGIN TESTS

### Mobile Login
- [ ] Enter valid mobile number (10 digits)
- [ ] Enter valid password
- [ ] Click "Log In"
- [ ] Verify successful login toast
- [ ] Verify redirect to dashboard

### Email Login
- [ ] Click "Email" tab
- [ ] Enter valid email address
- [ ] Enter valid password
- [ ] Click "Log In"
- [ ] Verify successful login toast

### Validation Errors
- [ ] Submit with empty mobile → See "Mobile number is required"
- [ ] Submit with invalid mobile (123) → See "Please enter a valid mobile number"
- [ ] Submit with empty email → See "Email is required"
- [ ] Submit with invalid email → See "Please enter a valid email"
- [ ] Submit with empty password → See "Password is required"
- [ ] Submit with wrong password → See "Invalid credentials" with recovery steps

### Password Visibility
- [ ] Password is masked by default (••••)
- [ ] Click eye icon → Password becomes visible
- [ ] Click eye-off icon → Password becomes masked again

### Remember Me
- [ ] Check "Remember me" checkbox
- [ ] Hover over info icon → See tooltip about 30-day persistence

### Form Switching
- [ ] Enter mobile number "9876543210"
- [ ] Switch to Email tab
- [ ] Verify mobile number is cleared
- [ ] Switch back to Mobile tab
- [ ] Verify field is empty (not repopulated)

---

## 📱 OTP LOGIN TESTS

### SMS Delivery
- [ ] Click "OTP" tab
- [ ] Verify "SMS" is selected by default
- [ ] Enter valid mobile number
- [ ] Click "Send OTP"
- [ ] Verify "Sending OTP..." loading state
- [ ] Verify success toast "OTP sent via SMS"
- [ ] Verify masked number in toast (******3210)
- [ ] Verify OTP input field appears
- [ ] Verify countdown timer appears (30s)

### WhatsApp Delivery
- [ ] Click "OTP" tab
- [ ] Click "WhatsApp" button
- [ ] Verify WhatsApp button is highlighted
- [ ] Enter valid mobile number
- [ ] Click "Send OTP"
- [ ] Verify success toast "OTP sent via WhatsApp"

### OTP Input
- [ ] Enter "123" → Verify 3 digits shown
- [ ] Try typing "abc" → Verify only numbers accepted
- [ ] Enter "123456" (6 digits)
- [ ] Verify OTP field shows "123456" with spacing
- [ ] Click "Log In"
- [ ] Verify login attempt

### OTP Validation
- [ ] Enter invalid OTP "999999"
- [ ] Click "Log In"
- [ ] Verify error: "Invalid OTP" with guidance
- [ ] Clear and enter valid OTP "123456"
- [ ] Verify successful login

### OTP Resend
- [ ] Wait for countdown to reach 0
- [ ] Verify "Resend" button becomes enabled
- [ ] Click "Didn't receive OTP? Resend"
- [ ] Verify new countdown starts (30s)
- [ ] Verify new OTP sent toast

### Email OTP
- [ ] Switch to Email tab (in OTP mode)
- [ ] Enter valid email
- [ ] Send OTP
- [ ] Verify masked email in confirmation (use***@example.com)

---

## 🌐 SSO LOGIN TESTS

### DigiLocker (Primary)
- [ ] Verify "DigiLocker Login" button visible
- [ ] Verify "Recommended" badge shown
- [ ] Click "DigiLocker Login"
- [ ] Verify SSO redirect or config warning
- [ ] Verify proper error handling if not configured

### Aadhaar OTP (Primary)
- [ ] Verify "Aadhaar OTP" button visible
- [ ] Click "Aadhaar OTP"
- [ ] Verify redirect to `/auth/aadhaar-otp`

### Progressive Disclosure
- [ ] Verify Google/Microsoft buttons are HIDDEN initially
- [ ] Click "More login options"
- [ ] Verify expand icon changes to collapse icon
- [ ] Verify Google button appears
- [ ] Verify Microsoft button appears
- [ ] Click "Show less options"
- [ ] Verify buttons collapse again

### Google SSO
- [ ] Expand SSO options
- [ ] Click "Continue with Google"
- [ ] Verify SSO redirect or config warning
- [ ] Verify Google logo visible and colored correctly

### Microsoft SSO
- [ ] Expand SSO options
- [ ] Click "Continue with Microsoft"
- [ ] Verify SSO redirect or config warning
- [ ] Verify Microsoft logo visible with 4 colored squares

---

## 🔁 RETURNING USER TESTS

### Setup
- [ ] Login successfully once
- [ ] Note that identifier is saved to localStorage
- [ ] Clear cookies/session (keep localStorage)
- [ ] Refresh `/login` page

### Verification
- [ ] Verify "Continue as [Name]" card appears
- [ ] Verify saved identifier shown (9876543210 or email)
- [ ] Click "Continue as [Name]" button
- [ ] Verify identifier field is auto-filled
- [ ] Verify login method matches (mobile vs email)
- [ ] Complete login
- [ ] Verify successful authentication

### Clearing
- [ ] Clear localStorage
- [ ] Refresh page
- [ ] Verify "Continue as" card does NOT appear
- [ ] Verify normal login screen shown

---

## 👆 BIOMETRIC LOGIN TESTS

### Feature Detection
- [ ] Check if device supports WebAuthn
- [ ] If supported: Verify "Biometric Login" button appears
- [ ] If not supported: Verify button does NOT appear

### Biometric Flow (if available)
- [ ] Click "Biometric Login" button
- [ ] Verify browser prompts for fingerprint/face
- [ ] Complete biometric authentication
- [ ] Verify login success

---

## 📐 RESPONSIVE LAYOUT TESTS

### Mobile Portrait (375px)
- [ ] Open on iPhone SE or resize browser to 375x667
- [ ] Verify login card fits viewport without horizontal scroll
- [ ] Verify all buttons are ≥ 48px tall (thumb-friendly)
- [ ] Verify form inputs are large enough (text-base font)
- [ ] Verify no text cutoff or overlapping elements
- [ ] Click input → Verify no auto-zoom (browser doesn't zoom in)
- [ ] Scroll to bottom → Verify footer visible
- [ ] Expand SSO options → Verify all buttons fit

### Mobile Landscape (667px wide)
- [ ] Rotate device or resize to 667x375
- [ ] Verify layout still works
- [ ] Verify no elements off-screen

### Tablet Portrait (768px)
- [ ] Open on iPad or resize to 768x1024
- [ ] Verify login card is centered
- [ ] Verify max-width constraint applied (doesn't stretch full width)
- [ ] Verify comfortable spacing

### Tablet Landscape (1024px wide)
- [ ] Resize to 1024x768
- [ ] Verify layout adapts properly
- [ ] Verify SSO buttons remain proportional

### Desktop (1920px)
- [ ] Open on desktop or resize to 1920x1080
- [ ] Verify login card is centered
- [ ] Verify max-width prevents sparse layout
- [ ] Verify background gradient visible
- [ ] Verify trust indicators (10M+ Users, 256-bit Encrypted) readable

### Large Desktop (2560px)
- [ ] Resize to 2560x1440 or 4K
- [ ] Verify layout doesn't break
- [ ] Verify no excessive white space
- [ ] Verify card remains at reasonable width

---

## 🌓 DARK MODE TESTS

### Enable Dark Mode
- [ ] Click theme toggle in header (sun/moon icon)
- [ ] Verify smooth transition to dark mode
- [ ] Verify all text remains readable

### Component Validation
- [ ] Login card background is dark
- [ ] Input backgrounds distinguishable from card
- [ ] Border colors visible
- [ ] Error text high contrast (red/orange)
- [ ] Primary button stands out
- [ ] SSO buttons have visible borders
- [ ] Trust badges remain readable
- [ ] Icons visible

### State Validation
- [ ] Trigger validation error → Verify error color visible in dark mode
- [ ] Send OTP → Verify loading state visible
- [ ] Expand SSO → Verify all buttons visible
- [ ] Hover over buttons → Verify hover state visible

### Switching
- [ ] Toggle from dark → light → dark
- [ ] Verify no flashing or layout shift
- [ ] Verify persistence (refresh page, mode remains)

---

## ♿ ACCESSIBILITY TESTS

### Keyboard Navigation
- [ ] Click in address bar, press Tab repeatedly
- [ ] Verify tab order: Password tab → OTP tab → Mobile tab → Email tab → Mobile input → Password input → Show password → Remember me → Forgot password → Log In → SSO buttons → Sign up link
- [ ] Press Shift+Tab → Verify reverse order
- [ ] Navigate to Login button, press Enter → Verify form submits
- [ ] Navigate to SSO button, press Space → Verify SSO triggers

### Focus Indicators
- [ ] Tab to each interactive element
- [ ] Verify visible 2px focus ring on each element
- [ ] Verify focus ring color has sufficient contrast

### Screen Reader (if available)
- [ ] Turn on screen reader (NVDA/JAWS/VoiceOver)
- [ ] Navigate to mobile input → Verify "Mobile Number" announced
- [ ] Trigger error → Verify error announced as "alert"
- [ ] Navigate to Submit button → Verify "Log In" announced with role
- [ ] Navigate to tabs → Verify role and selected state announced

### Color Contrast
- [ ] Use browser DevTools or contrast checker
- [ ] Verify body text ≥ 4.5:1 ratio
- [ ] Verify error text ≥ 4.5:1 ratio
- [ ] Verify button text ≥ 4.5:1 ratio
- [ ] Verify muted text ≥ 4.5:1 ratio

### Form Labels
- [ ] Right-click each input → Inspect
- [ ] Verify each input has associated `<label>` with matching `for` attribute
- [ ] Verify error messages have `aria-describedby` linking to input

---

## 🌍 BROWSER COMPATIBILITY TESTS

### Chrome/Edge
- [ ] Open in latest Chrome
- [ ] Complete full login flow
- [ ] Verify all styles render correctly
- [ ] Verify autofill works
- [ ] Test in Edge (Chromium-based)

### Safari
- [ ] Open in Safari 17+
- [ ] Verify gradient background renders
- [ ] Verify SVG icons render (Google, Microsoft logos)
- [ ] Verify CSS Grid layout works
- [ ] Test autofill

### Firefox
- [ ] Open in Firefox 121+
- [ ] Verify all styles consistent
- [ ] Verify form validation messages
- [ ] Verify flexbox layout

---

## ⚡ PERFORMANCE TESTS

### Loading Speed
- [ ] Open DevTools Network tab, set to "Fast 3G"
- [ ] Refresh page
- [ ] Verify page loads in < 3 seconds
- [ ] Verify loading states shown during requests

### Layout Stability
- [ ] Open DevTools Performance tab
- [ ] Refresh page and record
- [ ] Verify Cumulative Layout Shift (CLS) < 0.1
- [ ] Trigger validation error → Verify no layout jump

### Double-Submit Prevention
- [ ] Fill login form
- [ ] Click "Log In" button rapidly 5 times
- [ ] Verify only ONE request sent (check Network tab)
- [ ] Verify button disabled during submission

---

## 🔒 SECURITY TESTS

### Password Masking
- [ ] Enter password
- [ ] Verify shown as dots (••••)
- [ ] Right-click → Inspect → Verify input type="password"
- [ ] Show password → Verify type="text"
- [ ] Hide password → Verify type="password" again

### Data Privacy
- [ ] Send OTP
- [ ] Check success message → Verify phone shows as "******3210" (not full number)
- [ ] Check browser DevTools → Verify no password in HTML
- [ ] Check Network tab → Verify password only in encrypted POST body

### Error Messages
- [ ] Enter wrong password
- [ ] Verify error does NOT reveal if email/mobile exists
- [ ] Verify generic "Invalid credentials" message

---

## 🔗 NAVIGATION TESTS

### Links
- [ ] Click "Forgot password?" → Verify navigates to `/forgot-password`
- [ ] Click "Sign up" → Verify navigates to `/register`
- [ ] Click "Get help" → Verify navigates to `/help-center`

### Header/Footer
- [ ] Verify PublicHeader appears at top
- [ ] Verify theme toggle works
- [ ] Verify language selector works (if implemented)
- [ ] Verify PublicFooter appears at bottom
- [ ] Verify footer links functional

---

## 🎨 VISUAL POLISH TESTS

### Trust Indicators
- [ ] Verify "10M+ Users" badge with Users icon
- [ ] Verify "256-bit Encrypted" badge with Shield icon
- [ ] Verify footer shows "Secured by Government of India • MeitY • SSL Encrypted"

### Icons
- [ ] Verify Phone icon in mobile input
- [ ] Verify Mail icon in email input
- [ ] Verify Lock icon in password input
- [ ] Verify Eye/EyeOff icon in password toggle
- [ ] Verify MessageSquare icon in OTP tab
- [ ] Verify Smartphone icon in logo
- [ ] Verify all SSO provider logos render correctly

### Animations
- [ ] Hover over buttons → Verify smooth hover transition
- [ ] Click tab → Verify smooth tab switch
- [ ] Show loading spinner → Verify smooth rotation
- [ ] Expand SSO → Verify smooth accordion animation

### Spacing & Alignment
- [ ] Verify consistent spacing between form elements
- [ ] Verify buttons aligned properly
- [ ] Verify text centered in header
- [ ] Verify icons aligned in inputs

---

## ⚠️ ERROR SCENARIOS

### Network Errors
- [ ] Open DevTools, switch to Offline mode
- [ ] Try to login
- [ ] Verify error: "Login failed" with connection guidance
- [ ] Verify actionable recovery message

### API Errors
- [ ] (If possible) Mock 500 server error
- [ ] Verify generic error message
- [ ] Verify no sensitive data leaked

### Timeout
- [ ] (If possible) Mock slow API (>30s)
- [ ] Verify timeout message appears
- [ ] Verify retry guidance

---

## 📝 EDGE CASES

### Very Long Input
- [ ] Enter 100-character email
- [ ] Verify input handles gracefully (scrolls or truncates)
- [ ] Verify no layout break

### Special Characters
- [ ] Enter password with special chars: `P@ssw0rd!#$%^&*()`
- [ ] Verify accepted and masked correctly

### Copy/Paste OTP
- [ ] Copy "123456" to clipboard
- [ ] Paste into OTP field
- [ ] Verify only numeric characters accepted

### Rapid Tab Switching
- [ ] Rapidly switch between Password/OTP tabs
- [ ] Verify no UI glitches
- [ ] Verify form state resets

---

## ✅ FINAL CHECKLIST

- [ ] All password login tests passed
- [ ] All OTP login tests passed
- [ ] All SSO login tests passed
- [ ] All responsive tests passed (mobile, tablet, desktop)
- [ ] All dark mode tests passed
- [ ] All accessibility tests passed
- [ ] All browser compatibility tests passed
- [ ] All performance tests passed
- [ ] All security tests passed
- [ ] All navigation tests passed
- [ ] All visual polish verified
- [ ] All error scenarios handled
- [ ] All edge cases tested

---

## 🏆 SIGN-OFF

**Tester Name:** ______________________________  
**Date:** ______________________________  
**Result:** ☐ PASS  ☐ FAIL (explain below)  

**Notes/Issues Found:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Recommendation:** ☐ Approve for Release  ☐ Re-test Required

---

**Total Checklist Items:** 250+  
**Expected Pass Rate:** 100%  
**Estimated Time:** 2-3 hours for comprehensive manual testing

*Use this checklist in conjunction with automated test suites for complete validation coverage.*
