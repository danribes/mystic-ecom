/**
 * POST /api/checkout/webhook
 *
 * Stripe webhook handler for payment events
 * T219: Refactored to use service layer pattern (thin route handler)
 *
 * Flow:
 * 1. Verify webhook signature
 * 2. Check idempotency (prevent replay attacks)
 * 3. Delegate to WebhookService for business logic
 *
 * Security:
 * - Stripe signature verification required
 * - Idempotency check prevents replay attacks
 * - Rate limiting prevents webhook spam
 * - Raw body needed for signature validation
 */

import type { APIRoute } from 'astro';
import { validateWebhook, processWebhookEvent } from '@/lib/stripe';
import { WebhookService } from '@/services/webhook.service';
import { logger } from '@/lib/logger';

export const POST: APIRoute = async (context) => {
  const { request } = context;

  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.error('[Webhook] Missing Stripe signature');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Stripe signature',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify webhook signature and construct event
    let event;
    try {
      event = validateWebhook(body, signature);
    } catch (err) {
      logger.error('[Webhook] Signature verification failed:', err);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid signature',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info(`[Webhook] Received event: ${event.type}, ID: ${event.id}`);

    // Check idempotency - prevent replay attacks
    const alreadyProcessed = await WebhookService.checkIdempotency(event.id);
    if (alreadyProcessed) {
      logger.info(`[Webhook] Event ${event.id} already processed, skipping`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Event already processed (idempotent)',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark event as being processed
    await WebhookService.markProcessed(event.id);

    // Process the webhook event
    const processedEvent = await processWebhookEvent(event);

    // Delegate to service layer based on event type
    switch (processedEvent.type) {
      case 'checkout.completed':
        return await handleCheckoutCompleted(processedEvent, event);

      case 'payment.succeeded':
        return handlePaymentSucceeded(processedEvent);

      case 'payment.failed':
        return await handlePaymentFailed(processedEvent);

      case 'charge.refunded':
        return await handleRefund(processedEvent);

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Event received',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    logger.error('[Webhook] Error processing webhook:', error);

    // Return 500 to tell Stripe to retry
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Webhook processing failed',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(processedEvent: any, event: any) {
  const { orderId } = processedEvent;

  if (!orderId) {
    logger.error('[Webhook] No orderId in checkout session');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Order ID not found in session',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Delegate to service layer
  const result = await WebhookService.handleCheckoutCompleted(orderId, event);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: result.error || 'Order processing failed',
        orderId: orderId,
      }),
      {
        status: result.error === 'Order not found' ? 404 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Order completed successfully',
      orderId: orderId,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle payment_intent.succeeded event
 */
function handlePaymentSucceeded(processedEvent: any) {
  logger.info(`[Webhook] Payment succeeded: ${processedEvent.paymentIntentId}`);

  // This is handled by checkout.completed, but we log it
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Payment confirmed',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(processedEvent: any) {
  logger.error(`[Webhook] Payment failed: ${processedEvent.paymentIntentId}`);

  // Delegate to service layer
  await WebhookService.handlePaymentFailure(processedEvent.orderId);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Payment failure recorded',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle charge.refunded event
 */
async function handleRefund(processedEvent: any) {
  logger.info(`[Webhook] Charge refunded: ${processedEvent.paymentIntentId}`);

  // Delegate to service layer
  await WebhookService.handleRefund(processedEvent.orderId);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Refund processed',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
