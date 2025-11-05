-- Migration: Add video analytics tracking tables (T190)
-- Date: 2025-11-04
-- Purpose: Track video views, watch time, completion rates, and engagement metrics

-- Video analytics tracking table
-- Records each video view session with detailed engagement metrics
CREATE TABLE IF NOT EXISTS video_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- View session tracking
    session_id VARCHAR(255) NOT NULL, -- Frontend-generated session ID
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Watch metrics
    watch_time_seconds INTEGER DEFAULT 0 CHECK (watch_time_seconds >= 0), -- Total time watched
    video_duration_seconds INTEGER, -- Video length at view time
    completion_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Engagement metrics
    play_count INTEGER DEFAULT 1 CHECK (play_count > 0), -- Number of plays in session
    pause_count INTEGER DEFAULT 0 CHECK (pause_count >= 0),
    seek_count INTEGER DEFAULT 0 CHECK (seek_count >= 0),
    max_position_seconds INTEGER DEFAULT 0 CHECK (max_position_seconds >= 0), -- Furthest point reached

    -- Quality metrics
    average_playback_speed DECIMAL(3, 2) DEFAULT 1.00 CHECK (average_playback_speed > 0),
    quality_changes INTEGER DEFAULT 0 CHECK (quality_changes >= 0),

    -- Technical data
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50), -- mobile, tablet, desktop
    browser VARCHAR(100),
    os VARCHAR(100),
    referrer TEXT,

    -- Context
    lesson_id VARCHAR(255),
    is_preview BOOLEAN DEFAULT false, -- True for course preview videos

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX idx_video_analytics_user_id ON video_analytics(user_id);
CREATE INDEX idx_video_analytics_course_id ON video_analytics(course_id);
CREATE INDEX idx_video_analytics_session_id ON video_analytics(session_id);
CREATE INDEX idx_video_analytics_started_at ON video_analytics(started_at);
CREATE INDEX idx_video_analytics_completed ON video_analytics(completed) WHERE completed = true;
CREATE INDEX idx_video_analytics_user_video ON video_analytics(user_id, video_id);
CREATE INDEX idx_video_analytics_course_started ON video_analytics(course_id, started_at DESC);

-- Video engagement heatmap table
-- Tracks which segments of videos are most watched (for heatmap visualization)
CREATE TABLE IF NOT EXISTS video_heatmap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,

    -- Time segment (in seconds from start)
    segment_start INTEGER NOT NULL CHECK (segment_start >= 0),
    segment_end INTEGER NOT NULL CHECK (segment_end > segment_start),

    -- Engagement metrics for this segment
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0), -- How many times this segment was watched
    unique_viewers INTEGER DEFAULT 0 CHECK (unique_viewers >= 0), -- Unique users who watched this segment
    total_watch_time_seconds INTEGER DEFAULT 0 CHECK (total_watch_time_seconds >= 0),
    completion_rate DECIMAL(5, 2) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100), -- % of viewers who completed this segment

    -- Drop-off tracking
    drop_off_count INTEGER DEFAULT 0 CHECK (drop_off_count >= 0), -- How many stopped watching during this segment

    -- Aggregation metadata
    last_aggregated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure segments don't overlap for same video
    UNIQUE(video_id, segment_start, segment_end)
);

-- Indexes for heatmap queries
CREATE INDEX idx_video_heatmap_video_id ON video_heatmap(video_id);
CREATE INDEX idx_video_heatmap_video_segment ON video_heatmap(video_id, segment_start);
CREATE INDEX idx_video_heatmap_engagement ON video_heatmap(view_count DESC, unique_viewers DESC);

-- Video watch progress table (real-time progress tracking)
-- Separate from video_analytics for frequent updates without bloating analytics table
CREATE TABLE IF NOT EXISTS video_watch_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Current position
    current_position_seconds INTEGER DEFAULT 0 CHECK (current_position_seconds >= 0),
    video_duration_seconds INTEGER,

    -- Progress tracking
    progress_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed BOOLEAN DEFAULT false,

    -- Timestamps
    first_watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    lesson_id VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- One progress record per user per video
    UNIQUE(user_id, video_id)
);

