import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../app/context/ThemeContext';
import { LanguageProvider } from '../app/context/LanguageContext';
import { AccessibilityProvider } from '../app/context/AccessibilityContext';
import { AppProvider } from '../app/context/AppContext';

/**
 * Custom render function that wraps components with all providers
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <AppProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </AppProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock user for authenticated tests
 */
export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  mobile: '+91 98765 43210',
  role: 'citizen' as const,
  aadhaar: '1234 5678 9012',
};

/**
 * Mock admin user
 */
export const mockAdminUser = {
  ...mockUser,
  id: 'admin-user-1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
};

/**
 * Mock officer user
 */
export const mockOfficerUser = {
  ...mockUser,
  id: 'officer-user-1',
  name: 'Officer User',
  email: 'officer@example.com',
  role: 'officer' as const,
};

/**
 * Wait for async operations
 */
export const waitFor = async (callback: () => void, timeout = 1000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  callback();
};
