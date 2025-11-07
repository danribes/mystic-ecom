/**
 * T127: Podcast Integration
 *
 * Comprehensive podcast management system including:
 * - Podcast CRUD operations (stored as digital_products with type='audio')
 * - Episode management for podcast series
 * - RSS feed generation for podcast syndication
 * - Audio file metadata handling
 * - Duration formatting and file size utilities
 *
 * Podcasts are stored in the digital_products table with product_type='audio'
 */

import pool from '@/lib/db';
import type { PoolClient } from 'pg';

/**
 * Podcast Interface
 * Represents a podcast or podcast series stored as a digital product
 */
export interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  fileUrl: string;
  fileSizeMb?: number;
  duration?: number; // Duration in seconds
  previewUrl?: string;
  imageUrl?: string;
  downloadLimit: number;
  isPublished: boolean;
  // Episode metadata (if part of a series)
  episodeNumber?: number;
  seasonNumber?: number;
  seriesId?: string;
  // Podcast-specific metadata
  author?: string;
  category?: string;
  explicit?: boolean;
  language?: string;
  // Multilingual support
  titleEs?: string;
  descriptionEs?: string;
  longDescriptionEs?: string;
  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Podcast Episode Interface
 * For managing episodes within a podcast series
 */
export interface PodcastEpisode {
  id: string;
  seriesId: string;
  title: string;
  slug: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  fileUrl: string;
  fileSizeMb: number;
  imageUrl?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Podcast Series Interface
 * For managing podcast series/shows
 */
export interface PodcastSeries {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  author: string;
  category: string;
  explicit: boolean;
  language: string;
  episodeCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RSS Feed Item for podcast syndication
 */
export interface RSSFeedItem {
  title: string;
  description: string;
  link: string;
  guid: string;
  pubDate: string;
  enclosureUrl: string;
  enclosureLength: number;
  enclosureType: string;
  duration: string; // HH:MM:SS format
  episodeNumber?: number;
  seasonNumber?: number;
  explicit?: boolean;
  author?: string;
}

/**
 * RSS Feed for podcast syndication
 */
export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  language: string;
  copyright: string;
  author: string;
  category: string;
  imageUrl: string;
  explicit: boolean;
  items: RSSFeedItem[];
}

/**
 * Create a new podcast
 */
export async function createPodcast(podcast: Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>): Promise<Podcast> {
  const query = `
    INSERT INTO digital_products (
      title, slug, description, price, product_type, file_url,
      file_size_mb, preview_url, image_url, download_limit, is_published,
      title_es, description_es, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, 'audio', $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING
      id, title, slug, description, price, product_type as "productType",
      file_url as "fileUrl", file_size_mb as "fileSizeMb",
      preview_url as "previewUrl", image_url as "imageUrl",
      download_limit as "downloadLimit", is_published as "isPublished",
      title_es as "titleEs", description_es as "descriptionEs",
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    podcast.title,
    podcast.slug,
    podcast.description,
    podcast.price,
    podcast.fileUrl,
    podcast.fileSizeMb || null,
    podcast.previewUrl || null,
    podcast.imageUrl || null,
    podcast.downloadLimit,
    podcast.isPublished,
    podcast.titleEs || null,
    podcast.descriptionEs || null,
  ];

  const result = await pool.query(query, values);
  const row = result.rows[0];

  // Parse numeric fields
  return {
    ...row,
    price: parseFloat(row.price),
    fileSizeMb: row.fileSizeMb ? parseFloat(row.fileSizeMb) : null,
  };
}

/**
 * Get podcast by ID
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  const query = `
    SELECT
      id, title, slug, description,
      price, product_type as "productType", file_url as "fileUrl",
      file_size_mb as "fileSizeMb", preview_url as "previewUrl",
      image_url as "imageUrl", download_limit as "downloadLimit",
      is_published as "isPublished", title_es as "titleEs",
      description_es as "descriptionEs", long_description_es as "longDescriptionEs",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM digital_products
    WHERE id = $1 AND product_type = 'audio'
  `;

  const result = await pool.query(query, [id]);
  const row = result.rows[0];

  if (!row) return null;

  // Parse numeric fields
  return {
    ...row,
    price: parseFloat(row.price),
    fileSizeMb: row.fileSizeMb ? parseFloat(row.fileSizeMb) : null,
  };
}

/**
 * Get podcast by slug
 */
export async function getPodcastBySlug(slug: string): Promise<Podcast | null> {
  const query = `
    SELECT
      id, title, slug, description,
      price, product_type as "productType", file_url as "fileUrl",
      file_size_mb as "fileSizeMb", preview_url as "previewUrl",
      image_url as "imageUrl", download_limit as "downloadLimit",
      is_published as "isPublished", title_es as "titleEs",
      description_es as "descriptionEs", long_description_es as "longDescriptionEs",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM digital_products
    WHERE slug = $1 AND product_type = 'audio'
  `;

  const result = await pool.query(query, [slug]);
  const row = result.rows[0];

  if (!row) return null;

  // Parse numeric fields
  return {
    ...row,
    price: parseFloat(row.price),
    fileSizeMb: row.fileSizeMb ? parseFloat(row.fileSizeMb) : null,
  };
}

/**
 * List all podcasts with optional filters
 */
export async function listPodcasts(options: {
  published?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'price';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{ podcasts: Podcast[]; total: number }> {
  const {
    published,
    limit = 50,
    offset = 0,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  let whereClause = "WHERE product_type = 'audio'";
  const values: any[] = [];
  let paramIndex = 1;

  if (published !== undefined) {
    whereClause += ` AND is_published = $${paramIndex}`;
    values.push(published);
    paramIndex++;
  }

  if (search) {
    whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    values.push(`%${search}%`);
    paramIndex++;
  }

  const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM digital_products
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total);

  // Get podcasts
  const query = `
    SELECT
      id, title, slug, description,
      price, product_type as "productType", file_url as "fileUrl",
      file_size_mb as "fileSizeMb", preview_url as "previewUrl",
      image_url as "imageUrl", download_limit as "downloadLimit",
      is_published as "isPublished", title_es as "titleEs",
      description_es as "descriptionEs", long_description_es as "longDescriptionEs",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM digital_products
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);

