-- T213: Performance Optimization Indexes
-- Migration: Add indexes for query optimization and N+1 prevention
-- Date: 2025-11-05

-- ============================================================================
-- Courses Table Indexes
-- ============================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published) WHERE is_published = true;

-- Filtering
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);

-- Sorting
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Composite for common queries
CREATE INDEX IF NOT EXISTS idx_courses_published_level ON courses(is_published, level) WHERE is_published = true;

-- ============================================================================
-- Reviews Table Indexes
-- ============================================================================

-- JOIN optimization for course reviews
CREATE INDEX IF NOT EXISTS idx_reviews_course_approved ON reviews(course_id, is_approved) WHERE is_approved = true;

-- JOIN optimization for product reviews (if column exists)
-- CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved) WHERE is_approved = true;

-- Aggregations
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- Course Enrollments Indexes
-- ============================================================================

-- User lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);

-- Uniqueness check
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_user_course ON course_enrollments(user_id, course_id);

-- ============================================================================
-- Digital Products Indexes
-- ============================================================================

-- Lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON digital_products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON digital_products(is_published) WHERE is_published = true;

-- Filtering
CREATE INDEX IF NOT EXISTS idx_products_type ON digital_products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_price ON digital_products(price);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_products_title_search ON digital_products USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON digital_products USING gin(to_tsvector('english', description));

-- ============================================================================
-- Events Table Indexes
-- ============================================================================

-- Lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published) WHERE is_published = true;

-- Date filtering
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(event_date) WHERE is_published = true AND event_date >= CURRENT_DATE;

-- Location filtering
CREATE INDEX IF NOT EXISTS idx_events_city ON events(venue_city);
CREATE INDEX IF NOT EXISTS idx_events_country ON events(venue_country);

-- Availability
CREATE INDEX IF NOT EXISTS idx_events_available ON events(available_spots) WHERE available_spots > 0;

-- ============================================================================
-- Orders and Order Items Indexes
-- ============================================================================

-- User orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course ON order_items(course_id);

-- ============================================================================
-- Bookings Indexes
-- ============================================================================

-- User bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Event capacity checking
CREATE INDEX IF NOT EXISTS idx_bookings_event_status ON bookings(event_id, status) WHERE status != 'cancelled';

-- ============================================================================
-- Video Content Indexes (T181-T191)
-- ============================================================================

-- Course videos
CREATE INDEX IF NOT EXISTS idx_course_videos_course ON course_videos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_status ON course_videos(status);
CREATE INDEX IF NOT EXISTS idx_course_videos_cloudflare ON course_videos(cloudflare_video_id);

-- Video analytics
CREATE INDEX IF NOT EXISTS idx_video_analytics_video ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_user ON video_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_date ON video_analytics(watched_at);

-- ============================================================================
-- Analytics
-- ============================================================================

ANALYZE courses;
ANALYZE reviews;
ANALYZE course_enrollments;
ANALYZE digital_products;
ANALYZE events;
ANALYZE orders;
ANALYZE order_items;
ANALYZE bookings;
ANALYZE course_videos;
ANALYZE video_analytics;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully';
END $$;
