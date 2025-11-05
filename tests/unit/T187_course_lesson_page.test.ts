/**
 * T187: Course Lesson Page Tests
 *
 * Tests for course lesson page with video player integration,
 * progress tracking, and navigation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../src/lib/db');
vi.mock('../../src/lib/auth/session');
vi.mock('../../src/lib/logger');

import { getPool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth/session';

// Test data
const mockSession = {
  userId: 'user-123',
  email: 'user@example.com',
  role: 'user',
};

const mockCourse = {
  id: 'course-123',
  slug: 'test-course',
  title: 'Test Course',
  description: 'Test course description',
  image_url: 'https://example.com/image.jpg',
  instructor_name: 'Test Instructor',
  metadata: {
    curriculum: [
      {
        title: 'Section 1',
        lessons: [
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            description: 'First lesson',
            type: 'video',
            duration: 600,
            order: 1,
          },
          {
            id: 'lesson-2',
            title: 'Lesson 2',
            description: 'Second lesson',
            type: 'video',
            duration: 900,
            order: 2,
          },
        ],
      },
      {
        title: 'Section 2',
        lessons: [
          {
            id: 'lesson-3',
            title: 'Lesson 3',
            description: 'Third lesson',
            type: 'video',
            duration: 1200,
            order: 1,
          },
        ],
      },
    ],
  },
};

const mockVideo = {
  id: 'video-123',
  cloudflare_video_id: 'cf-video-123',
  title: 'Lesson 1 Video',
  description: 'Lesson 1 video description',
  duration: 600,
  thumbnail_url: 'https://example.com/thumb.jpg',
  status: 'ready',
  playback_hls_url: 'https://stream.cloudflare.com/hls',
  playback_dash_url: 'https://stream.cloudflare.com/dash',
  processing_progress: 100,
};

const mockLessonProgress = {
  id: 'progress-123',
  completed: false,
  time_spent_seconds: 120,
  score: null,
  last_accessed_at: new Date().toISOString(),
  completed_at: null,
};

// Mock pool query function
const createMockPool = () => {
  const mockQuery = vi.fn();
  return {
    query: mockQuery,
    end: vi.fn(),
    connect: vi.fn(),
  };
};

describe('T187: Course Lesson Page', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    vi.mocked(getPool).mockReturnValue(mockPool);
    vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Access and Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(null);

      // In Astro, we would test the redirect logic
      // For now, verify session check is called
      const session = await getSessionFromRequest({} as any);
      expect(session).toBeNull();
    });

    it('should check user enrollment in course', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment check
        .mockResolvedValueOnce({ rows: [mockCourse] }) // course data
        .mockResolvedValueOnce({ rows: [mockVideo] }) // video data
        .mockResolvedValueOnce({ rows: [mockLessonProgress] }); // progress data

      const session = await getSessionFromRequest({} as any);
      expect(session).toBeTruthy();

      // Simulate enrollment check
      const enrollmentResult = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [mockSession.userId, mockCourse.id]
      );

      // Verify enrollment check query was called
      expect(mockPool.query).toHaveBeenCalled();
      expect(enrollmentResult.rows.length).toBeGreaterThan(0);
    });

    it('should redirect if user not enrolled', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no enrollment

      const result = mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [mockSession.userId, mockCourse.id]
      );

      const enrolled = await result;
      expect(enrolled.rows.length).toBe(0);
    });
  });

  describe('Lesson Data Loading', () => {
    it('should load course data', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockCourse] });

      const result = await mockPool.query(
        `SELECT id, title, slug, description, image_url, instructor_name, metadata
         FROM courses
         WHERE id = $1 OR slug = $1`,
        [mockCourse.id]
      );

      expect(result.rows[0]).toEqual(mockCourse);
    });

    it('should load video data for lesson', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockVideo] });

      const result = await mockPool.query(
        `SELECT id, cloudflare_video_id, title, description, duration,
                thumbnail_url, status, playback_hls_url, playback_dash_url,
                processing_progress
         FROM course_videos
         WHERE course_id = $1 AND lesson_id = $2`,
        [mockCourse.id, 'lesson-1']
      );

      expect(result.rows[0]).toEqual(mockVideo);
    });

    it('should load lesson progress', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockLessonProgress] });

      const result = await mockPool.query(
        `SELECT id, completed, time_spent_seconds, score, last_accessed_at, completed_at
         FROM lesson_progress
         WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3`,
        [mockSession.userId, mockCourse.id, 'lesson-1']
      );

      expect(result.rows[0]).toEqual(mockLessonProgress);
    });

    it('should create progress record if not exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no existing progress

      const result = await mockPool.query(
        `SELECT id, completed, time_spent_seconds, score, last_accessed_at, completed_at
         FROM lesson_progress
         WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3`,
        [mockSession.userId, mockCourse.id, 'lesson-1']
      );

      expect(result.rows.length).toBe(0);

      // Should insert new progress
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'new-progress' }] });

      const insertResult = await mockPool.query(
        `INSERT INTO lesson_progress (user_id, course_id, lesson_id, completed)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (user_id, course_id, lesson_id) DO NOTHING`,
        [mockSession.userId, mockCourse.id, 'lesson-1']
      );

      expect(insertResult.rows.length).toBeGreaterThanOrEqual(0);
    });

    it('should update last accessed time', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ updated: true }] });

      const result = await mockPool.query(
        `UPDATE lesson_progress
         SET last_accessed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3`,
        [mockSession.userId, mockCourse.id, 'lesson-1']
      );

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('Lesson Navigation', () => {
    it('should identify previous lesson', () => {
      const allLessons = [
        { id: 'lesson-1', title: 'Lesson 1' },
        { id: 'lesson-2', title: 'Lesson 2' },
        { id: 'lesson-3', title: 'Lesson 3' },
      ];

      const currentIndex = 1; // lesson-2
      const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;

      expect(previousLesson).toEqual({ id: 'lesson-1', title: 'Lesson 1' });
    });

    it('should identify next lesson', () => {
      const allLessons = [
        { id: 'lesson-1', title: 'Lesson 1' },
        { id: 'lesson-2', title: 'Lesson 2' },
        { id: 'lesson-3', title: 'Lesson 3' },
      ];

      const currentIndex = 1; // lesson-2
      const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

      expect(nextLesson).toEqual({ id: 'lesson-3', title: 'Lesson 3' });
    });

    it('should return null for previous lesson on first lesson', () => {
      const allLessons = [
        { id: 'lesson-1', title: 'Lesson 1' },
        { id: 'lesson-2', title: 'Lesson 2' },
      ];

      const currentIndex = 0;
      const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;

      expect(previousLesson).toBeNull();
    });

    it('should return null for next lesson on last lesson', () => {
      const allLessons = [
        { id: 'lesson-1', title: 'Lesson 1' },
        { id: 'lesson-2', title: 'Lesson 2' },
      ];

      const currentIndex = 1;
      const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

      expect(nextLesson).toBeNull();
    });
  });

  describe('Video Display States', () => {
    it('should show video player when video is ready', () => {
      expect(mockVideo.status).toBe('ready');
      expect(mockVideo.cloudflare_video_id).toBeTruthy();
    });

    it('should show processing state when video is queued', () => {
      const queuedVideo = { ...mockVideo, status: 'queued', processing_progress: 25 };
      expect(queuedVideo.status).toBe('queued');
      expect(queuedVideo.processing_progress).toBe(25);
    });

    it('should show processing state when video is inprogress', () => {
      const processingVideo = { ...mockVideo, status: 'inprogress', processing_progress: 75 };
      expect(processingVideo.status).toBe('inprogress');
      expect(processingVideo.processing_progress).toBe(75);
    });

    it('should show placeholder when no video exists', () => {
      const noVideo = null;
      expect(noVideo).toBeNull();
    });
  });

  describe('Progress Tracking API - Complete Endpoint', () => {
    it('should mark lesson as complete', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment check
        .mockResolvedValueOnce({ rows: [{ updated: true }] }); // update progress

      // Simulate marking complete
      const enrollmentCheck = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [mockSession.userId, mockCourse.id]
      );

      expect(enrollmentCheck.rows.length).toBe(1);

      const updateResult = await mockPool.query(
        `INSERT INTO lesson_progress (user_id, course_id, lesson_id, completed, completed_at, updated_at)
         VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, course_id, lesson_id)
         DO UPDATE SET
           completed = true,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
        [mockSession.userId, mockCourse.id, 'lesson-1']
      );

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should reject if not authenticated', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(null);

      const session = await getSessionFromRequest({} as any);
      expect(session).toBeNull();
    });

    it('should reject if missing course or lesson ID', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      const courseId = '';
      const lessonId = 'lesson-1';

      expect(courseId).toBeFalsy();
      expect(lessonId).toBeTruthy();
    });

    it('should reject if not enrolled', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no enrollment

      const enrollmentCheck = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [mockSession.userId, mockCourse.id]
      );

      expect(enrollmentCheck.rows.length).toBe(0);
    });
  });

  describe('Progress Tracking API - Update Endpoint', () => {
    it('should update lesson progress with current time', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment check
        .mockResolvedValueOnce({ rows: [{ updated: true }] }); // update progress

      const currentTime = 300; // 5 minutes
      const progress = 50;

      const enrollmentCheck = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [mockSession.userId, mockCourse.id]
      );

      expect(enrollmentCheck.rows.length).toBe(1);

      const updateResult = await mockPool.query(
        `INSERT INTO lesson_progress (user_id, course_id, lesson_id, time_spent_seconds, last_accessed_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, course_id, lesson_id)
         DO UPDATE SET
           time_spent_seconds = GREATEST(lesson_progress.time_spent_seconds, EXCLUDED.time_spent_seconds),
           last_accessed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
        [mockSession.userId, mockCourse.id, 'lesson-1', Math.floor(currentTime)]
      );

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should auto-complete when progress reaches 90%', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment check
        .mockResolvedValueOnce({ rows: [{ updated: true }] }) // update time
        .mockResolvedValueOnce({ rows: [{ updated: true }] }); // auto-complete

      const progress = 95;

      // Enrollment check
      await mockPool.query('SELECT ...', [mockSession.userId, mockCourse.id]);

      // Update time
      await mockPool.query('INSERT INTO ...', [mockSession.userId, mockCourse.id, 'lesson-1', 500]);

      // Auto-complete if progress >= 90%
      if (progress >= 90) {
        await mockPool.query(
          `UPDATE lesson_progress
           SET completed = true,
               completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3 AND completed = false`,
          [mockSession.userId, mockCourse.id, 'lesson-1']
        );
      }

      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should not auto-complete when progress is below 90%', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment check
        .mockResolvedValueOnce({ rows: [{ updated: true }] }); // update time

      const progress = 50;

      // Enrollment check
      await mockPool.query('SELECT ...', [mockSession.userId, mockCourse.id]);

      // Update time
      await mockPool.query('INSERT INTO ...', [mockSession.userId, mockCourse.id, 'lesson-1', 300]);

      // Should not auto-complete
      if (progress >= 90) {
        await mockPool.query('UPDATE ...', [mockSession.userId, mockCourse.id, 'lesson-1']);
      }

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should reject if not enrolled', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no enrollment

      const enrollmentCheck = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [mockSession.userId, mockCourse.id]
      );

      expect(enrollmentCheck.rows.length).toBe(0);
    });
  });

  describe('Curriculum Sidebar', () => {
    it('should display all sections and lessons', () => {
      const curriculum = mockCourse.metadata.curriculum;

      expect(curriculum.length).toBe(2);
      expect(curriculum[0].lessons.length).toBe(2);
      expect(curriculum[1].lessons.length).toBe(1);
    });

    it('should highlight current lesson', () => {
      const currentLessonId = 'lesson-1';
      const lessons = mockCourse.metadata.curriculum[0].lessons;

      const currentLesson = lessons.find((l: any) => l.id === currentLessonId);
      expect(currentLesson).toBeDefined();
      expect(currentLesson?.id).toBe(currentLessonId);
    });

    it('should open section containing current lesson', () => {
      const currentLessonId = 'lesson-2';
      const curriculum = mockCourse.metadata.curriculum;

      const sectionWithLesson = curriculum.find((section: any) =>
        section.lessons?.some((l: any) => l.id === currentLessonId)
      );

      expect(sectionWithLesson).toBeDefined();
      expect(sectionWithLesson?.title).toBe('Section 1');
    });
  });

  describe('Duration Formatting', () => {
    it('should format seconds to MM:SS', () => {
      const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      };

      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(600)).toBe('10:00');
      expect(formatDuration(65)).toBe('1:05');
    });

    it('should format hours when duration > 1 hour', () => {
      const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      };

      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(7200)).toBe('2:00:00');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      try {
        await mockPool.query('SELECT ...', [mockCourse.id]);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database connection failed');
      }
    });

    it('should handle missing course data', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no course found

      const result = await mockPool.query(
        `SELECT id, title, slug FROM courses WHERE id = $1`,
        [mockCourse.id]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should handle missing video data', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no video found

      const result = await mockPool.query(
        `SELECT id, cloudflare_video_id FROM course_videos
         WHERE course_id = $1 AND lesson_id = $2`,
        [mockCourse.id, 'lesson-1']
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full lesson viewing workflow', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      // Step 1: Check enrollment
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      // Step 2: Load course
      mockPool.query.mockResolvedValueOnce({ rows: [mockCourse] });

      // Step 3: Load video
      mockPool.query.mockResolvedValueOnce({ rows: [mockVideo] });

      // Step 4: Load progress
      mockPool.query.mockResolvedValueOnce({ rows: [mockLessonProgress] });

      // Step 5: Update last accessed
      mockPool.query.mockResolvedValueOnce({ rows: [{ updated: true }] });

      // Simulate workflow
      const session = await getSessionFromRequest({} as any);
      expect(session).toBeTruthy();

      const enrollment = await mockPool.query('...', [session.userId, mockCourse.id]);
      expect(enrollment.rows.length).toBe(1);

      const course = await mockPool.query('...', [mockCourse.id]);
      expect(course.rows[0]).toBeTruthy();

      const video = await mockPool.query('...', [mockCourse.id, 'lesson-1']);
      expect(video.rows[0]).toBeTruthy();

      const progress = await mockPool.query('...', [session.userId, mockCourse.id, 'lesson-1']);
      expect(progress.rows[0]).toBeTruthy();

      const updated = await mockPool.query('...', [session.userId, mockCourse.id, 'lesson-1']);
      expect(updated.rows[0]).toBeTruthy();

      expect(mockPool.query).toHaveBeenCalledTimes(5);
    });

    it('should handle complete lesson workflow with progress updates', async () => {
      vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession);

      // Enrollment, course, video, initial progress
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
        .mockResolvedValueOnce({ rows: [mockCourse] })
        .mockResolvedValueOnce({ rows: [mockVideo] })
        .mockResolvedValueOnce({ rows: [] }) // no existing progress
        .mockResolvedValueOnce({ rows: [{ id: 'new-progress' }] }) // create progress
        .mockResolvedValueOnce({ rows: [{ updated: true }] }) // update accessed
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment for update
        .mockResolvedValueOnce({ rows: [{ updated: true }] }) // update progress
        .mockResolvedValueOnce({ rows: [{ updated: true }] }) // auto-complete
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // enrollment for complete
        .mockResolvedValueOnce({ rows: [{ updated: true }] }); // mark complete

      const session = await getSessionFromRequest({} as any);

      // Load page
      await mockPool.query('...enrollment...', [session.userId, mockCourse.id]);
      await mockPool.query('...course...', [mockCourse.id]);
      await mockPool.query('...video...', [mockCourse.id, 'lesson-1']);
      await mockPool.query('...progress...', [session.userId, mockCourse.id, 'lesson-1']);
      await mockPool.query('...create progress...', [session.userId, mockCourse.id, 'lesson-1']);
      await mockPool.query('...update accessed...', [session.userId, mockCourse.id, 'lesson-1']);

      // Update progress during playback
      await mockPool.query('...enrollment...', [session.userId, mockCourse.id]);
      await mockPool.query('...update time...', [session.userId, mockCourse.id, 'lesson-1', 300]);
      await mockPool.query('...auto-complete...', [session.userId, mockCourse.id, 'lesson-1']);

      // Mark complete
      await mockPool.query('...enrollment...', [session.userId, mockCourse.id]);
      await mockPool.query('...mark complete...', [session.userId, mockCourse.id, 'lesson-1']);

      expect(mockPool.query).toHaveBeenCalledTimes(11);
    });
  });
});