  // Parse numeric fields
  const podcasts = result.rows.map((row) => ({
    ...row,
    price: parseFloat(row.price),
    fileSizeMb: row.fileSizeMb ? parseFloat(row.fileSizeMb) : null,
  }));

  return {
    podcasts,
    total,
  };
}

/**
 * Update podcast
 */
export async function updatePodcast(
  id: string,
  updates: Partial<Omit<Podcast, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Podcast | null> {
  const allowedFields = [
    'title',
    'slug',
    'description',
    'price',
    'file_url',
    'file_size_mb',
    'preview_url',
    'image_url',
    'download_limit',
    'is_published',
    'title_es',
    'description_es',
  ];

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

    if (allowedFields.includes(snakeKey)) {
      setClauses.push(`${snakeKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (setClauses.length === 0) {
    return getPodcastById(id);
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE digital_products
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex} AND product_type = 'audio'
    RETURNING
      id, title, slug, description,
      price, product_type as "productType", file_url as "fileUrl",
      file_size_mb as "fileSizeMb", preview_url as "previewUrl",
      image_url as "imageUrl", download_limit as "downloadLimit",
      is_published as "isPublished", title_es as "titleEs",
      description_es as "descriptionEs", long_description_es as "longDescriptionEs",
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await pool.query(query, values);
  const row = result.rows[0];

  if (!row) return null;

  // Parse numeric fields
  return {
    ...row,
    price: parseFloat(row.price),
    fileSizeMb: row.fileSizeMb ? parseFloat(row.fileSizeMb) : null,
  };
}

/**
 * Delete podcast
 */
export async function deletePodcast(id: string): Promise<boolean> {
  const query = `
    DELETE FROM digital_products
    WHERE id = $1 AND product_type = 'audio'
    RETURNING id
  `;

  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }

  return `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Parse duration string (HH:MM:SS or MM:SS) to seconds
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(':').map((p) => parseInt(p, 10));

  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

/**
 * Format file size from MB to human-readable string
 */
export function formatFileSize(sizeMb: number): string {
  if (!sizeMb || sizeMb < 0) {
    return '0 MB';
  }

  if (sizeMb < 1) {
    return `${Math.round(sizeMb * 1024)} KB`;
  }

  if (sizeMb >= 1024) {
    return `${(sizeMb / 1024).toFixed(2)} GB`;
  }

  return `${sizeMb.toFixed(2)} MB`;
}

/**
 * Generate RSS feed for podcast syndication
 * Follows iTunes podcast RSS specification
 */
export async function generatePodcastRSSFeed(options: {
  siteUrl: string;
  title: string;
  description: string;
  author: string;
  category: string;
  imageUrl: string;
  language?: string;
  explicit?: boolean;
  copyright?: string;
  limit?: number;
}): Promise<string> {
  const {
    siteUrl,
    title,
    description,
    author,
    category,
    imageUrl,
    language = 'en',
    explicit = false,
    copyright = `© ${new Date().getFullYear()} ${author}`,
    limit = 100,
  } = options;

  // Get published podcasts
  const { podcasts } = await listPodcasts({
    published: true,
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Build RSS feed
  const rssItems = podcasts
    .map((podcast) => {
      const pubDate = podcast.createdAt.toUTCString();
      const duration = podcast.duration ? formatDuration(podcast.duration) : '00:00';
      const fileSize = podcast.fileSizeMb ? Math.round(podcast.fileSizeMb * 1024 * 1024) : 0;

      return `
    <item>
      <title><![CDATA[${podcast.title}]]></title>
      <description><![CDATA[${podcast.description}]]></description>
      <link>${siteUrl}/podcasts/${podcast.slug}</link>
      <guid isPermaLink="true">${siteUrl}/podcasts/${podcast.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${podcast.fileUrl}" length="${fileSize}" type="audio/mpeg" />
      <itunes:duration>${duration}</itunes:duration>
      <itunes:author>${author}</itunes:author>
      <itunes:explicit>${explicit ? 'yes' : 'no'}</itunes:explicit>
      ${podcast.imageUrl ? `<itunes:image href="${podcast.imageUrl}" />` : ''}
    </item>`;
    })
    .join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${siteUrl}</link>
    <language>${language}</language>
    <copyright>${copyright}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>${author}</itunes:author>
    <itunes:summary><![CDATA[${description}]]></itunes:summary>
    <itunes:category text="${category}" />
    <itunes:image href="${imageUrl}" />
    <itunes:explicit>${explicit ? 'yes' : 'no'}</itunes:explicit>
    <itunes:owner>
      <itunes:name>${author}</itunes:name>
    </itunes:owner>
    <atom:link href="${siteUrl}/podcasts/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  return rssFeed;
}

/**
 * Get podcast statistics
 */
export async function getPodcastStats(): Promise<{
  total: number;
  published: number;
  unpublished: number;
  totalDuration: number;
  totalFileSizeMb: number;
}> {
  const query = `
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_published = true) as published,
      COUNT(*) FILTER (WHERE is_published = false) as unpublished,
      COALESCE(SUM(file_size_mb), 0) as "totalFileSizeMb"
    FROM digital_products
    WHERE product_type = 'audio'
  `;

  const result = await pool.query(query);
  const stats = result.rows[0];

  return {
    total: parseInt(stats.total),
    published: parseInt(stats.published),
    unpublished: parseInt(stats.unpublished),
    totalDuration: 0, // Would need separate duration column
    totalFileSizeMb: parseFloat(stats.totalFileSizeMb),
  };
}

/**
 * Validate podcast data
 */
export function validatePodcast(podcast: Partial<Podcast>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!podcast.title || podcast.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!podcast.slug || podcast.slug.trim().length === 0) {
    errors.push('Slug is required');
  }

  if (!podcast.description || podcast.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (podcast.price !== undefined && podcast.price < 0) {
    errors.push('Price must be non-negative');
  }

  if (!podcast.fileUrl || podcast.fileUrl.trim().length === 0) {
    errors.push('File URL is required');
  }

  if (podcast.fileSizeMb !== undefined && podcast.fileSizeMb < 0) {
    errors.push('File size must be non-negative');
  }

  if (podcast.downloadLimit !== undefined && podcast.downloadLimit < 0) {
    errors.push('Download limit must be non-negative');
  }

  // Validate URL format
  if (podcast.fileUrl) {
    try {
      new URL(podcast.fileUrl);
    } catch {
      errors.push('File URL must be a valid URL');
    }
  }

  if (podcast.previewUrl) {
    try {
      new URL(podcast.previewUrl);
    } catch {
      errors.push('Preview URL must be a valid URL');
    }
  }

  if (podcast.imageUrl) {
    try {
      new URL(podcast.imageUrl);
    } catch {
      errors.push('Image URL must be a valid URL');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate unique slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if slug is unique
 */
export async function isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  let query = `
    SELECT COUNT(*) as count
    FROM digital_products
    WHERE slug = $1 AND product_type = 'audio'
  `;
  const values: any[] = [slug];

  if (excludeId) {
    query += ` AND id != $2`;
    values.push(excludeId);
  }

  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count) === 0;
}
