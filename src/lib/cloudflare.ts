/**
 * Cloudflare Stream API Integration
 *
 * This module provides functions for interacting with Cloudflare Stream,
 * a video hosting and streaming platform with global CDN delivery.
 *
 * Features:
 * - Video upload (TUS resumable uploads)
 * - Video metadata retrieval
 * - Video listing with pagination
 * - Video deletion
 * - Playback URL generation (HLS/DASH)
 * - Thumbnail generation
 * - Error handling for rate limits and network issues
 *
 * API Documentation: https://developers.cloudflare.com/stream/
 *
 * @module cloudflare
 */

import { logError } from './errors';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
}

export interface VideoMetadata {
  uid: string;
  thumbnail?: string;
  thumbnailTimestampPct?: number;
  readyToStream: boolean;
  status: {
    state: 'queued' | 'inprogress' | 'ready' | 'error';
    pctComplete?: string;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  meta?: Record<string, string>;
  created: string;
  modified: string;
  size?: number;
  preview?: string;
  allowedOrigins?: string[];
  requireSignedURLs: boolean;
  uploaded: string;
  uploadExpiry?: string;
  maxSizeSeconds?: number;
  maxDurationSeconds?: number;
  duration: number;
  input: {
    width?: number;
    height?: number;
  };
  playback?: {
    hls: string;
    dash: string;
  };
  watermark?: {
    uid: string;
  };
}

export interface UploadVideoOptions {
  file: File | Buffer;
  filename: string;
  meta?: Record<string, string>;
  requireSignedURLs?: boolean;
  allowedOrigins?: string[];
  thumbnailTimestampPct?: number;
  watermarkUid?: string;
  maxDurationSeconds?: number;
}

export interface ListVideosOptions {
  limit?: number;
  after?: string;
  before?: string;
  search?: string;
  status?: 'queued' | 'inprogress' | 'ready' | 'error';
  creator?: string;
}

export interface ListVideosResponse {
  result: VideoMetadata[];
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  range?: {
    unit: string;
    value: string;
  };
  total?: string;
}

export interface UploadResponse {
  result: VideoMetadata;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

export interface VideoPlaybackInfo {
  uid: string;
  hlsUrl: string;
  dashUrl: string;
  thumbnailUrl?: string;
  duration: number;
  ready: boolean;
}

export interface CloudflareError {
  code: number;
  message: string;
}

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = 'https://api.cloudflare.com/client/v4';

/**
 * Get Cloudflare configuration from environment variables
 *
 * @throws {Error} If required environment variables are not set
 */
export function getCloudflareConfig(): CloudflareConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID environment variable is not set. ' +
      'Get your account ID from https://dash.cloudflare.com/'
    );
  }

  if (!apiToken) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN environment variable is not set. ' +
      'Create an API token at https://dash.cloudflare.com/profile/api-tokens with Stream:Edit permissions'
    );
  }

  return { accountId, apiToken };
}

/**
 * Create request headers with authentication
 */
function getHeaders(apiToken: string, contentType?: string): HeadersInit {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${apiToken}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
}

/**
 * Handle Cloudflare API errors
 */
function handleCloudflareError(errors: CloudflareError[]): never {
  const error = errors[0] || { code: 0, message: 'Unknown error' };
  const errorMessage = `Cloudflare API Error ${error.code}: ${error.message}`;

  logError(new Error(errorMessage), {
    context: 'cloudflare-api',
    errors,
  });

  throw new Error(errorMessage);
}

// ============================================================================
// Core API Functions
// ============================================================================

/**
 * Create a TUS upload URL for resumable uploads
 *
 * This is the recommended method for uploading videos > 200MB.
 * Returns a TUS upload URL that can be used with a TUS client.
 *
 * @param options - Upload options (without file)
 * @returns TUS upload URL and video UID
 *
 * @example
 * ```typescript
 * const { tusUrl, videoId } = await createTusUpload({
 *   filename: 'large-video.mp4',
 *   meta: { courseId: '123', lessonId: '456' },
 *   maxDurationSeconds: 3600
 * });
 *
 * // Use TUS client to upload to tusUrl
 * // Video will be assigned the returned videoId
 * ```
 */
export async function createTusUpload(
  options: Omit<UploadVideoOptions, 'file'>
): Promise<{ tusUrl: string; videoId: string; expiresAt: string }> {
  try {
    const config = getCloudflareConfig();
    const url = `${BASE_URL}/accounts/${config.accountId}/stream?direct_upload=true`;

    const body: Record<string, any> = {
      maxDurationSeconds: options.maxDurationSeconds || 21600, // 6 hours default
    };

    if (options.meta) {
      body.meta = options.meta;
    }

    if (options.requireSignedURLs !== undefined) {
      body.requireSignedURLs = options.requireSignedURLs;
    }

    if (options.allowedOrigins) {
      body.allowedOrigins = options.allowedOrigins;
    }

    if (options.thumbnailTimestampPct !== undefined) {
      body.thumbnailTimestampPct = options.thumbnailTimestampPct;
    }

    if (options.watermarkUid) {
      body.watermark = { uid: options.watermarkUid };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(config.apiToken, 'application/json'),
      body: JSON.stringify(body),
    });

    const data: {
      success: boolean;
      result: {
        uid: string;
        uploadLink: string;
        watermark?: { uid: string };
      };
      errors: CloudflareError[];
    } = await response.json();

    if (!data.success) {
      handleCloudflareError(data.errors);
    }

    // Extract expiry from upload link (TUS link expires after 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return {
      tusUrl: data.result.uploadLink,
      videoId: data.result.uid,
      expiresAt,
    };
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-create-tus-upload',
      filename: options.filename,
    });
    throw error;
  }
}

