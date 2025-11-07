/**
 * T127: Podcast Integration - Test Suite
 *
 * Tests for podcast management system including CRUD operations,
 * RSS feed generation, and utility functions
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import pool from '../../src/lib/db';
import {
  createPodcast,
  getPodcastById,
  getPodcastBySlug,
  listPodcasts,
  updatePodcast,
  deletePodcast,
  formatDuration,
  parseDuration,
  formatFileSize,
  generatePodcastRSSFeed,
  getPodcastStats,
  validatePodcast,
  generateSlug,
  isSlugUnique,
  type Podcast,
} from '@/lib/podcast';

describe('T127: Podcast Integration', () => {
  // Test data
  const testPodcast1 = {
    title: 'Mindfulness Meditation Episode 1',
    slug: 'mindfulness-meditation-ep1',
    description: 'Introduction to mindfulness meditation practices',
    price: 9.99,
    fileUrl: 'https://example.com/audio/mindfulness-ep1.mp3',
    fileSizeMb: 45.5,
    previewUrl: 'https://example.com/previews/mindfulness-ep1-preview.mp3',
    imageUrl: 'https://example.com/images/mindfulness-ep1.jpg',
    downloadLimit: 3,
    isPublished: true,
    titleEs: 'Meditación de Atención Plena Episodio 1',
    descriptionEs: 'Introducción a las prácticas de meditación de atención plena',
  };

  const testPodcast2 = {
    title: 'Mindfulness Meditation Episode 2',
    slug: 'mindfulness-meditation-ep2',
    description: 'Advanced mindfulness techniques',
    price: 12.99,
    fileUrl: 'https://example.com/audio/mindfulness-ep2.mp3',
    fileSizeMb: 52.3,
    downloadLimit: 3,
    isPublished: false,
  };

  // Cleanup helper
  async function cleanupTestData() {
    const client = await pool.connect();
    try {
      // Delete test podcasts
      await client.query(
        `DELETE FROM digital_products WHERE product_type = 'audio' AND slug LIKE 'mindfulness-meditation-%'`
      );
      await client.query(
        `DELETE FROM digital_products WHERE product_type = 'audio' AND slug LIKE 'test-podcast-%'`
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
    describe('createPodcast', () => {
      it('should create a new podcast successfully', async () => {
        const podcast = await createPodcast(testPodcast1);

        expect(podcast).toBeDefined();
        expect(podcast.id).toBeDefined();
        expect(podcast.title).toBe(testPodcast1.title);
        expect(podcast.slug).toBe(testPodcast1.slug);
        expect(podcast.description).toBe(testPodcast1.description);
        expect(podcast.price).toBe(testPodcast1.price);
        expect(podcast.fileUrl).toBe(testPodcast1.fileUrl);
        expect(podcast.fileSizeMb).toBe(testPodcast1.fileSizeMb);
        expect(podcast.previewUrl).toBe(testPodcast1.previewUrl);
        expect(podcast.imageUrl).toBe(testPodcast1.imageUrl);
        expect(podcast.downloadLimit).toBe(testPodcast1.downloadLimit);
        expect(podcast.isPublished).toBe(testPodcast1.isPublished);
        expect(podcast.titleEs).toBe(testPodcast1.titleEs);
        expect(podcast.descriptionEs).toBe(testPodcast1.descriptionEs);
        expect(podcast.createdAt).toBeDefined();
        expect(podcast.updatedAt).toBeDefined();
      });

      it('should create podcast with minimal required fields', async () => {
        const minimalPodcast = {
          title: 'Minimal Podcast',
          slug: 'test-podcast-minimal',
          description: 'A minimal podcast',
          price: 0,
          fileUrl: 'https://example.com/audio/minimal.mp3',
          downloadLimit: 3,
          isPublished: false,
        };

        const podcast = await createPodcast(minimalPodcast);

        expect(podcast).toBeDefined();
        expect(podcast.title).toBe(minimalPodcast.title);
        expect(podcast.fileSizeMb).toBeNull();
        expect(podcast.previewUrl).toBeNull();
        expect(podcast.imageUrl).toBeNull();
      });

      it('should throw error for duplicate slug', async () => {
        await createPodcast(testPodcast1);

        await expect(createPodcast(testPodcast1)).rejects.toThrow();
      });
    });

    describe('getPodcastById', () => {
      it('should retrieve podcast by ID', async () => {
        const created = await createPodcast(testPodcast1);
        const retrieved = await getPodcastById(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.title).toBe(testPodcast1.title);
        expect(retrieved?.slug).toBe(testPodcast1.slug);
      });

      it('should return null for non-existent ID', async () => {
        const retrieved = await getPodcastById('00000000-0000-0000-0000-000000000000');

        expect(retrieved).toBeNull();
      });
    });

    describe('getPodcastBySlug', () => {
      it('should retrieve podcast by slug', async () => {
        await createPodcast(testPodcast1);
        const retrieved = await getPodcastBySlug(testPodcast1.slug);

        expect(retrieved).toBeDefined();
        expect(retrieved?.slug).toBe(testPodcast1.slug);
        expect(retrieved?.title).toBe(testPodcast1.title);
      });

      it('should return null for non-existent slug', async () => {
        const retrieved = await getPodcastBySlug('non-existent-slug');

        expect(retrieved).toBeNull();
      });
    });

    describe('listPodcasts', () => {
      it('should list all podcasts', async () => {
        await createPodcast(testPodcast1);
        await createPodcast(testPodcast2);

        const result = await listPodcasts();

        expect(result.podcasts).toBeDefined();
        expect(result.podcasts.length).toBeGreaterThanOrEqual(2);
        expect(result.total).toBeGreaterThanOrEqual(2);
      });

      it('should filter by published status', async () => {
        await createPodcast(testPodcast1); // published: true
        await createPodcast(testPodcast2); // published: false

        const publishedResult = await listPodcasts({ published: true });
        const unpublishedResult = await listPodcasts({ published: false });

        expect(publishedResult.podcasts.every((p) => p.isPublished)).toBe(true);
        expect(unpublishedResult.podcasts.every((p) => !p.isPublished)).toBe(true);
      });

      it('should support pagination', async () => {
        await createPodcast(testPodcast1);
        await createPodcast(testPodcast2);

        const page1 = await listPodcasts({ limit: 1, offset: 0 });
        const page2 = await listPodcasts({ limit: 1, offset: 1 });

        expect(page1.podcasts.length).toBe(1);
        expect(page2.podcasts.length).toBe(1);
        expect(page1.podcasts[0].id).not.toBe(page2.podcasts[0].id);
      });

      it('should support search', async () => {
        await createPodcast(testPodcast1);
        await createPodcast(testPodcast2);

        const result = await listPodcasts({ search: 'Episode 1' });

        expect(result.podcasts.length).toBeGreaterThanOrEqual(1);
        expect(result.podcasts.some((p) => p.title.includes('Episode 1'))).toBe(true);
      });

      it('should support sorting', async () => {
        await createPodcast(testPodcast1);
        await createPodcast(testPodcast2);

        const ascResult = await listPodcasts({ sortBy: 'title', sortOrder: 'asc' });
        const descResult = await listPodcasts({ sortBy: 'title', sortOrder: 'desc' });

        expect(ascResult.podcasts).toBeDefined();
        expect(descResult.podcasts).toBeDefined();
        // Verify order is different
        if (ascResult.podcasts.length >= 2) {
          expect(ascResult.podcasts[0].title).not.toBe(descResult.podcasts[0].title);
        }
      });
    });

    describe('updatePodcast', () => {
      it('should update podcast successfully', async () => {
        const created = await createPodcast(testPodcast1);

        const updated = await updatePodcast(created.id, {
          title: 'Updated Title',
          price: 19.99,
          isPublished: false,
        });

        expect(updated).toBeDefined();
        expect(updated?.title).toBe('Updated Title');
        expect(updated?.price).toBe(19.99);
        expect(updated?.isPublished).toBe(false);
        // Unchanged fields should remain
        expect(updated?.slug).toBe(testPodcast1.slug);
        expect(updated?.description).toBe(testPodcast1.description);
      });

      it('should return null for non-existent podcast', async () => {
        const updated = await updatePodcast('00000000-0000-0000-0000-000000000000', {
          title: 'Updated Title',
        });

        expect(updated).toBeNull();
      });

      it('should return podcast unchanged if no valid updates', async () => {
        const created = await createPodcast(testPodcast1);

        const updated = await updatePodcast(created.id, {
          // @ts-ignore - testing invalid field
          invalidField: 'value',
        });

        expect(updated).toBeDefined();
        expect(updated?.title).toBe(created.title);
      });
    });

    describe('deletePodcast', () => {
      it('should delete podcast successfully', async () => {
        const created = await createPodcast(testPodcast1);

        const deleted = await deletePodcast(created.id);

        expect(deleted).toBe(true);

        // Verify deletion
        const retrieved = await getPodcastById(created.id);
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent podcast', async () => {
        const deleted = await deletePodcast('00000000-0000-0000-0000-000000000000');

        expect(deleted).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('formatDuration', () => {
      it('should format seconds to MM:SS', () => {
        expect(formatDuration(0)).toBe('00:00');
        expect(formatDuration(30)).toBe('00:30');
        expect(formatDuration(90)).toBe('01:30');
        expect(formatDuration(300)).toBe('05:00');
        expect(formatDuration(3599)).toBe('59:59');
      });

      it('should format seconds to HH:MM:SS for long durations', () => {
        expect(formatDuration(3600)).toBe('01:00:00');
        expect(formatDuration(3661)).toBe('01:01:01');
        expect(formatDuration(7200)).toBe('02:00:00');
        expect(formatDuration(36000)).toBe('10:00:00');
      });

      it('should handle negative or invalid values', () => {
        expect(formatDuration(-10)).toBe('00:00');
        expect(formatDuration(NaN)).toBe('00:00');
      });
    });

    describe('parseDuration', () => {
      it('should parse MM:SS format', () => {
        expect(parseDuration('00:00')).toBe(0);
        expect(parseDuration('01:30')).toBe(90);
        expect(parseDuration('05:00')).toBe(300);
        expect(parseDuration('59:59')).toBe(3599);
      });

      it('should parse HH:MM:SS format', () => {
        expect(parseDuration('01:00:00')).toBe(3600);
        expect(parseDuration('01:01:01')).toBe(3661);
        expect(parseDuration('02:00:00')).toBe(7200);
        expect(parseDuration('10:30:45')).toBe(37845);
      });

      it('should handle invalid formats', () => {
        expect(parseDuration('invalid')).toBe(0);
        expect(parseDuration('')).toBe(0);
        expect(parseDuration('1')).toBe(0);
      });
    });

    describe('formatFileSize', () => {
      it('should format MB to human-readable string', () => {
        expect(formatFileSize(0)).toBe('0 MB');
        expect(formatFileSize(0.5)).toBe('512 KB');
        expect(formatFileSize(1)).toBe('1.00 MB');
        expect(formatFileSize(45.5)).toBe('45.50 MB');
        expect(formatFileSize(500)).toBe('500.00 MB');
      });

      it('should format large files to GB', () => {
        expect(formatFileSize(1024)).toBe('1.00 GB');
        expect(formatFileSize(2048)).toBe('2.00 GB');
        expect(formatFileSize(5120)).toBe('5.00 GB');
      });

      it('should handle negative or invalid values', () => {
        expect(formatFileSize(-10)).toBe('0 MB');
        expect(formatFileSize(NaN)).toBe('0 MB');
      });
    });

    describe('generateSlug', () => {
      it('should generate slug from title', () => {
        expect(generateSlug('Hello World')).toBe('hello-world');
        expect(generateSlug('Mindfulness Meditation')).toBe('mindfulness-meditation');
        expect(generateSlug('Episode #1: Introduction')).toBe('episode-1-introduction');
      });

      it('should handle special characters', () => {
        expect(generateSlug('Test & Example')).toBe('test-example');
        expect(generateSlug('Test@Example.com')).toBe('testexamplecom');
        expect(generateSlug('Test (with parentheses)')).toBe('test-with-parentheses');
      });

      it('should handle multiple spaces and hyphens', () => {
        expect(generateSlug('Test   Multiple   Spaces')).toBe('test-multiple-spaces');
        expect(generateSlug('Test---Hyphens')).toBe('test-hyphens');
        expect(generateSlug('  Leading and trailing  ')).toBe('leading-and-trailing');
      });

      it('should convert to lowercase', () => {
        expect(generateSlug('TEST UPPERCASE')).toBe('test-uppercase');
        expect(generateSlug('MixedCase')).toBe('mixedcase');
      });
    });

    describe('isSlugUnique', () => {
      it('should return true for unique slug', async () => {
        const isUnique = await isSlugUnique('unique-slug-test');

        expect(isUnique).toBe(true);
      });

      it('should return false for existing slug', async () => {
        await createPodcast(testPodcast1);

        const isUnique = await isSlugUnique(testPodcast1.slug);

        expect(isUnique).toBe(false);
      });

      it('should exclude specific ID from check', async () => {
        const created = await createPodcast(testPodcast1);

        // Should be unique when excluding the podcast itself
        const isUnique = await isSlugUnique(testPodcast1.slug, created.id);

        expect(isUnique).toBe(true);
      });
    });

    describe('validatePodcast', () => {
      it('should validate complete podcast data', () => {
        const result = validatePodcast(testPodcast1);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should require title', () => {
        const result = validatePodcast({
          title: '',
          slug: 'test',
          description: 'Test',
          price: 0,
          fileUrl: 'https://example.com/audio.mp3',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Title is required');
      });

      it('should require slug', () => {
        const result = validatePodcast({
          title: 'Test',
          slug: '',
          description: 'Test',
          price: 0,
          fileUrl: 'https://example.com/audio.mp3',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Slug is required');
      });

      it('should require description', () => {
        const result = validatePodcast({
          title: 'Test',
          slug: 'test',
          description: '',
          price: 0,
          fileUrl: 'https://example.com/audio.mp3',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Description is required');
      });

      it('should require valid price', () => {
        const result = validatePodcast({
          title: 'Test',
          slug: 'test',
          description: 'Test',
          price: -10,
          fileUrl: 'https://example.com/audio.mp3',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Price must be non-negative');
      });

      it('should require file URL', () => {
        const result = validatePodcast({
          title: 'Test',
          slug: 'test',
          description: 'Test',
          price: 0,
          fileUrl: '',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('File URL is required');
      });

      it('should validate URL format', () => {
        const result = validatePodcast({
          title: 'Test',
          slug: 'test',
          description: 'Test',
          price: 0,
          fileUrl: 'not-a-valid-url',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('File URL must be a valid URL');
      });

      it('should validate optional URL fields', () => {
        const result = validatePodcast({
          title: 'Test',
          slug: 'test',
          description: 'Test',
          price: 0,
          fileUrl: 'https://example.com/audio.mp3',
          previewUrl: 'not-a-url',
          imageUrl: 'also-not-a-url',
          downloadLimit: 3,
          isPublished: false,
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Preview URL must be a valid URL');
        expect(result.errors).toContain('Image URL must be a valid URL');
      });
    });
  });

  describe('RSS Feed Generation', () => {
    describe('generatePodcastRSSFeed', () => {
      it('should generate valid RSS feed', async () => {
        await createPodcast(testPodcast1);
        await createPodcast({ ...testPodcast2, isPublished: true });

        const rss = await generatePodcastRSSFeed({
          siteUrl: 'https://example.com',
          title: 'Mindfulness Meditation Podcast',
          description: 'A podcast about mindfulness and meditation',
          author: 'John Doe',
          category: 'Health & Fitness',
          imageUrl: 'https://example.com/podcast-cover.jpg',
        });

        expect(rss).toBeDefined();
        expect(rss).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(rss).toContain('<rss version="2.0"');
        expect(rss).toContain('<title><![CDATA[Mindfulness Meditation Podcast]]></title>');
        expect(rss).toContain('<description><![CDATA[A podcast about mindfulness and meditation]]></description>');
        expect(rss).toContain('<itunes:author>John Doe</itunes:author>');
        expect(rss).toContain('<itunes:category text="Health & Fitness"');
        expect(rss).toContain('<item>');
        expect(rss).toContain('</item>');
        expect(rss).toContain('</rss>');
      });

      it('should include podcast items in feed', async () => {
        const podcast = await createPodcast(testPodcast1);

        const rss = await generatePodcastRSSFeed({
          siteUrl: 'https://example.com',
          title: 'Test Podcast',
          description: 'Test Description',
          author: 'Test Author',
          category: 'Test Category',
          imageUrl: 'https://example.com/image.jpg',
        });

        expect(rss).toContain(podcast.title);
        expect(rss).toContain(podcast.description);
        expect(rss).toContain(podcast.fileUrl);
        expect(rss).toContain(`https://example.com/podcasts/${podcast.slug}`);
      });

      it('should only include published podcasts', async () => {
        await createPodcast(testPodcast1); // published
        await createPodcast(testPodcast2); // unpublished

        const rss = await generatePodcastRSSFeed({
          siteUrl: 'https://example.com',
          title: 'Test Podcast',
          description: 'Test Description',
          author: 'Test Author',
          category: 'Test Category',
          imageUrl: 'https://example.com/image.jpg',
        });

        expect(rss).toContain(testPodcast1.title);
        expect(rss).not.toContain(testPodcast2.title);
      });

      it('should respect limit parameter', async () => {
        await createPodcast(testPodcast1);
        await createPodcast({ ...testPodcast2, isPublished: true });

        const rss = await generatePodcastRSSFeed({
          siteUrl: 'https://example.com',
          title: 'Test Podcast',
          description: 'Test Description',
          author: 'Test Author',
          category: 'Test Category',
          imageUrl: 'https://example.com/image.jpg',
          limit: 1,
        });

        // Should only contain one item
        const itemCount = (rss.match(/<item>/g) || []).length;
        expect(itemCount).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Statistics', () => {
    describe('getPodcastStats', () => {
      it('should return podcast statistics', async () => {
        await createPodcast(testPodcast1); // published
        await createPodcast(testPodcast2); // unpublished

        const stats = await getPodcastStats();

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThanOrEqual(2);
        expect(stats.published).toBeGreaterThanOrEqual(1);
        expect(stats.unpublished).toBeGreaterThanOrEqual(1);
        expect(stats.totalFileSizeMb).toBeGreaterThan(0);
      });

      it('should return zero stats when no podcasts exist', async () => {
        const stats = await getPodcastStats();

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThanOrEqual(0);
        expect(stats.published).toBeGreaterThanOrEqual(0);
        expect(stats.unpublished).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete podcast lifecycle', async () => {
      // Create
      const created = await createPodcast(testPodcast1);
      expect(created.id).toBeDefined();

      // Read by ID
      const byId = await getPodcastById(created.id);
      expect(byId).toBeDefined();
      expect(byId?.title).toBe(testPodcast1.title);

      // Read by slug
      const bySlug = await getPodcastBySlug(testPodcast1.slug);
      expect(bySlug).toBeDefined();
      expect(bySlug?.id).toBe(created.id);

      // Update
      const updated = await updatePodcast(created.id, { title: 'Updated Title' });
      expect(updated?.title).toBe('Updated Title');

      // List
      const list = await listPodcasts({ search: 'Updated' });
      expect(list.podcasts.some((p) => p.id === created.id)).toBe(true);

      // Delete
      const deleted = await deletePodcast(created.id);
      expect(deleted).toBe(true);

      // Verify deletion
      const afterDelete = await getPodcastById(created.id);
      expect(afterDelete).toBeNull();
    });

    it('should handle multiple podcasts with different attributes', async () => {
      const podcast1 = await createPodcast(testPodcast1);
      const podcast2 = await createPodcast(testPodcast2);

      // List published
      const published = await listPodcasts({ published: true });
      expect(published.podcasts.some((p) => p.id === podcast1.id)).toBe(true);
      expect(published.podcasts.some((p) => p.id === podcast2.id)).toBe(false);

      // List unpublished
      const unpublished = await listPodcasts({ published: false });
      expect(unpublished.podcasts.some((p) => p.id === podcast2.id)).toBe(true);

      // Update podcast2 to published
      await updatePodcast(podcast2.id, { isPublished: true });

      // Both should now be in published list
      const allPublished = await listPodcasts({ published: true });
      expect(allPublished.podcasts.some((p) => p.id === podcast1.id)).toBe(true);
      expect(allPublished.podcasts.some((p) => p.id === podcast2.id)).toBe(true);
    });
  });
});
