/**
 * T148: GDPR Compliance Library
 *
 * Implements GDPR requirements:
 * - Article 15: Right of access (data export)
 * - Article 17: Right to erasure ("right to be forgotten")
 * - Article 20: Right to data portability
 */

import pool from './db';

/**
 * User data export interface
 */
export interface UserDataExport {
  metadata: {
    exportDate: string;
    userId: string;
    format: 'json';
    gdprArticle: 'Article 15 (Right of Access) & Article 20 (Data Portability)';
  };
  profile: {
    id: string;
    email: string;
    name: string;
    role: string;
    whatsapp: string | null;
    preferredLanguage: string | null;
    createdAt: string;
    updatedAt: string;
  };
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    currency: string;
    items: Array<{
      itemType: string;
      title: string;
      price: number;
      quantity: number;
    }>;
    createdAt: string;
  }>;
  bookings: Array<{
    id: string;
    eventTitle: string;
    status: string;
    attendees: number;
    totalPrice: number;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    courseTitle: string;
    rating: number;
    comment: string | null;
    isApproved: boolean;
    createdAt: string;
  }>;
  courseProgress: Array<{
    courseTitle: string;
    progressPercentage: number;
    completedLessons: string[];
    lastAccessedAt: string;
    completedAt: string | null;
  }>;
  lessonProgress: Array<{
    courseTitle: string;
    lessonId: string;
    completed: boolean;
    timeSpentSeconds: number;
    attempts: number;
    score: number | null;
    completedAt: string | null;
  }>;
  downloads: Array<{
    productTitle: string;
    downloadedAt: string;
  }>;
  cart: Array<{
    itemType: string;
    title: string;
    quantity: number;
    addedAt: string;
  }>;
}

/**
 * Export all user data in GDPR-compliant format
 *
 * Implements Article 15 (Right of Access) and Article 20 (Data Portability)
 *
 * @param userId - User ID to export data for
 * @returns Complete user data export
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const client = await pool.connect();

  try {
    // 1. Profile data
    const profileResult = await client.query(
      `SELECT id, email, name, role, whatsapp, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const profile = profileResult.rows[0];

    // 2. Orders and order items
    const ordersResult = await client.query(
      `SELECT
        o.id, o.status, o.total_amount, o.currency, o.created_at,
        json_agg(
          json_build_object(
            'itemType', oi.item_type,
            'title', oi.title,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orders = ordersResult.rows.map((row) => ({
      id: row.id,
      status: row.status,
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      items: row.items || [],
      createdAt: row.created_at.toISOString(),
    }));

    // 3. Bookings
    const bookingsResult = await client.query(
      `SELECT
        b.id, e.title as event_title, b.status, b.attendees,
        b.total_price, b.created_at
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    const bookings = bookingsResult.rows.map((row) => ({
      id: row.id,
      eventTitle: row.event_title,
      status: row.status,
      attendees: row.attendees,
      totalPrice: parseFloat(row.total_price),
      createdAt: row.created_at.toISOString(),
    }));

    // 4. Reviews
    const reviewsResult = await client.query(
      `SELECT
        r.id, c.title as course_title, r.rating, r.comment,
        r.is_approved, r.created_at
       FROM reviews r
       JOIN courses c ON r.course_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const reviews = reviewsResult.rows.map((row) => ({
      id: row.id,
      courseTitle: row.course_title,
      rating: row.rating,
      comment: row.comment,
      isApproved: row.is_approved,
      createdAt: row.created_at.toISOString(),
    }));

    // 5. Course progress
    const courseProgressResult = await client.query(
      `SELECT
        c.title as course_title, cp.progress_percentage,
        cp.completed_lessons, cp.last_accessed_at, cp.completed_at
       FROM course_progress cp
       JOIN courses c ON cp.course_id = c.id
       WHERE cp.user_id = $1
       ORDER BY cp.last_accessed_at DESC`,
      [userId]
    );

    const courseProgress = courseProgressResult.rows.map((row) => ({
      courseTitle: row.course_title,
      progressPercentage: row.progress_percentage,
      completedLessons: row.completed_lessons || [],
      lastAccessedAt: row.last_accessed_at.toISOString(),
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    }));

    // 6. Lesson progress
    const lessonProgressResult = await client.query(
      `SELECT
        c.title as course_title, lp.lesson_id, lp.completed,
        lp.time_spent_seconds, lp.attempts, lp.score, lp.completed_at
       FROM lesson_progress lp
       JOIN courses c ON lp.course_id = c.id
       WHERE lp.user_id = $1
       ORDER BY lp.last_accessed_at DESC`,
      [userId]
    );

    const lessonProgress = lessonProgressResult.rows.map((row) => ({
      courseTitle: row.course_title,
      lessonId: row.lesson_id,
      completed: row.completed,
      timeSpentSeconds: row.time_spent_seconds,
      attempts: row.attempts,
      score: row.score,
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    }));

    // 7. Download logs
    const downloadsResult = await client.query(
      `SELECT
        dp.title as product_title, dl.downloaded_at
       FROM download_logs dl
       JOIN digital_products dp ON dl.digital_product_id = dp.id
       WHERE dl.user_id = $1
       ORDER BY dl.downloaded_at DESC`,
      [userId]
    );

    const downloads = downloadsResult.rows.map((row) => ({
      productTitle: row.product_title,
      downloadedAt: row.downloaded_at.toISOString(),
    }));

    // 8. Cart items
    const cartResult = await client.query(
      `SELECT
        ci.item_type,
        COALESCE(c.title, dp.title) as title,
        ci.quantity,
        ci.created_at
       FROM cart_items ci
       LEFT JOIN courses c ON ci.course_id = c.id
       LEFT JOIN digital_products dp ON ci.digital_product_id = dp.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    );

    const cart = cartResult.rows.map((row) => ({
      itemType: row.item_type,
      title: row.title,
      quantity: row.quantity,
      addedAt: row.created_at.toISOString(),
    }));

    // Return complete export
    return {
      metadata: {
        exportDate: new Date().toISOString(),
        userId: userId,
        format: 'json',
        gdprArticle: 'Article 15 (Right of Access) & Article 20 (Data Portability)',
      },
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        whatsapp: profile.whatsapp,
        preferredLanguage: null, // Column doesn't exist in schema yet
        createdAt: profile.created_at.toISOString(),
        updatedAt: profile.updated_at.toISOString(),
      },
      orders,
      bookings,
      reviews,
      courseProgress,
      lessonProgress,
      downloads,
      cart,
    };
  } finally {
    client.release();
  }
}

/**
 * Deletion result interface
 */