/**
 * Upload a video to Cloudflare Stream
 *
 * Uses direct upload via multipart/form-data for files up to 200MB.
 * For larger files, use createTusUpload() for resumable uploads.
 *
 * @param options - Upload options including file and metadata
 * @returns Video metadata including UID
 *
 * @example
 * ```typescript
 * const result = await uploadVideo({
 *   file: videoFile,
 *   filename: 'course-intro.mp4',
 *   meta: {
 *     courseId: '123',
 *     lessonId: '456',
 *     title: 'Introduction to Meditation'
 *   },
 *   requireSignedURLs: true
 * });
 *
 * console.log('Video uploaded:', result.uid);
 * ```
 */
export async function uploadVideo(
  options: UploadVideoOptions
): Promise<VideoMetadata> {
  try {
    const config = getCloudflareConfig();
    const url = `${BASE_URL}/accounts/${config.accountId}/stream`;

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add file
    if (options.file instanceof Buffer) {
      const blob = new Blob([options.file]);
      formData.append('file', blob, options.filename);
    } else {
      formData.append('file', options.file, options.filename);
    }

    // Add metadata
    if (options.meta) {
      formData.append('meta', JSON.stringify(options.meta));
    }

    // Add optional parameters
    if (options.requireSignedURLs !== undefined) {
      formData.append('requireSignedURLs', String(options.requireSignedURLs));
    }

    if (options.allowedOrigins) {
      formData.append('allowedOrigins', options.allowedOrigins.join(','));
    }

    if (options.thumbnailTimestampPct !== undefined) {
      formData.append('thumbnailTimestampPct', String(options.thumbnailTimestampPct));
    }

    if (options.watermarkUid) {
      formData.append('watermark', options.watermarkUid);
    }

    if (options.maxDurationSeconds) {
      formData.append('maxDurationSeconds', String(options.maxDurationSeconds));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
      },
      body: formData,
    });

    const data: UploadResponse = await response.json();

    if (!data.success) {
      handleCloudflareError(data.errors);
    }

    return data.result;
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-upload-video',
      filename: options.filename,
    });
    throw error;
  }
}

/**
 * Retrieve video metadata and status
 *
 * @param videoId - Cloudflare Stream video UID
 * @returns Video metadata including processing status and playback URLs
 *
 * @example
 * ```typescript
 * const video = await getVideo('abc123');
 *
 * if (video.status.state === 'ready') {
 *   console.log('Video is ready:', video.playback?.hls);
 * } else {
 *   console.log('Processing:', video.status.pctComplete);
 * }
 * ```
 */
export async function getVideo(videoId: string): Promise<VideoMetadata> {
  try {
    const config = getCloudflareConfig();
    const url = `${BASE_URL}/accounts/${config.accountId}/stream/${videoId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(config.apiToken),
    });

    const data: UploadResponse = await response.json();

    if (!data.success) {
      handleCloudflareError(data.errors);
    }

    return data.result;
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-get-video',
      videoId,
    });
    throw error;
  }
}

/**
 * List videos with optional filtering and pagination
 *
 * @param options - Filtering and pagination options
 * @returns List of videos with pagination metadata
 *
 * @example
 * ```typescript
 * // Get first 50 ready videos
 * const result = await listVideos({
 *   limit: 50,
 *   status: 'ready'
 * });
 *
 * console.log(`Found ${result.total} videos`);
 *
 * // Get next page
 * if (result.range) {
 *   const nextPage = await listVideos({
 *     limit: 50,
 *     after: result.result[result.result.length - 1].uid
 *   });
 * }
 * ```
 */
export async function listVideos(
  options: ListVideosOptions = {}
): Promise<ListVideosResponse> {
  try {
    const config = getCloudflareConfig();
    const url = new URL(`${BASE_URL}/accounts/${config.accountId}/stream`);

    // Add query parameters
    if (options.limit) {
      url.searchParams.append('limit', String(options.limit));
    }

    if (options.after) {
      url.searchParams.append('after', options.after);
    }

    if (options.before) {
      url.searchParams.append('before', options.before);
    }

    if (options.search) {
      url.searchParams.append('search', options.search);
    }

    if (options.status) {
      url.searchParams.append('status', options.status);
    }

    if (options.creator) {
      url.searchParams.append('creator', options.creator);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(config.apiToken),
    });

    const data: ListVideosResponse = await response.json();

    if (!data.success) {
      handleCloudflareError(data.errors);
    }

    return data;
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-list-videos',
      options,
    });
    throw error;
  }
}

/**
 * Delete a video from Cloudflare Stream
 *
 * This permanently removes the video and all associated data.
 * This action cannot be undone.
 *
 * @param videoId - Cloudflare Stream video UID
 * @returns True if deletion was successful
 *
 * @example
 * ```typescript
 * const deleted = await deleteVideo('abc123');
 *
 * if (deleted) {
 *   console.log('Video deleted successfully');
 * }
 * ```
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    const config = getCloudflareConfig();
    const url = `${BASE_URL}/accounts/${config.accountId}/stream/${videoId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(config.apiToken),
    });

    const data: { success: boolean; errors: CloudflareError[] } = await response.json();

    if (!data.success) {
      handleCloudflareError(data.errors);
    }

    return data.success;
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-delete-video',
      videoId,
    });
    throw error;
  }
}

