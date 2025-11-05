# T219: Refactoring Large Files - Learning Guide

**Purpose:** Educational guide on refactoring large files using service layer pattern

---

## Why Refactor Large Files?

**Problems with Large Files:**
- Hard to read and understand
- Difficult to test
- Prone to bugs
- Hard to maintain
- Violates Single Responsibility Principle

**Solution:** Service Layer Pattern
- Separate HTTP concerns from business logic
- Thin route handlers (50-100 lines)
- Business logic in services (testable, reusable)

---

## Service Layer Pattern

### Architecture

```
Route Handler (HTTP Layer)
    ↓
Service Layer (Business Logic)
    ↓
Data Layer (Database/APIs)
```

### Example: Before Refactoring

```typescript
// webhook.ts - 508 lines, everything mixed together
export const POST: APIRoute = async ({ request }) => {
  // Signature verification
  const signature = request.headers.get('stripe-signature');
  if (!signature) return error400();

  // Idempotency check
  const redis = await getRedisClient();
  const exists = await redis.exists(`webhook:${eventId}`);
  if (exists) return alreadyProcessed();

  // Get order
  const order = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);

  // Transaction
  await pool.query('BEGIN');
  await pool.query('UPDATE orders SET status = completed');
  await pool.query('INSERT INTO course_enrollments...');
  await pool.query('UPDATE bookings...');
  await pool.query('COMMIT');

  // Send emails
  await sendEmail(...);
  await sendWhatsApp(...);

  // Clear cart
  await clearCart(userId);

  return success();
};
```

**Problems:**
- 508 lines in one file
- HTTP, business logic, database all mixed
- Hard to test (need to mock HTTP)
- Can't reuse logic elsewhere
- Difficult to find specific functionality

### After Refactoring

**webhook.ts - 247 lines (thin handler):**
```typescript
export const POST: APIRoute = async ({ request }) => {
  // HTTP concerns only
  const event = validateWebhook(body, signature);

  // Delegate to service
  if (await WebhookService.checkIdempotency(event.id)) {
    return alreadyProcessedResponse();
  }

  await WebhookService.markProcessed(event.id);

  const result = await WebhookService.handleCheckoutCompleted(orderId, event);

  return successResponse(result);
};
```

**webhook.service.ts - 496 lines (business logic):**
```typescript
export class OrderCompletionService {
  static async processCompletedCheckout(orderId, event) {
    const order = await this.getOrder(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    await this.updateOrderInTransaction(order);
    await this.sendNotifications(order, ...);
    await this.clearCustomerCart(order.user_id);

    return { success: true };
  }
}
```

**Benefits:**
- Clear separation of concerns
- Easy to test services independently
- Reusable business logic
- Readable code
- Easy to maintain

---

## Refactoring Process

### Step 1: Identify Business Logic

Look for:
- Database operations
- External API calls
- Complex calculations
- Business rules
- Validation logic

### Step 2: Create Service Classes

```typescript
// src/services/webhook.service.ts
export class WebhookIdempotencyService {
  static async isProcessed(eventId: string): Promise<boolean> {
    // Redis idempotency check
  }

  static async markProcessed(eventId: string): Promise<void> {
    // Mark in Redis
  }
}

export class OrderCompletionService {
  static async processCompletedCheckout(...) {
    // Order completion logic
  }
}
```

### Step 3: Update Route Handler

```typescript
// Before
export const POST = async ({ request }) => {
  // 500 lines of mixed logic
};

// After
export const POST = async ({ request }) => {
  const result = await WebhookService.handleCheckoutCompleted(...);
  return response(result);
};
```

### Step 4: Update Tests

```typescript
// Before: Mock entire database
vi.mock('@/lib/db');
const mockPool = { query: vi.fn() };

// After: Mock service layer
vi.mock('@/services/webhook.service');
expect(WebhookService.handleCheckoutCompleted).toHaveBeenCalled();
```

---

## Best Practices

### 1. Service Naming
✅ **Good:** `OrderCompletionService`, `PaymentFailureService`
❌ **Bad:** `WebhookHelper`, `Utils`, `Manager`

### 2. Method Naming
✅ **Good:** `processCompletedCheckout`, `grantAccessToItems`
❌ **Bad:** `doStuff`, `handle`, `process`

### 3. Single Responsibility
✅ **Good:** Each service handles one domain
❌ **Bad:** One service does everything

### 4. Static vs Instance
**Use Static:** When no state needed (most services)
```typescript
OrderCompletionService.processOrder(orderId);
```

**Use Instance:** When state needed (rare)
```typescript
const processor = new OrderProcessor(config);
processor.process(orderId);
```

### 5. Error Handling
**Service Layer:**
```typescript
// Return result objects
return { success: false, error: 'Order not found' };
```

**Route Handler:**
```typescript
// Convert to HTTP responses
if (!result.success) {
  return new Response(JSON.stringify({ error: result.error }), { status: 404 });
}
```

---

## Real-World Example

### Webhook Order Completion

**Before (Monolithic):**
- 508 lines in webhook.ts
- Everything in one function
- Hard to test
- Mixed concerns

**After (Service Layer):**

**Services:**
1. `WebhookIdempotencyService` - Redis caching
2. `OrderCompletionService` - Main orchestrator
3. `PaymentFailureService` - Failed payments
4. `RefundService` - Refund handling
5. `WebhookService` - Facade

**Benefits Realized:**
- Route handler: 508 → 247 lines (51% reduction)
- Clear responsibility boundaries
- 37 tests covering all scenarios
- Easy to add new features
- Reusable services

---

## Testing Service Layer

### Unit Test Example

```typescript
describe('OrderCompletionService', () => {
  it('should process order successfully', async () => {
    // Arrange
    const mockOrder = { id: '123', status: 'pending' };
    vi.mocked(getOrder).mockResolvedValue(mockOrder);

    // Act
    const result = await OrderCompletionService.processCompletedCheckout('123', {});

    // Assert
    expect(result.success).toBe(true);
  });
});
```

**Benefits:**
- No HTTP mocking needed
- Fast execution
- Focused on business logic
- Easy to understand

---

## When to Refactor

**Refactor When:**
- File > 300 lines
- Multiple responsibilities in one file
- Hard to test
- Hard to understand
- Frequent bugs in the file

**Don't Refactor When:**
- File < 200 lines
- Single, clear responsibility
- Easy to test and maintain
- Working well

---

## Migration Checklist

For refactoring any large file:

1. **Analysis**
   - [ ] Identify business logic
   - [ ] Group related functions
   - [ ] Note dependencies

2. **Create Services**
   - [ ] Create service file(s)
   - [ ] Extract business logic
   - [ ] Add documentation
   - [ ] Keep services focused

3. **Update Route**
   - [ ] Keep only HTTP concerns
   - [ ] Delegate to services
   - [ ] Handle errors properly

4. **Test**
   - [ ] Write service tests
   - [ ] Update route tests
   - [ ] Run all tests
   - [ ] Verify no regressions

5. **Document**
   - [ ] Update documentation
   - [ ] Add code comments
   - [ ] Update API docs

---

## Conclusion

**Service Layer Pattern Benefits:**
- ✅ Clear separation of concerns
- ✅ Easier to test
- ✅ Reusable business logic
- ✅ Maintainable code
- ✅ Industry standard

**Key Takeaways:**
1. Keep route handlers thin (HTTP only)
2. Move business logic to services
3. Test services independently
4. Follow single responsibility
5. Use clear naming

**Next Steps:**
- Apply pattern to other large files
- Refactor email.ts (1580 lines)
- Refactor analytics/videos.ts (970 lines)
- Continue improving codebase quality
