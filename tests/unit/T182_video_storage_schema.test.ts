/**
 * T182: Video Storage Schema Tests
 *
 * Tests for database schema changes to support video storage with Cloudflare Stream.
 * Validates:
 * - course_videos table structure
 * - video_status enum type
 * - Indexes and constraints
 * - Foreign key relationships
 * - Triggers for updated_at
 * - Preview video columns on courses table
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

// Test database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/spirituality_test',
});

describe('T182: Video Storage Schema', () => {
  beforeAll(async () => {
    // Ensure test database is clean and migrations are applied
    try {
      await pool.query('SELECT 1');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Enum Type: video_status', () => {
    it('should have video_status enum type with correct values', async () => {
      const result = await pool.query(`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = 'video_status'::regtype
        ORDER BY enumsortorder
      `);

      const enumValues = result.rows.map(row => row.enumlabel);
      expect(enumValues).toEqual(['queued', 'inprogress', 'ready', 'error']);
    });
  });

  describe('Table: course_videos', () => {
    it('should have course_videos table with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'course_videos'
        ORDER BY ordinal_position
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const columns = result.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
      }));

      // Check key columns exist
      const columnNames = columns.map(c => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('course_id');
      expect(columnNames).toContain('lesson_id');
      expect(columnNames).toContain('cloudflare_video_id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('duration');
      expect(columnNames).toContain('thumbnail_url');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('playback_hls_url');
      expect(columnNames).toContain('playback_dash_url');
      expect(columnNames).toContain('processing_progress');
      expect(columnNames).toContain('error_message');
      expect(columnNames).toContain('metadata');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have correct data types for course_videos columns', async () => {
      const result = await pool.query(`
        SELECT column_name, udt_name
        FROM information_schema.columns
        WHERE table_name = 'course_videos'
      `);

      const columnTypes = result.rows.reduce((acc, row) => {
        acc[row.column_name] = row.udt_name;
        return acc;
      }, {} as Record<string, string>);

      expect(columnTypes['id']).toBe('uuid');
      expect(columnTypes['course_id']).toBe('uuid');
      expect(columnTypes['lesson_id']).toBe('varchar');
      expect(columnTypes['cloudflare_video_id']).toBe('varchar');
      expect(columnTypes['processing_progress']).toBe('int4');
      expect(columnTypes['metadata']).toBe('jsonb');
    });

    it('should have primary key on id column', async () => {
      const result = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'course_videos' AND constraint_type = 'PRIMARY KEY'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have foreign key to courses table', async () => {
      const result = await pool.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'course_videos'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'course_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('courses');
      expect(result.rows[0].foreign_column_name).toBe('id');
      expect(result.rows[0].delete_rule).toBe('CASCADE');
    });

    it('should have unique constraint on cloudflare_video_id', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'course_videos'
          AND column_name = 'cloudflare_video_id'
          AND constraint_name LIKE '%unique%' OR constraint_name LIKE '%cloudflare_video_id%'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unique constraint on course_id and lesson_id combination', async () => {
      const result = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'course_videos'
          AND constraint_name = 'unique_course_lesson'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].constraint_type).toBe('UNIQUE');
    });

    it('should have check constraint on processing_progress (0-100)', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'course_videos'
          AND constraint_type = 'CHECK'
          AND constraint_name = 'check_progress'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Indexes: course_videos', () => {
    it('should have index on course_id', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'course_videos' AND indexname = 'idx_course_videos_course_id'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have index on lesson_id', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'course_videos' AND indexname = 'idx_course_videos_lesson_id'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have index on cloudflare_video_id', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'course_videos' AND indexname = 'idx_course_videos_cloudflare_id'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have index on status', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'course_videos' AND indexname = 'idx_course_videos_status'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have index on created_at', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'course_videos' AND indexname = 'idx_course_videos_created_at'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Table: courses (video columns)', () => {
    it('should have preview video columns on courses table', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'courses'
          AND column_name IN ('preview_video_url', 'preview_video_id', 'preview_video_thumbnail', 'preview_video_duration')
        ORDER BY column_name
      `);

      expect(result.rows).toHaveLength(4);
      const columnNames = result.rows.map(row => row.column_name).sort();
      expect(columnNames).toEqual([
        'preview_video_duration',
        'preview_video_id',
        'preview_video_thumbnail',
        'preview_video_url'
      ]);
    });

    it('should have correct data types for preview video columns', async () => {
      const result = await pool.query(`
        SELECT column_name, udt_name
        FROM information_schema.columns
        WHERE table_name = 'courses'
          AND column_name IN ('preview_video_url', 'preview_video_id', 'preview_video_thumbnail', 'preview_video_duration')
      `);

      const columnTypes = result.rows.reduce((acc, row) => {
        acc[row.column_name] = row.udt_name;
        return acc;
      }, {} as Record<string, string>);

      expect(columnTypes['preview_video_url']).toBe('varchar');
      expect(columnTypes['preview_video_id']).toBe('varchar');
      expect(columnTypes['preview_video_thumbnail']).toBe('varchar');
      expect(columnTypes['preview_video_duration']).toBe('int4');
    });

    it('should have index on preview_video_id', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'courses' AND indexname = 'idx_courses_preview_video_id'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Triggers: updated_at', () => {
    it('should have trigger for course_videos updated_at', async () => {
      const result = await pool.query(`
        SELECT trigger_name, event_manipulation, action_timing
        FROM information_schema.triggers
        WHERE event_object_table = 'course_videos'
          AND trigger_name = 'update_course_videos_timestamp'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].event_manipulation).toBe('UPDATE');
      expect(result.rows[0].action_timing).toBe('BEFORE');
    });
  });

  describe('Functional Tests: course_videos', () => {
    let testCourseId: string;
    let testVideoId: string;

    beforeAll(async () => {
      // Create a test course
      const courseResult = await pool.query(`
        INSERT INTO courses (title, slug, description, price, is_published)
        VALUES ('Test Course for Videos', 'test-course-videos', 'Test description', 99.99, true)
        RETURNING id
      `);
      testCourseId = courseResult.rows[0].id;
    });

    afterAll(async () => {
      // Clean up test data
      if (testVideoId) {
        await pool.query('DELETE FROM course_videos WHERE id = $1', [testVideoId]);
      }
      if (testCourseId) {
        await pool.query('DELETE FROM courses WHERE id = $1', [testCourseId]);
      }
    });

    it('should insert a course video successfully', async () => {
      const result = await pool.query(`
        INSERT INTO course_videos (
          course_id, lesson_id, cloudflare_video_id, title, status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [testCourseId, 'lesson-1', 'test-cf-video-123', 'Intro Video', 'queued']);

      expect(result.rows).toHaveLength(1);
      testVideoId = result.rows[0].id;

      expect(result.rows[0].course_id).toBe(testCourseId);
      expect(result.rows[0].lesson_id).toBe('lesson-1');
      expect(result.rows[0].cloudflare_video_id).toBe('test-cf-video-123');
      expect(result.rows[0].title).toBe('Intro Video');
      expect(result.rows[0].status).toBe('queued');
      expect(result.rows[0].processing_progress).toBe(0);
    });

    it('should enforce unique constraint on cloudflare_video_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO course_videos (
            course_id, lesson_id, cloudflare_video_id, title
          ) VALUES ($1, $2, $3, $4)
        `, [testCourseId, 'lesson-2', 'test-cf-video-123', 'Duplicate Video'])
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on course_id + lesson_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO course_videos (
            course_id, lesson_id, cloudflare_video_id, title
          ) VALUES ($1, $2, $3, $4)
        `, [testCourseId, 'lesson-1', 'different-video-456', 'Another Video'])
      ).rejects.toThrow();
    });

    it('should enforce check constraint on processing_progress', async () => {
      await expect(
        pool.query(`
          INSERT INTO course_videos (
            course_id, lesson_id, cloudflare_video_id, title, processing_progress
          ) VALUES ($1, $2, $3, $4, $5)
        `, [testCourseId, 'lesson-3', 'test-cf-video-789', 'Invalid Progress', 150])
      ).rejects.toThrow();
    });

    it('should update updated_at timestamp on video update', async () => {
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const beforeUpdate = await pool.query(
        'SELECT updated_at FROM course_videos WHERE id = $1',
        [testVideoId]
      );

      await pool.query(
        'UPDATE course_videos SET status = $1 WHERE id = $2',
        ['ready', testVideoId]
      );

      const afterUpdate = await pool.query(
        'SELECT updated_at FROM course_videos WHERE id = $1',
        [testVideoId]
      );

      const beforeTime = new Date(beforeUpdate.rows[0].updated_at).getTime();
      const afterTime = new Date(afterUpdate.rows[0].updated_at).getTime();

      expect(afterTime).toBeGreaterThan(beforeTime);
    });

    it('should cascade delete videos when course is deleted', async () => {
      // Create a temporary course and video with unique slug
      const uniqueSlug = `temp-course-delete-${Date.now()}`;
      const tempCourse = await pool.query(`
        INSERT INTO courses (title, slug, description, price)
        VALUES ('Temp Course', $1, 'Temp', 50.00)
        RETURNING id
      `, [uniqueSlug]);

      const tempVideo = await pool.query(`
        INSERT INTO course_videos (course_id, lesson_id, cloudflare_video_id, title)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [tempCourse.rows[0].id, 'lesson-1', 'temp-video-999', 'Temp Video']);

      // Delete the course
      await pool.query('DELETE FROM courses WHERE id = $1', [tempCourse.rows[0].id]);

      // Check that video was cascade deleted
      const videoCheck = await pool.query(
        'SELECT * FROM course_videos WHERE id = $1',
        [tempVideo.rows[0].id]
      );

      expect(videoCheck.rows).toHaveLength(0);
    });

    it('should store JSONB metadata correctly', async () => {
      const metadata = {
        resolution: '1920x1080',
        codec: 'h264',
        bitrate: 5000,
        fileSize: 125000000
      };

      await pool.query(
        'UPDATE course_videos SET metadata = $1 WHERE id = $2',
        [JSON.stringify(metadata), testVideoId]
      );

      const result = await pool.query(
        'SELECT metadata FROM course_videos WHERE id = $1',
        [testVideoId]
      );

      expect(result.rows[0].metadata).toEqual(metadata);
    });
  });

  describe('Functional Tests: courses preview videos', () => {
    let testCourseId: string;

    beforeAll(async () => {
      // Create a test course
      const courseResult = await pool.query(`
        INSERT INTO courses (title, slug, description, price)
        VALUES ('Test Course Preview Video', 'test-course-preview', 'Test', 79.99)
        RETURNING id
      `);
      testCourseId = courseResult.rows[0].id;
    });

    afterAll(async () => {
      if (testCourseId) {
        await pool.query('DELETE FROM courses WHERE id = $1', [testCourseId]);
      }
    });

    it('should store preview video metadata on courses', async () => {
      const result = await pool.query(`
        UPDATE courses SET
          preview_video_url = $1,
          preview_video_id = $2,
          preview_video_thumbnail = $3,
          preview_video_duration = $4
        WHERE id = $5
        RETURNING *
      `, [
        'https://customer-123.cloudflarestream.com/abc123/manifest/video.m3u8',
        'cf-preview-123',
        'https://customer-123.cloudflarestream.com/abc123/thumbnails/thumbnail.jpg',
        300,
        testCourseId
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].preview_video_url).toBe('https://customer-123.cloudflarestream.com/abc123/manifest/video.m3u8');
      expect(result.rows[0].preview_video_id).toBe('cf-preview-123');
      expect(result.rows[0].preview_video_thumbnail).toBe('https://customer-123.cloudflarestream.com/abc123/thumbnails/thumbnail.jpg');
      expect(result.rows[0].preview_video_duration).toBe(300);
    });
  });

  describe('Query Performance', () => {
    it('should efficiently query videos by course_id', async () => {
      const explain = await pool.query(`
        EXPLAIN SELECT * FROM course_videos WHERE course_id = '00000000-0000-0000-0000-000000000000'
      `);

      const plan = explain.rows.map(row => row['QUERY PLAN']).join(' ');
      expect(plan.toLowerCase()).toContain('index');
    });

    it('should efficiently query videos by status', async () => {
      const explain = await pool.query(`
        EXPLAIN SELECT * FROM course_videos WHERE status = 'ready'
      `);

      const plan = explain.rows.map(row => row['QUERY PLAN']).join(' ');
      expect(plan.toLowerCase()).toContain('index');
    });
  });
});
