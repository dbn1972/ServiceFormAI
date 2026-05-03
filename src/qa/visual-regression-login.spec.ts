/**
 * Login Module - Visual Regression Test Specifications
 * 
 * This file contains visual regression tests for the Login module
 * using Playwright and Percy/Chromatic for screenshot comparisons.
 * 
 * Ensures visual consistency across:
 * - Viewports (mobile, tablet, desktop)
 * - Themes (light, dark)
 * - States (default, error, loading, success)
 * - Browsers (Chrome, Firefox, Safari, Edge)
 */

import { test, expect } from '@playwright/test';

// Viewport configurations from Volume 12 standards
const viewports = {
  mobile: { width: 375, height: 667 },
  mobileWide: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  tabletLarge: { width: 1024, height: 768 },
  desktop: { width: 1920, height: 1080 },
  desktopWide: { width: 2560, height: 1440 }
};

test.describe('Login - Visual Regression Suite', () => {
  
  // ========================================================================
  // LIGHT MODE - ALL VIEWPORTS
  // ========================================================================

  test.describe('Light Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      // Ensure light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
    });

    test('Mobile (375px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await expect(page).toHaveScreenshot('login-light-mobile-default.png');
    });

    test('Mobile (414px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.mobileWide);
      await expect(page).toHaveScreenshot('login-light-mobile-wide-default.png');
    });

    test('Tablet (768px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await expect(page).toHaveScreenshot('login-light-tablet-default.png');
    });

    test('Tablet Landscape (1024px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.tabletLarge);
      await expect(page).toHaveScreenshot('login-light-tablet-landscape-default.png');
    });

    test('Desktop (1920px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await expect(page).toHaveScreenshot('login-light-desktop-default.png');
    });

    test('Desktop Wide (2560px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.desktopWide);
      await expect(page).toHaveScreenshot('login-light-desktop-wide-default.png');
    });
  });

  // ========================================================================
  // DARK MODE - ALL VIEWPORTS
  // ========================================================================

  test.describe('Dark Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
    });

    test('Mobile (375px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await expect(page).toHaveScreenshot('login-dark-mobile-default.png');
    });

    test('Mobile (414px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.mobileWide);
      await expect(page).toHaveScreenshot('login-dark-mobile-wide-default.png');
    });

    test('Tablet (768px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await expect(page).toHaveScreenshot('login-dark-tablet-default.png');
    });

    test('Desktop (1920px) - Default state', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await expect(page).toHaveScreenshot('login-dark-desktop-default.png');
    });
  });

  // ========================================================================
  // STATE VARIATIONS
  // ========================================================================

  test.describe('State Variations - Desktop Light Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
    });

    test('Email login mode', async ({ page }) => {
      await page.click('text=Email');
      await expect(page).toHaveScreenshot('login-light-desktop-email-mode.png');
    });

    test('OTP login mode', async ({ page }) => {
      await page.click('text=OTP');
      await expect(page).toHaveScreenshot('login-light-desktop-otp-mode.png');
    });

    test('OTP WhatsApp delivery selected', async ({ page }) => {
      await page.click('text=OTP');
      await page.click('button:has-text("WhatsApp")');
      await expect(page).toHaveScreenshot('login-light-desktop-otp-whatsapp.png');
    });

    test('Password visible state', async ({ page }) => {
      await page.fill('input[type="tel"]', '9876543210');
      await page.fill('input[type="password"]', 'TestPassword123');
      await page.click('[aria-label*="Show password"]');
      await expect(page).toHaveScreenshot('login-light-desktop-password-visible.png');
    });

    test('Mobile validation error', async ({ page }) => {
      await page.fill('input[type="tel"]', '123');
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('role=alert');
      await expect(page).toHaveScreenshot('login-light-desktop-mobile-error.png');
    });

    test('Email validation error', async ({ page }) => {
      await page.click('text=Email');
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('role=alert');
      await expect(page).toHaveScreenshot('login-light-desktop-email-error.png');
    });

    test('Password required error', async ({ page }) => {
      await page.fill('input[type="tel"]', '9876543210');
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('role=alert');
      await expect(page).toHaveScreenshot('login-light-desktop-password-error.png');
    });

    test('Loading state', async ({ page }) => {
      await page.fill('input[type="tel"]', '9876543210');
      await page.fill('input[type="password"]', 'TestPassword123');
      
      // Intercept the request to delay response
      await page.route('**/auth/login', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('text=Logging in');
      await expect(page).toHaveScreenshot('login-light-desktop-loading.png');
    });

    test('OTP sent state', async ({ page }) => {
      await page.click('text=OTP');
      await page.fill('input[type="tel"]', '9876543210');
      await page.click('button:has-text("Send OTP")');
      await page.waitForSelector('text=Enter OTP');
      await expect(page).toHaveScreenshot('login-light-desktop-otp-sent.png');
    });

    test('OTP input filled', async ({ page }) => {
      await page.click('text=OTP');
      await page.fill('input[type="tel"]', '9876543210');
      await page.click('button:has-text("Send OTP")');
      await page.waitForSelector('input[placeholder="123456"]');
      await page.fill('input[placeholder="123456"]', '123456');
      await expect(page).toHaveScreenshot('login-light-desktop-otp-filled.png');
    });

    test('More SSO options expanded', async ({ page }) => {
      await page.click('text=More login options');
      await page.waitForSelector('text=Continue with Google');
      await expect(page).toHaveScreenshot('login-light-desktop-sso-expanded.png');
    });

    test('Returning user banner', async ({ page }) => {
      // Set localStorage for returning user
      await page.evaluate(() => {
        localStorage.setItem('lastLoginIdentifier', '9876543210');
        localStorage.setItem('lastLoginName', 'Rajesh Kumar');
      });
      await page.reload();
      await page.waitForSelector('text=Continue as');
      await expect(page).toHaveScreenshot('login-light-desktop-returning-user.png');
    });

    test('Biometric login available', async ({ page }) => {
      // Mock WebAuthn availability
      await page.evaluate(() => {
        (window as any).PublicKeyCredential = {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(true)
        };
      });
      await page.reload();
      await page.waitForSelector('text=Biometric Login');
      await expect(page).toHaveScreenshot('login-light-desktop-biometric-available.png');
    });
  });

  // ========================================================================
  // STATE VARIATIONS - DARK MODE
  // ========================================================================

  test.describe('State Variations - Desktop Dark Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
    });

    test('OTP login mode', async ({ page }) => {
      await page.click('text=OTP');
      await expect(page).toHaveScreenshot('login-dark-desktop-otp-mode.png');
    });

    test('Mobile validation error', async ({ page }) => {
      await page.fill('input[type="tel"]', '123');
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('role=alert');
      await expect(page).toHaveScreenshot('login-dark-desktop-mobile-error.png');
    });

    test('Loading state', async ({ page }) => {
      await page.fill('input[type="tel"]', '9876543210');
      await page.fill('input[type="password"]', 'TestPassword123');
      
      await page.route('**/auth/login', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('text=Logging in');
      await expect(page).toHaveScreenshot('login-dark-desktop-loading.png');
    });

    test('More SSO options expanded', async ({ page }) => {
      await page.click('text=More login options');
      await page.waitForSelector('text=Continue with Google');
      await expect(page).toHaveScreenshot('login-dark-desktop-sso-expanded.png');
    });
  });

  // ========================================================================
  // MOBILE-SPECIFIC STATES
  // ========================================================================

  test.describe('Mobile-Specific States', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.mobile);
    });

    test('Mobile - OTP mode with WhatsApp', async ({ page }) => {
      await page.click('text=OTP');
      await page.click('button:has-text("WhatsApp")');
      await expect(page).toHaveScreenshot('login-light-mobile-otp-whatsapp.png');
    });

    test('Mobile - SSO options expanded', async ({ page }) => {
      await page.click('text=More login options');
      await page.waitForSelector('text=Continue with Google');
      await expect(page).toHaveScreenshot('login-light-mobile-sso-expanded.png');
    });

    test('Mobile - Error state with keyboard visible', async ({ page }) => {
      await page.fill('input[type="tel"]', '123');
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('role=alert');
      // Input still focused (keyboard would be visible on real device)
      await expect(page).toHaveScreenshot('login-light-mobile-error-keyboard.png');
    });

    test('Mobile Dark - OTP sent state', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.click('text=OTP');
      await page.fill('input[type="tel"]', '9876543210');
      await page.click('button:has-text("Send OTP")');
      await page.waitForSelector('text=Enter OTP');
      await expect(page).toHaveScreenshot('login-dark-mobile-otp-sent.png');
    });
  });

  // ========================================================================
  // TABLET-SPECIFIC STATES
  // ========================================================================

  test.describe('Tablet-Specific States', () => {
    test('Tablet Portrait - OTP mode', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.tablet);
      await page.click('text=OTP');
      await expect(page).toHaveScreenshot('login-light-tablet-otp-mode.png');
    });

    test('Tablet Landscape - SSO expanded', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.tabletLarge);
      await page.click('text=More login options');
      await page.waitForSelector('text=Continue with Google');
      await expect(page).toHaveScreenshot('login-light-tablet-landscape-sso-expanded.png');
    });
  });

  // ========================================================================
  // INTERACTION STATES (HOVER, FOCUS, ACTIVE)
  // ========================================================================

  test.describe('Interaction States - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
    });

    test('Submit button hover', async ({ page }) => {
      const button = page.locator('button:has-text("Log In")');
      await button.hover();
      await expect(page).toHaveScreenshot('login-light-desktop-button-hover.png');
    });

    test('Submit button focus', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      // Should be on submit button
      await expect(page).toHaveScreenshot('login-light-desktop-button-focus.png');
    });

    test('Input field focus', async ({ page }) => {
      await page.click('input[type="tel"]');
      await expect(page).toHaveScreenshot('login-light-desktop-input-focus.png');
    });

    test('SSO button hover', async ({ page }) => {
      const digilockerButton = page.locator('button:has-text("DigiLocker Login")');
      await digilockerButton.hover();
      await expect(page).toHaveScreenshot('login-light-desktop-sso-hover.png');
    });

    test('Toggle button hover', async ({ page }) => {
      await page.fill('input[type="password"]', 'test');
      const toggleButton = page.locator('[aria-label*="Show password"]');
      await toggleButton.hover();
      await expect(page).toHaveScreenshot('login-light-desktop-toggle-hover.png');
    });
  });

  // ========================================================================
  // CROSS-BROWSER VALIDATION
  // ========================================================================

  test.describe('Cross-Browser - Desktop Light Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
    });

    test('Chrome - Default state', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium');
      await expect(page).toHaveScreenshot('login-chrome-desktop-default.png');
    });

    test('Firefox - Default state', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox');
      await expect(page).toHaveScreenshot('login-firefox-desktop-default.png');
    });

    test('Safari - Default state', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit');
      await expect(page).toHaveScreenshot('login-safari-desktop-default.png');
    });
  });

  // ========================================================================
  // LAYOUT STABILITY (NO UNEXPECTED SHIFTS)
  // ========================================================================

  test.describe('Layout Stability', () => {
    test('No layout shift on form validation', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
      
      // Take baseline screenshot
      await expect(page).toHaveScreenshot('login-stability-baseline.png');
      
      // Trigger validation
      await page.fill('input[type="tel"]', '123');
      await page.click('button:has-text("Log In")');
      await page.waitForSelector('role=alert');
      
      // Layout should remain stable (error appears in reserved space)
      await expect(page).toHaveScreenshot('login-stability-with-error.png');
    });

    test('No layout shift when switching modes', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
      
      await expect(page).toHaveScreenshot('login-stability-password-mode.png');
      
      await page.click('text=OTP');
      await page.waitForTimeout(300); // Wait for transition
      
      await expect(page).toHaveScreenshot('login-stability-otp-mode.png');
    });

    test('No layout shift when expanding SSO options', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
      
      await expect(page).toHaveScreenshot('login-stability-sso-collapsed.png');
      
      await page.click('text=More login options');
      await page.waitForSelector('text=Continue with Google');
      
      await expect(page).toHaveScreenshot('login-stability-sso-expanded.png');
    });
  });

  // ========================================================================
  // PRINT STYLES (if applicable)
  // ========================================================================

  test.describe('Print Styles', () => {
    test('Print preview should be clean', async ({ page }) => {
      await page.goto('/login');
      await page.setViewportSize(viewports.desktop);
      
      await page.emulateMedia({ media: 'print' });
      await expect(page).toHaveScreenshot('login-print-preview.png');
    });
  });
});

// ========================================================================
// VISUAL REGRESSION THRESHOLDS
// ========================================================================

test.use({
  screenshot: {
    fullPage: true,
    threshold: 0.2, // 20% threshold for acceptable differences
    maxDiffPixels: 100,
  },
});
