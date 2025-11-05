/**
 * T181: Cloudflare Stream API Integration - Unit Tests
 *
 * Tests all Cloudflare Stream API functions including upload, retrieval,
 * listing, deletion, and playback info generation.
 *
 * @module tests/unit/T181_cloudflare_stream.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCloudflareConfig,
  uploadVideo,
  getVideo,
  listVideos,
  deleteVideo,
  getVideoPlaybackInfo,
  isVideoReady,
  getVideoStatus,
  updateVideoMetadata,
  generateThumbnailUrl,
  generatePlaybackUrl,
  type VideoMetadata,
  type ListVideosResponse,
  type UploadResponse,
} from '@/lib/cloudflare';

// ============================================================================
// Mock Setup
// ============================================================================

const mockAccountId = 'test-account-id-123';
const mockApiToken = 'test-api-token-456';
const mockVideoId = 'abc123def456';

// Store original environment
const originalEnv = { ...process.env };

// Mock fetch globally
global.fetch = vi.fn();

beforeEach(() => {
  // Reset environment
  process.env.CLOUDFLARE_ACCOUNT_ID = mockAccountId;
  process.env.CLOUDFLARE_API_TOKEN = mockApiToken;

  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore original environment
  process.env = { ...originalEnv };
});

// ============================================================================
// Helper Functions
// ============================================================================

function createMockVideoMetadata(overrides: Partial<VideoMetadata> = {}): VideoMetadata {
  return {
    uid: mockVideoId,
    thumbnail: 'https://videodelivery.net/abc123/thumbnails/thumbnail.jpg',
    thumbnailTimestampPct: 0.5,
    readyToStream: true,
    status: {
      state: 'ready',
      pctComplete: '100',
    },
    meta: {
      courseId: '123',
      lessonId: '456',
    },
    created: '2025-11-04T12:00:00Z',
    modified: '2025-11-04T12:05:00Z',
    size: 104857600, // 100MB
    preview: 'https://watch.cloudflarestream.com/abc123',
    requireSignedURLs: false,
    uploaded: '2025-11-04T12:00:00Z',
    duration: 300, // 5 minutes
    input: {
      width: 1920,
      height: 1080,
    },
    playback: {
      hls: 'https://videodelivery.net/abc123/manifest/video.m3u8',
      dash: 'https://videodelivery.net/abc123/manifest/video.mpd',
    },
    ...overrides,
  };
}

function mockFetchSuccess<T>(data: T) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
}

function mockFetchError(errors: Array<{ code: number; message: string }>) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    json: async () => ({
      success: false,
      errors,
      messages: [],
    }),
  });
}

// ============================================================================
// Configuration Tests
// ============================================================================

describe('getCloudflareConfig', () => {
  it('should return config when environment variables are set', () => {
    const config = getCloudflareConfig();

    expect(config.accountId).toBe(mockAccountId);
    expect(config.apiToken).toBe(mockApiToken);
  });

  it('should throw error when CLOUDFLARE_ACCOUNT_ID is not set', () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;

    expect(() => getCloudflareConfig()).toThrow(
      'CLOUDFLARE_ACCOUNT_ID environment variable is not set'
    );
  });

  it('should throw error when CLOUDFLARE_API_TOKEN is not set', () => {
    delete process.env.CLOUDFLARE_API_TOKEN;

    expect(() => getCloudflareConfig()).toThrow(
      'CLOUDFLARE_API_TOKEN environment variable is not set'
    );
  });
});

// ============================================================================
// Upload Video Tests
// ============================================================================

describe('uploadVideo', () => {
  it('should upload video successfully with Buffer', async () => {
    const mockVideo = createMockVideoMetadata();
    const mockResponse: UploadResponse = {
      success: true,
      result: mockVideo,
      errors: [],
      messages: [],
    };

    mockFetchSuccess(mockResponse);

    const buffer = Buffer.from('fake video data');
    const result = await uploadVideo({
      file: buffer,
      filename: 'test-video.mp4',
      meta: { courseId: '123' },
    });

    expect(result).toEqual(mockVideo);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain(`/accounts/${mockAccountId}/stream`);
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].headers.Authorization).toBe(`Bearer ${mockApiToken}`);
  });

  it('should include optional parameters in upload', async () => {
    const mockVideo = createMockVideoMetadata();
    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const buffer = Buffer.from('fake video data');
    await uploadVideo({
      file: buffer,
      filename: 'test.mp4',
      requireSignedURLs: true,
      allowedOrigins: ['https://example.com'],
      thumbnailTimestampPct: 0.25,
      watermarkUid: 'watermark123',
      maxDurationSeconds: 600,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle upload errors', async () => {
    mockFetchError([{ code: 1001, message: 'Invalid file format' }]);

    const buffer = Buffer.from('fake video data');

    await expect(
      uploadVideo({
        file: buffer,
        filename: 'test.mp4',
      })
    ).rejects.toThrow('Cloudflare API Error 1001: Invalid file format');
  });
});

// ============================================================================
// Get Video Tests
// ============================================================================

describe('getVideo', () => {
  it('should retrieve video metadata successfully', async () => {
    const mockVideo = createMockVideoMetadata();
    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await getVideo(mockVideoId);

    expect(result).toEqual(mockVideo);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain(`/stream/${mockVideoId}`);
    expect(fetchCall[1].method).toBe('GET');
  });

  it('should handle video not found error', async () => {
    mockFetchError([{ code: 1002, message: 'Video not found' }]);

    await expect(getVideo(mockVideoId)).rejects.toThrow(
      'Cloudflare API Error 1002: Video not found'
    );
  });
});

// ============================================================================
// List Videos Tests
// ============================================================================

describe('listVideos', () => {
  it('should list videos with default options', async () => {
    const mockVideos = [
      createMockVideoMetadata({ uid: 'video1' }),
      createMockVideoMetadata({ uid: 'video2' }),
    ];

    const mockResponse: ListVideosResponse = {
      success: true,
      result: mockVideos,
      errors: [],
      messages: [],
      total: '2',
    };

    mockFetchSuccess(mockResponse);

    const result = await listVideos();

    expect(result.result).toHaveLength(2);
    expect(result.total).toBe('2');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should include query parameters', async () => {
    const mockResponse: ListVideosResponse = {
      success: true,
      result: [],
      errors: [],
      messages: [],
    };

    mockFetchSuccess(mockResponse);

    await listVideos({
      limit: 50,
      status: 'ready',
      search: 'meditation',
      after: 'cursor123',
    });

    const fetchCall = (global.fetch as any).mock.calls[0];
    const url = new URL(fetchCall[0]);

    expect(url.searchParams.get('limit')).toBe('50');
    expect(url.searchParams.get('status')).toBe('ready');
    expect(url.searchParams.get('search')).toBe('meditation');
    expect(url.searchParams.get('after')).toBe('cursor123');
  });

  it('should handle empty results', async () => {
    const mockResponse: ListVideosResponse = {
      success: true,
      result: [],
      errors: [],
      messages: [],
      total: '0',
    };

    mockFetchSuccess(mockResponse);

    const result = await listVideos();

    expect(result.result).toHaveLength(0);
    expect(result.total).toBe('0');
  });

  it('should handle list errors', async () => {
    mockFetchError([{ code: 1003, message: 'Rate limit exceeded' }]);

    await expect(listVideos()).rejects.toThrow(
      'Cloudflare API Error 1003: Rate limit exceeded'
    );
  });
});

// ============================================================================
// Delete Video Tests
// ============================================================================

describe('deleteVideo', () => {
  it('should delete video successfully', async () => {
    mockFetchSuccess({ success: true, errors: [] });

    const result = await deleteVideo(mockVideoId);

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain(`/stream/${mockVideoId}`);
    expect(fetchCall[1].method).toBe('DELETE');
  });

  it('should handle deletion errors', async () => {
    mockFetchError([{ code: 1004, message: 'Video not found' }]);

    await expect(deleteVideo(mockVideoId)).rejects.toThrow(
      'Cloudflare API Error 1004: Video not found'
    );
  });
});

// ============================================================================
// Playback Info Tests
// ============================================================================

describe('getVideoPlaybackInfo', () => {
  it('should return playback info for ready video', async () => {
    const mockVideo = createMockVideoMetadata();
    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await getVideoPlaybackInfo(mockVideoId);

    expect(result.uid).toBe(mockVideoId);
    expect(result.hlsUrl).toBe(mockVideo.playback!.hls);
    expect(result.dashUrl).toBe(mockVideo.playback!.dash);
    expect(result.thumbnailUrl).toBe(mockVideo.thumbnail);
    expect(result.duration).toBe(300);
    expect(result.ready).toBe(true);
  });

  it('should handle video not ready', async () => {
    const mockVideo = createMockVideoMetadata({
      readyToStream: false,
      status: { state: 'inprogress', pctComplete: '50' },
      playback: undefined,
    });

    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await getVideoPlaybackInfo(mockVideoId);

    expect(result.ready).toBe(false);
    expect(result.hlsUrl).toBe('');
    expect(result.dashUrl).toBe('');
  });
});

// ============================================================================
// Video Status Tests
// ============================================================================

describe('isVideoReady', () => {
  it('should return true for ready video', async () => {
    const mockVideo = createMockVideoMetadata();
    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await isVideoReady(mockVideoId);

    expect(result).toBe(true);
  });

  it('should return false for processing video', async () => {
    const mockVideo = createMockVideoMetadata({
      readyToStream: false,
      status: { state: 'inprogress' },
    });

    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await isVideoReady(mockVideoId);

    expect(result).toBe(false);
  });

  it('should return false on error', async () => {
    mockFetchError([{ code: 1005, message: 'Network error' }]);

    const result = await isVideoReady(mockVideoId);

    expect(result).toBe(false);
  });
});

describe('getVideoStatus', () => {
  it('should return status for ready video', async () => {
    const mockVideo = createMockVideoMetadata();
    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await getVideoStatus(mockVideoId);

    expect(result.state).toBe('ready');
    expect(result.percentComplete).toBe(100);
    expect(result.errorMessage).toBeUndefined();
  });

  it('should return status for processing video', async () => {
    const mockVideo = createMockVideoMetadata({
      status: { state: 'inprogress', pctComplete: '75' },
    });

    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await getVideoStatus(mockVideoId);

    expect(result.state).toBe('inprogress');
    expect(result.percentComplete).toBe(75);
  });

  it('should return error status', async () => {
    const mockVideo = createMockVideoMetadata({
      status: {
        state: 'error',
        errorReasonCode: 'ERR_INVALID_FORMAT',
        errorReasonText: 'Invalid video format',
      },
    });

    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await getVideoStatus(mockVideoId);

    expect(result.state).toBe('error');
    expect(result.errorMessage).toBe('Invalid video format');
  });
});

// ============================================================================
// Update Metadata Tests
// ============================================================================

describe('updateVideoMetadata', () => {
  it('should update metadata successfully', async () => {
    const mockVideo = createMockVideoMetadata({
      meta: {
        courseId: '789',
        lessonId: '101',
        title: 'Updated Title',
      },
    });

    mockFetchSuccess({ success: true, result: mockVideo, errors: [], messages: [] });

    const result = await updateVideoMetadata(mockVideoId, {
      courseId: '789',
      lessonId: '101',
      title: 'Updated Title',
    });

    expect(result.meta).toEqual({
      courseId: '789',
      lessonId: '101',
      title: 'Updated Title',
    });

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
  });

  it('should handle update errors', async () => {
    mockFetchError([{ code: 1006, message: 'Invalid metadata' }]);

    await expect(
      updateVideoMetadata(mockVideoId, { invalid: 'data' })
    ).rejects.toThrow('Cloudflare API Error 1006: Invalid metadata');
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('generateThumbnailUrl', () => {
  it('should generate default thumbnail URL', () => {
    const url = generateThumbnailUrl(mockVideoId);

    expect(url).toBe(
      `https://videodelivery.net/${mockVideoId}/thumbnails/thumbnail.jpg`
    );
  });

  it('should generate thumbnail URL with time in seconds', () => {
    const url = generateThumbnailUrl(mockVideoId, 30);

    expect(url).toContain('time=30s');
  });

  it('should generate thumbnail URL with percentage', () => {
    const url = generateThumbnailUrl(mockVideoId, 0.5);

    expect(url).toContain('time=50pct');
  });
});

describe('generatePlaybackUrl', () => {
  it('should generate HLS URL by default', () => {
    const url = generatePlaybackUrl(mockVideoId);

    expect(url).toBe(
      `https://videodelivery.net/${mockVideoId}/manifest/video.m3u8`
    );
  });

  it('should generate HLS URL explicitly', () => {
    const url = generatePlaybackUrl(mockVideoId, 'hls');

    expect(url).toBe(
      `https://videodelivery.net/${mockVideoId}/manifest/video.m3u8`
    );
  });

  it('should generate DASH URL', () => {
    const url = generatePlaybackUrl(mockVideoId, 'dash');

    expect(url).toBe(
      `https://videodelivery.net/${mockVideoId}/manifest/video.mpd`
    );
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Error Handling', () => {
  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(getVideo(mockVideoId)).rejects.toThrow('Network error');
  });

  it('should handle malformed JSON response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    await expect(getVideo(mockVideoId)).rejects.toThrow('Invalid JSON');
  });

  it('should handle empty error array', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        errors: [],
        messages: [],
      }),
    });

    await expect(getVideo(mockVideoId)).rejects.toThrow(
      'Cloudflare API Error 0: Unknown error'
    );
  });
});

describe('Integration Scenarios', () => {
  it('should handle complete upload-to-playback workflow', async () => {
    // Upload
    const mockUploadedVideo = createMockVideoMetadata({
      readyToStream: false,
      status: { state: 'queued' },
    });
    mockFetchSuccess({ success: true, result: mockUploadedVideo, errors: [], messages: [] });

    const buffer = Buffer.from('video data');
    const uploaded = await uploadVideo({
      file: buffer,
      filename: 'course-intro.mp4',
      meta: { courseId: '123' },
    });

    expect(uploaded.uid).toBe(mockVideoId);

    // Check status (processing)
    const mockProcessingVideo = createMockVideoMetadata({
      readyToStream: false,
      status: { state: 'inprogress', pctComplete: '50' },
    });
    mockFetchSuccess({ success: true, result: mockProcessingVideo, errors: [], messages: [] });

    const status = await getVideoStatus(uploaded.uid);
    expect(status.state).toBe('inprogress');
    expect(status.percentComplete).toBe(50);

    // Check when ready
    const mockReadyVideo = createMockVideoMetadata();
    mockFetchSuccess({ success: true, result: mockReadyVideo, errors: [], messages: [] });

    const isReady = await isVideoReady(uploaded.uid);
    expect(isReady).toBe(true);

    // Get playback info
    mockFetchSuccess({ success: true, result: mockReadyVideo, errors: [], messages: [] });

    const playback = await getVideoPlaybackInfo(uploaded.uid);
    expect(playback.ready).toBe(true);
    expect(playback.hlsUrl).toBeTruthy();
  });

  it('should handle list and delete workflow', async () => {
    // List videos
    const mockVideos = [createMockVideoMetadata({ uid: 'video1' })];
    mockFetchSuccess({
      success: true,
      result: mockVideos,
      errors: [],
      messages: [],
      total: '1',
    });

    const list = await listVideos({ limit: 10 });
    expect(list.result).toHaveLength(1);

    // Delete video
    mockFetchSuccess({ success: true, errors: [] });

    const deleted = await deleteVideo(list.result[0].uid);
    expect(deleted).toBe(true);
  });
});
