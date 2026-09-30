import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'ServiceFormAI OS',
        short_name: 'ServiceForm',
        description: 'Government service forms — available offline',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#1a56db',
        background_color: '#ffffff',
        lang: 'en',
        dir: 'auto',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Resolve the validation engine to its source for bundling
      '@serviceformai/validation-engine': path.resolve(__dirname, './packages/validation-engine/src/index.ts'),
      // Resolve the form engine packages to their source for bundling
      '@serviceformai/form-engine-core': path.resolve(__dirname, './packages/form-engine-core/src/index.ts'),
      '@serviceformai/form-engine-react': path.resolve(__dirname, './packages/form-engine-react/src/index.ts'),
      '@serviceformai/service-manifest': path.resolve(__dirname, './packages/service-manifest/src/index.ts'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
