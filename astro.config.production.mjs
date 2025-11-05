// @ts-check
/**
 * Production Astro Configuration
 *
 * Optimized build configuration for production deployment with:
 * - Asset minification
 * - Code splitting
 * - Tree shaking
 * - Bundle optimization
 *
 * Part of T144: Minify and bundle assets for production
 */

import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// Production-optimized Astro configuration
export default defineConfig({
  site: 'https://mystic-ecom.pages.dev',
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  server: {
    port: 4321,
    host: true,
  },

  // Build optimization
  build: {
    // Inline small assets (< 4KB) as base64
    inlineStylesheets: 'auto',

    // Asset naming with content hash for cache busting
    assets: '_astro',
  },

  // Vite build optimizations
  vite: {
    build: {
      // Minification
      minify: 'esbuild',
      cssMinify: true,

      // Code splitting
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // Separate large libraries
              if (id.includes('stripe')) return 'vendor-stripe';
              if (id.includes('redis')) return 'vendor-redis';
              if (id.includes('pg')) return 'vendor-pg';

              // Other vendor code
              return 'vendor';
            }

            // Component chunks
            if (id.includes('/components/')) {
              return 'components';
            }

            // Lib chunks
            if (id.includes('/lib/')) {
              return 'lib';
            }
          },

          // Asset naming with hash
          entryFileNames: '_astro/[name].[hash].js',
          chunkFileNames: '_astro/[name].[hash].js',
          assetFileNames: '_astro/[name].[hash][extname]',
        },
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 500, // 500 KB

      // Source maps (disable in production for smaller bundles)
      sourcemap: false,

      // Target modern browsers
      target: 'es2020',

      // Enable tree shaking
      cssCodeSplit: true,
    },

    // Optimization
    optimizeDeps: {
      include: [
        'stripe',
        'redis',
        'pg',
        'bcrypt',
        'cookie',
      ],
    },

    // SSR externals
    ssr: {
      external: ['@redis/client', 'redis'],
      noExternal: ['stripe'],
    },

    // Performance optimizations
    server: {
      fs: {
        strict: false,
      },
    },
  },

  // Compression (handled by Cloudflare Pages)
  compressHTML: true,
});
