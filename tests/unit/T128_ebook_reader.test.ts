/**
 * T128: Digital Book Reader Functionality - Test Suite
 *
 * Tests for ebook management system including CRUD operations and utilities
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import pool from '../../src/lib/db';
import {
  createEbook,
  getEbookById,
  getEbookBySlug,
  listEbooks,
  updateEbook,
  deleteEbook,
  detectEbookFormat,
  formatFileSize,
  getEbookStats,
  validateEbook,
  generateSlug,
  isSlugUnique,
  formatISBN,
  parseISBN,
  type Ebook,
} from '@/lib/ebook';

describe('T128: Digital Book Reader Functionality', () => {
  // Test data
  const testEbook1 = {
    title: 'The Mindful Way Through Depression',
    slug: 'mindful-way-through-depression',
    description: 'A comprehensive guide to managing depression through mindfulness',
    price: 19.99,
    fileUrl: 'https://example.com/ebooks/mindful-depression.pdf',
    fileSizeMb: 12.5,
    previewUrl: 'https://example.com/previews/mindful-depression-preview.pdf',
    imageUrl: 'https://example.com/images/mindful-depression.jpg',
    downloadLimit: 5,
    isPublished: true,
    titleEs: 'El Camino Consciente a Través de la Depresión',
    descriptionEs: 'Una guía completa para manejar la depresión a través de la atención plena',
  };

  const testEbook2 = {
    title: 'Introduction to Meditation',
    slug: 'introduction-to-meditation',
    description: 'A beginner-friendly guide to meditation practices',
    price: 14.99,
    fileUrl: 'https://example.com/ebooks/intro-meditation.epub',
    fileSizeMb: 8.3,
    downloadLimit: 5,
    isPublished: false,
  };

  // Cleanup helper
  async function cleanupTestData() {
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM digital_products WHERE product_type = 'ebook' AND slug LIKE 'mindful-%'`
      );
      await client.query(
        `DELETE FROM digital_products WHERE product_type = 'ebook' AND slug LIKE 'test-ebook-%'`
      );
      await client.query(
        `DELETE FROM digital_products WHERE product_type = 'ebook' AND slug LIKE 'introduction-%'`
      );
    } finally {
      client.release();
    }
  }

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  describe('CRUD Operations', () => {
    describe('createEbook', () => {
      it('should create a new ebook successfully', async () => {
        const ebook = await createEbook(testEbook1);

        expect(ebook).toBeDefined();
        expect(ebook.id).toBeDefined();
        expect(ebook.title).toBe(testEbook1.title);
        expect(ebook.slug).toBe(testEbook1.slug);
        expect(ebook.description).toBe(testEbook1.description);
        expect(ebook.price).toBe(testEbook1.price);
        expect(ebook.fileUrl).toBe(testEbook1.fileUrl);
        expect(ebook.fileSizeMb).toBe(testEbook1.fileSizeMb);
        expect(ebook.isPublished).toBe(testEbook1.isPublished);
        expect(ebook.createdAt).toBeDefined();
        expect(ebook.updatedAt).toBeDefined();
      });

      it('should create ebook with minimal required fields', async () => {
        const minimalEbook = {
          title: 'Minimal Ebook',
          slug: 'test-ebook-minimal',
          description: 'A minimal ebook',
          price: 0,
          fileUrl: 'https://example.com/ebooks/minimal.pdf',
          downloadLimit: 5,
          isPublished: false,
        };

        const ebook = await createEbook(minimalEbook);

        expect(ebook).toBeDefined();
        expect(ebook.title).toBe(minimalEbook.title);
        expect(ebook.fileSizeMb).toBeNull();
      });

      it('should throw error for duplicate slug', async () => {
        await createEbook(testEbook1);
        await expect(createEbook(testEbook1)).rejects.toThrow();
      });
    });

    describe('getEbookById', () => {
      it('should retrieve ebook by ID', async () => {
        const created = await createEbook(testEbook1);
        const retrieved = await getEbookById(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.title).toBe(testEbook1.title);
      });

      it('should return null for non-existent ID', async () => {
        const retrieved = await getEbookById('00000000-0000-0000-0000-000000000000');
        expect(retrieved).toBeNull();
      });
    });

    describe('getEbookBySlug', () => {
      it('should retrieve ebook by slug', async () => {
        await createEbook(testEbook1);
        const retrieved = await getEbookBySlug(testEbook1.slug);

        expect(retrieved).toBeDefined();
        expect(retrieved?.slug).toBe(testEbook1.slug);
      });

      it('should return null for non-existent slug', async () => {
        const retrieved = await getEbookBySlug('non-existent-slug');
        expect(retrieved).toBeNull();
      });
    });

    describe('listEbooks', () => {
      it('should list all ebooks', async () => {
        await createEbook(testEbook1);
        await createEbook(testEbook2);

        const result = await listEbooks();

        expect(result.ebooks).toBeDefined();
        expect(result.ebooks.length).toBeGreaterThanOrEqual(2);
        expect(result.total).toBeGreaterThanOrEqual(2);
      });

      it('should filter by published status', async () => {
        await createEbook(testEbook1);
        await createEbook(testEbook2);

        const publishedResult = await listEbooks({ published: true });
        const unpublishedResult = await listEbooks({ published: false });

        expect(publishedResult.ebooks.every((e) => e.isPublished)).toBe(true);
        expect(unpublishedResult.ebooks.every((e) => !e.isPublished)).toBe(true);
      });

      it('should support pagination', async () => {
        await createEbook(testEbook1);
        await createEbook(testEbook2);

        const page1 = await listEbooks({ limit: 1, offset: 0 });
        const page2 = await listEbooks({ limit: 1, offset: 1 });

        expect(page1.ebooks.length).toBe(1);
        expect(page2.ebooks.length).toBe(1);
        expect(page1.ebooks[0].id).not.toBe(page2.ebooks[0].id);
      });

      it('should support search', async () => {
        await createEbook(testEbook1);
        await createEbook(testEbook2);

        const result = await listEbooks({ search: 'Depression' });

        expect(result.ebooks.length).toBeGreaterThanOrEqual(1);
        expect(result.ebooks.some((e) => e.title.includes('Depression'))).toBe(true);
      });

      it('should support sorting', async () => {
        await createEbook(testEbook1);
        await createEbook(testEbook2);

        const ascResult = await listEbooks({ sortBy: 'title', sortOrder: 'asc' });
        const descResult = await listEbooks({ sortBy: 'title', sortOrder: 'desc' });

        expect(ascResult.ebooks).toBeDefined();
        expect(descResult.ebooks).toBeDefined();
      });
    });

    describe('updateEbook', () => {
      it('should update ebook successfully', async () => {
        const created = await createEbook(testEbook1);

        const updated = await updateEbook(created.id, {
          title: 'Updated Title',
          price: 24.99,
          isPublished: false,
        });

        expect(updated).toBeDefined();
        expect(updated?.title).toBe('Updated Title');
        expect(updated?.price).toBe(24.99);
        expect(updated?.isPublished).toBe(false);
      });

      it('should return null for non-existent ebook', async () => {
        const updated = await updateEbook('00000000-0000-0000-0000-000000000000', {
          title: 'Updated Title',
        });

        expect(updated).toBeNull();
      });
    });

    describe('deleteEbook', () => {
      it('should delete ebook successfully', async () => {
        const created = await createEbook(testEbook1);

        const deleted = await deleteEbook(created.id);

        expect(deleted).toBe(true);

        const retrieved = await getEbookById(created.id);
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent ebook', async () => {
        const deleted = await deleteEbook('00000000-0000-0000-0000-000000000000');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('detectEbookFormat', () => {
      it('should detect PDF format', () => {
        expect(detectEbookFormat('https://example.com/book.pdf')).toBe('pdf');
        expect(detectEbookFormat('https://example.com/book.PDF')).toBe('pdf');
      });

      it('should detect EPUB format', () => {
        expect(detectEbookFormat('https://example.com/book.epub')).toBe('epub');
      });

      it('should detect MOBI format', () => {
        expect(detectEbookFormat('https://example.com/book.mobi')).toBe('mobi');
      });

      it('should detect AZW format', () => {
        expect(detectEbookFormat('https://example.com/book.azw')).toBe('azw');
        expect(detectEbookFormat('https://example.com/book.azw3')).toBe('azw');
      });

      it('should detect TXT format', () => {
        expect(detectEbookFormat('https://example.com/book.txt')).toBe('txt');
      });

      it('should detect HTML format', () => {
        expect(detectEbookFormat('https://example.com/book.html')).toBe('html');
        expect(detectEbookFormat('https://example.com/book.htm')).toBe('html');
      });

      it('should return null for unknown format', () => {
        expect(detectEbookFormat('https://example.com/book.unknown')).toBeNull();
      });
    });

    describe('formatFileSize', () => {
      it('should format MB to human-readable string', () => {
        expect(formatFileSize(0)).toBe('0 MB');
        expect(formatFileSize(0.5)).toBe('512 KB');
        expect(formatFileSize(12.5)).toBe('12.50 MB');
      });

      it('should format large files to GB', () => {
        expect(formatFileSize(1024)).toBe('1.00 GB');
        expect(formatFileSize(2048)).toBe('2.00 GB');
      });

      it('should handle invalid values', () => {
        expect(formatFileSize(-10)).toBe('0 MB');
        expect(formatFileSize(NaN)).toBe('0 MB');
      });
    });

    describe('generateSlug', () => {
      it('should generate slug from title', () => {
        expect(generateSlug('Hello World')).toBe('hello-world');
        expect(generateSlug('The Mindful Way')).toBe('the-mindful-way');
      });

      it('should handle special characters', () => {
        expect(generateSlug('Test & Example')).toBe('test-example');
        expect(generateSlug('Test@Example.com')).toBe('testexamplecom');
      });

      it('should handle multiple spaces', () => {
        expect(generateSlug('Test   Multiple   Spaces')).toBe('test-multiple-spaces');
      });
    });

    describe('isSlugUnique', () => {
      it('should return true for unique slug', async () => {
        const isUnique = await isSlugUnique('unique-slug-test');
        expect(isUnique).toBe(true);
      });

      it('should return false for existing slug', async () => {
        await createEbook(testEbook1);
        const isUnique = await isSlugUnique(testEbook1.slug);
        expect(isUnique).toBe(false);
      });

      it('should exclude specific ID from check', async () => {
        const created = await createEbook(testEbook1);
        const isUnique = await isSlugUnique(testEbook1.slug, created.id);
        expect(isUnique).toBe(true);
      });
    });

    describe('validateEbook', () => {
      it('should validate complete ebook data', () => {
        const result = validateEbook(testEbook1);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should require title', () => {
        const result = validateEbook({ ...testEbook1, title: '' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Title is required');
      });

      it('should require slug', () => {
        const result = validateEbook({ ...testEbook1, slug: '' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Slug is required');
      });

      it('should require description', () => {
        const result = validateEbook({ ...testEbook1, description: '' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Description is required');
      });

      it('should validate URL format', () => {
        const result = validateEbook({ ...testEbook1, fileUrl: 'not-a-url' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('File URL must be a valid URL');
      });

      it('should validate ISBN format', () => {
        const result = validateEbook({
          ...testEbook1,
          isbn: 'invalid-isbn',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('ISBN must be 10 or 13 digits');
      });
    });

    describe('formatISBN', () => {
      it('should format ISBN-10', () => {
        expect(formatISBN('0306406152')).toBe('0-306-40615-2');
      });

      it('should format ISBN-13', () => {
        expect(formatISBN('9780306406157')).toBe('978-0-306-40615-7');
      });

      it('should handle already formatted ISBN', () => {
        expect(formatISBN('0-306-40615-2')).toBe('0-306-40615-2');
      });

      it('should return original for invalid length', () => {
        expect(formatISBN('12345')).toBe('12345');
      });
    });

    describe('parseISBN', () => {
      it('should remove hyphens and spaces', () => {
        expect(parseISBN('0-306-40615-2')).toBe('0306406152');
        expect(parseISBN('978-0-306-40615-7')).toBe('9780306406157');
        expect(parseISBN('0 306 40615 2')).toBe('0306406152');
      });
    });
  });

  describe('Statistics', () => {
    describe('getEbookStats', () => {
      it('should return ebook statistics', async () => {
        await createEbook(testEbook1);
        await createEbook(testEbook2);

        const stats = await getEbookStats();

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThanOrEqual(2);
        expect(stats.published).toBeGreaterThanOrEqual(1);
        expect(stats.unpublished).toBeGreaterThanOrEqual(1);
        expect(stats.totalFileSizeMb).toBeGreaterThan(0);
      });

      it('should return zero stats when no ebooks exist', async () => {
        const stats = await getEbookStats();

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete ebook lifecycle', async () => {
      // Create
      const created = await createEbook(testEbook1);
      expect(created.id).toBeDefined();

      // Read by ID
      const byId = await getEbookById(created.id);
      expect(byId).toBeDefined();
      expect(byId?.title).toBe(testEbook1.title);

      // Read by slug
      const bySlug = await getEbookBySlug(testEbook1.slug);
      expect(bySlug).toBeDefined();
      expect(bySlug?.id).toBe(created.id);

      // Update
      const updated = await updateEbook(created.id, { title: 'Updated Title' });
      expect(updated?.title).toBe('Updated Title');

      // List
      const list = await listEbooks({ search: 'Updated' });
      expect(list.ebooks.some((e) => e.id === created.id)).toBe(true);

      // Delete
      const deleted = await deleteEbook(created.id);
      expect(deleted).toBe(true);

      // Verify deletion
      const afterDelete = await getEbookById(created.id);
      expect(afterDelete).toBeNull();
    });

    it('should handle multiple ebooks with different attributes', async () => {
      const ebook1 = await createEbook(testEbook1);
      const ebook2 = await createEbook(testEbook2);

      // List published
      const published = await listEbooks({ published: true });
      expect(published.ebooks.some((e) => e.id === ebook1.id)).toBe(true);
      expect(published.ebooks.some((e) => e.id === ebook2.id)).toBe(false);

      // Update ebook2 to published
      await updateEbook(ebook2.id, { isPublished: true });

      // Both should now be in published list
      const allPublished = await listEbooks({ published: true });
      expect(allPublished.ebooks.some((e) => e.id === ebook1.id)).toBe(true);
      expect(allPublished.ebooks.some((e) => e.id === ebook2.id)).toBe(true);
    });
  });
});
