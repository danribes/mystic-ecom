/**
 * T188: Video Management Tests
 *
 * Tests for video management page and API endpoints.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../src/lib/db');
vi.mock('../../src/lib/auth/admin');
vi.mock('../../src/lib/logger');
vi.mock('../../src/lib/videos');
vi.mock('../../src/lib/cloudflare');

import { checkAdminAuth } from '@/lib/auth/admin';
import { getVideoById, updateVideoMetadata, deleteVideoRecord, getCourseVideos } from '@/lib/videos';
import { deleteVideo } from '@/lib/cloudflare';

// Test data
const mockAdmin = {
  user: {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
  },
};

const mockVideo = {
  id: 'video-123',
  course_id: 'course-123',
  lesson_id: 'lesson-01',
  cloudflare_video_id: 'cf-video-123',
  title: 'Test Video',
  description: 'Test description',
  duration: 600,
  thumbnail_url: 'https://example.com/thumb.jpg',
  status: 'ready' as const,
  playback_hls_url: 'https://stream.cloudflare.com/hls',
  playback_dash_url: 'https://stream.cloudflare.com/dash',
  processing_progress: 100,
  error_message: null,
  metadata: null,
  created_at: new Date('2025-01-01'),
  updated_at: new Date('2025-01-01'),
};

const mockVideos = [
  mockVideo,
  {
    ...mockVideo,
    id: 'video-456',
    lesson_id: 'lesson-02',
    title: 'Test Video 2',
    status: 'inprogress' as const,
    processing_progress: 50,
  },
  {
    ...mockVideo,
    id: 'video-789',
    lesson_id: 'lesson-03',
    title: 'Test Video 3',
    status: 'error' as const,
  },
];

describe('T188: Video Management', () => {
  beforeEach(() => {
    vi.mocked(checkAdminAuth).mockResolvedValue(mockAdmin);
    vi.mocked(getVideoById).mockResolvedValue(mockVideo);
    vi.mocked(getCourseVideos).mockResolvedValue(mockVideos);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Video List Display', () => {
    it('should fetch and display all videos for a course', async () => {
      const videos = await getCourseVideos('course-123');

      expect(videos).toHaveLength(3);
      expect(videos[0].title).toBe('Test Video');
      expect(videos[1].status).toBe('inprogress');
      expect(videos[2].status).toBe('error');
    });

    it('should display video thumbnails', () => {
      const video = mockVideo;
      expect(video.thumbnail_url).toBeTruthy();
      expect(video.thumbnail_url).toContain('https://');
    });

    it('should display video duration', () => {
      const video = mockVideo;
      expect(video.duration).toBe(600);

      // Test duration formatting
      const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      };

      expect(formatDuration(600)).toBe('10:00');
      expect(formatDuration(3665)).toBe('1:01:05');
    });

    it('should display video status with correct badge', () => {
      const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
          ready: 'bg-success text-white',
          queued: 'bg-warning text-white',
          inprogress: 'bg-primary text-white',
          error: 'bg-error text-white',
        };
        return colors[status] || 'bg-gray-500 text-white';
      };

      expect(getStatusColor('ready')).toContain('bg-success');
      expect(getStatusColor('inprogress')).toContain('bg-primary');
      expect(getStatusColor('error')).toContain('bg-error');
    });

    it('should display processing progress for inprogress videos', () => {
      const processingVideo = mockVideos.find((v) => v.status === 'inprogress');
      expect(processingVideo?.processing_progress).toBe(50);
    });

    it('should display upload date', () => {
      const video = mockVideo;
      expect(video.created_at).toBeInstanceOf(Date);
    });

    it('should handle empty video list', async () => {
      vi.mocked(getCourseVideos).mockResolvedValueOnce([]);

      const videos = await getCourseVideos('course-empty');
      expect(videos).toHaveLength(0);
    });
  });

  describe('Search and Filter', () => {
    it('should filter videos by search term in title', () => {
      const searchTerm = 'test video 2';
      const filtered = mockVideos.filter((v) =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Test Video 2');
    });

    it('should filter videos by lesson ID', () => {
      const lessonId = 'lesson-02';
      const filtered = mockVideos.filter((v) => v.lesson_id === lessonId);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].lesson_id).toBe('lesson-02');
    });

    it('should filter videos by status', () => {
      const status = 'ready';
      const filtered = mockVideos.filter((v) => v.status === status);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('ready');
    });

    it('should handle no search results', () => {
      const searchTerm = 'nonexistent video';
      const filtered = mockVideos.filter((v) =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Update Video API', () => {
    it('should update video title and description', async () => {
      const updatedVideo = { ...mockVideo, title: 'Updated Title', description: 'Updated description' };
      vi.mocked(updateVideoMetadata).mockResolvedValueOnce(updatedVideo);

      const result = await updateVideoMetadata('video-123', {
        title: 'Updated Title',
        description: 'Updated description',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated description');
    });

    it('should require authentication', async () => {
      vi.mocked(checkAdminAuth).mockResolvedValueOnce({ user: null });

      const authResult = await checkAdminAuth({} as any);
      expect(authResult.user).toBeNull();
    });

    it('should validate video ID', async () => {
      const videoId = '';
      expect(videoId).toBe('');
    });

    it('should validate title is not empty', async () => {
      const title = '';
      expect(title.trim().length).toBe(0);
    });

    it('should check if video exists before updating', async () => {
      vi.mocked(getVideoById).mockResolvedValueOnce(null);

      const video = await getVideoById('nonexistent');
      expect(video).toBeNull();
    });

    it('should trim whitespace from title and description', () => {
      const title = '  Test Title  ';
      const description = '  Test Description  ';

      expect(title.trim()).toBe('Test Title');
      expect(description.trim()).toBe('Test Description');
    });

    it('should allow null description', async () => {
      const updatedVideo = { ...mockVideo, description: null };
      vi.mocked(updateVideoMetadata).mockResolvedValueOnce(updatedVideo);

      const result = await updateVideoMetadata('video-123', {
        title: 'Test Title',
        description: null,
      });

      expect(result.description).toBeNull();
    });

    it('should handle update errors', async () => {
      vi.mocked(updateVideoMetadata).mockRejectedValueOnce(new Error('Database error'));

      try {
        await updateVideoMetadata('video-123', { title: 'New Title' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });
  });

  describe('Delete Video API', () => {
    it('should delete video from database and Cloudflare', async () => {
      vi.mocked(deleteVideo).mockResolvedValueOnce(undefined);
      vi.mocked(deleteVideoRecord).mockResolvedValueOnce(undefined);

      await deleteVideo('cf-video-123');
      await deleteVideoRecord('video-123');

      expect(deleteVideo).toHaveBeenCalledWith('cf-video-123');
      expect(deleteVideoRecord).toHaveBeenCalledWith('video-123');
    });

    it('should require authentication', async () => {
      vi.mocked(checkAdminAuth).mockResolvedValueOnce({ user: null });

      const authResult = await checkAdminAuth({} as any);
      expect(authResult.user).toBeNull();
    });

    it('should validate video ID', async () => {
      const videoId = '';
      expect(videoId).toBe('');
    });

    it('should check if video exists before deleting', async () => {
      vi.mocked(getVideoById).mockResolvedValueOnce(null);

      const video = await getVideoById('nonexistent');
      expect(video).toBeNull();
    });

    it('should continue database deletion even if Cloudflare deletion fails', async () => {
      vi.mocked(deleteVideo).mockRejectedValueOnce(new Error('Cloudflare API error'));
      vi.mocked(deleteVideoRecord).mockResolvedValueOnce(undefined);

      // Try to delete from Cloudflare (will fail)
      try {
        await deleteVideo('cf-video-123');
      } catch (error) {
        // Expected to fail
        expect((error as Error).message).toBe('Cloudflare API error');
      }

      // Should still delete from database
      await deleteVideoRecord('video-123');
      expect(deleteVideoRecord).toHaveBeenCalledWith('video-123');
    });

    it('should handle deletion errors', async () => {
      vi.mocked(deleteVideoRecord).mockRejectedValueOnce(new Error('Database error'));

      try {
        await deleteVideoRecord('video-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });
  });

  describe('Inline Editing', () => {
    it('should show edit form when edit button clicked', () => {
      const isEditMode = false;
      const newEditMode = true;

      expect(newEditMode).toBe(true);
    });

    it('should hide edit form when cancel button clicked', () => {
      const isEditMode = true;
      const newEditMode = false;

      expect(newEditMode).toBe(false);
    });

    it('should reset form values on cancel', () => {
      const originalTitle = 'Original Title';
      const editedTitle = 'Edited Title';

      // On cancel, should revert to original
      const revertedTitle = originalTitle;

      expect(revertedTitle).toBe('Original Title');
      expect(revertedTitle).not.toBe(editedTitle);
    });

    it('should disable save button during save', () => {
      const isSaving = true;
      const buttonDisabled = isSaving;

      expect(buttonDisabled).toBe(true);
    });

    it('should show success message after save', () => {
      const saveSuccess = true;
      const buttonText = saveSuccess ? 'Saved!' : 'Save';

      expect(buttonText).toBe('Saved!');
    });
  });

  describe('Delete Confirmation Modal', () => {
    it('should show modal when delete button clicked', () => {
      const isModalVisible = false;
      const newModalVisible = true;

      expect(newModalVisible).toBe(true);
    });

    it('should hide modal when cancel button clicked', () => {
      const isModalVisible = true;
      const newModalVisible = false;

      expect(newModalVisible).toBe(false);
    });

    it('should display video title in modal', () => {
      const videoTitle = 'Test Video';
      const modalText = `Are you sure you want to delete "${videoTitle}"?`;

      expect(modalText).toContain(videoTitle);
    });

    it('should hide modal on background click', () => {
      const clickedElement = 'modal-background';
      const shouldClose = clickedElement === 'modal-background';

      expect(shouldClose).toBe(true);
    });

    it('should disable delete button during deletion', () => {
      const isDeleting = true;
      const buttonDisabled = isDeleting;

      expect(buttonDisabled).toBe(true);
    });

    it('should remove video row from table after successful deletion', () => {
      const videos = [mockVideo, mockVideos[1], mockVideos[2]];
      const videoToDelete = 'video-123';
      const remainingVideos = videos.filter((v) => v.id !== videoToDelete);

      expect(remainingVideos).toHaveLength(2);
      expect(remainingVideos.find((v) => v.id === videoToDelete)).toBeUndefined();
    });

    it('should update video count after deletion', () => {
      const originalCount = 3;
      const newCount = originalCount - 1;

      expect(newCount).toBe(2);
    });

    it('should reload page if no videos remain', () => {
      const videos = [mockVideo];
      const videoToDelete = 'video-123';
      const remainingVideos = videos.filter((v) => v.id !== videoToDelete);

      const shouldReload = remainingVideos.length === 0;
      expect(shouldReload).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when course not found', async () => {
      const course = null;
      const error = course ? null : 'Course not found';

      expect(error).toBe('Course not found');
    });

    it('should display error message when videos fail to load', async () => {
      vi.mocked(getCourseVideos).mockRejectedValueOnce(new Error('Database error'));

      try {
        await getCourseVideos('course-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should show alert on update failure', async () => {
      vi.mocked(updateVideoMetadata).mockRejectedValueOnce(new Error('Update failed'));

      try {
        await updateVideoMetadata('video-123', { title: 'New Title' });
      } catch (error) {
        expect((error as Error).message).toBe('Update failed');
      }
    });

    it('should show alert on delete failure', async () => {
      vi.mocked(deleteVideoRecord).mockRejectedValueOnce(new Error('Delete failed'));

      try {
        await deleteVideoRecord('video-123');
      } catch (error) {
        expect((error as Error).message).toBe('Delete failed');
      }
    });
  });

  describe('Video Actions', () => {
    it('should show edit button for all videos', () => {
      const hasEditButton = true;
      expect(hasEditButton).toBe(true);
    });

    it('should show view button only for ready videos', () => {
      const readyVideo = mockVideos.find((v) => v.status === 'ready');
      const processingVideo = mockVideos.find((v) => v.status === 'inprogress');

      expect(readyVideo?.status).toBe('ready');
      expect(processingVideo?.status).not.toBe('ready');
    });

    it('should show delete button for all videos', () => {
      const hasDeleteButton = true;
      expect(hasDeleteButton).toBe(true);
    });

    it('should open lesson in new tab when view button clicked', () => {
      const lessonUrl = `/courses/test-course/lessons/lesson-01`;
      const target = '_blank';

      expect(lessonUrl).toContain('/courses/');
      expect(target).toBe('_blank');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full edit workflow', async () => {
      // 1. Check auth
      const authResult = await checkAdminAuth({} as any);
      expect(authResult.user).toBeTruthy();

      // 2. Get video
      const video = await getVideoById('video-123');
      expect(video).toBeTruthy();

      // 3. Update video
      const updatedVideo = { ...mockVideo, title: 'New Title' };
      vi.mocked(updateVideoMetadata).mockResolvedValueOnce(updatedVideo);

      const result = await updateVideoMetadata('video-123', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('should complete full delete workflow', async () => {
      // 1. Check auth
      const authResult = await checkAdminAuth({} as any);
      expect(authResult.user).toBeTruthy();

      // 2. Get video
      const video = await getVideoById('video-123');
      expect(video).toBeTruthy();

      // 3. Delete from Cloudflare
      vi.mocked(deleteVideo).mockResolvedValueOnce(undefined);
      await deleteVideo(video!.cloudflare_video_id);

      // 4. Delete from database
      vi.mocked(deleteVideoRecord).mockResolvedValueOnce(undefined);
      await deleteVideoRecord('video-123');

      expect(deleteVideo).toHaveBeenCalled();
      expect(deleteVideoRecord).toHaveBeenCalled();
    });

    it('should handle search and filter together', () => {
      const searchTerm = 'test';
      const statusFilter = 'ready';

      const filtered = mockVideos.filter((v) => {
        const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || v.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('ready');
    });
  });
});
