/**
 * Graceful Shutdown Handler (T211)
 *
 * Handles graceful shutdown of database connections, Redis, and other resources
 * when receiving SIGTERM or SIGINT signals.
 *
 * Features:
 * - Automatic registration of shutdown handlers
 * - Proper cleanup of database pool
 * - Proper cleanup of Redis connection
 * - Prevents new connections during shutdown
 * - Timeout protection for hanging connections
 * - Logging of shutdown progress
 */

import { closePool } from './db';
import { closeRedis } from './redis';
import { logger } from './logger';

/**
 * Shutdown state
 */
let isShuttingDown = false;
let shutdownHandlersRegistered = false;

/**
 * Timeout for graceful shutdown (30 seconds)
 */
const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10);

/**
 * Resource cleanup functions
 */
type CleanupFunction = () => Promise<void>;
const cleanupFunctions: Map<string, CleanupFunction> = new Map();

/**
 * Check if server is shutting down
 */
export function isShuttingDownNow(): boolean {
  return isShuttingDown;
}

/**
 * Alias for isShuttingDownNow (exported for better API)
 */
export { isShuttingDownNow as isShuttingDown };

/**
 * Register a cleanup function to be called during shutdown
 *
 * @param name - Unique identifier for the cleanup function
 * @param cleanup - Async function to execute during shutdown
 */
export function registerCleanup(name: string, cleanup: CleanupFunction): void {
  cleanupFunctions.set(name, cleanup);
  logger.debug(`Registered cleanup function: ${name}`);
}

/**
 * Unregister a cleanup function
 *
 * @param name - Name of the cleanup function to remove
 */
export function unregisterCleanup(name: string): void {
  cleanupFunctions.delete(name);
  logger.debug(`Unregistered cleanup function: ${name}`);
}

/**
 * Execute all cleanup functions
 */
async function executeCleanup(): Promise<void> {
  const cleanupPromises: Promise<void>[] = [];

  for (const [name, cleanup] of cleanupFunctions.entries()) {
    logger.info(`Executing cleanup: ${name}`);

    const cleanupPromise = cleanup()
      .then(() => {
        logger.info(`Cleanup completed: ${name}`);
      })
      .catch((error) => {
        logger.error(`Cleanup failed for ${name}:`, error);
      });

    cleanupPromises.push(cleanupPromise);
  }

  // Wait for all cleanup functions with timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      logger.warn(`Cleanup timeout reached (${SHUTDOWN_TIMEOUT}ms), forcing shutdown`);
      resolve();
    }, SHUTDOWN_TIMEOUT);
  });

  await Promise.race([
    Promise.all(cleanupPromises),
    timeoutPromise,
  ]);
}

/**
 * Perform graceful shutdown
 */
async function gracefulShutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown calls
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Execute registered cleanup functions
    await executeCleanup();

    // Close database pool
    logger.info('Closing database connection pool...');
    await closePool();

    // Close Redis connection
    logger.info('Closing Redis connection...');
    await closeRedis();

    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during graceful shutdown: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Register shutdown handlers for SIGTERM and SIGINT
 *
 * Call this function once during application startup
 */
export function registerShutdownHandlers(): void {
  // Prevent duplicate registration
  if (shutdownHandlersRegistered) {
    logger.warn('Shutdown handlers already registered');
    return;
  }

  // SIGTERM - Graceful shutdown (sent by Docker, K8s, systemd)
  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM');
  });

  // SIGINT - Ctrl+C in terminal
  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT');
  });

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message} - Stack: ${error.stack}`);
    gracefulShutdown('uncaughtException');
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
    gracefulShutdown('unhandledRejection');
  });

  shutdownHandlersRegistered = true;
  logger.info('Shutdown handlers registered');
}

/**
 * Middleware to reject requests during shutdown
 *
 * Usage in API routes:
 * ```typescript
 * if (isShuttingDownNow()) {
 *   return new Response('Service Unavailable', { status: 503 });
 * }
 * ```
 */
export function checkShutdownStatus(): boolean {
  return !isShuttingDown;
}

/**
 * Force immediate shutdown (for testing)
 *
 * @param exitCode - Exit code to use
 */
export function forceShutdown(exitCode: number = 0): void {
  logger.warn(`Forcing immediate shutdown with exit code ${exitCode}`);
  process.exit(exitCode);
}

// Register default cleanup functions
registerCleanup('database', async () => {
  await closePool();
});

registerCleanup('redis', async () => {
  await closeRedis();
});

export default {
  registerShutdownHandlers,
  registerCleanup,
  unregisterCleanup,
  isShuttingDown: isShuttingDownNow,
  checkShutdownStatus,
  forceShutdown,
};
