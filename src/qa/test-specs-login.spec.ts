/**
 * Login Module - Automated Test Specifications
 * 
 * This file contains comprehensive test cases for the Login module
 * aligned with Volume 12 QA standards.
 * 
 * Test Framework: Jest + React Testing Library
 * Coverage Target: 90%+
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Login from '../app/pages/Login';

expect.extend(toHaveNoViolations);

describe('Login Module - Comprehensive QA Suite', () => {
  
  // ========================================================================
  // 1. FUNCTIONAL VALIDATION
  // ========================================================================

  describe('Password Login Flow', () => {
    it('should successfully login with valid mobile and password', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '9876543210');
      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/logged in successfully/i)).toBeInTheDocument();
      });
    });

    it('should successfully login with valid email and password', async () => {
      render(<Login />);
      
      // Switch to email mode
      const emailTab = screen.getByRole('tab', { name: /email/i });
      await userEvent.click(emailTab);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/logged in successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid mobile number', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '123');
      await userEvent.click(submitButton);
      
      expect(await screen.findByText(/valid mobile number/i)).toBeInTheDocument();
    });

    it('should show error for invalid email', async () => {
      render(<Login />);
      
      const emailTab = screen.getByRole('tab', { name: /email/i });
      await userEvent.click(emailTab);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      
      expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    });

    it('should show error for invalid credentials', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '9876543210');
      await userEvent.type(passwordInput, 'WrongPassword');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should toggle password visibility', async () => {
      render(<Login />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      
      expect(passwordInput.type).toBe('password');
      
      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');
      
      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should clear identifier when switching login methods', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const emailTab = screen.getByRole('tab', { name: /email/i });
      await userEvent.click(emailTab);
      
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput.value).toBe('');
    });
  });

  describe('OTP Login Flow', () => {
    it('should send OTP via SMS successfully', async () => {
      render(<Login />);
      
      // Switch to OTP mode
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      // Select SMS delivery
      const smsButton = screen.getByRole('button', { name: /sms/i });
      await userEvent.click(smsButton);
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByText(/otp sent via sms/i)).toBeInTheDocument();
      });
    });

    it('should send OTP via WhatsApp successfully', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      // Select WhatsApp delivery
      const whatsappButton = screen.getByRole('button', { name: /whatsapp/i });
      await userEvent.click(whatsappButton);
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByText(/otp sent via whatsapp/i)).toBeInTheDocument();
      });
    });

    it('should show OTP countdown after sending', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument();
      });
    });

    it('should validate OTP input format', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument();
      });
      
      const otpInput = screen.getByLabelText(/enter otp/i);
      await userEvent.type(otpInput, '12'); // Too short
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      await userEvent.click(loginButton);
      
      expect(await screen.findByText(/6-digit otp/i)).toBeInTheDocument();
    });

    it('should only accept numeric input in OTP field', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument();
      });
      
      const otpInput = screen.getByLabelText(/enter otp/i) as HTMLInputElement;
      await userEvent.type(otpInput, 'abc123xyz');
      
      // Should only have numeric characters
      expect(otpInput.value).toBe('123');
    });

    it('should show error for invalid OTP', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument();
      });
      
      const otpInput = screen.getByLabelText(/enter otp/i);
      await userEvent.type(otpInput, '999999');
      
      const loginButton = screen.getByRole('button', { name: /log in/i });
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid otp/i)).toBeInTheDocument();
      });
    });
  });

  describe('SSO Login Flows', () => {
    it('should initiate DigiLocker login', async () => {
      render(<Login />);
      
      const digilockerButton = screen.getByRole('button', { name: /digilocker login/i });
      await userEvent.click(digilockerButton);
      
      // Should attempt SSO redirect or show config warning
      await waitFor(() => {
        expect(
          screen.getByText(/digilocker/i)
        ).toBeInTheDocument();
      });
    });

    it('should initiate Aadhaar OTP flow', async () => {
      render(<Login />);
      
      const aadhaarButton = screen.getByRole('button', { name: /aadhaar otp/i });
      await userEvent.click(aadhaarButton);
      
      // Should navigate to Aadhaar OTP page
      expect(window.location.href).toContain('/auth/aadhaar-otp');
    });

    it('should show more SSO options when expanded', async () => {
      render(<Login />);
      
      const moreOptionsButton = screen.getByRole('button', { name: /more login options/i });
      
      // Google and Microsoft should be hidden initially
      expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
      
      await userEvent.click(moreOptionsButton);
      
      // Now they should be visible
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument();
    });

    it('should collapse SSO options when clicked again', async () => {
      render(<Login />);
      
      const moreOptionsButton = screen.getByRole('button', { name: /more login options/i });
      await userEvent.click(moreOptionsButton);
      
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      
      await userEvent.click(moreOptionsButton);
      
      expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    });
  });

  describe('Returning User Experience', () => {
    beforeEach(() => {
      localStorage.setItem('lastLoginIdentifier', '9876543210');
      localStorage.setItem('lastLoginName', 'Test User');
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should show "Continue as" option for returning users', () => {
      render(<Login />);
      
      expect(screen.getByText(/continue as test user/i)).toBeInTheDocument();
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });

    it('should populate identifier when "Continue as" is clicked', async () => {
      render(<Login />);
      
      const continueButton = screen.getByRole('button', { name: /continue as test user/i });
      await userEvent.click(continueButton);
      
      const mobileInput = screen.getByLabelText(/mobile number/i) as HTMLInputElement;
      expect(mobileInput.value).toBe('9876543210');
    });
  });

  // ========================================================================
  // 2. ACCESSIBILITY VALIDATION (WCAG 2.1 AA)
  // ========================================================================

  describe('Accessibility - WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Login />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label associations', () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      expect(mobileInput).toHaveAttribute('id');
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('id');
    });

    it('should have ARIA attributes on form controls', () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      expect(mobileInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should announce errors to screen readers', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '123');
      await userEvent.click(submitButton);
      
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should have proper tab order', async () => {
      render(<Login />);
      
      const user = userEvent.setup();
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('tab', { name: /password/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('tab', { name: /otp/i })).toHaveFocus();
    });

    it('should have visible focus indicators', async () => {
      render(<Login />);
      
      const submitButton = screen.getByRole('button', { name: /log in/i });
      submitButton.focus();
      
      expect(submitButton).toHaveClass(/focus:ring-2/);
    });

    it('should have ARIA labels on icon buttons', () => {
      render(<Login />);
      
      const togglePasswordButton = screen.getByRole('button', { name: /show password/i });
      expect(togglePasswordButton).toHaveAttribute('aria-label');
    });

    it('should have role="tab" on mode toggles', () => {
      render(<Login />);
      
      const passwordTab = screen.getByRole('tab', { name: /password/i });
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      
      expect(passwordTab).toHaveAttribute('aria-selected');
      expect(otpTab).toHaveAttribute('aria-selected');
    });

    it('should have aria-expanded on progressive disclosure', async () => {
      render(<Login />);
      
      const moreOptionsButton = screen.getByRole('button', { name: /more login options/i });
      expect(moreOptionsButton).toHaveAttribute('aria-expanded', 'false');
      
      await userEvent.click(moreOptionsButton);
      expect(moreOptionsButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ========================================================================
  // 3. RESPONSIVE & LAYOUT VALIDATION
  // ========================================================================

  describe('Responsive Layout', () => {
    it('should render correctly on mobile viewport (375px)', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<Login />);
      
      const loginCard = screen.getByRole('form');
      expect(loginCard).toBeInTheDocument();
      
      // Should be full width with padding
      const container = loginCard.parentElement;
      expect(container).toHaveClass(/max-w-md/);
    });

    it('should render correctly on tablet viewport (768px)', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      
      render(<Login />);
      
      const loginCard = screen.getByRole('form');
      expect(loginCard).toBeInTheDocument();
    });

    it('should render correctly on desktop viewport (1920px)', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      
      render(<Login />);
      
      const loginCard = screen.getByRole('form');
      expect(loginCard).toBeInTheDocument();
      
      // Should be centered with max-width constraint
      const container = loginCard.parentElement;
      expect(container).toHaveClass(/max-w-md/);
    });

    it('should have touch-friendly targets on mobile (min 48px)', () => {
      global.innerWidth = 375;
      render(<Login />);
      
      const submitButton = screen.getByRole('button', { name: /log in/i });
      expect(submitButton).toHaveClass(/min-h-\[48px\]/);
    });
  });

  // ========================================================================
  // 4. DARK MODE & THEME VALIDATION
  // ========================================================================

  describe('Dark Mode Support', () => {
    it('should render in dark mode without errors', () => {
      document.documentElement.classList.add('dark');
      
      render(<Login />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      
      document.documentElement.classList.remove('dark');
    });

    it('should maintain contrast in dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<Login />);
      
      const loginCard = screen.getByRole('form').parentElement;
      expect(loginCard).toHaveClass(/bg-card/);
      
      document.documentElement.classList.remove('dark');
    });
  });

  // ========================================================================
  // 5. PERFORMANCE & RELIABILITY
  // ========================================================================

  describe('Performance & Loading States', () => {
    it('should show loading state during login', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '9876543210');
      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.click(submitButton);
      
      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should prevent double submission', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '9876543210');
      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.click(submitButton);
      await userEvent.click(submitButton); // Second click should be ignored
      
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during OTP send', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      expect(screen.getByText(/sending otp/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // 6. ERROR HANDLING & RECOVERY
  // ========================================================================

  describe('Error Handling', () => {
    it('should show network error with recovery guidance', async () => {
      // Mock network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await userEvent.type(mobileInput, '9876543210');
      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      render(<Login />);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      // Trigger validation error
      await userEvent.type(mobileInput, '123');
      await userEvent.click(submitButton);
      
      expect(await screen.findByText(/valid mobile number/i)).toBeInTheDocument();
      
      // Start typing again
      await userEvent.clear(mobileInput);
      await userEvent.type(mobileInput, '9876543210');
      
      expect(screen.queryByText(/valid mobile number/i)).not.toBeInTheDocument();
    });

    it('should link to help center for login issues', () => {
      render(<Login />);
      
      const helpLink = screen.getByRole('link', { name: /get help/i });
      expect(helpLink).toHaveAttribute('href', '/help-center');
    });
  });

  // ========================================================================
  // 7. SECURITY & PRIVACY
  // ========================================================================

  describe('Security Features', () => {
    it('should mask password by default', () => {
      render(<Login />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should mask identifier in OTP confirmation messages', async () => {
      render(<Login />);
      
      const otpTab = screen.getByRole('tab', { name: /otp/i });
      await userEvent.click(otpTab);
      
      const mobileInput = screen.getByLabelText(/mobile number/i);
      await userEvent.type(mobileInput, '9876543210');
      
      const sendOtpButton = screen.getByRole('button', { name: /send otp/i });
      await userEvent.click(sendOtpButton);
      
      await waitFor(() => {
        expect(screen.getByText(/\*\*\*\*\*\*3210/)).toBeInTheDocument();
      });
    });

    it('should not expose sensitive data in DOM', () => {
      render(<Login />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(passwordInput, 'SecretPassword123!');
      
      // Password should not be visible in DOM as plain text
      expect(screen.queryByText('SecretPassword123!')).not.toBeInTheDocument();
    });
  });
});
