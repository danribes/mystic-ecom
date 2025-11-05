/**
 * T219: Webhook Service Layer
 *
 * Extracted business logic from webhook.ts route handler
 * Handles webhook processing, order completion, notifications, and refunds
 *
 * Pattern: Thin route handlers, logic in services
 */

import { getPool, transaction, type PoolClient } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { clearCart } from '@/services/cart.service';
import { sendOrderConfirmationEmail, type OrderConfirmationData } from '@/lib/email';
import { notifyAdminsNewOrder } from '@/lib/twilio';
import { getCheckoutSession } from '@/lib/stripe';
import type { ProcessedWebhookEvent } from '@/lib/stripe';
import { logger } from '@/lib/logger';

/**
 * Idempotency Service
 * Prevents duplicate webhook processing using Redis
 */
export class WebhookIdempotencyService {
  private static readonly TTL_SECONDS = 86400; // 24 hours
  private static readonly KEY_PREFIX = 'webhook:processed:';

  /**
   * Check if webhook event has already been processed
   */
  static async isProcessed(eventId: string): Promise<boolean> {
    try {
      const redis = await getRedisClient();
      const key = `${this.KEY_PREFIX}${eventId}`;
      const exists = await redis.exists(key);
      return exists > 0;
    } catch (error) {
      logger.error('[WebhookIdempotency] Error checking processed status:', error);
      // Fail open - allow processing if Redis unavailable
      return false;
    }
  }

  /**
   * Mark webhook event as processed
   * Stores event ID in Redis with 24 hour expiration
   */
  static async markProcessed(eventId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = `${this.KEY_PREFIX}${eventId}`;
      await redis.setEx(key, this.TTL_SECONDS, new Date().toISOString());
    } catch (error) {
      logger.error('[WebhookIdempotency] Error marking processed:', error);
      // Non-critical - continue anyway
    }
  }
}

/**
 * Order data from database
 */
interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: Date;
}

/**
 * Order item from database
 */
interface OrderItem {
  id: string;
  item_type: string;
  title: string;
  price: number;
  quantity: number;
  course_id: string | null;
  digital_product_id: string | null;
}

/**
 * User details from database
 */
interface UserDetails {
  name: string | null;
  email: string;
  phone: string | null;
}

/**
 * Order Completion Service
 * Handles the complete order fulfillment workflow
 */
