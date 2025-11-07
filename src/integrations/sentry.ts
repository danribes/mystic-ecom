/**
 * Sentry Astro Integration
 *
 * Initializes Sentry for error tracking in Astro applications
 */

import type { AstroIntegration } from 'astro';
import { initSentry } from '../lib/sentry';

export default function sentryIntegration(): AstroIntegration {
  return {
    name: 'sentry',
    hooks: {
      'astro:config:setup': () => {
        // Initialize Sentry when Astro starts
        initSentry();
      },
      'astro:server:start': () => {
        console.log('Sentry integration: Server started');
      },
    },
  };
}
