// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sentryIntegration from './src/integrations/sentry';

// Cloudflare Pages Configuration
// https://astro.build/config
export default defineConfig({
  // Use environment variable for site URL, fallback to localhost for development
  site: process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:4321',
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    // Cloudflare Workers runtime configuration
    runtime: {
      mode: 'local',
      type: 'pages',
    },
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false, // Keep our custom global.css
    }),
    sentryIntegration(),
  ],
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    ssr: {
      external: ['@redis/client', 'redis'],
    },
    define: {
      // Make environment variables available at build time
      'process.env.PUBLIC_SITE_URL': JSON.stringify(process.env.PUBLIC_SITE_URL),
    },
  },
});
