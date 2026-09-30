import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, User, Settings as SettingsIcon, LogOut, Search, ClipboardCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { useAnnouncer } from '../hooks/useAnnouncer';

export default function Navigation() {
  const { user, logout } = useApp();
  const location = useLocation();
  const { announce } = useAnnouncer();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    announce('You have been logged out', 'polite');
  };

  if (!user) {
    // Public navigation
    return (
      <nav
        className="border-b border-border bg-card sticky top-0 z-40"
        aria-label="Main navigation"
        id="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="ServiceFormAI OS Home"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-semibold">ServiceFormAI OS</span>
            </Link>

            <ul className="flex items-center gap-4" role="list">
              <li>
                <Link
                  to="/features"
                  className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline"
                >
                  Help
                </Link>
              </li>
              <li>
                <ThemeToggle />
              </li>
              <li>
                <LanguageSelector />
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  Log In
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated navigation
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/services', icon: Search, label: 'Services' },
    { path: '/applications', icon: FileText, label: 'Applications' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    ...(user.role === 'admin' || user.role === 'officer' || user.role === 'reviewer'
      ? [{ path: '/producer/redress', icon: ClipboardCheck, label: 'Redress' }]
      : []),
  ];

  return (
    <nav
      className="border-b border-border bg-card sticky top-0 z-40"
      aria-label="Main navigation"
      id="navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/dashboard"
            className="flex items-center gap-3"
            aria-label="ServiceFormAI OS Dashboard"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold hidden sm:inline">ServiceFormAI OS</span>
          </Link>

          <ul className="flex items-center gap-6" role="list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      active
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}

            <li className="h-6 w-px bg-border hidden sm:block" aria-hidden="true" />

            <li>
              <ThemeToggle />
            </li>
            <li>
              <LanguageSelector />
            </li>

            <li>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Profile: ${user.name}`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span className="hidden md:inline">{user.name}</span>
              </Link>
            </li>

            <li>
              <Link
                to="/settings"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </li>

            <li>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Log Out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
