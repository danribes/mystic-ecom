/**
 * T128: Digital Book Reader Functionality
 *
 * Comprehensive ebook management system including:
 * - Ebook CRUD operations (stored as digital_products with type='ebook')
 * - Reading progress tracking
 * - Bookmark management
 * - Table of contents support
 * - Format detection (PDF, EPUB, MOBI)
 *
 * Ebooks are stored in the digital_products table with product_type='ebook'
 */

import pool from '@/lib/db';
import type { PoolClient } from 'pg';

/**
 * Ebook Format Types
 */
export type EbookFormat = 'pdf' | 'epub' | 'mobi' | 'azw' | 'txt' | 'html';

/**
 * Ebook Interface
 * Represents a digital book stored as a digital product
 */
export interface Ebook {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  fileUrl: string;
  fileSizeMb?: number;
  format?: EbookFormat;
  pageCount?: number;
  isbn?: string;
  author?: string;
  publisher?: string;
  publishedYear?: number;
  language?: string;
  previewUrl?: string;
  imageUrl?: string; // Cover image
  downloadLimit: number;
  isPublished: boolean;
  // Multilingual support
  titleEs?: string;
  descriptionEs?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reading Progress Interface
 * Tracks user's reading progress for an ebook
 */
export interface ReadingProgress {
  id: string;
  userId: string;
  ebookId: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bookmark Interface
 * User bookmarks for specific pages/locations
 */
export interface Bookmark {
  id: string;
  userId: string;
  ebookId: string;
  page: number;
  location?: string; // For EPUB (location string)
  note?: string;
  createdAt: Date;
}

/**
 * Table of Contents Entry
 */
export interface TOCEntry {
  title: string;
  page: number;
  level: number; // Heading level (1, 2, 3)
  children?: TOCEntry[];
}

/**
 * Create a new ebook
 */
export async function createEbook(ebook: Omit<Ebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ebook> {
  const query = `
    INSERT INTO digital_products (
      title, slug, description, price, product_type, file_url,
      file_size_mb, preview_url, image_url, download_limit, is_published,
      title_es, description_es, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, 'ebook', $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING
      id, title, slug, description, price, product_type as "productType",
      file_url as "fileUrl", file_size_mb as "fileSizeMb",
      preview_url as "previewUrl", image_url as "imageUrl",
      download_limit as "downloadLimit", is_published as "isPublished",
      title_es as "titleEs", description_es as "descriptionEs",
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    ebook.title,
    ebook.slug,
    ebook.description,
    ebook.price,
    ebook.fileUrl,
    ebook.fileSizeMb || null,
    ebook.previewUrl || null,
    ebook.imageUrl || null,
    ebook.downloadLimit,
    ebook.isPublished,
    ebook.titleEs || null,
    ebook.descriptionEs || null,
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
 * Get ebook by ID
 */
export async function getEbookById(id: string): Promise<Ebook | null> {
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
    WHERE id = $1 AND product_type = 'ebook'
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
 * Get ebook by slug
 */
export async function getEbookBySlug(slug: string): Promise<Ebook | null> {
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
    WHERE slug = $1 AND product_type = 'ebook'
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
 * List all ebooks with optional filters
 */
export async function listEbooks(options: {
  published?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'price';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{ ebooks: Ebook[]; total: number }> {
  const {
    published,
    limit = 50,
    offset = 0,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  let whereClause = "WHERE product_type = 'ebook'";
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

  // Get ebooks
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
  const ebooks = result.rows.map((row) => ({
    ...row,
    price: parseFloat(row.price),
    fileSizeMb: row.fileSizeMb ? parseFloat(row.fileSizeMb) : null,
  }));

  return {
    ebooks,
    total,
  };
}

/**
 * Update ebook
 */
export async function updateEbook(
  id: string,
  updates: Partial<Omit<Ebook, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Ebook | null> {
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
    return getEbookById(id);
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE digital_products
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex} AND product_type = 'ebook'
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
 * Delete ebook
 */
export async function deleteEbook(id: string): Promise<boolean> {
  const query = `
    DELETE FROM digital_products
    WHERE id = $1 AND product_type = 'ebook'
    RETURNING id
  `;

  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}

/**
 * Detect ebook format from file URL or extension
 */
export function detectEbookFormat(fileUrl: string): EbookFormat | null {
  const url = fileUrl.toLowerCase();

  if (url.endsWith('.pdf')) return 'pdf';
  if (url.endsWith('.epub')) return 'epub';
  if (url.endsWith('.mobi')) return 'mobi';
  if (url.endsWith('.azw') || url.endsWith('.azw3')) return 'azw';
  if (url.endsWith('.txt')) return 'txt';
  if (url.endsWith('.html') || url.endsWith('.htm')) return 'html';

  return null;
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
 * Get ebook statistics
 */
export async function getEbookStats(): Promise<{
  total: number;
  published: number;
  unpublished: number;
  totalFileSizeMb: number;
}> {
  const query = `
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_published = true) as published,
      COUNT(*) FILTER (WHERE is_published = false) as unpublished,
      COALESCE(SUM(file_size_mb), 0) as "totalFileSizeMb"
    FROM digital_products
    WHERE product_type = 'ebook'
  `;

  const result = await pool.query(query);
  const stats = result.rows[0];

  return {
    total: parseInt(stats.total),
    published: parseInt(stats.published),
    unpublished: parseInt(stats.unpublished),
    totalFileSizeMb: parseFloat(stats.totalFileSizeMb),
  };
}

/**
 * Validate ebook data
 */
export function validateEbook(ebook: Partial<Ebook>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ebook.title || ebook.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!ebook.slug || ebook.slug.trim().length === 0) {
    errors.push('Slug is required');
  }

  if (!ebook.description || ebook.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (ebook.price !== undefined && ebook.price < 0) {
    errors.push('Price must be non-negative');
  }

  if (!ebook.fileUrl || ebook.fileUrl.trim().length === 0) {
    errors.push('File URL is required');
  }

  if (ebook.fileSizeMb !== undefined && ebook.fileSizeMb < 0) {
    errors.push('File size must be non-negative');
  }

  if (ebook.downloadLimit !== undefined && ebook.downloadLimit < 0) {
    errors.push('Download limit must be non-negative');
  }

  // Validate URL format
  if (ebook.fileUrl) {
    try {
      new URL(ebook.fileUrl);
    } catch {
      errors.push('File URL must be a valid URL');
    }
  }

  if (ebook.previewUrl) {
    try {
      new URL(ebook.previewUrl);
    } catch {
      errors.push('Preview URL must be a valid URL');
    }
  }

  if (ebook.imageUrl) {
    try {
      new URL(ebook.imageUrl);
    } catch {
      errors.push('Image URL must be a valid URL');
    }
  }

  // Validate ISBN format (if provided)
  if (ebook.isbn) {
    const isbn = ebook.isbn.replace(/[-\s]/g, '');
    if (!/^\d{10}(\d{3})?$/.test(isbn)) {
      errors.push('ISBN must be 10 or 13 digits');
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
    WHERE slug = $1 AND product_type = 'ebook'
  `;
  const values: any[] = [slug];

  if (excludeId) {
    query += ` AND id != $2`;
    values.push(excludeId);
  }

  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count) === 0;
}

/**
 * Format ISBN (add hyphens)
 */
export function formatISBN(isbn: string): string {
  const digits = isbn.replace(/[-\s]/g, '');

  if (digits.length === 10) {
    // ISBN-10: 0-306-40615-2
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  } else if (digits.length === 13) {
    // ISBN-13: 978-0-306-40615-7
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 12)}-${digits.slice(12)}`;
  }

  return isbn;
}

/**
 * Parse ISBN from various formats
 */
export function parseISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}
