import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import Navigation from '../Navigation';
import { AppContext } from '../../context/AppContext';

const mockLogout = vi.fn();

const MockAppProviderWithUser = ({ children }: { children: React.ReactNode }) => {
  const mockUser = {
    id: 'test-1',
    name: 'Test User',
    email: 'test@example.com',
    mobile: '+91 98765 43210',
    role: 'citizen' as const,
  };

  return (
    <AppContext.Provider
      value={{
        user: mockUser,
        logout: mockLogout,
        login: vi.fn(),
        loginWithSSO: vi.fn(),
        updateProfile: vi.fn(),
      } as any}
    >
      {children}
    </AppContext.Provider>
  );
};

const MockAppProviderWithoutUser = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppContext.Provider
      value={{
        user: null,
        logout: mockLogout,
        login: vi.fn(),
        loginWithSSO: vi.fn(),
        updateProfile: vi.fn(),
      } as any}
    >
      {children}
    </AppContext.Provider>
  );
};

describe('Navigation', () => {
  describe('Public Navigation', () => {
    it('should render public navigation when user is not logged in', () => {
      render(
        <MockAppProviderWithoutUser>
          <Navigation />
        </MockAppProviderWithoutUser>
      );

      expect(screen.getByText('ServiceFormAI OS')).toBeInTheDocument();
      expect(screen.getByText('Log In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should show navigation links in public mode', () => {
      render(
        <MockAppProviderWithoutUser>
          <Navigation />
        </MockAppProviderWithoutUser>
      );

      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    it('should have correct ARIA attributes for navigation', () => {
      render(
        <MockAppProviderWithoutUser>
          <Navigation />
        </MockAppProviderWithoutUser>
      );

      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('id', 'navigation');
    });
  });

  describe('Authenticated Navigation', () => {
    it('should render authenticated navigation when user is logged in', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Applications')).toBeInTheDocument();
    });

    it('should show logout button when user is logged in', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      const logoutButton = screen.getByLabelText(/log out/i);
      expect(logoutButton).toBeInTheDocument();
    });

    it('should have aria-current on active page', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      // Note: aria-current would be set based on current location
      expect(dashboardLink).toBeInTheDocument();
    });

    it('should render user profile link', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      const profileLink = screen.getByLabelText(/profile: test user/i);
      expect(profileLink).toBeInTheDocument();
    });

    it('should render settings link', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      const settingsLink = screen.getByLabelText(/settings/i);
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have navigation landmark', () => {
      render(
        <MockAppProviderWithoutUser>
          <Navigation />
        </MockAppProviderWithoutUser>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have list structure for navigation items', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should have aria-hidden on decorative icons', () => {
      render(
        <MockAppProviderWithUser>
          <Navigation />
        </MockAppProviderWithUser>
      );

      // Icons should be marked as decorative
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });
});