-- Indexes for watch progress
CREATE INDEX idx_video_watch_progress_user_id ON video_watch_progress(user_id);
CREATE INDEX idx_video_watch_progress_video_id ON video_watch_progress(video_id);
CREATE INDEX idx_video_watch_progress_course_id ON video_watch_progress(course_id);
CREATE INDEX idx_video_watch_progress_user_course ON video_watch_progress(user_id, course_id);
CREATE INDEX idx_video_watch_progress_completed ON video_watch_progress(completed) WHERE completed = true;
CREATE INDEX idx_video_watch_progress_last_watched ON video_watch_progress(last_watched_at DESC);

-- Trigger for updating video_heatmap.updated_at
CREATE TRIGGER update_video_heatmap_updated_at BEFORE UPDATE ON video_heatmap
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating video_watch_progress.updated_at
CREATE TRIGGER update_video_watch_progress_updated_at BEFORE UPDATE ON video_watch_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for video analytics summary (for dashboard performance)
CREATE MATERIALIZED VIEW video_analytics_summary AS
SELECT
    va.video_id,
    va.course_id,
    cv.title as video_title,
    cv.lesson_id,
    c.title as course_title,

    -- View metrics
    COUNT(DISTINCT va.id) as total_views,
    COUNT(DISTINCT va.user_id) as unique_viewers,
    COUNT(DISTINCT CASE WHEN va.completed = true THEN va.user_id END) as unique_completers,

    -- Time metrics
    AVG(va.watch_time_seconds) as avg_watch_time_seconds,
    SUM(va.watch_time_seconds) as total_watch_time_seconds,
    MAX(va.watch_time_seconds) as max_watch_time_seconds,

    -- Completion metrics
    AVG(va.completion_percentage) as avg_completion_percentage,
    COUNT(CASE WHEN va.completed = true THEN 1 END) as completed_count,
    ROUND(
        (COUNT(CASE WHEN va.completed = true THEN 1 END)::DECIMAL /
         NULLIF(COUNT(DISTINCT va.id), 0) * 100),
        2
    ) as completion_rate,

    -- Engagement metrics
    AVG(va.play_count) as avg_play_count,
    AVG(va.pause_count) as avg_pause_count,
    AVG(va.seek_count) as avg_seek_count,
    AVG(va.average_playback_speed) as avg_playback_speed,

    -- Play rate (% of people who started watching)
    ROUND(
        (COUNT(DISTINCT CASE WHEN va.watch_time_seconds > 0 THEN va.user_id END)::DECIMAL /
         NULLIF(COUNT(DISTINCT va.user_id), 0) * 100),
        2
    ) as play_rate,

    -- Drop-off rate (% who didn't complete)
    ROUND(
        (COUNT(CASE WHEN va.completed = false THEN 1 END)::DECIMAL /
         NULLIF(COUNT(DISTINCT va.id), 0) * 100),
        2
    ) as drop_off_rate,

    -- Time periods
    MIN(va.started_at) as first_view_at,
    MAX(va.started_at) as last_view_at,

    -- Metadata
    cv.duration as video_duration_seconds,
    cv.status as video_status,
    va.is_preview

FROM video_analytics va
INNER JOIN course_videos cv ON va.video_id = cv.id
INNER JOIN courses c ON va.course_id = c.id
GROUP BY va.video_id, va.course_id, cv.title, cv.lesson_id, c.title, cv.duration, cv.status, va.is_preview;

-- Indexes for materialized view
CREATE INDEX idx_video_analytics_summary_video_id ON video_analytics_summary(video_id);
CREATE INDEX idx_video_analytics_summary_course_id ON video_analytics_summary(course_id);
CREATE INDEX idx_video_analytics_summary_total_views ON video_analytics_summary(total_views DESC);
CREATE INDEX idx_video_analytics_summary_completion_rate ON video_analytics_summary(completion_rate DESC);
CREATE INDEX idx_video_analytics_summary_watch_time ON video_analytics_summary(total_watch_time_seconds DESC);

-- Function to refresh analytics summary (call periodically or after bulk updates)
CREATE OR REPLACE FUNCTION refresh_video_analytics_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY video_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE video_analytics IS 'T190: Tracks individual video viewing sessions with detailed engagement metrics';
COMMENT ON TABLE video_heatmap IS 'T190: Aggregated engagement data for video segments (heatmap visualization)';
COMMENT ON TABLE video_watch_progress IS 'T190: Real-time video watch progress for users (resume functionality)';
COMMENT ON MATERIALIZED VIEW video_analytics_summary IS 'T190: Pre-aggregated video analytics for dashboard performance';
COMMENT ON FUNCTION refresh_video_analytics_summary IS 'T190: Refresh the video analytics summary materialized view';
