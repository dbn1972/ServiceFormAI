# 🧪 Testing Guide
**ServiceFormAI OS - Complete Testing Documentation**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Running Tests](#running-tests)
3. [Writing Tests](#writing-tests)
4. [Test Coverage](#test-coverage)
5. [CI/CD Integration](#cicd-integration)
6. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

This will install all testing dependencies:
- Vitest (unit testing)
- React Testing Library
- Playwright (E2E testing)
- ESLint & Prettier

### Run Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

---

## 🧪 Running Tests

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/app/context/__tests__/ThemeContext.test.tsx

# Run tests matching pattern
pnpm test Navigation

# Watch mode (re-run on changes)
pnpm test -- --watch

# Run with coverage
pnpm test:coverage

# Open coverage report
open coverage/index.html
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e e2e/auth.spec.ts

# Run in headed mode (see browser)
pnpm test:e2e -- --headed

# Run specific browser
pnpm test:e2e -- --project=chromium

# Run with UI mode
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e -- --debug
```

---

## ✍️ Writing Tests

### Unit Tests

#### Testing Contexts

```typescript
// src/app/context/__tests__/ThemeContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

it('should update theme', () => {
  const { result } = renderHook(() => useTheme(), {
    wrapper: ThemeProvider,
  });

  act(() => {
    result.current.setTheme('dark');
  });

  expect(result.current.theme).toBe('dark');
});
```

#### Testing Components

```typescript
// src/app/components/__tests__/Navigation.test.tsx
import { screen } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import Navigation from '../Navigation';

it('should render navigation', () => {
  render(<Navigation />);
  
  expect(screen.getByText('ServiceFormAI OS')).toBeInTheDocument();
});
```

#### Testing Hooks

```typescript
// src/app/hooks/__tests__/useFocusTrap.test.tsx
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

it('should return a ref', () => {
  const { result } = renderHook(() => useFocusTrap(false));
  
  expect(result.current.current).toBeNull();
});
```

### E2E Tests

```typescript
// e2e/landing.spec.ts
import { test, expect } from '@playwright/test';

test('should load landing page', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.getByRole('heading', { name: /government services/i })).toBeVisible();
});
```

---

## 📊 Test Coverage

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

### View Coverage Report

```bash
# Generate coverage
pnpm test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Badges

Coverage reports are uploaded to Codecov in CI/CD.

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Located in `.github/workflows/ci.yml`

**On Every PR:**
- ✅ Run ESLint
- ✅ Run TypeScript type check
- ✅ Run unit tests with coverage
- ✅ Run E2E tests
- ✅ Build application
- ✅ Security audit

**On Main Branch:**
- ✅ All of the above
- ✅ Deploy to staging

### Pre-commit Hooks

Configured with Husky and lint-staged.

**Before each commit:**
- Run ESLint on staged files
- Run Prettier on staged files
- Run related tests

Setup:
```bash
pnpm prepare
```

---

## 💡 Best Practices

### 1. Test Structure

Use **Arrange-Act-Assert** pattern:

```typescript
it('should update theme', () => {
  // Arrange
  const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
  
  // Act
  act(() => {
    result.current.setTheme('dark');
  });
  
  // Assert
  expect(result.current.theme).toBe('dark');
});
```

### 2. Test Naming

Use descriptive names:

```typescript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should update theme when setTheme is called', () => {});
```

### 3. Test One Thing

Each test should verify one behavior:

```typescript
// ❌ Bad
it('should work', () => {
  expect(theme).toBe('dark');
  expect(language).toBe('en');
  expect(user).toBeTruthy();
});

// ✅ Good
it('should set theme to dark', () => {
  expect(theme).toBe('dark');
});

it('should set language to English', () => {
  expect(language).toBe('en');
});
```

### 4. Use Test Utilities

Use custom render with all providers:

```typescript
import { render } from '../../../test/test-utils';

// This automatically wraps with ThemeProvider, LanguageProvider, etc.
render(<MyComponent />);
```

### 5. Mock External Dependencies

```typescript
import { vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;
```

### 6. Test Accessibility

```typescript
it('should be keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  
  const focusedElement = await page.evaluateHandle(() => document.activeElement);
  expect(focusedElement).toBeTruthy();
});
```

### 7. Clean Up

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

---

## 📁 Test File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── Navigation.tsx
│   │   └── __tests__/
│   │       └── Navigation.test.tsx
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   └── __tests__/
│   │       └── ThemeContext.test.tsx
│   └── hooks/
│       ├── useFocusTrap.ts
│       └── __tests__/
│           └── useFocusTrap.test.tsx
└── test/
    ├── setup.ts
    └── test-utils.tsx

e2e/
├── landing.spec.ts
├── auth.spec.ts
└── accessibility.spec.ts
```

---

## 🎯 Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Contexts | 100% | 80%+ |
| Hooks | 100% | 80%+ |
| Components | 15% | 80%+ |
| Pages | 0% | 70%+ |
| Services | 0% | 80%+ |
| Overall | 12% | 80%+ |

---

## 🔧 Configuration Files

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `src/test/setup.ts` - Test setup and mocks
- `src/test/test-utils.tsx` - Custom render utilities
- `.lintstagedrc.json` - Pre-commit checks

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🐛 Troubleshooting

### Tests Failing in CI but Passing Locally

- Check Node.js version matches CI (20.x)
- Clear `node_modules` and reinstall
- Check for race conditions in async tests

### E2E Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Use `page.waitForLoadState()` for dynamic content

### Coverage Not Generated

- Ensure `@vitest/coverage-v8` is installed
- Check `vitest.config.ts` coverage configuration
- Run `pnpm test:coverage` not just `pnpm test`

---

*For questions, contact: qa@serviceformai.gov.in*