/**
 * Get video playback information
 *
 * Returns URLs for HLS and DASH playback, thumbnail, and metadata
 * needed for video player integration.
 *
 * @param videoId - Cloudflare Stream video UID
 * @returns Playback information including streaming URLs
 *
 * @example
 * ```typescript
 * const playback = await getVideoPlaybackInfo('abc123');
 *
 * if (playback.ready) {
 *   // Use with video player
 *   videoPlayer.src = playback.hlsUrl;
 *   videoPlayer.poster = playback.thumbnailUrl;
 * } else {
 *   console.log('Video is still processing...');
 * }
 * ```
 */
export async function getVideoPlaybackInfo(
  videoId: string
): Promise<VideoPlaybackInfo> {
  try {
    const video = await getVideo(videoId);

    if (!video.playback) {
      return {
        uid: video.uid,
        hlsUrl: '',
        dashUrl: '',
        thumbnailUrl: video.thumbnail,
        duration: video.duration || 0,
        ready: false,
      };
    }

    return {
      uid: video.uid,
      hlsUrl: video.playback.hls,
      dashUrl: video.playback.dash,
      thumbnailUrl: video.thumbnail,
      duration: video.duration || 0,
      ready: video.readyToStream,
    };
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-get-playback-info',
      videoId,
    });
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if video is ready for playback
 *
 * @param videoId - Cloudflare Stream video UID
 * @returns True if video is ready to stream
 */
export async function isVideoReady(videoId: string): Promise<boolean> {
  try {
    const video = await getVideo(videoId);
    return video.readyToStream && video.status.state === 'ready';
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-is-video-ready',
      videoId,
    });
    return false;
  }
}

/**
 * Get video processing status
 *
 * @param videoId - Cloudflare Stream video UID
 * @returns Processing status information
 */
export async function getVideoStatus(videoId: string): Promise<{
  state: string;
  percentComplete: number;
  errorMessage?: string;
}> {
  try {
    const video = await getVideo(videoId);

    return {
      state: video.status.state,
      percentComplete: video.status.pctComplete
        ? parseFloat(video.status.pctComplete)
        : 0,
      errorMessage: video.status.errorReasonText,
    };
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-get-video-status',
      videoId,
    });
    throw error;
  }
}

/**
 * Update video metadata
 *
 * @param videoId - Cloudflare Stream video UID
 * @param meta - Metadata to update
 * @returns Updated video metadata
 */
export async function updateVideoMetadata(
  videoId: string,
  meta: Record<string, string>
): Promise<VideoMetadata> {
  try {
    const config = getCloudflareConfig();
    const url = `${BASE_URL}/accounts/${config.accountId}/stream/${videoId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(config.apiToken, 'application/json'),
      body: JSON.stringify({ meta }),
    });

    const data: UploadResponse = await response.json();

    if (!data.success) {
      handleCloudflareError(data.errors);
    }

    return data.result;
  } catch (error) {
    logError(error as Error, {
      context: 'cloudflare-update-video-metadata',
      videoId,
      meta,
    });
    throw error;
  }
}

/**
 * Generate thumbnail URL with custom timestamp
 *
 * @param videoId - Cloudflare Stream video UID
 * @param time - Time in seconds (or percentage if between 0-1)
 * @returns Thumbnail URL
 */
export function generateThumbnailUrl(
  videoId: string,
  time?: number
): string {
  const baseUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;

  if (time !== undefined) {
    const timeParam = time < 1 ? `${time * 100}pct` : `${time}s`;
    return `${baseUrl}?time=${timeParam}`;
  }

  return baseUrl;
}

/**
 * Generate direct playback URL
 *
 * @param videoId - Cloudflare Stream video UID
 * @param format - 'hls' or 'dash'
 * @returns Playback URL
 */
export function generatePlaybackUrl(
  videoId: string,
  format: 'hls' | 'dash' = 'hls'
): string {
  if (format === 'dash') {
    return `https://videodelivery.net/${videoId}/manifest/video.mpd`;
  }
  return `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  getCloudflareConfig,
  createTusUpload,
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
};
