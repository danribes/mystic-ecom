# T133: Stripe Payment Scenarios - Learning Guide

**Topic**: Complete guide to testing Stripe payment integration
**Audience**: Developers implementing or testing payment processing
**Prerequisites**: Basic understanding of APIs, webhooks, and TypeScript

---

## Table of Contents
1. [Introduction to Stripe](#introduction-to-stripe)
2. [Understanding Payment Processing](#understanding-payment-processing)
3. [Stripe Test Cards](#stripe-test-cards)
4. [Payment Scenarios Explained](#payment-scenarios-explained)
5. [Webhook Events](#webhook-events)
6. [Implementation Guide](#implementation-guide)
7. [Testing Best Practices](#testing-best-practices)
8. [Security Considerations](#security-considerations)
9. [Common Pitfalls](#common-pitfalls)
10. [Troubleshooting](#troubleshooting)

---

## Introduction to Stripe

### What is Stripe?

Stripe is a payment processing platform that allows businesses to accept payments online. It provides:

- **Payment Processing**: Credit cards, debit cards, digital wallets
- **Global Support**: 135+ currencies, 45+ countries
- **Developer-Friendly APIs**: RESTful API, webhooks, SDKs
- **Security**: PCI DSS Level 1 certified
- **Testing Tools**: Test mode with test cards

### Why Use Stripe?

1. **Easy Integration**: Simple API, comprehensive documentation
2. **Security**: Stripe handles PCI compliance
3. **Reliability**: 99.99% uptime SLA
4. **Features**: Subscriptions, invoicing, fraud prevention
5. **Global**: Multi-currency, local payment methods

### Stripe Architecture

```
Customer Browser → Your Application → Stripe API → Payment Networks → Bank
                                    ↓
                              Webhooks (async)
                                    ↓
                            Your Application
```

---

## Understanding Payment Processing

### Payment Flow Overview

#### 1. Customer Checkout
```
User adds items to cart
  ↓
User clicks "Checkout"
  ↓
Application creates Stripe Checkout Session
  ↓
User redirected to Stripe-hosted checkout page
```

#### 2. Payment Processing
```
User enters card details on Stripe page
  ↓
Stripe validates card information
  ↓
Payment processed (or declined)
  ↓
User redirected to success/cancel URL
```

#### 3. Webhook Confirmation
```
Stripe sends webhook to your server
  ↓
Your application validates webhook signature
  ↓
Process webhook event (update order status)
  ↓
Send confirmation email to customer
```

### Key Stripe Concepts

#### Payment Intent
A Payment Intent represents your intent to collect payment from a customer.

```typescript
{
  id: "pi_1234567890",
  amount: 5000,           // $50.00 in cents
  currency: "usd",
  status: "succeeded",    // or "requires_payment_method", "canceled", etc.
  metadata: {
    orderId: "order_123"  // Your custom data
  }
}
```

**States**:
- `requires_payment_method`: Waiting for card details
- `requires_confirmation`: Card details added, needs confirmation
- `requires_action`: Needs 3D Secure authentication
- `processing`: Payment being processed
- `succeeded`: Payment successful
- `canceled`: Payment canceled

#### Checkout Session
A Checkout Session creates a Stripe-hosted payment page.

```typescript
{
  id: "cs_test_1234567890",
  mode: "payment",        // or "subscription", "setup"
  client_reference_id: "order_123",
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "Meditation Course"
        },
        unit_amount: 2999   // $29.99
      },
      quantity: 1
    }
  ],
  success_url: "https://yoursite.com/success",
  cancel_url: "https://yoursite.com/cancel"
}
```

#### Webhook Events
Asynchronous notifications sent by Stripe when events occur.

```typescript
{
  id: "evt_1234567890",
  type: "checkout.session.completed",
  data: {
    object: { /* Checkout Session data */ }
  }
}
```

---

## Stripe Test Cards

### Overview

Stripe provides test card numbers that simulate different payment scenarios. These cards only work in **test mode** and never create real charges.

### Basic Success Card

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any ZIP code
```

**Result**: Payment succeeds

### All Successful Payment Cards

| Card Brand | Number | Use Case |
|------------|--------|----------|
| Visa | 4242424242424242 | Basic success |
| Visa (Debit) | 4000056655665556 | Debit card |
| Mastercard | 5555555555554444 | Mastercard payments |
| American Express | 378282246310005 | AmEx (4-digit CVC) |
| Discover | 6011111111111117 | Discover card |
| Diners Club | 3056930009020004 | Diners card |
| JCB | 3566002020360505 | JCB card |

### Declined Payment Cards

| Card Number | Decline Reason | Description |
|-------------|----------------|-------------|
| 4000000000000002 | Generic Decline | Card declined for unknown reason |
| 4000000000009995 | Insufficient Funds | Not enough balance |
| 4000000000009987 | Lost Card | Card reported lost |
| 4000000000009979 | Stolen Card | Card reported stolen |
| 4000000000000069 | Expired Card | Card has expired |
| 4000000000000127 | Incorrect CVC | CVC check fails |
| 4000000000000119 | Processing Error | Temporary error, retry may work |

### Authentication Required (3D Secure)

| Card Number | Behavior | Description |
|-------------|----------|-------------|
| 4000002500003155 | Auth Required | Triggers 3D Secure authentication |
| 4000002760003184 | Auth Required (Setup) | For setup intents |
| 4000008400001629 | Auth Fails | Authentication will fail |

**What is 3D Secure?**
3D Secure (3DS) is an additional security layer for online card transactions. It's required by regulation in Europe (SCA - Strong Customer Authentication).

### Fraud and Risk Cards

| Card Number | Scenario | Description |
|-------------|----------|-------------|
| 4100000000000019 | Fraudulent | Flagged as fraudulent |
| 4000000000009235 | High Risk | Elevated risk score |
| 4000000000006975 | Velocity Exceeded | Too many transactions |

### Dispute Cards

| Card Number | Dispute Type | When Dispute Occurs |
|-------------|--------------|---------------------|
| 4000000000000259 | Fraudulent | Immediately after charge |
| 4000000000002685 | Product Not Received | Immediately after charge |
| 4000000000001976 | Product Unacceptable | Immediately after charge |
| 4000000000008235 | Early Fraudulent | Right away (test fraud prevention) |

**What are Disputes?**
Disputes (chargebacks) occur when a customer questions a charge with their bank. You lose the funds immediately and must provide evidence to win the dispute.

---

## Payment Scenarios Explained

### Scenario 1: Successful Payment

**User Story**: Customer purchases a meditation course for $29.99

**Flow**:
1. Customer adds course to cart
2. Clicks checkout
3. Enters card: 4242 4242 4242 4242
4. Payment processes successfully
5. Redirected to success page
6. Receives confirmation email

**Test Code**:
```typescript
const order = {
  items: [{
    itemType: 'course',
    itemTitle: 'Meditation Basics',
    price: 2999, // $29.99 in cents
    quantity: 1
  }],
  subtotal: 2999,
  tax: 240,
  total: 3239,
  userEmail: 'customer@example.com'
};

const session = await createCheckoutSession(
  'order_001',
  order,
  'https://yoursite.com/success',
  'https://yoursite.com/cancel'
);

// Redirect user to session.url
```

**Expected Result**:
- Checkout session created: `cs_test_...`
- User completes payment on Stripe page
- Webhook received: `checkout.session.completed`
- Order marked as paid
- Customer receives email

---

### Scenario 2: Insufficient Funds

**User Story**: Customer tries to purchase but card has insufficient funds

**Test Card**: 4000 0000 0000 9995

**Flow**:
1. Customer enters card with insufficient funds
2. Stripe attempts to process payment
3. Card declined: "insufficient_funds"
4. User sees error message
5. User prompted to try another payment method

**Test Code**:
```typescript
// In a real integration test, you would:
// 1. Create checkout session
// 2. Attempt payment with test card 4000000000009995
// 3. Webhook received: payment_intent.payment_failed
// 4. Display error to user

// Simulate the webhook event:
const failedEvent = {
  type: 'payment_intent.payment_failed',
  data: {
    object: {
      id: 'pi_failed_001',
      last_payment_error: {
        code: 'insufficient_funds',
        message: 'Your card has insufficient funds.'
      }
    }
  }
};
```

**Expected Result**:
- Payment fails
- Error message shown to user
- Order remains unpaid
- Customer can retry with different card

---

### Scenario 3: 3D Secure Authentication

**User Story**: European customer requires Strong Customer Authentication

**Test Card**: 4000 0025 0000 3155

**Flow**:
1. Customer enters card requiring authentication
2. Payment status: `requires_action`
3. Modal opens for 3D Secure challenge
4. Customer completes authentication
5. Payment processes successfully

**Test Code**:
```typescript
// Create payment intent
const paymentIntent = await createPaymentIntent(
  'order_3ds_001',
  5000,
  'eur'
);

// On frontend, Stripe.js will automatically handle 3DS
// showing authentication modal to customer

// After authentication, webhook received:
// payment_intent.succeeded
```

**Expected Result**:
- Authentication challenge shown
- Customer authenticates successfully
- Payment completes
- Order marked as paid

**3D Secure Test Flow**:
- Use card 4000002500003155
- When prompted, click "Complete authentication"
- Payment succeeds after authentication

---

### Scenario 4: Card Declined

**User Story**: Customer's card is declined for unknown reason

**Test Card**: 4000 0000 0000 0002

**Flow**:
1. Customer enters card
2. Card declined by issuing bank
3. Generic decline error shown
4. Customer must use different card

**Error Handling**:
```typescript
try {
  await stripe.confirmCardPayment(clientSecret);
} catch (error) {
  if (error.code === 'card_declined') {
    // Show user-friendly message
    displayError('Your card was declined. Please try a different card.');
  }
}
```

---

### Scenario 5: Fraudulent Transaction

**User Story**: Payment flagged as potentially fraudulent

**Test Card**: 4100 0000 0000 0019

**Flow**:
1. Customer enters card
2. Stripe's fraud detection flags transaction
3. Payment blocked or requires review
4. Merchant reviews in Stripe Dashboard

**Handling Fraud**:
```typescript
// Webhook: charge.failed or review.opened
const fraudEvent = {
  type: 'review.opened',
  data: {
    object: {
      reason: 'rule', // Fraud rule triggered
      payment_intent: 'pi_suspicious_001'
    }
  }
};

// In your application:
// - Mark order as "under review"
// - Don't fulfill order yet
// - Wait for manual review
// - Send email to customer about delay
```

---

### Scenario 6: Refund Processing

**User Story**: Customer requests refund for purchased course

**Flow**:
1. Customer contacts support
2. Admin initiates refund
3. Refund processed through Stripe
4. Funds returned to customer's card
5. Customer receives refund confirmation

**Test Code**:
```typescript
// Full refund
const refund = await createRefund(paymentIntentId);

// Partial refund
const partialRefund = await createRefund(
  paymentIntentId,
  2500, // Refund $25 of $50 charge
  'requested_by_customer'
);

// Webhook received: charge.refunded
```

**Refund Timeline**:
- Initiated: Immediately
- Posted to card: 5-10 business days
- Customer sees credit: Depends on bank

---

### Scenario 7: Dispute (Chargeback)

**User Story**: Customer files dispute claiming they didn't receive product

**Test Card**: 4000 0000 0000 2685

**Flow**:
1. Payment succeeds initially
2. Customer files chargeback with bank
3. Funds immediately withdrawn from your account
4. Webhook: `charge.dispute.created`
5. You have ~2 weeks to respond
6. Provide evidence (receipts, delivery proof)
7. Card network makes final decision

**Handling Disputes**:
```typescript
// Webhook received
const disputeEvent = {
  type: 'charge.dispute.created',
  data: {
    object: {
      id: 'dp_001',
      charge: 'ch_001',
      reason: 'product_not_received',
      amount: 5000,
      evidence_details: {
        due_by: 1735689600 // Timestamp for evidence deadline
      }
    }
  }
};

// In your application:
// 1. Flag the order
// 2. Notify admin/support team
// 3. Gather evidence:
//    - Delivery confirmation
//    - Customer communications
//    - Service logs showing access
// 4. Submit evidence via Stripe Dashboard or API
```

**Evidence to Collect**:
- Customer communication (emails, chat logs)
- Proof of delivery or access
- Service usage logs
- Terms of service agreement
- Customer's previous successful purchases

---

## Webhook Events

### What are Webhooks?

Webhooks are HTTP callbacks sent by Stripe to your server when events occur. They're essential for:
- Confirming payments
- Handling asynchronous events
- Keeping your system in sync with Stripe

### Why Webhooks Matter

**Problem**: User closes browser after payment
**Solution**: Webhook still arrives, order gets fulfilled

**Problem**: Payment requires offline processing
**Solution**: Webhook notifies when complete

### Key Webhook Events

#### checkout.session.completed
Fired when customer completes checkout.

```typescript
{
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      client_reference_id: 'order_123', // Your order ID
      payment_intent: 'pi_123',
      payment_status: 'paid',
      customer_email: 'customer@example.com',
      amount_total: 5000
    }
  }
}
```

**Action**: Mark order as paid, send confirmation email

#### payment_intent.succeeded
Payment successfully processed.

```typescript
{
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_123',
      amount: 5000,
      status: 'succeeded',
      metadata: { orderId: 'order_123' }
    }
  }
}
```

**Action**: Fulfill order, grant access to product

#### payment_intent.payment_failed
Payment attempt failed.

```typescript
{
  type: 'payment_intent.payment_failed',
  data: {
    object: {
      id: 'pi_123',
      last_payment_error: {
        code: 'card_declined',
        message: 'Your card was declined.'
      }
    }
  }
}
```

**Action**: Notify customer, prompt to retry

#### charge.refunded
Refund processed.

```typescript
{
  type: 'charge.refunded',
  data: {
    object: {
      id: 'ch_123',
      amount_refunded: 5000,
      refunded: true
    }
  }
}
```

**Action**: Update order status, send refund confirmation

#### charge.dispute.created
Customer filed dispute.

```typescript
{
  type: 'charge.dispute.created',
  data: {
    object: {
      id: 'dp_123',
      reason: 'fraudulent',
      status: 'needs_response'
    }
  }
}
```

**Action**: Alert team, gather evidence

### Webhook Signature Validation

**Critical Security Step**: Always validate webhook signatures

```typescript
import Stripe from 'stripe';

export function validateWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    // Stripe verifies this came from them
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (err) {
    // Signature invalid - reject webhook
    throw new Error('Invalid webhook signature');
  }
}
```

**Why Validate?**
- Prevents attackers from sending fake webhooks
- Ensures webhook actually came from Stripe
- Protects against replay attacks

### Webhook Best Practices

#### 1. Return 200 Quickly
```typescript
// ✅ Good
app.post('/webhook', async (req, res) => {
  // Validate signature
  const event = validateWebhook(req.body, req.headers['stripe-signature']);

  // Return 200 immediately
  res.status(200).send('Received');

  // Process asynchronously
  await processWebhookEvent(event);
});
```

```typescript
// ❌ Bad - Stripe will retry if you don't respond quickly
app.post('/webhook', async (req, res) => {
  const event = validateWebhook(req.body, req.headers['stripe-signature']);
  await processWebhookEvent(event); // Might timeout
  res.status(200).send('Received');
});
```

#### 2. Handle Idempotency
Webhooks can be sent multiple times. Handle duplicates:

```typescript
async function processWebhookEvent(event: Stripe.Event) {
  // Check if already processed
  const existing = await db.query(
    'SELECT * FROM webhook_events WHERE event_id = $1',
    [event.id]
  );

  if (existing.rows.length > 0) {
    console.log(`Event ${event.id} already processed`);
    return;
  }

  // Process event
  // ...

  // Mark as processed
  await db.query(
    'INSERT INTO webhook_events (event_id, processed_at) VALUES ($1, NOW())',
    [event.id]
  );
}
```

#### 3. Handle All Event Types
```typescript
switch (event.type) {
  case 'checkout.session.completed':
    await handleCheckoutCompleted(event.data.object);
    break;
  case 'payment_intent.succeeded':
    await handlePaymentSucceeded(event.data.object);
    break;
  case 'payment_intent.payment_failed':
    await handlePaymentFailed(event.data.object);
    break;
  case 'charge.refunded':
    await handleRefund(event.data.object);
    break;
  case 'charge.dispute.created':
    await handleDispute(event.data.object);
    break;
  default:
    console.log(`Unhandled event type: ${event.type}`);
}
```

---

## Implementation Guide

### Setting Up Stripe

#### 1. Install Stripe SDK
```bash
npm install stripe
npm install --save-dev @types/stripe
```

#### 2. Initialize Stripe Client
```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export default stripe;
```

#### 3. Environment Variables
```bash
# .env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Creating Checkout Session

```typescript
export async function createCheckoutSession(
  orderId: string,
  order: {
    items: Array<{
      itemType: string;
      itemTitle: string;
      price: number;
      quantity: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    userEmail: string;
  },
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  // Validation
  if (!orderId) throw new Error('Order ID is required');
  if (order.items.length === 0) throw new Error('Order must have at least one item');
  if (order.total <= 0) throw new Error('Order total must be greater than zero');

  // Create line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
    (item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.itemTitle,
          description: item.itemType,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })
  );

  // Add tax as line item if present
  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax',
        },
        unit_amount: order.tax,
      },
      quantity: 1,
    });
  }

  // Create session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: order.userEmail,
    client_reference_id: orderId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orderId,
      subtotal: order.subtotal.toString(),
      tax: order.tax.toString(),
    },
  });

  return session;
}
```

### Creating Payment Intent

```typescript
export async function createPaymentIntent(
  orderId: string,
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  if (amount <= 0) throw new Error('Amount must be greater than zero');

  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      orderId,
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
}
```

### Processing Webhooks

```typescript
export function validateWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function processWebhookEvent(event: Stripe.Event) {
  let orderId: string | null = null;
  let result: any = {
    type: event.type,
    orderId: null,
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      orderId = session.client_reference_id || null;

      result = {
        type: 'checkout.completed',
        orderId,
        paymentIntentId: session.payment_intent as string,
        amount: session.amount_total,
        status: 'paid',
        data: {
          customerEmail: session.customer_email,
          paymentStatus: session.payment_status,
        },
      };

      // Update order in database
      if (orderId) {
        await updateOrderStatus(orderId, 'paid');
        await sendConfirmationEmail(session.customer_email!, orderId);
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      orderId = paymentIntent.metadata.orderId || null;

      result = {
        type: 'payment.succeeded',
        orderId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: 'paid',
      };
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      orderId = paymentIntent.metadata.orderId || null;

      result = {
        type: 'payment.failed',
        orderId,
        status: 'payment_failed',
        data: {
          lastPaymentError: paymentIntent.last_payment_error?.message,
        },
      };

      // Notify customer of failed payment
      if (orderId) {
        await sendPaymentFailedEmail(orderId);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      orderId = charge.metadata.orderId || null;

      result = {
        type: 'charge.refunded',
        orderId,
        amount: charge.amount_refunded,
        status: 'refunded',
        data: {
          refundReason: charge.refunds?.data[0]?.reason,
        },
      };

      if (orderId) {
        await updateOrderStatus(orderId, 'refunded');
      }
      break;
    }
  }

  return result;
}
```

### Creating Refunds

```typescript
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  if (!paymentIntentId) throw new Error('Payment Intent ID is required');

  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amount) params.amount = amount;
  if (reason) params.reason = reason;

  return await stripe.refunds.create(params);
}
```

---

## Testing Best Practices

### 1. Test Mode vs Live Mode

Always use test mode during development:

```typescript
// Test mode key (starts with sk_test_)
const stripe = new Stripe('sk_test_your_key_here');

// Live mode key (starts with sk_live_) - NEVER use in development
const stripe = new Stripe('sk_live_your_key_here');
```

### 2. Comprehensive Test Coverage

Test all scenarios:
- ✅ Successful payments
- ✅ Declined cards
- ✅ Insufficient funds
- ✅ 3D Secure authentication
- ✅ Expired cards
- ✅ Invalid CVC
- ✅ Processing errors
- ✅ Webhooks
- ✅ Refunds
- ✅ Disputes

### 3. Automated Testing

```typescript
describe('Stripe Integration', () => {
  it('should create checkout session', async () => {
    const session = await createCheckoutSession(/* ... */);
    expect(session.id).toMatch(/^cs_test_/);
  });

  it('should handle declined card', async () => {
    // Use test card 4000000000000002
    // Verify error handling
  });

  it('should process webhook', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      // ... mock data
    };
    const result = await processWebhookEvent(mockEvent);
    expect(result.status).toBe('paid');
  });
});
```

### 4. Integration Testing

Test the full flow:
1. Create checkout session
2. Simulate payment completion
3. Verify webhook received
4. Check order status updated
5. Confirm email sent

### 5. Error Handling Tests

```typescript
it('should handle Stripe API errors', async () => {
  await expect(
    createCheckoutSession('', order, successUrl, cancelUrl)
  ).rejects.toThrow('Order ID is required');
});

it('should handle network errors', async () => {
  // Mock network failure
  // Verify graceful degradation
});
```

---

## Security Considerations

### 1. Never Expose Secret Keys

```typescript
// ❌ NEVER do this
const stripe = new Stripe('sk_test_1234567890');

// ✅ Use environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### 2. Always Validate Webhooks

```typescript
// ❌ NEVER trust webhook without validation
app.post('/webhook', async (req, res) => {
  const event = req.body;
  await processWebhookEvent(event); // DANGEROUS!
});

// ✅ Always validate signature
app.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const event = validateWebhook(req.body, signature);
  await processWebhookEvent(event);
});
```

### 3. Use HTTPS

Webhooks must be sent to HTTPS endpoints:
- ✅ `https://yoursite.com/webhook`
- ❌ `http://yoursite.com/webhook`

### 4. Sanitize Metadata

Never store sensitive data in metadata:

```typescript
// ❌ Don't store sensitive data
metadata: {
  creditCardNumber: '4242...',  // NEVER!
  ssn: '123-45-6789',          // NEVER!
  password: 'secret123'         // NEVER!
}

// ✅ Store non-sensitive identifiers only
metadata: {
  orderId: 'order_123',
  userId: 'user_456',
  source: 'mobile_app'
}
```

### 5. Implement Rate Limiting

Protect your webhook endpoint:

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});

app.post('/webhook', webhookLimiter, async (req, res) => {
  // Process webhook
});
```

### 6. Monitor for Fraud

```typescript
// Check Stripe Radar risk score
if (paymentIntent.charges.data[0]?.outcome?.risk_level === 'elevated') {
  // Flag order for manual review
  await flagOrderForReview(orderId);
}
```

---

## Common Pitfalls

### 1. Not Using Webhook Idempotency

**Problem**: Processing same webhook multiple times

**Solution**:
```typescript
async function processWebhook(event: Stripe.Event) {
  // Check if already processed
  const exists = await db.query(
    'SELECT 1 FROM processed_webhooks WHERE event_id = $1',
    [event.id]
  );

  if (exists.rows.length > 0) return;

  // Process...

  // Mark as processed
  await db.query(
    'INSERT INTO processed_webhooks (event_id) VALUES ($1)',
    [event.id]
  );
}
```

### 2. Relying on Redirect Only

**Problem**: User closes browser before reaching success page

**Solution**: Always use webhooks for order fulfillment
```typescript
// ❌ Don't rely on this
app.get('/success', (req, res) => {
  const orderId = req.query.order_id;
  fulfillOrder(orderId); // User might not reach this page!
});

// ✅ Use webhooks
async function processWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    await fulfillOrder(event.data.object.client_reference_id);
  }
}
```

### 3. Not Handling 3D Secure

**Problem**: Payment gets stuck requiring authentication

**Solution**: Use Stripe.js which handles 3DS automatically
```javascript
// Frontend
const {error} = await stripe.confirmCardPayment(clientSecret);
// Stripe.js automatically shows 3DS modal
```

### 4. Incorrect Amount Units

**Problem**: Sending $50.00 instead of 5000 cents

**Solution**: Always use smallest currency unit
```typescript
// ❌ Wrong
amount: 50.00  // Stripe interprets as 50 cents!

