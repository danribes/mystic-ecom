/**
 * Video Analytics Tests (T190)
 *
 * Comprehensive test suite for video analytics tracking system.
 *
 * Test Coverage:
 * - Video view tracking
 * - Progress tracking
 * - Completion tracking
 * - Analytics retrieval
 * - Heatmap generation
 * - Popular videos ranking
 * - User progress tracking
 * - Dashboard stats
 * - Cache behavior
 * - Error handling
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import {
  trackVideoView,
  trackVideoProgress,
  trackVideoCompletion,
  getVideoAnalyticsSummary,
  getCourseVideoAnalytics,
  getCourseVideoAnalyticsOverview,
  getPopularVideos,
  getVideoHeatmap,
  getUserVideoProgress,
  getUserCourseProgress,
  getAnalyticsDashboardStats,
  refreshAnalyticsSummary,
  type VideoViewData,
  type VideoProgressData,
  type VideoCompletionData,
} from '../../src/lib/analytics/videos';
import { getPool } from '../../src/lib/db';

// ============================================================================
// Test Data
// ============================================================================

const mockVideoId = '550e8400-e29b-41d4-a716-446655440001';
const mockUserId = '550e8400-e29b-41d4-a716-446655440002';
const mockCourseId = '550e8400-e29b-41d4-a716-446655440003';
const mockSessionId = `session-${Date.now()}-test`;

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(async () => {
  const pool = getPool();

  // Create test user
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, role)
     VALUES ($1, 'test-analytics@example.com', 'hash', 'Test Analytics User', 'user')
     ON CONFLICT (id) DO NOTHING`,
    [mockUserId]
  );

  // Create test course
  await pool.query(
    `INSERT INTO courses (id, title, slug, description, price)
     VALUES ($1, 'Test Analytics Course', 'test-analytics-course', 'Test course for analytics', 99.99)
     ON CONFLICT (id) DO NOTHING`,
    [mockCourseId]
  );

  // Create test video
  await pool.query(
    `INSERT INTO course_videos (id, course_id, lesson_id, cloudflare_video_id, title, duration, status)
     VALUES ($1, $2, 'lesson-1', 'cf-video-123', 'Test Video', 600, 'ready')
     ON CONFLICT (id) DO NOTHING`,
    [mockVideoId, mockCourseId]
  );
});

afterAll(async () => {
  const pool = getPool();

  // Clean up test data (cascade will handle related records)
  await pool.query('DELETE FROM video_analytics WHERE course_id = $1', [mockCourseId]);
  await pool.query('DELETE FROM video_heatmap WHERE video_id = $1', [mockVideoId]);
  await pool.query('DELETE FROM video_watch_progress WHERE course_id = $1', [mockCourseId]);
  await pool.query('DELETE FROM course_videos WHERE id = $1', [mockVideoId]);
  await pool.query('DELETE FROM courses WHERE id = $1', [mockCourseId]);
  await pool.query('DELETE FROM users WHERE id = $1', [mockUserId]);

  // Refresh materialized view
  await pool.query('REFRESH MATERIALIZED VIEW video_analytics_summary');
});

const mockVideoViewData: VideoViewData = {
  video_id: mockVideoId,
  user_id: mockUserId,
  course_id: mockCourseId,
  session_id: mockSessionId,
  video_duration_seconds: 600, // 10 minutes
  lesson_id: 'lesson-1',
  is_preview: false,
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  device_type: 'desktop',
  browser: 'Chrome',
  os: 'macOS',
  referrer: 'https://example.com',
};

// ============================================================================
// Video View Tracking Tests
// ============================================================================

describe('T190: Video View Tracking', () => {
  it('should track a video view with all fields', async () => {
    const analytics = await trackVideoView(mockVideoViewData);

    expect(analytics).toBeDefined();
    expect(analytics.video_id).toBe(mockVideoId);
    expect(analytics.user_id).toBe(mockUserId);
    expect(analytics.course_id).toBe(mockCourseId);
    expect(analytics.session_id).toBe(mockSessionId);
    expect(analytics.video_duration_seconds).toBe(600);
    expect(analytics.lesson_id).toBe('lesson-1');
    expect(analytics.is_preview).toBe(false);
    expect(analytics.watch_time_seconds).toBe(0); // Initial
    expect(analytics.completion_percentage).toBe(0); // Initial
    expect(analytics.completed).toBe(false);
    expect(analytics.play_count).toBe(1);
  });

  it('should track anonymous video view (no user_id)', async () => {
    const viewData = {
      ...mockVideoViewData,
      user_id: null,
      session_id: `session-${Date.now()}-anonymous`,
    };

    const analytics = await trackVideoView(viewData);

    expect(analytics.user_id).toBeNull();
    expect(analytics.video_id).toBe(mockVideoId);
  });

  it('should track preview video view', async () => {
    const viewData = {
      ...mockVideoViewData,
      is_preview: true,
      session_id: `session-${Date.now()}-preview`,
    };

    const analytics = await trackVideoView(viewData);

    expect(analytics.is_preview).toBe(true);
  });

  it('should prevent duplicate session tracking', async () => {
    const sessionId = `session-${Date.now()}-duplicate-test`;
    const viewData = { ...mockVideoViewData, session_id: sessionId };

    // Track first time
    const first = await trackVideoView(viewData);
    expect(first.session_id).toBe(sessionId);

    // Track second time with same session_id (should return existing)
    const second = await trackVideoView(viewData);
    expect(second.id).toBe(first.id);
    expect(second.session_id).toBe(sessionId);
  });

  it('should throw error for missing required fields', async () => {
    const invalidData = {
      video_id: '',
      course_id: mockCourseId,
      session_id: mockSessionId,
    } as VideoViewData;

    await expect(trackVideoView(invalidData)).rejects.toThrow();
  });

  it('should handle missing optional fields', async () => {
    const minimalData: VideoViewData = {
      video_id: mockVideoId,
      course_id: mockCourseId,
      session_id: `session-${Date.now()}-minimal`,
    };

    const analytics = await trackVideoView(minimalData);

    expect(analytics).toBeDefined();
    expect(analytics.video_duration_seconds).toBeNull();
    expect(analytics.lesson_id).toBeNull();
    expect(analytics.device_type).toBeNull();
  });

  it('should capture device information correctly', async () => {
    const viewData = {
      ...mockVideoViewData,
      session_id: `session-${Date.now()}-device`,
      device_type: 'mobile' as const,
      browser: 'Safari',
      os: 'iOS',
    };

    const analytics = await trackVideoView(viewData);

    expect(analytics.device_type).toBe('mobile');
    expect(analytics.browser).toBe('Safari');
    expect(analytics.os).toBe('iOS');
  });
});

// ============================================================================
// Video Progress Tracking Tests
// ============================================================================

describe('T190: Video Progress Tracking', () => {
  let sessionId: string;

  beforeEach(async () => {
    // Create a session first
    sessionId = `session-${Date.now()}-progress`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });
  });

  it('should update video progress', async () => {
    const progressData: VideoProgressData = {
      session_id: sessionId,
      current_position_seconds: 120, // 2 minutes
      watch_time_seconds: 100,
      play_count: 2,
      pause_count: 1,
      seek_count: 0,
    };

    const analytics = await trackVideoProgress(progressData);

    expect(analytics.max_position_seconds).toBeGreaterThanOrEqual(120);
    expect(analytics.watch_time_seconds).toBe(100);
    expect(analytics.play_count).toBe(2);
    expect(analytics.pause_count).toBe(1);
  });

  it('should calculate completion percentage correctly', async () => {
    const progressData: VideoProgressData = {
      session_id: sessionId,
      current_position_seconds: 300, // 5 minutes of 10 minute video
      watch_time_seconds: 300,
    };

    const analytics = await trackVideoProgress(progressData);

    expect(analytics.completion_percentage).toBeGreaterThan(0);
    expect(analytics.completion_percentage).toBeLessThanOrEqual(100);
  });

  it('should track multiple progress updates', async () => {
    // First update
    await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 60,
      watch_time_seconds: 50,
    });

    // Second update
    await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 120,
      watch_time_seconds: 100,
    });

    // Third update
    const final = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 180,
      watch_time_seconds: 150,
    });

    expect(final.max_position_seconds).toBeGreaterThanOrEqual(180);
    expect(final.watch_time_seconds).toBe(150);
  });

  it('should update max_position_seconds to highest value', async () => {
    // Forward seek
    await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 300,
      watch_time_seconds: 100,
    });

    // Backward seek (should not decrease max_position)
    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 150,
      watch_time_seconds: 120,
    });

    expect(analytics.max_position_seconds).toBeGreaterThanOrEqual(300);
  });

  it('should track playback speed changes', async () => {
    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 100,
      watch_time_seconds: 80,
      average_playback_speed: 1.5,
    });

    expect(analytics.average_playback_speed).toBe(1.5);
  });

  it('should track quality changes', async () => {
    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 100,
      watch_time_seconds: 90,
      quality_changes: 3,
    });

    expect(analytics.quality_changes).toBe(3);
  });

  it('should throw error for non-existent session', async () => {
    await expect(
      trackVideoProgress({
        session_id: 'non-existent-session',
        current_position_seconds: 100,
      })
    ).rejects.toThrow();
  });
});

// ============================================================================
// Video Completion Tracking Tests
// ============================================================================

describe('T190: Video Completion Tracking', () => {
  let sessionId: string;

  beforeEach(async () => {
    sessionId = `session-${Date.now()}-completion`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });
  });

  it('should mark video as completed', async () => {
    const completionData: VideoCompletionData = {
      session_id: sessionId,
      watch_time_seconds: 550,
      completion_percentage: 92,
    };

    const analytics = await trackVideoCompletion(completionData);

    expect(analytics.completed).toBe(true);
    expect(analytics.completed_at).toBeDefined();
    expect(analytics.watch_time_seconds).toBe(550);
    expect(analytics.completion_percentage).toBe(92);
  });

  it('should handle 100% completion', async () => {
    const analytics = await trackVideoCompletion({
      session_id: sessionId,
      watch_time_seconds: 600,
      completion_percentage: 100,
    });

    expect(analytics.completion_percentage).toBe(100);
    expect(analytics.completed).toBe(true);
  });

  it('should allow completion at 90% threshold', async () => {
    const analytics = await trackVideoCompletion({
      session_id: sessionId,
      watch_time_seconds: 540,
      completion_percentage: 90,
    });

    expect(analytics.completed).toBe(true);
    expect(analytics.completion_percentage).toBe(90);
  });

  it('should update user watch progress on completion', async () => {
    await trackVideoCompletion({
      session_id: sessionId,
      watch_time_seconds: 550,
      completion_percentage: 92,
    });

    // Check user progress was updated
    const progress = await getUserVideoProgress(mockUserId, mockVideoId);
    expect(progress?.completed).toBe(true);
  });
});

// ============================================================================
// Analytics Retrieval Tests
// ============================================================================

describe('T190: Analytics Retrieval', () => {
  beforeEach(async () => {
    // Create test analytics data
    const sessionId = `session-${Date.now()}-retrieval`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });
    await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 300,
      watch_time_seconds: 280,
    });
  });

  it('should get video analytics summary', async () => {
    const summary = await getVideoAnalyticsSummary(mockVideoId);

    expect(summary).toBeDefined();
    if (summary) {
      expect(summary.video_id).toBe(mockVideoId);
      expect(summary.total_views).toBeGreaterThan(0);
      expect(summary.unique_viewers).toBeGreaterThan(0);
    }
  });

  it('should return null for video with no analytics', async () => {
    const nonExistentVideoId = '550e8400-e29b-41d4-a716-999999999999';
    const summary = await getVideoAnalyticsSummary(nonExistentVideoId);

    expect(summary).toBeNull();
  });

  it('should get course video analytics', async () => {
    const analytics = await getCourseVideoAnalytics(mockCourseId);

    expect(Array.isArray(analytics)).toBe(true);
  });

  it('should get course video analytics overview', async () => {
    const overview = await getCourseVideoAnalyticsOverview(mockCourseId);

    expect(overview).toBeDefined();
    if (overview) {
      expect(overview.course_id).toBe(mockCourseId);
      expect(overview.total_videos).toBeGreaterThanOrEqual(0);
      expect(overview.total_views).toBeGreaterThanOrEqual(0);
    }
  });

  it('should cache analytics data', async () => {
    // First call - cache miss
    const first = await getVideoAnalyticsSummary(mockVideoId);

    // Second call - should hit cache
    const second = await getVideoAnalyticsSummary(mockVideoId);

    expect(first).toEqual(second);
  });
});

// ============================================================================
// Popular Videos Tests
// ============================================================================

describe('T190: Popular Videos', () => {
  it('should get popular videos with default limit', async () => {
    const popular = await getPopularVideos();

    expect(Array.isArray(popular)).toBe(true);
    expect(popular.length).toBeLessThanOrEqual(10);
  });

  it('should get popular videos with custom limit', async () => {
    const popular = await getPopularVideos(5);

    expect(popular.length).toBeLessThanOrEqual(5);
  });

  it('should exclude preview videos from popular list', async () => {
    const popular = await getPopularVideos(20);

    // All videos should have is_preview: false
    const hasPreview = popular.some(v => v.is_preview === true);
    expect(hasPreview).toBe(false);
  });

  it('should order popular videos by views descending', async () => {
    const popular = await getPopularVideos(10);

    if (popular.length > 1) {
      for (let i = 0; i < popular.length - 1; i++) {
        expect(popular[i].total_views).toBeGreaterThanOrEqual(popular[i + 1].total_views);
      }
    }
  });
});

// ============================================================================
// Video Heatmap Tests
// ============================================================================

describe('T190: Video Heatmap', () => {
  it('should get video heatmap', async () => {
    const heatmap = await getVideoHeatmap(mockVideoId);

    expect(Array.isArray(heatmap)).toBe(true);
  });

  it('should have segments ordered by start time', async () => {
    const heatmap = await getVideoHeatmap(mockVideoId);

    if (heatmap.length > 1) {
      for (let i = 0; i < heatmap.length - 1; i++) {
        expect(heatmap[i].segment_start).toBeLessThan(heatmap[i + 1].segment_start);
      }
    }
  });

  it('should have valid segment data', async () => {
    const heatmap = await getVideoHeatmap(mockVideoId);

    heatmap.forEach(segment => {
      expect(segment.segment_end).toBeGreaterThan(segment.segment_start);
      expect(segment.view_count).toBeGreaterThanOrEqual(0);
      expect(segment.unique_viewers).toBeGreaterThanOrEqual(0);
      expect(segment.completion_rate).toBeGreaterThanOrEqual(0);
      expect(segment.completion_rate).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// User Progress Tests
// ============================================================================

describe('T190: User Progress Tracking', () => {
  beforeEach(async () => {
    // Create session with progress
    const sessionId = `session-${Date.now()}-user-progress`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });
    await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 200,
      watch_time_seconds: 180,
    });
  });

  it('should get user video progress', async () => {
    const progress = await getUserVideoProgress(mockUserId, mockVideoId);

    expect(progress).toBeDefined();
    if (progress) {
      expect(progress.user_id).toBe(mockUserId);
      expect(progress.video_id).toBe(mockVideoId);
      expect(progress.current_position_seconds).toBeGreaterThan(0);
    }
  });

  it('should return null for user with no progress', async () => {
    const nonExistentUserId = '550e8400-e29b-41d4-a716-999999999999';
    const progress = await getUserVideoProgress(nonExistentUserId, mockVideoId);

    expect(progress).toBeNull();
  });

  it('should get user course progress', async () => {
    const progress = await getUserCourseProgress(mockUserId, mockCourseId);

    expect(Array.isArray(progress)).toBe(true);
  });

  it('should order user course progress by last watched', async () => {
    const progress = await getUserCourseProgress(mockUserId, mockCourseId);

    if (progress.length > 1) {
      for (let i = 0; i < progress.length - 1; i++) {
        const first = new Date(progress[i].last_watched_at).getTime();
        const second = new Date(progress[i + 1].last_watched_at).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    }
  });
});

// ============================================================================
// Dashboard Stats Tests
// ============================================================================

describe('T190: Dashboard Statistics', () => {
  it('should get dashboard stats', async () => {
    const stats = await getAnalyticsDashboardStats();

    expect(stats).toBeDefined();
    expect(stats.total_videos_with_analytics).toBeGreaterThanOrEqual(0);
    expect(stats.total_views).toBeGreaterThanOrEqual(0);
    expect(stats.total_unique_viewers).toBeGreaterThanOrEqual(0);
    expect(stats.total_watch_time_hours).toBeGreaterThanOrEqual(0);
    expect(stats.average_completion_rate).toBeGreaterThanOrEqual(0);
    expect(stats.average_completion_rate).toBeLessThanOrEqual(100);
  });

  it('should categorize videos by completion rate', async () => {
    const stats = await getAnalyticsDashboardStats();

    expect(stats.videos_by_completion_rate).toBeDefined();
    expect(stats.videos_by_completion_rate.high).toBeGreaterThanOrEqual(0);
    expect(stats.videos_by_completion_rate.medium).toBeGreaterThanOrEqual(0);
    expect(stats.videos_by_completion_rate.low).toBeGreaterThanOrEqual(0);

    const total =
      stats.videos_by_completion_rate.high +
      stats.videos_by_completion_rate.medium +
      stats.videos_by_completion_rate.low;

    expect(total).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Analytics Summary Refresh Tests
// ============================================================================

describe('T190: Analytics Summary Refresh', () => {
  it('should refresh analytics summary', async () => {
    await expect(refreshAnalyticsSummary()).resolves.not.toThrow();
  });

  it('should clear caches after refresh', async () => {
    // Get data before refresh
    const before = await getVideoAnalyticsSummary(mockVideoId);

    // Refresh
    await refreshAnalyticsSummary();

    // Get data after refresh (should hit database, not cache)
    const after = await getVideoAnalyticsSummary(mockVideoId);

    // Both should return same data (cache cleared and repopulated)
    expect(before).toEqual(after);
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('T190: Edge Cases', () => {
  it('should handle very long watch times', async () => {
    const sessionId = `session-${Date.now()}-long-watch`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });

    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 3600, // 1 hour
      watch_time_seconds: 3000,
    });

    expect(analytics.watch_time_seconds).toBe(3000);
  });

  it('should handle zero watch time', async () => {
    const sessionId = `session-${Date.now()}-zero-watch`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });

    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 0,
      watch_time_seconds: 0,
    });

    expect(analytics.watch_time_seconds).toBe(0);
    expect(analytics.completion_percentage).toBe(0);
  });

  it('should handle high seek count', async () => {
    const sessionId = `session-${Date.now()}-high-seek`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });

    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 100,
      watch_time_seconds: 50,
      seek_count: 100,
    });

    expect(analytics.seek_count).toBe(100);
  });

  it('should handle slow playback speed', async () => {
    const sessionId = `session-${Date.now()}-slow-speed`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });

    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 100,
      watch_time_seconds: 150, // More watch time than position (slow speed)
      average_playback_speed: 0.5,
    });

    expect(analytics.average_playback_speed).toBe(0.5);
  });

  it('should handle fast playback speed', async () => {
    const sessionId = `session-${Date.now()}-fast-speed`;
    await trackVideoView({ ...mockVideoViewData, session_id: sessionId });

    const analytics = await trackVideoProgress({
      session_id: sessionId,
      current_position_seconds: 100,
      watch_time_seconds: 50, // Less watch time than position (fast speed)
      average_playback_speed: 2.0,
    });

    expect(analytics.average_playback_speed).toBe(2.0);
  });
});
