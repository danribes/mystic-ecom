/**
 * Video Analytics Tracking Script (T190)
 *
 * Client-side script for automatically tracking video analytics.
 * Tracks views, watch progress, and completions.
 *
 * Features:
 * - Automatic session ID generation
 * - Periodic progress updates (every 15 seconds)
 * - Completion detection (90%+ watched)
 * - Play, pause, seek event tracking
 * - Network-aware batching
 * - Offline queue with retry
 *
 * Usage:
 * Import and initialize in VideoPlayer component or course page.
 */

import { logger } from '../lib/logger';

// ============================================================================
// Types
// ============================================================================

interface VideoAnalyticsConfig {
  videoId: string;
  courseId: string;
  videoDuration: number;
  lessonId?: string;
  isPreview?: boolean;
  updateInterval?: number; // Seconds between progress updates (default: 15)
  completionThreshold?: number; // % watched to mark as complete (default: 90)
}

interface VideoSession {
  sessionId: string;
  videoId: string;
  courseId: string;
  startTime: number;
  lastUpdateTime: number;
  currentPosition: number;
  watchTime: number;
  playCount: number;
  pauseCount: number;
  seekCount: number;
  totalPlaybackSpeed: number; // For calculating average
  speedChangeCount: number;
  qualityChanges: number;
  isTracked: boolean;
  isCompleted: boolean;
}

// ============================================================================
// Session Management
// ============================================================================

const sessions: Map<string, VideoSession> = new Map();
const updateIntervals: Map<string, number> = new Map();

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create session for video
 */
function getSession(videoId: string): VideoSession | null {
  return sessions.get(videoId) || null;
}

/**
 * Create new session
 */
function createSession(config: VideoAnalyticsConfig): VideoSession {
  const sessionId = generateSessionId();

  const session: VideoSession = {
    sessionId,
    videoId: config.videoId,
    courseId: config.courseId,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    currentPosition: 0,
    watchTime: 0,
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    totalPlaybackSpeed: 1.0,
    speedChangeCount: 1,
    qualityChanges: 0,
    isTracked: false,
    isCompleted: false,
  };

  sessions.set(config.videoId, session);

  return session;
}

/**
 * Clear session
 */
function clearSession(videoId: string): void {
  // Clear update interval
  const intervalId = updateIntervals.get(videoId);
  if (intervalId) {
    clearInterval(intervalId);
    updateIntervals.delete(videoId);
  }

  // Remove session
  sessions.delete(videoId);
}

// ============================================================================
// API Calls
// ============================================================================

/**
 * Track video view (session start)
 */
async function trackView(config: VideoAnalyticsConfig, session: VideoSession): Promise<void> {
  try {
    const response = await fetch('/api/analytics/video-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: config.videoId,
        course_id: config.courseId,
        session_id: session.sessionId,
        video_duration_seconds: Math.floor(config.videoDuration),
        lesson_id: config.lessonId,
        is_preview: config.isPreview || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to track video view: ${response.statusText}`);
    }

    session.isTracked = true;
    logger.debug(`Video view tracked: ${config.videoId}`);
  } catch (error) {
    logger.error('Error tracking video view:', error);
    // Queue for retry
    queueForRetry('view', config, session);
  }
}

/**
 * Track video progress
 */
async function trackProgress(config: VideoAnalyticsConfig, session: VideoSession): Promise<void> {
  try {
    const avgPlaybackSpeed = session.totalPlaybackSpeed / session.speedChangeCount;

    const response = await fetch('/api/analytics/video-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: session.sessionId,
        current_position_seconds: Math.floor(session.currentPosition),
        watch_time_seconds: Math.floor(session.watchTime),
        play_count: session.playCount,
        pause_count: session.pauseCount,
        seek_count: session.seekCount,
        average_playback_speed: parseFloat(avgPlaybackSpeed.toFixed(2)),
        quality_changes: session.qualityChanges,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to track video progress: ${response.statusText}`);
    }

    session.lastUpdateTime = Date.now();
    logger.debug(`Video progress tracked: ${config.videoId}, position: ${session.currentPosition}s`);
  } catch (error) {
    logger.error('Error tracking video progress:', error);
    // Queue for retry
    queueForRetry('progress', config, session);
  }
}

/**
 * Track video completion
 */
