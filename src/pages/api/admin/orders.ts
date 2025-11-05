/**
 * T072: Admin Orders API Endpoint
 *
 * GET /api/admin/orders
 * - List all orders with filtering
 * - Supports query parameters: status, search, startDate, endDate, itemType
 * - Returns JSON by default
 * - Returns CSV when format=csv query parameter is present
 * - Admin authentication required
 *
 * Security: T204 - Uses centralized admin authorization middleware
 */

import type { APIRoute } from 'astro';
import { searchOrders } from '@/services/order.service';
import { withAdminAuth } from '@/lib/adminAuth';
import type { OrderStatus } from '@/types';
import { z } from 'zod';

// ==================== Validation Schemas ====================

const OrdersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'payment_pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  itemType: z.enum(['course', 'event', 'digital_product']).optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

// ==================== Helper Functions ====================

/**
 * Convert orders to CSV format
 */
function ordersToCSV(orders: any[]): string {
  if (orders.length === 0) {
    return 'Order ID,User Email,User Name,Status,Subtotal,Tax,Total,Items Count,Created At,Updated At\n';
  }

  const headers = [
    'Order ID',
    'User Email',
    'User Name',
    'Status',
    'Subtotal',
    'Tax',
    'Total',
    'Items Count',
    'Created At',
    'Updated At',
    'Payment Intent ID',
    'Item Types',
    'Item Titles',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toISOString();
  };

  const rows = orders.map(order => [
    escapeCSV(order.id),
    escapeCSV(order.userEmail),
    escapeCSV(order.userName || ''),
    escapeCSV(order.status),
    formatCurrency(order.subtotal),
    formatCurrency(order.tax),
    formatCurrency(order.total),
    order.items?.length || 0,
    formatDate(order.createdAt),
    formatDate(order.updatedAt),
    escapeCSV(order.paymentIntentId || ''),
    escapeCSV(order.items?.map((item: any) => item.itemType).join('; ') || ''),
    escapeCSV(order.items?.map((item: any) => item.itemTitle).join('; ') || ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

// ==================== GET Handler ====================

/**
 * GET /api/admin/orders
 * List all orders with filtering and optional CSV export
 */
const handler: APIRoute = async ({ request, url, cookies, locals }) => {
  try {
    // Admin authentication handled by withAdminAuth middleware
    // Session available in locals.session

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = OrdersQuerySchema.safeParse(queryParams);

    if (!validatedQuery.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameters',
          details: validatedQuery.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { search, status, startDate, endDate, itemType, format } = validatedQuery.data;

    // Build filters object
    const filters: any = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (itemType) filters.itemType = itemType;

    // Fetch orders
    const orders = await searchOrders(search || '', filters);

    // Return CSV if requested
    if (format === 'csv') {
      const csv = ordersToCSV(orders);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `orders-export-${timestamp}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Return JSON
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orders,
          count: orders.length,
          filters: {
            search,
            status,
            startDate,
            endDate,
            itemType,
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Export handler wrapped with admin authorization middleware
export const GET = withAdminAuth(handler);