export class OrderCompletionService {
  /**
   * Process completed checkout session
   * Handles order update, access granting, and notifications
   */
  static async processCompletedCheckout(
    orderId: string,
    event: any
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const pool = getPool();

    // Get order details
    const order = await this.getOrder(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Check if already processed
    if (order.status === 'completed') {
      logger.info(`[OrderCompletion] Order already completed: ${orderId}`);
      return { success: true };
    }

    // Process order in atomic transaction
    try {
      const { orderItems, customerName, customerPhone } = await this.updateOrderInTransaction(
        order
      );

      // Get customer email from Stripe session
      const customerEmail = await this.getCustomerEmail(event);

      // Send notifications (non-blocking)
      await this.sendNotifications(order, orderItems, customerName, customerEmail, customerPhone);

      // Clear cart (non-blocking)
      await this.clearCustomerCart(order.user_id);

      logger.info(`[OrderCompletion] Successfully completed order: ${orderId}`);
      return { success: true };
    } catch (error) {
      logger.error(`[OrderCompletion] Failed to process order ${orderId}:`, error);
      return {
        success: false,
        error: 'Order processing failed - transaction rolled back',
      };
    }
  }

  /**
   * Get order from database
   */
  private static async getOrder(orderId: string): Promise<Order | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, user_id, total_amount, status, created_at
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update order in atomic transaction
   * Returns order items and customer details
   */
  private static async updateOrderInTransaction(
    order: Order
  ): Promise<{
    orderItems: OrderItem[];
    customerName: string;
    customerPhone: string | null;
  }> {
    let orderItems: OrderItem[] = [];
    let customerName = 'Valued Customer';
    let customerPhone: string | null = null;

    await transaction(async (client) => {
      // 1. Update order status
      await client.query(
        `UPDATE orders
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order.id]
      );

      logger.info(`[OrderCompletion] Order status updated: ${order.id}`);

      // 2. Get order items
      const itemsResult = await client.query(
        `SELECT id, item_type, title, price, quantity, course_id, digital_product_id
         FROM order_items
         WHERE order_id = $1`,
        [order.id]
      );

      orderItems = itemsResult.rows;

      // 3. Get user details
      if (order.user_id) {
        const userResult = await client.query(
          'SELECT name, email, phone FROM users WHERE id = $1',
          [order.user_id]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          customerName = user.name || customerName;
          customerPhone = user.phone;
        }
      }

      // 4. Grant access to purchased items
      await this.grantAccessToItems(client, order.user_id, orderItems);

      // 5. Update event bookings
      await client.query(
        `UPDATE bookings
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $1 AND status = 'pending'`,
        [order.id]
      );

      logger.info(`[OrderCompletion] Transaction completed for order: ${order.id}`);
    });

    return { orderItems, customerName, customerPhone };
  }

  /**
   * Grant access to purchased items
   */
  private static async grantAccessToItems(
    client: PoolClient,
    userId: string,
    items: OrderItem[]
  ): Promise<void> {
    for (const item of items) {
      if (item.item_type === 'course' && item.course_id) {
        await client.query(
          `INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, course_id) DO NOTHING`,
          [userId, item.course_id]
        );

        logger.info(`[OrderCompletion] Granted course access: user=${userId}, course=${item.course_id}`);
      }

      // Digital products access is granted via order_items table
    }
  }

  /**
   * Get customer email from Stripe session
   */
  private static async getCustomerEmail(event: any): Promise<string | null> {
    try {
      const sessionData = event.data.object as any;
      const session = await getCheckoutSession(sessionData.id);
      return session.customer_email || null;
    } catch (error) {
      logger.error('[OrderCompletion] Error fetching customer email:', error);
      return null;
    }
  }

  /**
   * Send all notifications for completed order
   */
  private static async sendNotifications(
    order: Order,
    orderItems: OrderItem[],
    customerName: string,
    customerEmail: string | null,
    customerPhone: string | null
  ): Promise<void> {
    try {
      // Prepare email data
      const emailData: OrderConfirmationData = {
        orderId: order.id,
        customerName,
        customerEmail: customerEmail || '',
        orderDate: new Date(order.created_at),
        items: orderItems.map(item => ({
          type: item.item_type,
          title: item.title,
          price: item.price * 100, // Convert to cents
          quantity: item.quantity,
        })),
        subtotal: Math.round((order.total_amount / 1.08) * 100),
        tax: Math.round(order.total_amount * 0.08 * 100),
        total: Math.round(order.total_amount * 100),
        accessLinks: [],
      };

      // Send customer email
      if (customerEmail) {
        const emailResult = await sendOrderConfirmationEmail(emailData);
        logger.info(`[OrderCompletion] Customer email sent for order ${order.id}:`, {
          success: emailResult.success,
          messageId: emailResult.messageId,
        });

        // Send WhatsApp if phone provided
        if (customerPhone) {
          const { sendOrderWhatsApp } = await import('@/lib/whatsapp');
          const whatsappResult = await sendOrderWhatsApp({
            orderId: order.id,
            customerName,
            customerPhone,
            items: orderItems.map(item => ({
              title: item.title,
              price: item.price,
            })),
            total: order.total_amount,
            dashboardUrl: `${process.env.BASE_URL || 'http://localhost:4321'}/dashboard/orders/${order.id}`,
          });
          logger.info(`[OrderCompletion] WhatsApp sent for order ${order.id}:`, {
            success: whatsappResult.success,
          });
        }
      }

      // Send admin notifications
      const adminResult = await notifyAdminsNewOrder({
        orderId: order.id,
        customerName,
        customerEmail: customerEmail || 'No email provided',
        totalAmount: order.total_amount,
        items: orderItems.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      logger.info(`[OrderCompletion] Admin notifications sent for order ${order.id}:`, {
        successCount: adminResult.filter(r => r !== null).length,
        totalAdmins: adminResult.length,
      });
    } catch (error) {
      logger.error('[OrderCompletion] Notification error:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Clear customer's cart after successful purchase
   */
  private static async clearCustomerCart(userId: string): Promise<void> {
    try {
      if (userId) {
        await clearCart(userId);
        logger.info(`[OrderCompletion] Cart cleared for user: ${userId}`);
      }
    } catch (error) {
      logger.error('[OrderCompletion] Cart clear error:', error);
      // Don't throw - cart clearing is non-critical
    }
  }
}

/**
 * Payment Failure Service
 * Handles failed payment events
 */
export class PaymentFailureService {
  /**
   * Process payment failure event
   */
  static async processPaymentFailure(orderId: string | undefined): Promise<void> {
    if (!orderId) {
      logger.warn('[PaymentFailure] No orderId provided');
      return;
    }

    const pool = getPool();

    try {
      await pool.query(
        `UPDATE orders
         SET status = 'payment_failed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [orderId]
      );

      logger.info(`[PaymentFailure] Order marked as failed: ${orderId}`);
    } catch (error) {
      logger.error(`[PaymentFailure] Error updating order ${orderId}:`, error);
      throw error;
    }
  }
}

/**
 * Refund Service
 * Handles refund events and access revocation
 */
export class RefundService {
  /**
   * Process refund event
   * Updates order status and revokes access
   */
  static async processRefund(orderId: string | undefined): Promise<void> {
    if (!orderId) {
      logger.warn('[Refund] No orderId provided');
      return;
    }

    const pool = getPool();

    try {
      await transaction(async (client) => {
        // 1. Update order status
        await client.query(
          `UPDATE orders
           SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [orderId]
        );

        // 2. Revoke course access
        await client.query(
          `DELETE FROM course_enrollments
           WHERE user_id IN (SELECT user_id FROM orders WHERE id = $1)
           AND course_id IN (
             SELECT course_id FROM order_items
             WHERE order_id = $1 AND course_id IS NOT NULL
           )`,
          [orderId]
        );

        // 3. Cancel bookings
        await client.query(
          `UPDATE bookings
           SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1`,
          [orderId]
        );
      });

      logger.info(`[Refund] Successfully processed refund for order: ${orderId}`);
    } catch (error) {
      logger.error(`[Refund] Error processing refund for order ${orderId}:`, error);
      throw error;
    }
  }
}

/**
 * Webhook Service
 * Main service orchestrator for webhook events
 */
export class WebhookService {
  /**
   * Check if event already processed (idempotency)
   */
  static async checkIdempotency(eventId: string): Promise<boolean> {
    return WebhookIdempotencyService.isProcessed(eventId);
  }

  /**
   * Mark event as processed
   */
  static async markProcessed(eventId: string): Promise<void> {
    return WebhookIdempotencyService.markProcessed(eventId);
  }

  /**
   * Handle checkout completed event
   */
  static async handleCheckoutCompleted(
    orderId: string,
    event: any
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    return OrderCompletionService.processCompletedCheckout(orderId, event);
  }

  /**
   * Handle payment failure event
   */
  static async handlePaymentFailure(orderId: string | undefined): Promise<void> {
    return PaymentFailureService.processPaymentFailure(orderId);
  }

  /**
   * Handle refund event
   */
  static async handleRefund(orderId: string | undefined): Promise<void> {
    return RefundService.processRefund(orderId);
  }
}
