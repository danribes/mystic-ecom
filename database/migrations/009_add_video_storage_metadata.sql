-- T182: Add Video Storage Metadata
-- Migration to add course_videos table and video columns to courses table
-- Date: 2025-11-04

-- ============================================================================
-- Course Videos Table
-- ============================================================================

-- Create enum for video status
CREATE TYPE video_status AS ENUM ('queued', 'inprogress', 'ready', 'error');

-- Course videos table for lesson-specific videos
CREATE TABLE IF NOT EXISTS course_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id VARCHAR(255) NOT NULL, -- Flexible identifier (e.g., "lesson-1", "module-2-lesson-3")
    cloudflare_video_id VARCHAR(255) NOT NULL UNIQUE, -- Cloudflare Stream video UID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER, -- Duration in seconds
    thumbnail_url VARCHAR(500),
    status video_status DEFAULT 'queued',
    playback_hls_url VARCHAR(500), -- HLS manifest URL
    playback_dash_url VARCHAR(500), -- DASH manifest URL
    processing_progress INTEGER DEFAULT 0, -- Percentage 0-100
    error_message TEXT, -- Error details if status is 'error'
    metadata JSONB, -- Additional metadata from Cloudflare
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_progress CHECK (processing_progress >= 0 AND processing_progress <= 100),
    CONSTRAINT unique_course_lesson UNIQUE(course_id, lesson_id)
);

-- Indexes for course_videos
CREATE INDEX idx_course_videos_course_id ON course_videos(course_id);
CREATE INDEX idx_course_videos_lesson_id ON course_videos(lesson_id);
CREATE INDEX idx_course_videos_cloudflare_id ON course_videos(cloudflare_video_id);
CREATE INDEX idx_course_videos_status ON course_videos(status);
CREATE INDEX idx_course_videos_created_at ON course_videos(created_at);

-- Comments for documentation
COMMENT ON TABLE course_videos IS 'Stores video metadata for course lessons integrated with Cloudflare Stream';
COMMENT ON COLUMN course_videos.cloudflare_video_id IS 'Unique identifier from Cloudflare Stream API';
COMMENT ON COLUMN course_videos.lesson_id IS 'Flexible lesson identifier matching course curriculum structure';
COMMENT ON COLUMN course_videos.status IS 'Video processing status: queued, inprogress, ready, error';
COMMENT ON COLUMN course_videos.processing_progress IS 'Transcoding progress percentage (0-100)';
COMMENT ON COLUMN course_videos.metadata IS 'Additional metadata from Cloudflare Stream (resolution, file size, etc.)';

-- ============================================================================
-- Update Courses Table
-- ============================================================================

-- Add video columns to courses table for preview/intro videos
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS preview_video_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS preview_video_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS preview_video_thumbnail VARCHAR(500),
    ADD COLUMN IF NOT EXISTS preview_video_duration INTEGER;

-- Add indexes for video columns
CREATE INDEX IF NOT EXISTS idx_courses_preview_video_id ON courses(preview_video_id);

-- Comments for documentation
COMMENT ON COLUMN courses.preview_video_url IS 'HLS URL for course preview/intro video (Cloudflare Stream)';
COMMENT ON COLUMN courses.preview_video_id IS 'Cloudflare Stream video UID for preview video';
COMMENT ON COLUMN courses.preview_video_thumbnail IS 'Thumbnail URL for preview video';
COMMENT ON COLUMN courses.preview_video_duration IS 'Duration of preview video in seconds';

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_course_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for course_videos
CREATE TRIGGER update_course_videos_timestamp
    BEFORE UPDATE ON course_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_course_videos_updated_at();

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_videos') THEN
        RAISE NOTICE 'course_videos table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create course_videos table';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'preview_video_url'
    ) THEN
        RAISE NOTICE 'courses table updated with video columns';
    ELSE
        RAISE EXCEPTION 'Failed to add video columns to courses table';
    END IF;
END $$;