// ✅ Correct
amount: 5000  // $50.00 in cents
```

### 5. Not Testing Failures

**Problem**: Only testing successful payments

**Solution**: Test all decline scenarios
```typescript
// Test insufficient funds
// Test expired cards
// Test authentication failures
// Test processing errors
```

---

## Troubleshooting

### Issue: "Invalid API Key"

**Cause**: Using wrong key or live mode key in test

**Solution**:
```bash
# Check your environment variable
echo $STRIPE_SECRET_KEY

# Should start with sk_test_ for testing
# Should start with sk_live_ for production
```

### Issue: Webhook Not Received

**Diagnosis**:
1. Check webhook endpoint is HTTPS
2. Verify endpoint is publicly accessible
3. Check Stripe Dashboard → Webhooks → Event log

**Solution**:
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3000/webhook

# Test webhook
stripe trigger checkout.session.completed
```

### Issue: "No signatures found"

**Cause**: Missing `stripe-signature` header

**Solution**:
```typescript
// Make sure you're reading raw body
app.post('/webhook',
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    // ...
  }
);
```

### Issue: Payment Stuck in "Processing"

**Cause**: Async payment method (bank transfer)

**Solution**: Wait for webhook, show processing state to user
```typescript
// Show loading state
if (paymentIntent.status === 'processing') {
  return <ProcessingState />;
}
```

