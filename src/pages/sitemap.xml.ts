/**
 * XML Sitemap Endpoint (T229)
 *
 * Dynamically generates XML sitemap for all pages on the site.
 * Fetches courses, events, and products from database and combines with static pages.
 *
 * @see https://www.sitemaps.org/protocol.html
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */

import type { APIRoute } from 'astro';
import { getCourses } from '@/lib/courses';
import { getEvents } from '@/lib/events';
import { getProducts } from '@/lib/products';
import { generateSitemap, generateSitemapXML } from '@/lib/sitemap';

/**
 * GET endpoint for sitemap.xml
 *
 * Returns XML sitemap with all site URLs
 */
export const GET: APIRoute = async ({ site, url }) => {
  try {
    // Get base URL from Astro config or request
    const baseUrl = site?.origin || url.origin;

    // Fetch all courses
    const coursesResult = await getCourses({
      limit: 1000, // Fetch up to 1000 courses
      offset: 0,
      isPublished: true, // Only published courses
    });

    // Fetch all events
    const allEvents = await getEvents({
      // No filters - get all events
    });

    // Fetch all products
    const productsResult = await getProducts({
      limit: 1000, // Fetch up to 1000 products
      offset: 0,
      isActive: true, // Only active products
    });

    // Transform data to sitemap format
    const courses = coursesResult.courses.map((course) => ({
      slug: course.slug,
      updated_at: course.updated_at,
    }));

    const events = allEvents.map((event) => ({
      slug: event.slug,
      updated_at: event.updated_at,
    }));

    const products = productsResult.products.map((product) => ({
      slug: product.slug,
      updated_at: product.updated_at,
    }));

    // Generate sitemap
    const sitemapResult = await generateSitemap(
      {
        baseUrl,
        includeStatic: true,
        includeCourses: true,
        includeEvents: true,
        includeProducts: true,
      },
      {
        courses,
        events,
        products,
      }
    );

    // Convert to XML
    const xml = generateSitemapXML(sitemapResult.urls);

    // Return XML response with proper headers
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Robots-Tag': 'noindex', // Don't index the sitemap itself
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return error response
    return new Response('Error generating sitemap', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
};

/**
 * Prerender configuration
 * Set to false to generate sitemap dynamically on each request
 */
export const prerender = false;