async function trackCompletion(config: VideoAnalyticsConfig, session: VideoSession): Promise<void> {
  if (session.isCompleted) {
    return; // Already tracked
  }

  try {
    const completionPercentage = (session.watchTime / config.videoDuration) * 100;

    const response = await fetch('/api/analytics/video-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: session.sessionId,
        watch_time_seconds: Math.floor(session.watchTime),
        completion_percentage: parseFloat(completionPercentage.toFixed(2)),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to track video completion: ${response.statusText}`);
    }

    session.isCompleted = true;
    logger.info(`Video completed: ${config.videoId}, ${completionPercentage.toFixed(2)}%`);

    // Dispatch completion event
    const event = new CustomEvent('videoanalyticscompletion', {
      detail: {
        videoId: config.videoId,
        courseId: config.courseId,
        completionPercentage,
      },
    });
    window.dispatchEvent(event);
  } catch (error) {
    logger.error('Error tracking video completion:', error);
    // Queue for retry
    queueForRetry('complete', config, session);
  }
}

// ============================================================================
// Retry Queue
// ============================================================================

interface RetryQueueItem {
  type: 'view' | 'progress' | 'complete';
  config: VideoAnalyticsConfig;
  session: VideoSession;
  attempts: number;
  nextRetryTime: number;
}

const retryQueue: RetryQueueItem[] = [];
let retryIntervalId: number | null = null;

/**
 * Queue failed request for retry
 */
function queueForRetry(
  type: 'view' | 'progress' | 'complete',
  config: VideoAnalyticsConfig,
  session: VideoSession
): void {
  retryQueue.push({
    type,
    config,
    session,
    attempts: 0,
    nextRetryTime: Date.now() + 5000, // Retry in 5 seconds
  });

  // Start retry processor if not running
  if (!retryIntervalId) {
    retryIntervalId = window.setInterval(processRetryQueue, 5000);
  }
}

/**
 * Process retry queue
 */
async function processRetryQueue(): Promise<void> {
  const now = Date.now();

  for (let i = retryQueue.length - 1; i >= 0; i--) {
    const item = retryQueue[i];

    if (now < item.nextRetryTime) {
      continue; // Not time to retry yet
    }

    try {
      // Retry the request
      if (item.type === 'view') {
        await trackView(item.config, item.session);
      } else if (item.type === 'progress') {
        await trackProgress(item.config, item.session);
      } else if (item.type === 'complete') {
        await trackCompletion(item.config, item.session);
      }

      // Success - remove from queue
      retryQueue.splice(i, 1);
      logger.debug(`Retry successful for ${item.type}`);
    } catch (error) {
      item.attempts++;

      if (item.attempts >= 3) {
        // Max retries reached - give up
        retryQueue.splice(i, 1);
        logger.warn(`Max retries reached for ${item.type}, giving up`);
      } else {
        // Schedule next retry with exponential backoff
        item.nextRetryTime = now + Math.pow(2, item.attempts) * 5000;
        logger.debug(`Retry ${item.attempts}/3 failed for ${item.type}, will retry in ${(item.nextRetryTime - now) / 1000}s`);
      }
    }
  }

  // Stop retry processor if queue is empty
  if (retryQueue.length === 0 && retryIntervalId) {
    clearInterval(retryIntervalId);
    retryIntervalId = null;
  }
}

// ============================================================================
// Video Event Tracking
// ============================================================================

/**
 * Initialize analytics tracking for a video
 */
export function initVideoAnalytics(
  videoElement: HTMLVideoElement | HTMLIFrameElement,
  config: VideoAnalyticsConfig
): () => void {
  // Create session
  const session = createSession(config);

  logger.debug(`Initialized video analytics: ${config.videoId}`);

  // Track initial view
  trackView(config, session);

  // Setup event listeners
  const cleanupFunctions: (() => void)[] = [];

  if (videoElement instanceof HTMLVideoElement) {
    // Native HTML5 video element
    setupNativeVideoTracking(videoElement, config, session, cleanupFunctions);
  } else {
    // Iframe (Cloudflare Stream)
    setupIframeVideoTracking(videoElement, config, session, cleanupFunctions);
  }

  // Setup periodic progress updates
  const updateInterval = (config.updateInterval || 15) * 1000;
  const intervalId = window.setInterval(() => {
    if (session.isTracked) {
      trackProgress(config, session);
    }
  }, updateInterval);

  updateIntervals.set(config.videoId, intervalId);

  // Cleanup function
  return () => {
    // Send final progress update
    if (session.isTracked) {
      trackProgress(config, session);
    }

    // Run all cleanup functions
    cleanupFunctions.forEach(fn => fn());

    // Clear session
    clearSession(config.videoId);

    logger.debug(`Cleaned up video analytics: ${config.videoId}`);
  };
}

/**
 * Setup tracking for native HTML5 video
 */
function setupNativeVideoTracking(
  video: HTMLVideoElement,
  config: VideoAnalyticsConfig,
  session: VideoSession,
  cleanupFunctions: (() => void)[]
): void {
  let lastPosition = 0;
  let lastUpdateTime = Date.now();

  // Play event
  const onPlay = () => {
    session.playCount++;
    lastUpdateTime = Date.now();
    logger.debug('Video play');
  };
  video.addEventListener('play', onPlay);
  cleanupFunctions.push(() => video.removeEventListener('play', onPlay));

  // Pause event
  const onPause = () => {
    session.pauseCount++;

    // Update watch time
    const now = Date.now();
    const elapsed = (now - lastUpdateTime) / 1000;
    session.watchTime += elapsed;

    logger.debug('Video pause');
  };
  video.addEventListener('pause', onPause);
  cleanupFunctions.push(() => video.removeEventListener('pause', onPause));

  // Time update event
  const onTimeUpdate = () => {
    const currentTime = video.currentTime;

    // Detect seek
    if (Math.abs(currentTime - lastPosition) > 2) {
      session.seekCount++;
      logger.debug('Video seek detected');
    }

    // Update position
    session.currentPosition = currentTime;
    lastPosition = currentTime;

    // Update watch time if playing
    if (!video.paused) {
      const now = Date.now();
      const elapsed = (now - lastUpdateTime) / 1000;
      session.watchTime += elapsed;
      lastUpdateTime = now;
    }

    // Check for completion
    const completionThreshold = config.completionThreshold || 90;
    const watchedPercentage = (currentTime / config.videoDuration) * 100;

    if (!session.isCompleted && watchedPercentage >= completionThreshold) {
      trackCompletion(config, session);
    }
  };
  video.addEventListener('timeupdate', onTimeUpdate);
  cleanupFunctions.push(() => video.removeEventListener('timeupdate', onTimeUpdate));

  // Playback rate change
  const onRateChange = () => {
    session.totalPlaybackSpeed += video.playbackRate;
    session.speedChangeCount++;
    logger.debug(`Playback speed changed: ${video.playbackRate}x`);
  };
  video.addEventListener('ratechange', onRateChange);
  cleanupFunctions.push(() => video.removeEventListener('ratechange', onRateChange));

  // Ended event
  const onEnded = () => {
    // Mark as completed if not already
    if (!session.isCompleted) {
      trackCompletion(config, session);
    }
  };
  video.addEventListener('ended', onEnded);
  cleanupFunctions.push(() => video.removeEventListener('ended', onEnded));
}

/**
 * Setup tracking for iframe video (Cloudflare Stream)
 */
function setupIframeVideoTracking(
  iframe: HTMLIFrameElement,
  config: VideoAnalyticsConfig,
  session: VideoSession,
  cleanupFunctions: (() => void)[]
): void {
  // Listen for Cloudflare Stream player events via postMessage
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== 'https://iframe.cloudflarestream.com' &&
        event.origin !== 'https://customer-0123456789abcdef.cloudflarestream.com') {
      return;
    }

    const data = event.data;

    if (data.event === 'play') {
      session.playCount++;
    } else if (data.event === 'pause') {
      session.pauseCount++;
    } else if (data.event === 'seeked') {
      session.seekCount++;
    } else if (data.event === 'timeupdate') {
      session.currentPosition = data.currentTime || 0;

      // Update watch time
      const now = Date.now();
      const elapsed = (now - session.lastUpdateTime) / 1000;
      if (data.playing) {
        session.watchTime += elapsed;
      }
      session.lastUpdateTime = now;

      // Check for completion
      const completionThreshold = config.completionThreshold || 90;
      const watchedPercentage = (session.currentPosition / config.videoDuration) * 100;

      if (!session.isCompleted && watchedPercentage >= completionThreshold) {
        trackCompletion(config, session);
      }
    } else if (data.event === 'ended') {
      if (!session.isCompleted) {
        trackCompletion(config, session);
      }
    }
  };

  window.addEventListener('message', onMessage);
  cleanupFunctions.push(() => window.removeEventListener('message', onMessage));
}

/**
 * Initialize analytics for all videos on page
 */
export function initAllVideoAnalytics(): () => void {
  const cleanupFunctions: (() => void)[] = [];

  // Find all video elements with data-video-analytics attribute
  const videos = document.querySelectorAll<HTMLVideoElement | HTMLIFrameElement>(
    '[data-video-analytics]'
  );

  videos.forEach(video => {
    const videoId = video.dataset.videoId;
    const courseId = video.dataset.courseId;
    const videoDuration = parseFloat(video.dataset.videoDuration || '0');
    const lessonId = video.dataset.lessonId;
    const isPreview = video.dataset.isPreview === 'true';

    if (!videoId || !courseId || !videoDuration) {
      logger.warn('Video missing required analytics data attributes');
      return;
    }

    const cleanup = initVideoAnalytics(video, {
      videoId,
      courseId,
      videoDuration,
      lessonId,
      isPreview,
    });

    cleanupFunctions.push(cleanup);
  });

  // Return master cleanup function
  return () => {
    cleanupFunctions.forEach(fn => fn());
  };
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllVideoAnalytics);
  } else {
    initAllVideoAnalytics();
  }
}