### Issue: Duplicate Charges

**Cause**: Retrying failed requests without idempotency key

**Solution**:
```typescript
await stripe.paymentIntents.create(
  {amount: 5000, currency: 'usd'},
  {idempotencyKey: 'order_123_attempt_1'} // Prevents duplicates
);
```

---

## Additional Resources

### Official Documentation
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Testing Guide](https://stripe.com/docs/testing)
- [Webhook Guide](https://stripe.com/docs/webhooks)

### Testing Tools
- [Stripe CLI](https://stripe.com/docs/stripe-cli) - Test webhooks locally
- [Stripe Dashboard](https://dashboard.stripe.com) - View test payments
- [Webhook Testing](https://stripe.com/docs/webhooks/test) - Test webhook handling

### Best Practices
- [Security Best Practices](https://stripe.com/docs/security/guide)
- [Error Handling](https://stripe.com/docs/error-handling)
- [Idempotency](https://stripe.com/docs/api/idempotent_requests)

---

## Summary

### Key Takeaways

1. **Always Use Test Mode**: Test cards only work with test API keys
2. **Validate Webhooks**: Never trust unvalidated webhook data
3. **Test All Scenarios**: Success, decline, authentication, refunds
4. **Handle Errors Gracefully**: Provide clear feedback to users
5. **Use Webhooks for Fulfillment**: Don't rely on redirects alone
6. **Never Expose Secrets**: Use environment variables
7. **Amounts in Cents**: $50.00 = 5000 cents
8. **Implement Idempotency**: Prevent duplicate processing

### Testing Checklist

- [ ] Successful payment with Visa (4242 4242 4242 4242)
- [ ] Declined payment (4000 0000 0000 0002)
- [ ] Insufficient funds (4000 0000 0000 9995)
- [ ] 3D Secure authentication (4000 0025 0000 3155)
- [ ] Expired card (4000 0000 0000 0069)
- [ ] Processing error (4000 0000 0000 0119)
- [ ] Webhook validation
- [ ] Webhook processing
- [ ] Refund creation
- [ ] Error handling
- [ ] Multiple currencies
- [ ] Multiple line items

### Next Steps

1. Set up Stripe account at https://dashboard.stripe.com/register
2. Get test API keys from Developers → API Keys
3. Install Stripe CLI for local webhook testing
4. Implement checkout session creation
5. Set up webhook endpoint
6. Test all payment scenarios
7. Monitor in Stripe Dashboard
8. Review security best practices
9. Plan for production deployment
10. Set up production monitoring

---

**Remember**: Always test thoroughly in test mode before going live. Stripe's test cards make it easy to simulate every scenario. Use them!
