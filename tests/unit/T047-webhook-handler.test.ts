/**
 * T047: Stripe Webhook Handler Tests
 * T219: Updated to work with refactored service layer
 *
 * Tests the POST /api/checkout/webhook endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Stripe from 'stripe';

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
  validateWebhook: vi.fn(),
  processWebhookEvent: vi.fn(),
}));

vi.mock('@/services/webhook.service', () => ({
  WebhookService: {
    checkIdempotency: vi.fn(),
    markProcessed: vi.fn(),
    handleCheckoutCompleted: vi.fn(),
    handlePaymentFailure: vi.fn(),
    handleRefund: vi.fn(),
  },
}));

import { validateWebhook, processWebhookEvent } from '@/lib/stripe';
import { WebhookService } from '@/services/webhook.service';
import { POST } from '../../src/pages/api/checkout/webhook';

describe('Webhook Handler - T047/T219', () => {
  let mockRequest: Request;
  const mockOrderId = 'order-uuid-123';
  const mockPaymentIntentId = 'pi_test_789';

  // Mock Stripe event
  const mockCheckoutCompletedEvent: Stripe.Event = {
    id: 'evt_test_123',
    object: 'event',
    api_version: '2025-02-24.acacia',
    created: Date.now() / 1000,
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: {
        id: 'cs_test_abc123',
        object: 'checkout.session',
        customer_email: 'test@example.com',
        client_reference_id: mockOrderId,
        payment_intent: mockPaymentIntentId,
      } as any,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    (validateWebhook as any).mockReturnValue(mockCheckoutCompletedEvent);
    (processWebhookEvent as any).mockResolvedValue({
      type: 'checkout.completed',
      orderId: mockOrderId,
      paymentIntentId: mockPaymentIntentId,
      amount: 8532,
      status: 'paid',
      data: {
        customerEmail: 'test@example.com',
        paymentStatus: 'paid',
      },
    });

    // Mock WebhookService (T219: now using service layer)
    (WebhookService.checkIdempotency as any).mockResolvedValue(false); // Not processed
    (WebhookService.markProcessed as any).mockResolvedValue(undefined);
    (WebhookService.handleCheckoutCompleted as any).mockResolvedValue({ success: true });
    (WebhookService.handlePaymentFailure as any).mockResolvedValue(undefined);
    (WebhookService.handleRefund as any).mockResolvedValue(undefined);

    process.env.BASE_URL = 'http://localhost:4321';
    process.env.NODE_ENV = 'test';
  });

  describe('Successful Webhook Processing', () => {
    it('should process checkout.session.completed event successfully', async () => {
      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order completed successfully');
      expect(data.orderId).toBe(mockOrderId);
    });

    it('should verify webhook signature', async () => {
      const mockSignature = 't=timestamp,v1=signature';
      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      await POST({ request: mockRequest } as any);

      expect(validateWebhook).toHaveBeenCalledWith(expect.any(String), mockSignature);
    });

    it('should delegate to WebhookService.handleCheckoutCompleted', async () => {
      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      await POST({ request: mockRequest } as any);

      // T219: Verify service layer is called
      expect(WebhookService.handleCheckoutCompleted).toHaveBeenCalledWith(
        mockOrderId,
        expect.any(Object)
      );
    });

    it('should check idempotency before processing', async () => {
      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      await POST({ request: mockRequest } as any);

      // T219: Verify idempotency check is called
      expect(WebhookService.checkIdempotency).toHaveBeenCalledWith('evt_test_123');
    });

    it('should mark event as processed', async () => {
      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      await POST({ request: mockRequest } as any);

      // T219: Verify event marked as processed
      expect(WebhookService.markProcessed).toHaveBeenCalledWith('evt_test_123');
    });

    it('should skip already processed events (idempotency)', async () => {
      // Mock event as already processed
      (WebhookService.checkIdempotency as any).mockResolvedValue(true);

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Event already processed (idempotent)');

      // Should not call handle functions
      expect(WebhookService.handleCheckoutCompleted).not.toHaveBeenCalled();
    });

    it('should continue processing even if service layer succeeds', async () => {
      (WebhookService.handleCheckoutCompleted as any).mockResolvedValue({ success: true });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 if stripe-signature header is missing', async () => {
      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing Stripe signature');
    });

    it('should return 400 if signature verification fails', async () => {
      (validateWebhook as any).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid signature');
    });

    it('should return 400 if orderId is missing from event', async () => {
      (processWebhookEvent as any).mockResolvedValue({
        type: 'checkout.completed',
        orderId: null, // Missing orderId
        paymentIntentId: mockPaymentIntentId,
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order ID not found in session');
    });

    it('should return 404 if order not found in database', async () => {
      (WebhookService.handleCheckoutCompleted as any).mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order not found');
    });

    it('should return 500 if database error occurs', async () => {
      (WebhookService.handleCheckoutCompleted as any).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Other Event Types', () => {
    it('should handle payment_intent.succeeded event', async () => {
      (processWebhookEvent as any).mockResolvedValue({
        type: 'payment.succeeded',
        paymentIntentId: mockPaymentIntentId,
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payment confirmed');
    });

    it('should handle payment_intent.payment_failed event', async () => {
      (processWebhookEvent as any).mockResolvedValue({
        type: 'payment.failed',
        paymentIntentId: mockPaymentIntentId,
        orderId: mockOrderId,
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payment failure recorded');

      // T219: Verify service layer called
      expect(WebhookService.handlePaymentFailure).toHaveBeenCalledWith(mockOrderId);
    });

    it('should handle charge.refunded event', async () => {
      (processWebhookEvent as any).mockResolvedValue({
        type: 'charge.refunded',
        paymentIntentId: mockPaymentIntentId,
        orderId: mockOrderId,
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Refund processed');

      // T219: Verify service layer called
      expect(WebhookService.handleRefund).toHaveBeenCalledWith(mockOrderId);
    });

    it('should handle unknown event types gracefully', async () => {
      (processWebhookEvent as any).mockResolvedValue({
        type: 'unknown.event',
      });

      mockRequest = new Request('http://localhost/api/checkout/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=timestamp,v1=signature',
        },
        body: JSON.stringify(mockCheckoutCompletedEvent),
      });

      const response = await POST({ request: mockRequest } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Event received');
    });
  });
});
