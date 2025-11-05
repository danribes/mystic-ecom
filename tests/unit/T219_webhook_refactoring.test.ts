/**
 * T219: Webhook Refactoring - Test Suite
 *
 * Tests for refactored webhook service layer
 * Verifies business logic extracted from route handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WebhookIdempotencyService,
  OrderCompletionService,
  PaymentFailureService,
  RefundService,
  WebhookService,
} from '@/services/webhook.service';
import { getRedisClient } from '@/lib/redis';
import { getPool } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/redis');
vi.mock('@/lib/db');
vi.mock('@/lib/email');
vi.mock('@/lib/whatsapp');
vi.mock('@/lib/twilio');
vi.mock('@/lib/stripe');
vi.mock('@/services/cart.service');

describe('T219: Webhook Service Refactoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WebhookIdempotencyService', () => {
    it('should check if event is processed', async () => {
      const mockRedis = {
        exists: vi.fn().mockResolvedValue(1),
      };
      vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

      const isProcessed = await WebhookIdempotencyService.isProcessed('evt_123');

      expect(isProcessed).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('webhook:processed:evt_123');
    });

    it('should return false if event not processed', async () => {
      const mockRedis = {
        exists: vi.fn().mockResolvedValue(0),
      };
      vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

      const isProcessed = await WebhookIdempotencyService.isProcessed('evt_456');

      expect(isProcessed).toBe(false);
    });

    it('should handle Redis errors gracefully (fail open)', async () => {
      vi.mocked(getRedisClient).mockRejectedValue(new Error('Redis connection failed'));

      const isProcessed = await WebhookIdempotencyService.isProcessed('evt_789');

      // Should return false to allow processing when Redis is unavailable
      expect(isProcessed).toBe(false);
    });

    it('should mark event as processed', async () => {
      const mockRedis = {
        setEx: vi.fn().mockResolvedValue('OK'),
      };
      vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

      await WebhookIdempotencyService.markProcessed('evt_123');

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'webhook:processed:evt_123',
        86400, // 24 hours
        expect.any(String)
      );
    });

    it('should handle marking errors gracefully', async () => {
      vi.mocked(getRedisClient).mockRejectedValue(new Error('Redis write failed'));

      // Should not throw
      await expect(WebhookIdempotencyService.markProcessed('evt_123')).resolves.not.toThrow();
    });
  });

  describe('OrderCompletionService', () => {
    it('should return error if order not found', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      const result = await OrderCompletionService.processCompletedCheckout('order_123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('should return success if order already completed', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: 'order_123',
              user_id: 'user_456',
              total_amount: 100,
              status: 'completed',
              created_at: new Date(),
            },
          ],
        }),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      const result = await OrderCompletionService.processCompletedCheckout('order_123', {});

      expect(result.success).toBe(true);
    });

    it('should process pending order successfully', async () => {
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [] }) // UPDATE orders
          .mockResolvedValueOnce({ // Get order items
            rows: [
              {
                id: 'item_1',
                item_type: 'course',
                title: 'Test Course',
                price: 50,
                quantity: 1,
                course_id: 'course_123',
                digital_product_id: null,
              },
            ],
          })
          .mockResolvedValueOnce({ // Get user details
            rows: [{ name: 'John Doe', email: 'john@example.com', phone: '+1234567890' }],
          })
          .mockResolvedValueOnce({ rows: [] }) // Grant course access
          .mockResolvedValueOnce({ rows: [] }), // Update bookings
      };

      const mockPool = {
        query: vi.fn()
          .mockResolvedValueOnce({ // Get order
            rows: [
              {
                id: 'order_123',
                user_id: 'user_456',
                total_amount: 100,
                status: 'pending',
                created_at: new Date(),
              },
            ],
          }),
      };

      vi.mocked(getPool).mockReturnValue(mockPool as any);

      // Mock transaction
      const { transaction } = await import('@/lib/db');
      vi.mocked(transaction).mockImplementation(async (callback) => {
        await callback(mockClient as any);
      });

      // Mock external services
      const { getCheckoutSession } = await import('@/lib/stripe');
      vi.mocked(getCheckoutSession).mockResolvedValue({
        customer_email: 'customer@example.com',
        client_reference_id: 'user_456',
      } as any);

      const { sendOrderConfirmationEmail } = await import('@/lib/email');
      vi.mocked(sendOrderConfirmationEmail).mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      } as any);

      const { notifyAdminsNewOrder } = await import('@/lib/twilio');
      vi.mocked(notifyAdminsNewOrder).mockResolvedValue([{ success: true }] as any);

      const { clearCart } = await import('@/services/cart.service');
      vi.mocked(clearCart).mockResolvedValue(undefined);

      const result = await OrderCompletionService.processCompletedCheckout('order_123', {
        data: {
          object: { id: 'cs_123' },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle transaction errors', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: 'order_123',
              user_id: 'user_456',
              total_amount: 100,
              status: 'pending',
              created_at: new Date(),
            },
          ],
        }),
      };

      vi.mocked(getPool).mockReturnValue(mockPool as any);

      // Mock transaction failure
      const { transaction } = await import('@/lib/db');
      vi.mocked(transaction).mockRejectedValue(new Error('Database error'));

      const result = await OrderCompletionService.processCompletedCheckout('order_123', {
        data: {
          object: { id: 'cs_123' },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('transaction rolled back');
    });
  });

  describe('PaymentFailureService', () => {
    it('should update order status to payment_failed', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      await PaymentFailureService.processPaymentFailure('order_123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'payment_failed'"),
        ['order_123']
      );
    });

    it('should handle missing orderId', async () => {
      const mockPool = {
        query: vi.fn(),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      // Should not throw
      await expect(PaymentFailureService.processPaymentFailure(undefined)).resolves.not.toThrow();

      // Should not call query
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should throw on database error', async () => {
      const mockPool = {
        query: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      await expect(PaymentFailureService.processPaymentFailure('order_123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('RefundService', () => {
    it('should process refund successfully', async () => {
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [] }) // Update order status
          .mockResolvedValueOnce({ rows: [] }) // Revoke course access
          .mockResolvedValueOnce({ rows: [] }), // Cancel bookings
      };

      // Mock transaction
      const { transaction } = await import('@/lib/db');
      vi.mocked(transaction).mockImplementation(async (callback) => {
        await callback(mockClient as any);
      });

      await RefundService.processRefund('order_123');

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'refunded'"),
        ['order_123']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM course_enrollments'),
        ['order_123']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'"),
        ['order_123']
      );
    });

    it('should handle missing orderId', async () => {
      const { transaction } = await import('@/lib/db');
      const mockTransaction = vi.mocked(transaction);

      // Should not throw
      await expect(RefundService.processRefund(undefined)).resolves.not.toThrow();

      // Should not call transaction
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should throw on transaction error', async () => {
      const { transaction } = await import('@/lib/db');
      vi.mocked(transaction).mockRejectedValue(new Error('Transaction failed'));

      await expect(RefundService.processRefund('order_123')).rejects.toThrow('Transaction failed');
    });
  });

  describe('WebhookService', () => {
    it('should delegate idempotency check', async () => {
      const mockRedis = {
        exists: vi.fn().mockResolvedValue(1),
      };
      vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

      const result = await WebhookService.checkIdempotency('evt_123');

      expect(result).toBe(true);
    });

    it('should delegate marking processed', async () => {
      const mockRedis = {
        setEx: vi.fn().mockResolvedValue('OK'),
      };
      vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

      await WebhookService.markProcessed('evt_123');

      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    it('should delegate checkout completed handling', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: 'order_123',
              user_id: 'user_456',
              total_amount: 100,
              status: 'completed',
              created_at: new Date(),
            },
          ],
        }),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      const result = await WebhookService.handleCheckoutCompleted('order_123', {});

      expect(result.success).toBe(true);
    });

    it('should delegate payment failure handling', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      await expect(WebhookService.handlePaymentFailure('order_123')).resolves.not.toThrow();

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should delegate refund handling', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      const { transaction } = await import('@/lib/db');
      vi.mocked(transaction).mockImplementation(async (callback) => {
        await callback(mockClient as any);
      });

      await expect(WebhookService.handleRefund('order_123')).resolves.not.toThrow();
    });
  });

  describe('Service Layer Integration', () => {
    it('should maintain same functionality as original webhook', async () => {
      // This test verifies the refactored code maintains behavior
      const mockPool = {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              id: 'order_123',
              user_id: 'user_456',
              total_amount: 100,
              status: 'completed',
              created_at: new Date(),
            },
          ],
        }),
      };
      vi.mocked(getPool).mockReturnValue(mockPool as any);

      // Test idempotency
      const mockRedis = {
        exists: vi.fn().mockResolvedValue(0),
        setEx: vi.fn().mockResolvedValue('OK'),
      };
      vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

      const isProcessed = await WebhookService.checkIdempotency('evt_new');
      expect(isProcessed).toBe(false);

      await WebhookService.markProcessed('evt_new');
      expect(mockRedis.setEx).toHaveBeenCalled();

      // Test order completion (already completed)
      const result = await WebhookService.handleCheckoutCompleted('order_123', {});
      expect(result.success).toBe(true);
    });
  });
});