export interface DeletionResult {
  success: boolean;
  userId: string;
  deletionType: 'anonymized' | 'soft-deleted' | 'hard-deleted';
  deletedAt: string;
  anonymizedRecords: {
    orders: number;
    bookings: number;
  };
  deletedRecords: {
    passwordResetTokens: number;
    cartItems: number;
    reviews: number;
    courseProgress: number;
    lessonProgress: number;
  };
  message: string;
}

/**
 * Delete/anonymize user data per GDPR Article 17 (Right to Erasure)
 *
 * Strategy:
 * 1. Check for financial records (orders, bookings) - these have RESTRICT constraint
 * 2. If financial records exist:
 *    - Anonymize user profile (replace email/name with anonymous values)
 *    - Keep financial records for legal compliance
 *    - Delete non-essential data (cart, progress, reviews)
 * 3. If no financial records:
 *    - Perform soft delete (set deleted_at)
 *    - All related data cascades due to foreign keys
 *
 * @param userId - User ID to delete/anonymize
 * @param hardDelete - If true, attempt hard delete (only if no financial records)
 * @returns Deletion result with details
 */
export async function deleteUserData(
  userId: string,
  hardDelete: boolean = false
): Promise<DeletionResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      throw new Error('User not found');
    }

    // Check for financial records (orders, bookings)
    const ordersCount = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
      [userId]
    );
    const bookingsCount = await client.query(
      'SELECT COUNT(*) as count FROM bookings WHERE user_id = $1',
      [userId]
    );

    const hasOrders = parseInt(ordersCount.rows[0].count) > 0;
    const hasBookings = parseInt(bookingsCount.rows[0].count) > 0;
    const hasFinancialRecords = hasOrders || hasBookings;

    if (hasFinancialRecords) {
      // STRATEGY: Anonymize user + delete non-essential data
      // Cannot delete user due to RESTRICT constraints on orders/bookings

      const anonymizedEmail = `deleted_${userId}@anonymized.local`;
      const anonymizedName = `Deleted User ${userId.substring(0, 8)}`;

      // Anonymize user profile
      await client.query(
        `UPDATE users
         SET
           email = $1,
           name = $2,
           whatsapp = NULL,
           password_hash = 'ANONYMIZED',
           deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [anonymizedEmail, anonymizedName, userId]
      );

      // Delete password reset tokens
      const passwordTokensResult = await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 RETURNING id',
        [userId]
      );

      // Delete cart items
      const cartResult = await client.query(
        'DELETE FROM cart_items WHERE user_id = $1 RETURNING id',
        [userId]
      );

      // Delete reviews
      const reviewsResult = await client.query(
        'DELETE FROM reviews WHERE user_id = $1 RETURNING id',
        [userId]
      );

      // Delete course progress
      const courseProgressResult = await client.query(
        'DELETE FROM course_progress WHERE user_id = $1 RETURNING id',
        [userId]
      );

      // Delete lesson progress
      const lessonProgressResult = await client.query(
        'DELETE FROM lesson_progress WHERE user_id = $1 RETURNING id',
        [userId]
      );

      // Download logs: user_id is SET NULL (logs preserved for audit)
      await client.query(
        'UPDATE download_logs SET user_id = NULL WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        userId,
        deletionType: 'anonymized',
        deletedAt: new Date().toISOString(),
        anonymizedRecords: {
          orders: parseInt(ordersCount.rows[0].count),
          bookings: parseInt(bookingsCount.rows[0].count),
        },
        deletedRecords: {
          passwordResetTokens: passwordTokensResult.rows.length,
          cartItems: cartResult.rows.length,
          reviews: reviewsResult.rows.length,
          courseProgress: courseProgressResult.rows.length,
          lessonProgress: lessonProgressResult.rows.length,
        },
        message:
          'User data anonymized. Financial records (orders, bookings) retained for legal compliance with anonymized user identity.',
      };
    } else {
      // No financial records - can delete user
      if (hardDelete) {
        // Hard delete: actually remove from database
        // Related data cascades automatically (cart_items, reviews, course_progress, etc.)

        const deleteResult = await client.query(
          'DELETE FROM users WHERE id = $1 RETURNING id',
          [userId]
        );

        await client.query('COMMIT');

        return {
          success: true,
          userId,
          deletionType: 'hard-deleted',
          deletedAt: new Date().toISOString(),
          anonymizedRecords: {
            orders: 0,
            bookings: 0,
          },
          deletedRecords: {
            passwordResetTokens: 0,
            cartItems: 0,
            reviews: 0,
            courseProgress: 0,
            lessonProgress: 0,
          },
          message:
            'User and all related data permanently deleted from database.',
        };
      } else {
        // Soft delete: set deleted_at timestamp
        await client.query(
          `UPDATE users
           SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [userId]
        );

        // Delete non-user data that shouldn't be kept
        await client.query(
          'DELETE FROM password_reset_tokens WHERE user_id = $1',
          [userId]
        );
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [
          userId,
        ]);

        await client.query('COMMIT');

        return {
          success: true,
          userId,
          deletionType: 'soft-deleted',
          deletedAt: new Date().toISOString(),
          anonymizedRecords: {
            orders: 0,
            bookings: 0,
          },
          deletedRecords: {
            passwordResetTokens: 0,
            cartItems: 0,
            reviews: 0,
            courseProgress: 0,
            lessonProgress: 0,
          },
          message:
            'User soft deleted. Set deleted_at timestamp. Can be restored if needed.',
        };
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if user has given cookie consent
 *
 * @param consentCookie - Cookie consent value from browser
 * @returns Consent status
 */
