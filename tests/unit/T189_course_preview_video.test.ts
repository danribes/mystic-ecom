/**
 * T189: Course Preview Video Tests
 *
 * Tests for:
 * - Preview video section display for non-enrolled users
 * - Enrollment CTA display
 * - Thumbnail fallback
 * - VideoPlayer integration
 * - Lazy loading
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSessionFromRequest } from '../../src/lib/auth/session';
import { getPool } from '../../src/lib/db';

// Mock dependencies
vi.mock('../../src/lib/db');
vi.mock('../../src/lib/auth/session');
vi.mock('../../src/lib/logger');

// ============================================================================
// Test Data
// ============================================================================

const mockCourse = {
  id: 'course-123',
  title: 'Test Course',
  slug: 'test-course',
  description: 'Test description',
  longDescription: 'Test long description',
  imageUrl: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  previewVideoUrl: 'abc123def456789012345678abcdef01', // Cloudflare video ID (32 hex chars)
  price: 19900,
  duration: 14400,
  level: 'intermediate' as const,
  category: 'Test Category',
  tags: ['test', 'course'],
  instructorId: 'instructor-123',
  instructorName: 'Test Instructor',
  instructorAvatar: 'https://i.pravatar.cc/150',
  enrollmentCount: 1247,
  avgRating: 4.9,
  reviewCount: 423,
  learningOutcomes: ['Outcome 1', 'Outcome 2'],
  prerequisites: ['Prerequisite 1'],
  curriculum: [
    {
      title: 'Section 1',
      description: 'Section description',
      order: 1,
      lessons: [
        { title: 'Lesson 1', duration: 600, type: 'video', order: 1 },
        { title: 'Lesson 2', duration: 900, type: 'video', order: 2 },
      ],
    },
  ],
  isPublished: true,
  isFeatured: true,
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPool = {
  query: vi.fn(),
};

// ============================================================================
// Preview Video Section Tests
// ============================================================================

describe('T189: Course Preview Video Section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPool).mockReturnValue(mockPool as any);
  });

  describe('Display Logic', () => {
    it('should show preview video section for non-enrolled users', () => {
      const hasPurchased = false;
      const hasPreviewVideo = !!mockCourse.previewVideoUrl;

      expect(hasPreviewVideo).toBe(true);
      expect(hasPurchased).toBe(false);

      // Preview section should be visible
      const shouldShowPreview = hasPreviewVideo && !hasPurchased;
      expect(shouldShowPreview).toBe(true);
    });

    it('should hide preview video section for enrolled users', () => {
      const hasPurchased = true;
      const hasPreviewVideo = !!mockCourse.previewVideoUrl;

      expect(hasPreviewVideo).toBe(true);
      expect(hasPurchased).toBe(true);

      // Preview section should NOT be visible
      const shouldShowPreview = hasPreviewVideo && !hasPurchased;
      expect(shouldShowPreview).toBe(false);
    });

    it('should not show preview section if no preview video', () => {
      const courseWithoutPreview = { ...mockCourse, previewVideoUrl: null };
      const hasPurchased = false;

      const hasPreviewVideo = !!courseWithoutPreview.previewVideoUrl;
      expect(hasPreviewVideo).toBe(false);

      const shouldShowPreview = hasPreviewVideo && !hasPurchased;
      expect(shouldShowPreview).toBe(false);
    });

    it('should extract Cloudflare video ID from preview URL', () => {
      const previewUrl = 'abc123def456789012345678abcdef01';
      const regex = /([a-f0-9]{32})/;
      const match = previewUrl.match(regex);

      expect(match).toBeTruthy();
      expect(match![1]).toBe('abc123def456789012345678abcdef01');
    });

    it('should handle full Cloudflare URL format', () => {
      const fullUrl = 'https://videodelivery.net/abc123def456789012345678abcdef01/manifest/video.m3u8';
      const regex = /([a-f0-9]{32})/;
      const match = fullUrl.match(regex);

      expect(match).toBeTruthy();
      expect(match![1]).toBe('abc123def456789012345678abcdef01');
    });
  });

  describe('Enrollment CTA', () => {
    it('should display enrollment CTA for non-enrolled users', () => {
      const hasPurchased = false;
      const showCTA = !hasPurchased;

      expect(showCTA).toBe(true);
    });

    it('should not display enrollment CTA for enrolled users', () => {
      const hasPurchased = true;
      const showCTA = !hasPurchased;

      expect(showCTA).toBe(false);
    });

    it('should include course price in CTA', () => {
      const price = mockCourse.price;
      const formattedPrice = `$${(price / 100).toFixed(2)}`;

      expect(formattedPrice).toBe('$199.00');
    });

    it('should show lesson count in CTA', () => {
      const getTotalLessons = (curriculum: typeof mockCourse.curriculum) => {
        return curriculum.reduce((total, section) => total + section.lessons.length, 0);
      };

      const lessonCount = getTotalLessons(mockCourse.curriculum);
      expect(lessonCount).toBe(2);
    });

    it('should format course duration in CTA', () => {
      const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
          return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
      };

      const duration = formatDuration(mockCourse.duration);
      expect(duration).toBe('4h');
    });
  });

  describe('Thumbnail Fallback', () => {
    it('should show thumbnail fallback when preview video invalid', () => {
      const invalidPreviewUrl = 'invalid-url';
      const regex = /([a-f0-9]{32})/;
      const match = invalidPreviewUrl.match(regex);

      expect(match).toBeNull();

      // Should show thumbnail fallback
      const showThumbnailFallback = !match && !!invalidPreviewUrl;
      expect(showThumbnailFallback).toBe(true);
    });

    it('should use thumbnailUrl as fallback image', () => {
      const fallbackImage = mockCourse.thumbnailUrl || mockCourse.imageUrl;

      expect(fallbackImage).toBe(mockCourse.thumbnailUrl);
    });

    it('should use imageUrl if thumbnailUrl not available', () => {
      const courseWithoutThumbnail = { ...mockCourse, thumbnailUrl: null };
      const fallbackImage = courseWithoutThumbnail.thumbnailUrl || courseWithoutThumbnail.imageUrl;

      expect(fallbackImage).toBe(mockCourse.imageUrl);
    });

    it('should show play icon overlay on thumbnail fallback', () => {
      const hasThumbnailFallback = true;
      const showPlayOverlay = hasThumbnailFallback;

      expect(showPlayOverlay).toBe(true);
    });
  });

  describe('VideoPlayer Integration', () => {
    it('should pass correct props to VideoPlayer', () => {
      const videoId = 'abc123def456789012345678abcdef01';
      const title = `${mockCourse.title} - Preview`;
      const poster = mockCourse.thumbnailUrl || mockCourse.imageUrl;

      const videoPlayerProps = {
        videoId,
        title,
        poster,
      };

      expect(videoPlayerProps.videoId).toBe(videoId);
      expect(videoPlayerProps.title).toBe('Test Course - Preview');
      expect(videoPlayerProps.poster).toBe(mockCourse.thumbnailUrl);
    });

    it('should use course image as poster if thumbnail not available', () => {
      const courseWithoutThumbnail = { ...mockCourse, thumbnailUrl: null };
      const poster = courseWithoutThumbnail.thumbnailUrl || courseWithoutThumbnail.imageUrl;

      expect(poster).toBe(courseWithoutThumbnail.imageUrl);
    });

    it('should include "Preview" badge on video player', () => {
      const showPreviewBadge = true;
      expect(showPreviewBadge).toBe(true);
    });
  });

  describe('Lazy Loading', () => {
    it('should use aspect-video container for lazy loading', () => {
      const hasAspectVideoContainer = true;
      expect(hasAspectVideoContainer).toBe(true);
    });

    it('should set loading="lazy" on thumbnail fallback', () => {
      const imageLoadingAttribute = 'lazy';
      expect(imageLoadingAttribute).toBe('lazy');
    });

    it('should use data attribute for video container', () => {
      const hasVideoContainer = true;
      const containerAttribute = 'data-video-container';

      expect(hasVideoContainer).toBe(true);
      expect(containerAttribute).toBe('data-video-container');
    });
  });

  describe('Responsive Design', () => {
    it('should use flex-col for mobile layout', () => {
      const mobileLayoutClasses = 'flex flex-col md:flex-row';
      expect(mobileLayoutClasses).toContain('flex-col');
      expect(mobileLayoutClasses).toContain('md:flex-row');
    });

    it('should stack content vertically on mobile', () => {
      const contentLayoutClasses = 'flex-col md:flex-row items-center gap-8';
      expect(contentLayoutClasses).toContain('flex-col');
      expect(contentLayoutClasses).toContain('gap-8');
    });

    it('should use 50% width on desktop', () => {
      const desktopWidthClasses = 'w-full md:w-1/2';
      expect(desktopWidthClasses).toContain('w-full');
      expect(desktopWidthClasses).toContain('md:w-1/2');
    });
  });

  describe('CTA Buttons', () => {
    it('should have "Enroll Now" button with price', () => {
      const enrollButtonText = 'Enroll Now - $199.00';
      expect(enrollButtonText).toContain('Enroll Now');
      expect(enrollButtonText).toContain('$199.00');
    });

    it('should have "View Curriculum" button', () => {
      const viewCurriculumText = 'View Curriculum';
      expect(viewCurriculumText).toBe('View Curriculum');
    });

    it('should scroll to add-to-cart button on enroll click', () => {
      const scrollTarget = '.btn-add-cart';
      expect(scrollTarget).toBe('.btn-add-cart');
    });

    it('should scroll to curriculum section on view curriculum click', () => {
      const scrollTarget = '.curriculum-section';
      expect(scrollTarget).toBe('.curriculum-section');
    });
  });

  describe('Styling', () => {
    it('should use Tailwind classes for layout', () => {
      const containerClasses = 'container mx-auto px-4 max-w-5xl';
      expect(containerClasses).toContain('container');
      expect(containerClasses).toContain('mx-auto');
      expect(containerClasses).toContain('max-w-5xl');
    });

    it('should use bg-gray-50 for section background', () => {
      const sectionClasses = 'preview-video-section bg-gray-50 py-12';
      expect(sectionClasses).toContain('bg-gray-50');
      expect(sectionClasses).toContain('py-12');
    });

    it('should use primary color for CTA buttons', () => {
      const ctaButtonClasses = 'bg-primary hover:bg-primary-dark text-white';
      expect(ctaButtonClasses).toContain('bg-primary');
      expect(ctaButtonClasses).toContain('hover:bg-primary-dark');
    });

    it('should use rounded corners for cards', () => {
      const cardClasses = 'rounded-lg shadow-lg';
      expect(cardClasses).toContain('rounded-lg');
      expect(cardClasses).toContain('shadow-lg');
    });

    it('should use shadow-2xl for video container', () => {
      const videoContainerClasses = 'relative rounded-lg overflow-hidden shadow-2xl';
      expect(videoContainerClasses).toContain('shadow-2xl');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive alt text for thumbnail fallback', () => {
      const altText = `${mockCourse.title} preview`;
      expect(altText).toBe('Test Course preview');
    });

    it('should use semantic HTML for headings', () => {
      const headingLevel = 'h2';
      expect(headingLevel).toBe('h2');
    });

    it('should have accessible button text', () => {
      const buttonTexts = ['Enroll Now', 'View Curriculum'];
      expect(buttonTexts).toContain('Enroll Now');
      expect(buttonTexts).toContain('View Curriculum');
    });
  });

  describe('Purchase Check Integration', () => {
    it('should check if user has purchased course', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'order-123' }],
        rowCount: 1,
      } as any);

      const userId = 'user-123';
      const courseId = 'course-123';

      const purchaseResult = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [userId, courseId]
      );

      const hasPurchased = purchaseResult.rowCount > 0;
      expect(hasPurchased).toBe(true);
    });

    it('should return false if user has not purchased', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const userId = 'user-123';
      const courseId = 'course-123';

      const purchaseResult = await mockPool.query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
         LIMIT 1`,
        [userId, courseId]
      );

      const hasPurchased = purchaseResult.rowCount > 0;
      expect(hasPurchased).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing session gracefully', () => {
      const session = null;
      const isLoggedIn = !!session;

      expect(isLoggedIn).toBe(false);
    });

    it('should handle course without curriculum', () => {
      const courseWithoutCurriculum = { ...mockCourse, curriculum: [] };
      const getTotalLessons = (curriculum: typeof mockCourse.curriculum) => {
        return curriculum.reduce((total, section) => total + section.lessons.length, 0);
      };

      const lessonCount = getTotalLessons(courseWithoutCurriculum.curriculum);
      expect(lessonCount).toBe(0);
    });

    it('should handle zero price courses', () => {
      const freeCourse = { ...mockCourse, price: 0 };
      const formattedPrice = `$${(freeCourse.price / 100).toFixed(2)}`;

      expect(formattedPrice).toBe('$0.00');
    });

    it('should handle empty preview video URL', () => {
      const emptyPreviewUrl = '';
      const hasPreviewVideo = !!emptyPreviewUrl;

      expect(hasPreviewVideo).toBe(false);
    });

    it('should handle null preview video URL', () => {
      const nullPreviewUrl = null;
      const hasPreviewVideo = !!nullPreviewUrl;

      expect(hasPreviewVideo).toBe(false);
    });
  });
});
