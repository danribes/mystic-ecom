import type { APIRoute } from 'astro';
import { search } from '../../lib/search';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { asyncHandler, RateLimitError, assert } from '@/lib/errors';
import { log } from '@/lib/logger';

/**
 * GET /api/search
 * Search across courses, products, and events with filtering and pagination
 *
 * Security: T199 - Rate limited to 30 requests per minute per IP
 * T208: Uses standardized error handling
 */
export const GET: APIRoute = asyncHandler(async (context) => {
  const { request } = context;

  // Rate limiting: 30 requests per minute (prevents scraping)
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.SEARCH);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    log.warn('Search rate limit exceeded', {
      ip: context.clientAddress,
      query: new URL(request.url).searchParams.get('q'),
      resetAt: new Date(rateLimitResult.resetAt * 1000).toISOString(),
    });

    throw new RateLimitError(
      'Too many search requests. Please try again later.',
      retryAfter,
      rateLimitResult.resetAt
    );
  }

  const url = new URL(request.url);
  const params = url.searchParams;

  // Get query parameter (required)
  const query = params.get('q') || '';

  // Validate query using assert helpers
  assert(query.trim().length > 0, 'Search query is required');
  assert(query.length <= 200, 'Search query is too long (max 200 characters)');

  // Get optional type filter
  const type = params.get('type');
  if (type) {
    assert(
      ['course', 'product', 'event'].includes(type),
      'Invalid type parameter. Must be: course, product, or event',
      { providedType: type }
    );
  }

  // Get price filters
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');

  // Validate price filters
  if (minPrice) {
    const parsed = parseFloat(minPrice);
    assert(
      !isNaN(parsed) && parsed >= 0,
      'Invalid minPrice parameter',
      { providedValue: minPrice }
    );
  }

  if (maxPrice) {
    const parsed = parseFloat(maxPrice);
    assert(
      !isNaN(parsed) && parsed >= 0,
      'Invalid maxPrice parameter',
      { providedValue: maxPrice }
    );
  }

  // Get level filter (for courses)
  const level = params.get('level') || undefined;

  // Get product type filter
  const productType = params.get('productType');
  if (productType) {
    assert(
      ['pdf', 'audio', 'video', 'ebook'].includes(productType),
      'Invalid productType parameter. Must be: pdf, audio, video, or ebook',
      { providedType: productType }
    );
  }

  // Get city filter (for events)
  const city = params.get('city') || undefined;

  // Get pagination parameters
  const limitParam = params.get('limit');
  const offsetParam = params.get('offset');

  let limit = 20; // Default
  let offset = 0; // Default

  if (limitParam) {
    const parsedLimit = parseInt(limitParam);
    assert(
      !isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 100,
      'Invalid limit parameter. Must be between 1 and 100',
      { providedValue: limitParam }
    );
    limit = parsedLimit;
  }

  if (offsetParam) {
    const parsedOffset = parseInt(offsetParam);
    assert(
      !isNaN(parsedOffset) && parsedOffset >= 0,
      'Invalid offset parameter. Must be 0 or greater',
      { providedValue: offsetParam }
    );
    offset = parsedOffset;
  }

  // Perform search
  const results = await search({
    query,
    type: type as 'course' | 'product' | 'event' | undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    level,
    productType: productType as 'pdf' | 'audio' | 'video' | 'ebook' | undefined,
    city,
    limit,
    offset
  });

  log.info('Search completed', {
    query,
    totalCount: results.total || 0,
  });

  // Return successful response
  return new Response(
    JSON.stringify({
      success: true,
      data: results
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    }
  );
});

/**
 * OPTIONS /api/search
 * Handle CORS preflight requests
 */
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
