/**
 * DELETE /api/cart/remove
 *
 * Remove an item from the shopping cart
 * Uses Redis-backed cart service
 *
 * Security: T200 - Rate limited to 100 requests per hour per session
 */

import type { APIRoute } from 'astro';
import { removeFromCart } from '@/services/cart.service';
import { rateLimit, RateLimitProfiles } from '@/lib/ratelimit';
import { validateCSRF } from '@/lib/csrf';
import type { OrderItemType } from '@/types';

export const DELETE: APIRoute = async (context) => {
  const { request, cookies } = context;

  // T201: CSRF protection - validate token
  const csrfValid = await validateCSRF(context);
  if (!csrfValid) {
    console.warn('[CART-REMOVE] CSRF validation failed:', {
      ip: context.clientAddress,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Rate limiting: 100 requests per hour (prevents cart abuse)
  const rateLimitResult = await rateLimit(context, RateLimitProfiles.CART);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetAt - Math.floor(Date.now() / 1000);
    console.warn('[CART-REMOVE] Rate limit exceeded:', {
      ip: context.clientAddress,
      resetAt: new Date(rateLimitResult.resetAt * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many cart operations. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        resetAt: rateLimitResult.resetAt,
        retryAfter: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter > 0 ? retryAfter : 1),
        },
      }
    );
  }

  try {
    // Get user ID from session cookie
    const sessionId = cookies.get('session_id')?.value;
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active session found',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { itemType, itemId } = body;

    // Validate required fields
    if (!itemType || !itemId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: itemType and itemId',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate item type
    const validTypes: OrderItemType[] = ['course', 'event', 'digital_product'];
    if (!validTypes.includes(itemType as OrderItemType)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid itemType. Must be one of: ${validTypes.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Remove item from cart
    const cart = await removeFromCart(
      sessionId,
      itemType as OrderItemType,
      itemId
    );

    return new Response(
      JSON.stringify({
        success: true,
        cart,
        message: 'Item removed from cart successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error removing item from cart:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Item not in cart error
      if (error.message.includes('not found') || error.message.includes('not in cart')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to remove item from cart',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
