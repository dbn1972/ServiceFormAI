import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Exclude backend Jest specs — they must be run with `cd backend && pnpm test`
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'backend/**',       // all backend Jest specs
      'e2e/**',           // Playwright specs — run with `npx playwright test`
      'src/qa/**',        // QA Playwright specs
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'backend/',
        'e2e/',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@serviceformai/form-engine-react': path.resolve(__dirname, './packages/form-engine-react/src/index.ts'),
      '@serviceformai/service-manifest': path.resolve(__dirname, './packages/service-manifest/src/index.ts'),
      '@serviceformai/form-engine-core': path.resolve(__dirname, './packages/form-engine-core/src/index.ts'),
      '@serviceformai/validation-engine': path.resolve(__dirname, './packages/validation-engine/src/index.ts'),
    },
  },
});
