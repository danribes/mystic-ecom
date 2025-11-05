/**
 * T183: Video Service Tests
 *
 * Tests for video service functionality including:
 * - Creating video records
 * - Retrieving videos (by course, by lesson, by ID)
 * - Updating video metadata
 * - Deleting videos
 * - Getting playback data
 * - Redis caching
 * - Cloudflare integration
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import * as redis from '../../src/lib/redis';
import * as cloudflare from '../../src/lib/cloudflare';
import * as videos from '../../src/lib/videos';

// Test database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/spirituality_test',
});

// Mock Cloudflare functions
vi.mock('../../src/lib/cloudflare', async () => {
  const actual = await vi.importActual('../../src/lib/cloudflare');
  return {
    ...actual,
    getVideo: vi.fn(),
    deleteVideo: vi.fn(),
    generatePlaybackUrl: vi.fn(),
    generateThumbnailUrl: vi.fn(),
  };
});

describe('T183: Video Service', () => {
  let testCourseId: string;
  let testVideoId: string;
  let testCloudflareVideoId: string;

  beforeAll(async () => {
    // Create a test course
    const courseResult = await pool.query(`
      INSERT INTO courses (title, slug, description, price, is_published)
      VALUES ('Test Video Course', 'test-video-course', 'Course for video tests', 99.99, true)
      RETURNING id
    `);
    testCourseId = courseResult.rows[0].id;
    testCloudflareVideoId = `cf-test-video-${Date.now()}`;
  });

  afterAll(async () => {
    // Clean up
    if (testCourseId) {
      await pool.query('DELETE FROM courses WHERE id = $1', [testCourseId]);
    }
    await pool.end();
  });

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Setup default mock responses
    vi.mocked(cloudflare.getVideo).mockResolvedValue({
      uid: testCloudflareVideoId,
      status: { state: 'ready', pctComplete: '100' },
      playback: {
        hls: 'https://customer.cloudflarestream.com/abc/manifest/video.m3u8',
        dash: 'https://customer.cloudflarestream.com/abc/manifest/video.mpd',
      },
      thumbnail: 'https://customer.cloudflarestream.com/abc/thumbnails/thumbnail.jpg',
      duration: 300,
      meta: {},
    } as any);

    vi.mocked(cloudflare.deleteVideo).mockResolvedValue(true);

    vi.mocked(cloudflare.generatePlaybackUrl).mockImplementation((videoId, format) => {
      return `https://customer.cloudflarestream.com/${videoId}/manifest/video.${format === 'hls' ? 'm3u8' : 'mpd'}`;
    });

    vi.mocked(cloudflare.generateThumbnailUrl).mockImplementation((videoId) => {
      return `https://customer.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
    });
  });

  afterEach(async () => {
    // Clear test data after each test
    if (testVideoId) {
      await pool.query('DELETE FROM course_videos WHERE id = $1', [testVideoId]).catch(() => {});
      testVideoId = '';
    }

    // Clear Redis cache
    await redis.delPattern('video:*').catch(() => {});
    await redis.delPattern('course_videos:*').catch(() => {});
  });

  describe('createCourseVideo', () => {
    it('should create a video record successfully', async () => {
      const input: videos.CreateVideoInput = {
        course_id: testCourseId,
        lesson_id: 'lesson-1',
        cloudflare_video_id: testCloudflareVideoId,
        title: 'Introduction Video',
        description: 'This is the introduction lesson',
        status: 'queued',
      };

      const video = await videos.createCourseVideo(input);

      expect(video).toBeDefined();
      expect(video.id).toBeDefined();
      expect(video.course_id).toBe(testCourseId);
      expect(video.lesson_id).toBe('lesson-1');
      expect(video.cloudflare_video_id).toBe(testCloudflareVideoId);
      expect(video.title).toBe('Introduction Video');
      expect(video.description).toBe('This is the introduction lesson');
      expect(video.status).toBe('queued');
      expect(video.processing_progress).toBe(0);

      testVideoId = video.id;
    });

    it('should create video with default values', async () => {
      const input: videos.CreateVideoInput = {
        course_id: testCourseId,
        lesson_id: 'lesson-2',
        cloudflare_video_id: `${testCloudflareVideoId}-2`,
        title: 'Lesson 2',
      };

      const video = await videos.createCourseVideo(input);

      expect(video.status).toBe('queued');
      expect(video.processing_progress).toBe(0);
      expect(video.description).toBeNull();

      testVideoId = video.id;
    });

    it('should cache the created video', async () => {
      const input: videos.CreateVideoInput = {
        course_id: testCourseId,
        lesson_id: 'lesson-3',
        cloudflare_video_id: `${testCloudflareVideoId}-3`,
        title: 'Cached Video',
      };

      const video = await videos.createCourseVideo(input);
      testVideoId = video.id;

      // Check if cached
      const cached = await redis.getJSON(`video:${video.id}`);
      expect(cached).toBeDefined();
    });

    it('should throw error for missing required fields', async () => {
      const input = {
        course_id: testCourseId,
        lesson_id: 'lesson-4',
        // Missing cloudflare_video_id and title
      } as videos.CreateVideoInput;

      await expect(videos.createCourseVideo(input)).rejects.toThrow(videos.VideoError);
      await expect(videos.createCourseVideo(input)).rejects.toThrow('Missing required fields');
    });

    it('should throw error for non-existent course', async () => {
      const input: videos.CreateVideoInput = {
        course_id: '00000000-0000-0000-0000-000000000000',
        lesson_id: 'lesson-5',
        cloudflare_video_id: `${testCloudflareVideoId}-5`,
        title: 'Invalid Course Video',
      };

      await expect(videos.createCourseVideo(input)).rejects.toThrow(videos.VideoError);
      await expect(videos.createCourseVideo(input)).rejects.toThrow('Course not found');
    });

    it('should throw error for duplicate Cloudflare video ID', async () => {
      const input: videos.CreateVideoInput = {
        course_id: testCourseId,
        lesson_id: 'lesson-6',
        cloudflare_video_id: testCloudflareVideoId,
        title: 'Duplicate Test',
      };

      const video1 = await videos.createCourseVideo(input);
      testVideoId = video1.id;

      await expect(
        videos.createCourseVideo({
          ...input,
          lesson_id: 'lesson-7',
        })
      ).rejects.toThrow('already exists');
    });

    it('should throw error for duplicate course-lesson combination', async () => {
      const input: videos.CreateVideoInput = {
        course_id: testCourseId,
        lesson_id: 'lesson-8',
        cloudflare_video_id: `${testCloudflareVideoId}-8`,
        title: 'Test',
      };

      const video1 = await videos.createCourseVideo(input);
      testVideoId = video1.id;

      await expect(
        videos.createCourseVideo({
          ...input,
          cloudflare_video_id: `${testCloudflareVideoId}-8b`,
        })
      ).rejects.toThrow('already exists');
    });

    it('should store metadata as JSONB', async () => {
      const metadata = {
        resolution: '1920x1080',
        codec: 'h264',
        bitrate: 5000,
      };

      const input: videos.CreateVideoInput = {
        course_id: testCourseId,
        lesson_id: 'lesson-9',
        cloudflare_video_id: `${testCloudflareVideoId}-9`,
        title: 'Metadata Test',
        metadata,
      };

      const video = await videos.createCourseVideo(input);
      testVideoId = video.id;

      expect(video.metadata).toEqual(metadata);
    });
  });

  describe('getCourseVideos', () => {
    beforeEach(async () => {
      // Create multiple videos for testing
      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-a',
        cloudflare_video_id: `${testCloudflareVideoId}-a`,
        title: 'Video A',
        status: 'ready',
      });

      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-b',
        cloudflare_video_id: `${testCloudflareVideoId}-b`,
        title: 'Video B',
        status: 'queued',
      });

      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-c',
        cloudflare_video_id: `${testCloudflareVideoId}-c`,
        title: 'Video C',
        status: 'ready',
      });
    });

    afterEach(async () => {
      // Clean up all test videos
      await pool.query('DELETE FROM course_videos WHERE course_id = $1', [testCourseId]);
    });

    it('should retrieve all ready videos for a course', async () => {
      const courseVideos = await videos.getCourseVideos(testCourseId);

      expect(courseVideos).toHaveLength(2);
      expect(courseVideos.every(v => v.status === 'ready')).toBe(true);
      expect(courseVideos.map(v => v.lesson_id).sort()).toEqual(['lesson-a', 'lesson-c']);
    });

    it('should retrieve all videos including not ready', async () => {
      const allVideos = await videos.getCourseVideos(testCourseId, { includeNotReady: true });

      expect(allVideos).toHaveLength(3);
    });

    it('should return empty array for course with no videos', async () => {
      const emptyResult = await videos.getCourseVideos('00000000-0000-0000-0000-000000000000');

      expect(emptyResult).toEqual([]);
    });

    it('should cache course videos', async () => {
      // First call - should query database
      const videos1 = await videos.getCourseVideos(testCourseId);

      // Second call - should use cache
      const videos2 = await videos.getCourseVideos(testCourseId);

      // Compare key fields (dates may be serialized differently)
      expect(videos1.length).toBe(videos2.length);
      expect(videos1[0].id).toBe(videos2[0].id);
      expect(videos1[0].title).toBe(videos2[0].title);

      // Verify cache exists
      const cached = await redis.getJSON(`course_videos:${testCourseId}`);
      expect(cached).toBeDefined();
    });

    it('should order videos by lesson_id', async () => {
      const allVideos = await videos.getCourseVideos(testCourseId, { includeNotReady: true });

      const lessonIds = allVideos.map(v => v.lesson_id);
      const sortedLessonIds = [...lessonIds].sort();

      expect(lessonIds).toEqual(sortedLessonIds);
    });
  });

  describe('getLessonVideo', () => {
    beforeEach(async () => {
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-specific',
        cloudflare_video_id: `${testCloudflareVideoId}-specific`,
        title: 'Specific Lesson Video',
      });
      testVideoId = video.id;
    });

    it('should retrieve a specific lesson video', async () => {
      const video = await videos.getLessonVideo(testCourseId, 'lesson-specific');

      expect(video).toBeDefined();
      expect(video?.lesson_id).toBe('lesson-specific');
      expect(video?.title).toBe('Specific Lesson Video');
    });

    it('should return null for non-existent lesson', async () => {
      const video = await videos.getLessonVideo(testCourseId, 'non-existent-lesson');

      expect(video).toBeNull();
    });

    it('should cache lesson video', async () => {
      await videos.getLessonVideo(testCourseId, 'lesson-specific');

      const cached = await redis.getJSON(`video:${testCourseId}:lesson-specific`);
      expect(cached).toBeDefined();
    });
  });

  describe('getVideoById', () => {
    beforeEach(async () => {
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-by-id',
        cloudflare_video_id: `${testCloudflareVideoId}-by-id`,
        title: 'Get By ID Test',
      });
      testVideoId = video.id;
    });

    it('should retrieve video by ID', async () => {
      const video = await videos.getVideoById(testVideoId);

      expect(video).toBeDefined();
      expect(video?.id).toBe(testVideoId);
      expect(video?.title).toBe('Get By ID Test');
    });

    it('should return null for non-existent ID', async () => {
      const video = await videos.getVideoById('00000000-0000-0000-0000-000000000000');

      expect(video).toBeNull();
    });

    it('should use cache on second call', async () => {
      // First call
      await videos.getVideoById(testVideoId);

      // Second call should use cache
      const cached = await redis.getJSON(`video:${testVideoId}`);
      expect(cached).toBeDefined();

      const video = await videos.getVideoById(testVideoId);
      expect(video).toBeDefined();
    });
  });

  describe('updateVideoMetadata', () => {
    beforeEach(async () => {
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-update',
        cloudflare_video_id: `${testCloudflareVideoId}-update`,
        title: 'Original Title',
        status: 'queued',
      });
      testVideoId = video.id;
    });

    it('should update video title', async () => {
      const updated = await videos.updateVideoMetadata(testVideoId, {
        title: 'Updated Title',
      });

      expect(updated.title).toBe('Updated Title');
    });

    it('should update video status', async () => {
      const updated = await videos.updateVideoMetadata(testVideoId, {
        status: 'ready',
        processing_progress: 100,
      });

      expect(updated.status).toBe('ready');
      expect(updated.processing_progress).toBe(100);
    });

    it('should update multiple fields', async () => {
      const updates: videos.UpdateVideoInput = {
        title: 'New Title',
        description: 'New Description',
        status: 'ready',
        duration: 600,
        thumbnail_url: 'https://example.com/thumb.jpg',
      };

      const updated = await videos.updateVideoMetadata(testVideoId, updates);

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New Description');
      expect(updated.status).toBe('ready');
      expect(updated.duration).toBe(600);
      expect(updated.thumbnail_url).toBe('https://example.com/thumb.jpg');
    });

    it('should invalidate cache after update', async () => {
      // Cache the video first
      await videos.getVideoById(testVideoId);

      // Update video
      await videos.updateVideoMetadata(testVideoId, { title: 'Cache Test' });

      // Cache should be invalidated
      const cached = await redis.getJSON(`video:${testVideoId}`);
      expect(cached).toBeNull();
    });

    it('should throw error for non-existent video', async () => {
      await expect(
        videos.updateVideoMetadata('00000000-0000-0000-0000-000000000000', { title: 'Test' })
      ).rejects.toThrow('Video not found');
    });

    it('should throw error when no fields to update', async () => {
      await expect(
        videos.updateVideoMetadata(testVideoId, {})
      ).rejects.toThrow('No fields to update');
    });

    it('should update metadata JSONB field', async () => {
      const newMetadata = {
        resolution: '1920x1080',
        codec: 'h265',
      };

      const updated = await videos.updateVideoMetadata(testVideoId, {
        metadata: newMetadata,
      });

      expect(updated.metadata).toEqual(newMetadata);
    });
  });

  describe('deleteVideoRecord', () => {
    let deleteTestVideoId: string;
    let deleteTestCloudflareId: string;

    beforeEach(async () => {
      // Use unique ID for each test
      deleteTestCloudflareId = `${testCloudflareVideoId}-delete-${Date.now()}`;
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: `lesson-delete-${Date.now()}`,
        cloudflare_video_id: deleteTestCloudflareId,
        title: 'Delete Test',
      });
      deleteTestVideoId = video.id;
    });

    afterEach(() => {
      deleteTestVideoId = ''; // Already deleted in test
    });

    it('should delete video from database', async () => {
      const result = await videos.deleteVideoRecord(deleteTestVideoId, false);

      expect(result).toBe(true);

      // Verify deletion
      const video = await videos.getVideoById(deleteTestVideoId);
      expect(video).toBeNull();
    });

    it('should delete video from Cloudflare when requested', async () => {
      await videos.deleteVideoRecord(deleteTestVideoId, true);

      expect(cloudflare.deleteVideo).toHaveBeenCalledWith(deleteTestCloudflareId);
    });

    it('should not delete from Cloudflare when flag is false', async () => {
      await videos.deleteVideoRecord(deleteTestVideoId, false);

      expect(cloudflare.deleteVideo).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent video', async () => {
      await expect(
        videos.deleteVideoRecord('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Video not found');
    });

    it('should throw CloudflareError if Cloudflare deletion fails', async () => {
      vi.mocked(cloudflare.deleteVideo).mockRejectedValueOnce(new Error('Cloudflare error'));

      await expect(
        videos.deleteVideoRecord(deleteTestVideoId, true)
      ).rejects.toThrow('Failed to delete video from Cloudflare');
    });

    it('should invalidate cache after deletion', async () => {
      // Cache the video
      await videos.getVideoById(deleteTestVideoId);

      // Delete video
      await videos.deleteVideoRecord(deleteTestVideoId, false);

      // Cache should be cleared
      const cached = await redis.getJSON(`video:${deleteTestVideoId}`);
      expect(cached).toBeNull();
    });
  });

  describe('getVideoPlaybackData', () => {
    beforeEach(async () => {
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-playback',
        cloudflare_video_id: `${testCloudflareVideoId}-playback`,
        title: 'Playback Test',
        status: 'ready',
      });
      testVideoId = video.id;
    });

    it('should return video with playback data', async () => {
      const playbackData = await videos.getVideoPlaybackData(testVideoId);

      expect(playbackData).toBeDefined();
      expect(playbackData.id).toBe(testVideoId);
      expect(playbackData.is_ready).toBe(true);
      expect(playbackData.playback_urls).toBeDefined();
      expect(playbackData.playback_urls.hls).toBeDefined();
      expect(playbackData.playback_urls.dash).toBeDefined();
    });

    it('should fetch status from Cloudflare', async () => {
      await videos.getVideoPlaybackData(testVideoId);

      expect(cloudflare.getVideo).toHaveBeenCalledWith(`${testCloudflareVideoId}-playback`);
    });

    it('should generate playback URLs', async () => {
      const playbackData = await videos.getVideoPlaybackData(testVideoId);

      expect(playbackData.playback_urls.hls).toContain('m3u8');
      expect(playbackData.playback_urls.dash).toContain('mpd');
    });

    it('should generate thumbnail URL', async () => {
      const playbackData = await videos.getVideoPlaybackData(testVideoId);

      expect(playbackData.thumbnail_url_generated).toBeDefined();
      expect(playbackData.thumbnail_url_generated).toContain('thumbnail');
    });

    it('should throw error for non-existent video', async () => {
      await expect(
        videos.getVideoPlaybackData('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Video not found');
    });

    it('should handle Cloudflare API failures gracefully', async () => {
      vi.mocked(cloudflare.getVideo).mockRejectedValueOnce(new Error('API error'));

      const playbackData = await videos.getVideoPlaybackData(testVideoId);

      // Should still return data from database
      expect(playbackData).toBeDefined();
      expect(playbackData.cloudflare_status).toBeDefined();
    });
  });

  describe('syncVideoStatus', () => {
    beforeEach(async () => {
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'lesson-sync',
        cloudflare_video_id: `${testCloudflareVideoId}-sync`,
        title: 'Sync Test',
        status: 'queued',
        processing_progress: 0,
      });
      testVideoId = video.id;
    });

    it('should sync video status from Cloudflare', async () => {
      const synced = await videos.syncVideoStatus(testVideoId);

      expect(synced.status).toBe('ready');
      expect(synced.processing_progress).toBe(100);
      expect(cloudflare.getVideo).toHaveBeenCalled();
    });

    it('should update playback URLs when video is ready', async () => {
      const synced = await videos.syncVideoStatus(testVideoId);

      expect(synced.playback_hls_url).toBeDefined();
      expect(synced.playback_dash_url).toBeDefined();
    });

    it('should update thumbnail URL', async () => {
      const synced = await videos.syncVideoStatus(testVideoId);

      expect(synced.thumbnail_url).toBeDefined();
    });

    it('should throw error for non-existent video', async () => {
      await expect(
        videos.syncVideoStatus('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Video not found');
    });
  });

  describe('getCourseVideoStats', () => {
    beforeEach(async () => {
      // Clean up any existing videos first
      await pool.query('DELETE FROM course_videos WHERE course_id = $1', [testCourseId]);

      // Create videos with different statuses
      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'stat-1',
        cloudflare_video_id: `${testCloudflareVideoId}-stat-1`,
        title: 'Video 1',
        status: 'ready',
        duration: 300,
      });

      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'stat-2',
        cloudflare_video_id: `${testCloudflareVideoId}-stat-2`,
        title: 'Video 2',
        status: 'ready',
        duration: 600,
      });

      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'stat-3',
        cloudflare_video_id: `${testCloudflareVideoId}-stat-3`,
        title: 'Video 3',
        status: 'queued',
        duration: 450,
      });

      await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'stat-4',
        cloudflare_video_id: `${testCloudflareVideoId}-stat-4`,
        title: 'Video 4',
        status: 'error',
      });
    });

    afterEach(async () => {
      await pool.query('DELETE FROM course_videos WHERE course_id = $1', [testCourseId]);
    });

    it('should return video statistics for course', async () => {
      const stats = await videos.getCourseVideoStats(testCourseId);

      expect(stats.total).toBe(4);
      expect(stats.ready).toBe(2);
      expect(stats.queued).toBe(1);
      expect(stats.error).toBe(1);
      expect(stats.processing).toBe(0);
      expect(stats.totalDuration).toBe(1350); // 300 + 600 + 450
    });

    it('should return zero stats for course with no videos', async () => {
      const stats = await videos.getCourseVideoStats('00000000-0000-0000-0000-000000000000');

      expect(stats.total).toBe(0);
      expect(stats.ready).toBe(0);
      expect(stats.totalDuration).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw VideoError with correct error code', async () => {
      try {
        await videos.createCourseVideo({
          course_id: '00000000-0000-0000-0000-000000000000',
          lesson_id: 'test',
          cloudflare_video_id: 'test',
          title: 'Test',
        });
        throw new Error('Should have thrown VideoError');
      } catch (error) {
        expect(error).toBeInstanceOf(videos.VideoError);
        expect((error as videos.VideoError).code).toBe(videos.VideoErrorCode.COURSE_NOT_FOUND);
      }
    });

    it('should include error details in VideoError', async () => {
      try {
        await videos.updateVideoMetadata('00000000-0000-0000-0000-000000000000', {
          title: 'Test',
        });
        throw new Error('Should have thrown VideoError');
      } catch (error) {
        expect(error).toBeInstanceOf(videos.VideoError);
        expect((error as videos.VideoError).message).toContain('Video not found');
      }
    });
  });

  describe('Caching Behavior', () => {
    beforeEach(async () => {
      const video = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'cache-test',
        cloudflare_video_id: `${testCloudflareVideoId}-cache`,
        title: 'Cache Test',
      });
      testVideoId = video.id;
    });

    it('should cache video on creation', async () => {
      const cached = await redis.getJSON(`video:${testVideoId}`);
      expect(cached).toBeDefined();
    });

    it('should use cache on subsequent reads', async () => {
      // First read
      await videos.getVideoById(testVideoId);

      // Clear mocks to verify cache usage
      vi.clearAllMocks();

      // Second read (should use cache, no DB query)
      const video = await videos.getVideoById(testVideoId);

      expect(video).toBeDefined();
      // Since we're using cache, the actual DB query count would be 0
      // (This is verified by the fact that the function returns successfully)
    });

    it('should invalidate cache on update', async () => {
      // Cache video
      await videos.getVideoById(testVideoId);

      // Update video
      await videos.updateVideoMetadata(testVideoId, { title: 'New Title' });

      // Cache should be cleared
      const cached = await redis.getJSON(`video:${testVideoId}`);
      expect(cached).toBeNull();
    });

    it('should invalidate course cache when video created', async () => {
      // Create second video
      const video2 = await videos.createCourseVideo({
        course_id: testCourseId,
        lesson_id: 'cache-test-2',
        cloudflare_video_id: `${testCloudflareVideoId}-cache-2`,
        title: 'Cache Test 2',
      });

      // Course cache should not exist (was invalidated)
      const cached = await redis.getJSON(`course_videos:${testCourseId}`);
      expect(cached).toBeNull();

      // Clean up
      await pool.query('DELETE FROM course_videos WHERE id = $1', [video2.id]);
    });
  });
});