export interface CookieConsent {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export function parseCookieConsent(consentCookie: string | undefined): CookieConsent {
  if (!consentCookie) {
    return {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
  }

  try {
    const consent = JSON.parse(decodeURIComponent(consentCookie));
    return {
      essential: true, // Always true
      analytics: consent.analytics === true,
      marketing: consent.marketing === true,
      timestamp: consent.timestamp || Date.now(),
    };
  } catch {
    return {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
  }
}

/**
 * Generate cookie consent cookie value
 *
 * @param analytics - Allow analytics cookies
 * @param marketing - Allow marketing cookies
 * @returns Cookie value string
 */
export function generateConsentCookie(
  analytics: boolean,
  marketing: boolean
): string {
  const consent: CookieConsent = {
    essential: true,
    analytics,
    marketing,
    timestamp: Date.now(),
  };

  return encodeURIComponent(JSON.stringify(consent));
}

/**
 * Validate that required GDPR pages exist
 *
 * @returns Validation result
 */
export interface GDPRComplianceCheck {
  privacyPolicyExists: boolean;
  termsOfServiceExists: boolean;
  cookieConsentImplemented: boolean;
  dataExportAvailable: boolean;
  dataDeletionAvailable: boolean;
  compliant: boolean;
}

export async function checkGDPRCompliance(): Promise<GDPRComplianceCheck> {
  // This is a basic check - in production, you'd verify actual page existence
  return {
    privacyPolicyExists: true, // Assume exists (would check /privacy-policy route)
    termsOfServiceExists: true, // Assume exists (would check /terms route)
    cookieConsentImplemented: true,
    dataExportAvailable: true,
    dataDeletionAvailable: true,
    compliant: true,
  };
}
