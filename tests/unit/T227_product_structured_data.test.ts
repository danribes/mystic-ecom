/**
 * T227: Product Structured Data Tests
 *
 * Tests for Schema.org Product structured data generation.
 * Ensures proper JSON-LD markup for search engine rich results.
 *
 * @see https://schema.org/Product
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */

import { describe, it, expect } from 'vitest';
import { generateProductSchema } from '@/lib/structuredData';
import type { ProductSchema } from '@/lib/structuredData';

describe('T227: Product Structured Data', () => {
  // ============================================================================
  // Basic Product Schema Generation
  // ============================================================================

  describe('generateProductSchema', () => {
    describe('Basic Functionality', () => {
      it('should generate product schema with required fields', () => {
        const product = generateProductSchema({
          name: 'Meditation Guide PDF',
          description: 'A comprehensive guide to meditation practices',
        });

        expect(product['@context']).toBe('https://schema.org');
        expect(product['@type']).toBe('Product');
        expect(product.name).toBe('Meditation Guide PDF');
        expect(product.description).toBe('A comprehensive guide to meditation practices');
      });

      it('should include product name and description', () => {
        const product = generateProductSchema({
          name: 'Mindfulness Audio Course',
          description: 'Learn mindfulness through guided audio lessons',
        });

        expect(product.name).toBe('Mindfulness Audio Course');
        expect(product.description).toBe('Learn mindfulness through guided audio lessons');
      });

      it('should handle long product names', () => {
        const longName =
          'Complete Spirituality Transformation Bundle: Meditation, Yoga, Mindfulness, and Inner Peace Mastery Course';

        const product = generateProductSchema({
          name: longName,
          description: 'Comprehensive spiritual development package',
        });

        expect(product.name).toBe(longName);
      });

      it('should handle long descriptions', () => {
        const longDescription =
          'This comprehensive digital product includes everything you need to transform your spiritual practice. ' +
          'With over 50 hours of video content, 200 pages of PDF guides, and lifetime access to our community, ' +
          'you will embark on a journey of profound personal growth and spiritual awakening.';

        const product = generateProductSchema({
          name: 'Spiritual Transformation Bundle',
          description: longDescription,
        });

        expect(product.description).toBe(longDescription);
      });

      it('should handle special characters in name and description', () => {
        const product = generateProductSchema({
          name: 'Zen & Mindfulness: The Complete Guide™',
          description: 'Learn meditation, yoga & mindfulness practices (500+ techniques) <for beginners>',
        });

        expect(product.name).toBe('Zen & Mindfulness: The Complete Guide™');
        expect(product.description).toContain('&');
        expect(product.description).toContain('(500+ techniques)');
      });
    });

    describe('Product Images', () => {
      it('should include single product image', () => {
        const product = generateProductSchema({
          name: 'Meditation Cushion',
          description: 'Premium meditation cushion',
          image: 'https://example.com/images/cushion.jpg',
        });

        expect(product.image).toBe('https://example.com/images/cushion.jpg');
      });

      it('should handle multiple product images', () => {
        const product = generateProductSchema({
          name: 'Yoga Mat',
          description: 'Eco-friendly yoga mat',
          image: [
            'https://example.com/images/mat-1.jpg',
            'https://example.com/images/mat-2.jpg',
            'https://example.com/images/mat-3.jpg',
          ],
        });

        expect(Array.isArray(product.image)).toBe(true);
        expect((product.image as string[]).length).toBe(3);
        expect((product.image as string[])[0]).toBe('https://example.com/images/mat-1.jpg');
      });

      it('should handle product without image', () => {
        const product = generateProductSchema({
          name: 'Audio Course',
          description: 'Digital audio course',
        });

        expect(product.image).toBeUndefined();
      });

      it('should handle absolute image URLs', () => {
        const product = generateProductSchema({
          name: 'Course',
          description: 'Online course',
          image: 'https://example.com/images/course.jpg',
        });

        expect(product.image).toBe('https://example.com/images/course.jpg');
      });
    });

    describe('Product Brand', () => {
      it('should include brand as Brand type', () => {
        const product = generateProductSchema({
          name: 'Meditation Cushion',
          description: 'Premium cushion',
          brand: {
            '@type': 'Brand',
            name: 'Zen Supply',
          },
        });

        expect(product.brand).toBeDefined();
        expect((product.brand as any)['@type']).toBe('Brand');
        expect((product.brand as any).name).toBe('Zen Supply');
      });

      it('should include brand as Organization type', () => {
        const product = generateProductSchema({
          name: 'Yoga Mat',
          description: 'Eco mat',
          brand: {
            '@type': 'Organization',
            name: 'Spirituality Platform',
          },
        });

        expect(product.brand).toBeDefined();
        expect((product.brand as any)['@type']).toBe('Organization');
        expect((product.brand as any).name).toBe('Spirituality Platform');
      });

      it('should handle product without brand', () => {
        const product = generateProductSchema({
          name: 'Generic Product',
          description: 'No brand product',
        });

        expect(product.brand).toBeUndefined();
      });
    });

    describe('Product Identifiers', () => {
      it('should include SKU', () => {
        const product = generateProductSchema({
          name: 'Meditation Guide',
          description: 'PDF guide',
          sku: 'PROD-001',
        });

        expect(product.sku).toBe('PROD-001');
      });

      it('should include MPN (Manufacturer Part Number)', () => {
        const product = generateProductSchema({
          name: 'Yoga Block',
          description: 'Cork block',
          mpn: 'YB-123-CORK',
        });

        expect(product.mpn).toBe('YB-123-CORK');
      });

      it('should handle both SKU and MPN', () => {
        const product = generateProductSchema({
          name: 'Meditation Timer',
          description: 'Digital timer',
          sku: 'MT-456',
          mpn: 'TIMER-456-DIG',
        });

        expect(product.sku).toBe('MT-456');
        expect(product.mpn).toBe('TIMER-456-DIG');
      });

      it('should handle product without identifiers', () => {
        const product = generateProductSchema({
          name: 'Simple Product',
          description: 'No identifiers',
        });

        expect(product.sku).toBeUndefined();
        expect(product.mpn).toBeUndefined();
      });
    });

    describe('Product Offers', () => {
      it('should include basic offer with price', () => {
        const product = generateProductSchema({
          name: 'Digital Course',
          description: 'Online course',
          offers: {
            '@type': 'Offer',
            price: 99.99,
            priceCurrency: 'USD',
          },
        });

        expect(product.offers).toBeDefined();
        expect((product.offers as any)['@type']).toBe('Offer');
        expect((product.offers as any).price).toBe(99.99);
        expect((product.offers as any).priceCurrency).toBe('USD');
      });

      it('should handle price as string', () => {
        const product = generateProductSchema({
          name: 'PDF Guide',
          description: 'Downloadable guide',
          offers: {
            '@type': 'Offer',
            price: '29.99',
            priceCurrency: 'USD',
          },
        });

        expect((product.offers as any).price).toBe('29.99');
      });

      it('should include availability status', () => {
        const product = generateProductSchema({
          name: 'Video Course',
          description: 'Online video course',
          offers: {
            '@type': 'Offer',
            price: 149.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        });

        expect((product.offers as any).availability).toBe('https://schema.org/InStock');
      });

      it('should handle out of stock availability', () => {
        const product = generateProductSchema({
          name: 'Limited Edition',
          description: 'Sold out product',
          offers: {
            '@type': 'Offer',
            price: 99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/OutOfStock',
          },
        });

        expect((product.offers as any).availability).toBe('https://schema.org/OutOfStock');
      });

      it('should include offer URL', () => {
        const product = generateProductSchema({
          name: 'Audio Book',
          description: 'Spiritual audio book',
          offers: {
            '@type': 'Offer',
            price: 19.99,
            priceCurrency: 'USD',
            url: 'https://example.com/products/audio-book',
          },
        });

        expect((product.offers as any).url).toBe('https://example.com/products/audio-book');
      });

      it('should include price valid until date', () => {
        const product = generateProductSchema({
          name: 'Discounted Course',
          description: 'Limited time offer',
          offers: {
            '@type': 'Offer',
            price: 49.99,
            priceCurrency: 'USD',
            priceValidUntil: '2025-12-31',
          },
        });

        expect((product.offers as any).priceValidUntil).toBe('2025-12-31');
      });

      it('should include seller information', () => {
        const product = generateProductSchema({
          name: 'Premium Course',
          description: 'Expert-led course',
          offers: {
            '@type': 'Offer',
            price: 199.99,
            priceCurrency: 'USD',
            seller: {
              '@type': 'Organization',
              name: 'Spirituality Platform',
            },
          },
        });

        expect((product.offers as any).seller).toBeDefined();
        expect((product.offers as any).seller['@type']).toBe('Organization');
        expect((product.offers as any).seller.name).toBe('Spirituality Platform');
      });

      it('should handle zero price (free product)', () => {
        const product = generateProductSchema({
          name: 'Free Guide',
          description: 'Free downloadable guide',
          offers: {
            '@type': 'Offer',
            price: 0,
            priceCurrency: 'USD',
          },
        });

        expect((product.offers as any).price).toBe(0);
      });

      it('should handle product without offers', () => {
        const product = generateProductSchema({
          name: 'Coming Soon',
          description: 'Product not yet available',
        });

        expect(product.offers).toBeUndefined();
      });
    });

    describe('Product Ratings and Reviews', () => {
      it('should include aggregate rating', () => {
        const product = generateProductSchema({
          name: 'Popular Course',
          description: 'Highly rated course',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: 4.8,
            reviewCount: 150,
          },
        });

        expect(product.aggregateRating).toBeDefined();
        expect((product.aggregateRating as any)['@type']).toBe('AggregateRating');
        expect((product.aggregateRating as any).ratingValue).toBe(4.8);
        expect((product.aggregateRating as any).reviewCount).toBe(150);
      });

      it('should include best and worst rating', () => {
        const product = generateProductSchema({
          name: 'Reviewed Product',
          description: 'Product with ratings',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: 4.5,
            reviewCount: 200,
            bestRating: 5,
            worstRating: 1,
          },
        });

        expect((product.aggregateRating as any).bestRating).toBe(5);
        expect((product.aggregateRating as any).worstRating).toBe(1);
      });

      it('should include individual reviews', () => {
        const product = generateProductSchema({
          name: 'Course with Reviews',
          description: 'Customer reviewed course',
          review: [
            {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: 'Jane Doe',
              },
              datePublished: '2025-11-01',
              reviewBody: 'Excellent course!',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: 5,
                bestRating: 5,
              },
            },
          ],
        });

        expect(Array.isArray(product.review)).toBe(true);
        expect((product.review as any)[0]['@type']).toBe('Review');
        expect((product.review as any)[0].author.name).toBe('Jane Doe');
        expect((product.review as any)[0].reviewRating.ratingValue).toBe(5);
      });

      it('should handle multiple reviews', () => {
        const product = generateProductSchema({
          name: 'Well-reviewed Product',
          description: 'Product with multiple reviews',
          review: [
            {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: 'John Smith',
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: 5,
              },
            },
            {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: 'Mary Johnson',
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: 4,
              },
            },
          ],
        });

        expect((product.review as any).length).toBe(2);
        expect((product.review as any)[0].author.name).toBe('John Smith');
        expect((product.review as any)[1].author.name).toBe('Mary Johnson');
      });

      it('should handle product without ratings', () => {
        const product = generateProductSchema({
          name: 'New Product',
          description: 'No reviews yet',
        });

        expect(product.aggregateRating).toBeUndefined();
        expect(product.review).toBeUndefined();
      });
    });

    describe('Product URL', () => {
      it('should include product URL', () => {
        const product = generateProductSchema({
          name: 'Online Course',
          description: 'Digital course',
          url: 'https://example.com/products/online-course',
        });

        expect(product.url).toBe('https://example.com/products/online-course');
      });

      it('should handle product without URL', () => {
        const product = generateProductSchema({
          name: 'Product',
          description: 'Description',
        });

        expect(product.url).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      const product = generateProductSchema({
        name: '',
        description: '',
      });

      expect(product.name).toBe('');
      expect(product.description).toBe('');
    });

    it('should handle very long names', () => {
      const veryLongName = 'A'.repeat(500);

      const product = generateProductSchema({
        name: veryLongName,
        description: 'Test product',
      });

      expect(product.name).toBe(veryLongName);
      expect(product.name.length).toBe(500);
    });

    it('should handle unicode characters', () => {
      const product = generateProductSchema({
        name: 'Zen 禅 Meditation Course',
        description: 'Learn meditation: 瞑想を学ぶ',
      });

      expect(product.name).toContain('禅');
      expect(product.description).toContain('瞑想');
    });

    it('should handle emojis', () => {
      const product = generateProductSchema({
        name: '🧘 Meditation Guide 🕉️',
        description: 'Transform your practice ✨',
      });

      expect(product.name).toContain('🧘');
      expect(product.description).toContain('✨');
    });

    it('should handle HTML entities', () => {
      const product = generateProductSchema({
        name: 'Spirituality &amp; Mindfulness',
        description: 'Price: $99 &lt;discount&gt;',
      });

      expect(product.name).toContain('&amp;');
      expect(product.description).toContain('&lt;');
    });

    it('should handle newlines in description', () => {
      const product = generateProductSchema({
        name: 'Multi-line Product',
        description: 'Line 1\nLine 2\nLine 3',
      });

      expect(product.description).toContain('\n');
    });
  });

  // ============================================================================
  // Real-World Product Scenarios
  // ============================================================================

  describe('Real-World Scenarios', () => {
    describe('Digital Products', () => {
      it('should generate schema for PDF guide', () => {
        const product = generateProductSchema({
          name: 'Complete Meditation Guide PDF',
          description: 'A 200-page comprehensive guide to meditation practices for beginners and advanced practitioners',
          image: 'https://example.com/images/meditation-guide.jpg',
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-101',
          offers: {
            '@type': 'Offer',
            price: '29.99',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: 'https://example.com/products/meditation-guide',
          },
          url: 'https://example.com/products/meditation-guide',
        });

        expect(product['@type']).toBe('Product');
        expect(product.name).toContain('PDF');
        expect((product.offers as any).price).toBe('29.99');
      });

      it('should generate schema for audio course', () => {
        const product = generateProductSchema({
          name: 'Mindfulness Audio Course',
          description: 'Learn mindfulness through 20 guided audio lessons',
          image: 'https://example.com/images/audio-course.jpg',
          brand: {
            '@type': 'Organization',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-202',
          offers: {
            '@type': 'Offer',
            price: 49.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: 'https://example.com/products/audio-course',
            seller: {
              '@type': 'Organization',
              name: 'Spirituality Platform',
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: 4.7,
            reviewCount: 89,
            bestRating: 5,
            worstRating: 1,
          },
        });

        expect(product.name).toContain('Audio');
        expect((product.aggregateRating as any).ratingValue).toBe(4.7);
      });

      it('should generate schema for video course', () => {
        const product = generateProductSchema({
          name: 'Complete Yoga Video Course',
          description: 'Master yoga with 50+ video lessons',
          image: [
            'https://example.com/images/yoga-1.jpg',
            'https://example.com/images/yoga-2.jpg',
          ],
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-303',
          offers: {
            '@type': 'Offer',
            price: 99.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: 'https://example.com/products/yoga-video-course',
          },
        });

        expect(product.name).toContain('Video');
        expect(Array.isArray(product.image)).toBe(true);
      });

      it('should generate schema for ebook', () => {
        const product = generateProductSchema({
          name: 'Spiritual Awakening eBook',
          description: 'Digital book on spiritual transformation',
          image: 'https://example.com/images/ebook.jpg',
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-404',
          offers: {
            '@type': 'Offer',
            price: 19.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        });

        expect(product.name).toContain('eBook');
        expect((product.offers as any).price).toBe(19.99);
      });
    });

    describe('Free Products', () => {
      it('should generate schema for free product', () => {
        const product = generateProductSchema({
          name: 'Free Meditation Starter Guide',
          description: 'Get started with meditation - completely free',
          image: 'https://example.com/images/free-guide.jpg',
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-FREE-001',
          offers: {
            '@type': 'Offer',
            price: 0,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: 'https://example.com/products/free-starter-guide',
          },
        });

        expect((product.offers as any).price).toBe(0);
        expect(product.name).toContain('Free');
      });
    });

    describe('Out of Stock Products', () => {
      it('should generate schema for out of stock product', () => {
        const product = generateProductSchema({
          name: 'Limited Edition Meditation Course',
          description: 'Exclusive course - now sold out',
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          offers: {
            '@type': 'Offer',
            price: 149.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/OutOfStock',
          },
        });

        expect((product.offers as any).availability).toBe('https://schema.org/OutOfStock');
      });
    });

    describe('Products with Reviews', () => {
      it('should generate schema for highly-rated product with reviews', () => {
        const product = generateProductSchema({
          name: 'Best-Selling Mindfulness Course',
          description: 'Our most popular course with hundreds of 5-star reviews',
          image: 'https://example.com/images/bestseller.jpg',
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-BEST-001',
          offers: {
            '@type': 'Offer',
            price: 79.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: 4.9,
            reviewCount: 342,
            bestRating: 5,
            worstRating: 1,
          },
          review: [
            {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: 'Sarah Thompson',
              },
              datePublished: '2025-10-15',
              reviewBody: 'This course changed my life! Highly recommended.',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: 5,
                bestRating: 5,
              },
            },
            {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: 'Michael Chen',
              },
              datePublished: '2025-10-20',
              reviewBody: 'Excellent content and very well structured.',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: 5,
                bestRating: 5,
              },
            },
          ],
        });

        expect((product.aggregateRating as any).ratingValue).toBe(4.9);
        expect((product.aggregateRating as any).reviewCount).toBe(342);
        expect((product.review as any).length).toBe(2);
      });
    });

    describe('Bundle Products', () => {
      it('should generate schema for product bundle', () => {
        const product = generateProductSchema({
          name: 'Complete Spiritual Transformation Bundle',
          description:
            'Includes: Meditation Guide PDF, Mindfulness Audio Course, Yoga Video Series, and bonus materials',
          image: 'https://example.com/images/bundle.jpg',
          brand: {
            '@type': 'Brand',
            name: 'Spirituality Platform',
          },
          sku: 'PROD-BUNDLE-001',
          offers: {
            '@type': 'Offer',
            price: 199.99,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2025-12-31',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: 4.8,
            reviewCount: 156,
          },
        });

        expect(product.name).toContain('Bundle');
        expect((product.offers as any).priceValidUntil).toBe('2025-12-31');
      });
    });
  });

  // ============================================================================
  // Schema Validation
  // ============================================================================

  describe('Schema Validation', () => {
    it('should always include @context', () => {
      const product = generateProductSchema({
        name: 'Test Product',
        description: 'Test description',
      });

      expect(product['@context']).toBe('https://schema.org');
    });

    it('should always include @type as Product', () => {
      const product = generateProductSchema({
        name: 'Test Product',
        description: 'Test description',
      });

      expect(product['@type']).toBe('Product');
    });

    it('should always include required name field', () => {
      const product = generateProductSchema({
        name: 'Required Name',
        description: 'Required description',
      });

      expect(product.name).toBeDefined();
      expect(typeof product.name).toBe('string');
    });

    it('should always include required description field', () => {
      const product = generateProductSchema({
        name: 'Product name',
        description: 'Required description',
      });

      expect(product.description).toBeDefined();
      expect(typeof product.description).toBe('string');
    });

    it('should return valid JSON-LD object', () => {
      const product = generateProductSchema({
        name: 'JSON-LD Test',
        description: 'Testing JSON-LD output',
      });

      // Should be serializable to JSON
      expect(() => JSON.stringify(product)).not.toThrow();

      // Should parse back to same object
      const parsed = JSON.parse(JSON.stringify(product));
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('Product');
    });
  });

  // ============================================================================
  // Compatibility Tests
  // ============================================================================

  describe('Google Rich Results Compatibility', () => {
    it('should use schema.org URLs for availability', () => {
      const product = generateProductSchema({
        name: 'Available Product',
        description: 'In stock product',
        offers: {
          '@type': 'Offer',
          price: 99,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      });

      expect((product.offers as any).availability).toContain('schema.org');
    });

    it('should use proper currency codes', () => {
      const product = generateProductSchema({
        name: 'Priced Product',
        description: 'Product with price',
        offers: {
          '@type': 'Offer',
          price: 49.99,
          priceCurrency: 'USD',
        },
      });

      expect((product.offers as any).priceCurrency).toBe('USD');
      expect((product.offers as any).priceCurrency.length).toBe(3);
    });

    it('should use absolute URLs for images', () => {
      const product = generateProductSchema({
        name: 'Product with Image',
        description: 'Has image',
        image: 'https://example.com/image.jpg',
      });

      expect(product.image).toContain('https://');
    });

    it('should use absolute URLs for product URLs', () => {
      const product = generateProductSchema({
        name: 'Product with URL',
        description: 'Has URL',
        url: 'https://example.com/products/test',
      });

      expect(product.url).toContain('https://');
    });
  });
});
