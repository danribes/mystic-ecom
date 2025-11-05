# T218: Health Check Endpoint - Didactic Guide

**Task ID**: T218
**Topic**: Building Production-Ready Health Check Endpoints
**Difficulty**: Intermediate
**Date**: 2025-11-03

## Table of Contents

1. [What is a Health Check Endpoint?](#what-is-a-health-check-endpoint)
2. [Why Health Checks Matter](#why-health-checks-matter)
3. [How Health Checks Work](#how-health-checks-work)
4. [Implementation Deep Dive](#implementation-deep-dive)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)
7. [Real-World Examples](#real-world-examples)
8. [Testing Strategies](#testing-strategies)

---

## What is a Health Check Endpoint?

A **health check endpoint** is a specialized API endpoint that reports the operational status of your application and its dependencies. It's a lightweight diagnostic tool that answers the question: "Is my application ready to serve traffic?"

### Anatomy of a Health Check

```
GET /api/health

Response:
{
  "status": "healthy",        // Overall health
  "timestamp": "2025-11-03T...",  // When checked
  "version": "0.0.1",         // App version
  "uptime": {                 // How long running
    "seconds": 3600,
    "human": "1h"
  },
  "services": {               // Dependencies
    "database": { "status": "up", "responseTime": 15 },
    "redis": { "status": "up", "responseTime": 3 }
  }
}
```

### Key Components

1. **Overall Status**: Single word summary (healthy/degraded/unhealthy)
2. **Service Checks**: Status of each dependency
3. **Response Times**: Performance metrics
4. **Metadata**: Version, uptime, timestamp

---

## Why Health Checks Matter

### 1. Load Balancing

Modern infrastructure uses health checks to route traffic:

```
┌─────────────┐
│Load Balancer│
└─────┬───────┘
      │ Checks every 10 seconds
      ├────> Server 1: /health → 200 OK ✅ (receives traffic)
      ├────> Server 2: /health → 503 ❌ (no traffic)
      └────> Server 3: /health → 200 OK ✅ (receives traffic)
```

**Result**: Only healthy instances receive user requests.

### 2. Auto-Scaling

Cloud platforms (AWS, GCP, Azure) use health checks to:
- **Scale Up**: Unhealthy instances → spin up new ones
- **Scale Down**: All healthy + low load → terminate excess instances
- **Replace**: Consistently unhealthy → terminate and replace

### 3. Monitoring & Alerting

Health checks enable proactive monitoring:

```
Uptime Monitor (every 5 min)
    ↓
/api/health → 503
    ↓
Alert: "Production database is down!"
    ↓
Page on-call engineer
```

### 4. Deployment Safety

During deployments, health checks prevent premature traffic routing:

```
Deploy Process:
1. Deploy new version
2. Wait for health check: /health → 200 ✅
3. Route traffic to new version
4. Terminate old version
```

---

## How Health Checks Work

### The Request-Response Cycle

```
1. Load Balancer                    → GET /api/health
2. Your Application
   ├─ Check Database                → SELECT 1
   ├─ Check Redis                   → PING
   └─ Aggregate Results             → Determine status
3. Your Application                 → 200 OK or 503 Service Unavailable
4. Load Balancer Decides
   ├─ 200 OK     → Route traffic here ✅
   └─ 503 Error  → Don't route traffic ❌
```

### Status Determination Logic

```typescript
function determineStatus(db, redis) {
  if (db === 'down' && redis === 'down') return 'unhealthy';
  if (db === 'down') return 'unhealthy';  // Database critical
  if (redis === 'down') return 'degraded'; // Redis not critical
  return 'healthy';
}
```

**Why Different Criticality?**

- **Database**: Without it, can't serve any requests → Unhealthy
- **Redis**: Session data lost, but can still function → Degraded

---

## Implementation Deep Dive

### 1. Parallel Service Checking

**❌ Sequential (Slow)**:
```typescript
const db = await checkDatabase();      // 20ms
const redis = await checkRedis();      // 10ms
// Total: 30ms
```

**✅ Parallel (Fast)**:
```typescript
const [db, redis] = await Promise.all([
  checkDatabase(),   // Both run
  checkRedis(),      // simultaneously
]);
// Total: 20ms (max of both, not sum)
```

**Why It Matters**: Health checks are polled frequently (every 5-30 seconds). Faster checks = less overhead.

### 2. Database Health Check

```typescript
async function checkDatabase() {
  const startTime = Date.now();

  try {
    const pool = getPool();

    // Simple, fast query
    await pool.query('SELECT 1 as health_check');

    const responseTime = Date.now() - startTime;
    return { status: 'up', responseTime };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'down',
      responseTime,
      error: error.message
    };
  }
}
```

**Key Points**:

1. **Simple Query**: `SELECT 1` is fast and tests connectivity
2. **Response Time**: Track performance, not just up/down
3. **Error Handling**: Return structured error, don't throw
4. **Always Return**: Never leave caller without answer

### 3. Redis Health Check

```typescript
async function checkRedis() {
  const startTime = Date.now();

  try {
    const redis = await getRedisClient();

    // Fastest Redis command
    await redis.ping();

    const responseTime = Date.now() - startTime;
    return { status: 'up', responseTime };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'down',
      responseTime,
      error: error.message
    };
  }
}
```

**Why PING?**
- Fastest Redis command
- Tests connectivity
- Confirms Redis is responding
- No side effects

### 4. Uptime Calculation

```typescript
// At module load (once)
const START_TIME = Date.now();

// In handler
const uptimeSeconds = (Date.now() - START_TIME) / 1000;

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

// Examples:
// 45 seconds        → "45s"
// 125 seconds       → "2m 5s"
// 3665 seconds      → "1h 1m 5s"
// 90065 seconds     → "1d 1h 1m 5s"
```

**Why Format?**
- Raw seconds hard to interpret: "What is 90065 seconds?"
- Formatted easy to understand: "Oh, 1 day and 1 hour"

### 5. Caching Prevention

```typescript
return new Response(JSON.stringify(response), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',

    // Prevent caching
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});
```

**Why No Cache?**

Load balancers need **real-time** status:

```
❌ Bad (cached):
10:00 - Health check returns 200 (cached for 5 min)
10:02 - Database goes down
10:03 - Load balancer checks health → gets cached 200 ✅
10:04 - Routes traffic to broken server → ERRORS!

✅ Good (no cache):
10:00 - Health check returns 200
10:02 - Database goes down
10:03 - Load balancer checks health → fresh check → 503 ❌
10:04 - No traffic routed → No errors!
```

---

## Best Practices

### 1. Keep Checks Fast

```typescript
// ✅ Good: Simple connectivity test
await pool.query('SELECT 1');

// ❌ Bad: Complex query
await pool.query(`
  SELECT COUNT(*) FROM users
  JOIN orders ON users.id = orders.user_id
  WHERE orders.created_at > NOW() - INTERVAL '1 day'
`);
```

**Why?** Health checks run frequently. Slow checks = performance penalty.

### 2. Return Appropriate HTTP Status Codes

```
200 OK                     → Healthy (route traffic here)
503 Service Unavailable    → Unhealthy/Degraded (don't route traffic)
```

**Don't use**:
- 500 Internal Server Error (implies server problem, not dependency)
- 404 Not Found (endpoint doesn't exist)
- 401 Unauthorized (health checks are public)

### 3. Distinguish Critical vs Non-Critical Services

```typescript
function determineOverallStatus(db, redis, cache) {
  // Database is CRITICAL - can't function without it
  if (db.status === 'down') return 'unhealthy';

  // Redis affects sessions but not critical
  if (redis.status === 'down') return 'degraded';

  // Cache is optimization only
  if (cache.status === 'down') return 'healthy'; // Still report it

  return 'healthy';
}
```

### 4. Include Response Times

```typescript
services: {
  database: {
    status: 'up',
    responseTime: 15  // milliseconds
  }
}
```

**Benefits**:
- Detect performance degradation before failures
- Alert on "database slow" before "database down"
- Helps diagnose issues

### 5. Don't Expose Sensitive Information

```typescript
// ❌ Bad: Exposes internal details
{
  error: "Connection failed to postgres://admin:password@db.internal:5432/prod"
}

// ✅ Good: Generic error
{
  error: "Database connection failed"
}
```

### 6. Log Errors for Debugging

```typescript
catch (error) {
  // Log for developers
  console.error('[Health Check] Database check failed:', error);

  // Return generic message to public
  return {
    status: 'down',
    error: 'Database connection failed' // Generic
  };
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting No-Cache Headers

```typescript
// ❌ Without no-cache headers
GET /api/health → 200 OK (cached by CDN for 5 minutes)
Database goes down → Load balancer still sees cached 200 → Routes traffic to broken server

// ✅ With no-cache headers
GET /api/health → 200 OK (not cached)
Database goes down → Load balancer sees fresh 503 → Stops routing traffic
```

### Pitfall 2: Not Handling getPool() Errors

```typescript
// ❌ Bad: getPool() throw not caught
const pool = getPool(); // Throws if config invalid
await pool.query('SELECT 1');

// ✅ Good: Catch all errors
try {
  const pool = getPool();
  await pool.query('SELECT 1');
} catch (error) {
  // Caught and handled
}
```

### Pitfall 3: Sequential Instead of Parallel

```typescript
// ❌ Slow: 20ms + 10ms = 30ms total
const db = await checkDatabase();
const redis = await checkRedis();

// ✅ Fast: max(20ms, 10ms) = 20ms total
const [db, redis] = await Promise.all([
  checkDatabase(),
  checkRedis()
]);
```

### Pitfall 4: Using Complex Queries

```typescript
// ❌ Slow and resource-intensive
SELECT COUNT(*) FROM orders
WHERE created_at > NOW() - INTERVAL '1 year'

// ✅ Fast and lightweight
SELECT 1
```

### Pitfall 5: Not Differentiating Service Criticality

```typescript
// ❌ Treats all services equally
if (db.down || redis.down || cache.down) return 'unhealthy';

// ✅ Differentiates criticality
if (db.down) return 'unhealthy';  // Critical
if (redis.down) return 'degraded'; // Important but not critical
if (cache.down) return 'healthy';  // Nice to have
```

---

## Real-World Examples

### Example 1: AWS Application Load Balancer

```yaml
# Terraform configuration
resource "aws_lb_target_group" "app" {
  health_check {
    enabled             = true
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2    # 2 successes = healthy
    unhealthy_threshold = 3    # 3 failures = unhealthy
    timeout             = 5
    interval            = 30    # Check every 30 seconds
    matcher             = "200" # Must return 200
  }
}
```

**How It Works**:
1. Every 30 seconds, ALB sends `GET /api/health`
2. If response is 200 within 5 seconds → Success
3. 2 consecutive successes → Mark healthy → Route traffic
4. 3 consecutive failures → Mark unhealthy → Stop traffic

### Example 2: Kubernetes Liveness Probe

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
```

**How It Works**:
1. Wait 30 seconds after container starts
2. Every 10 seconds, check `/api/health`
3. If 3 consecutive failures → Kill and restart container

### Example 3: Datadog Monitoring

```yaml
# datadog-checks.yaml
init_config:

instances:
  - name: Production Health Check
    url: https://api.yourapp.com/api/health
    method: get
    timeout: 10
    http_response_status_code: 200
    check_response_body: true
    include_content: true
    json_path: ["status"]
    expected_value: ["healthy"]
    notify_on_failure: true
    notification_message: |
      🚨 Production Health Check Failed!
      Status: {{json_path.status}}
      Please investigate immediately.
```

---

## Testing Strategies

### 1. Unit Tests

Test each component in isolation:

```typescript
describe('checkDatabase', () => {
  it('returns up when query succeeds', async () => {
    mockQuery.mockResolvedValue({ rows: [{ health_check: 1 }] });

    const result = await checkDatabase();

    expect(result.status).toBe('up');
    expect(result.responseTime).toBeGreaterThan(0);
  });

  it('returns down when query fails', async () => {
    mockQuery.mockRejectedValue(new Error('Connection failed'));

    const result = await checkDatabase();

    expect(result.status).toBe('down');
    expect(result.error).toBe('Connection failed');
  });
});
```

### 2. Integration Tests

Test against real services (in Docker):

```typescript
describe('Health Check Integration', () => {
  it('returns healthy with real services', async () => {
    // Assuming Docker services are running
    const response = await fetch('http://localhost:3000/api/health');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database.status).toBe('up');
    expect(body.services.redis.status).toBe('up');
  });
});
```

### 3. Chaos Testing

Intentionally break services to verify detection:

```bash
# Stop database
docker-compose stop postgres

# Check health
curl http://localhost:3000/api/health
# Should return 503 with database: down

# Restart database
docker-compose start postgres

# Check health
curl http://localhost:3000/api/health
# Should return 200 with database: up
```

---

## Key Takeaways

1. **Purpose**: Health checks enable load balancers, auto-scaling, and monitoring
2. **Speed**: Keep checks fast (simple queries, parallel execution)
3. **Status Codes**: Use 200 for healthy, 503 for unhealthy/degraded
4. **No Caching**: Always return fresh status
5. **Criticality**: Differentiate between critical and non-critical services
6. **Response Times**: Include performance metrics
7. **Error Handling**: Catch all errors, return structured responses
8. **Security**: Don't expose sensitive information
9. **Testing**: Unit tests for logic, integration tests for real behavior

---

## Further Reading

- [Health Check Pattern (Microsoft)](https://docs.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring)
- [AWS ELB Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
- [Kubernetes Liveness/Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [The Twelve-Factor App: Disposability](https://12factor.net/disposability)

---

**Guide Complete**: 2025-11-03
**Difficulty**: Intermediate
**Estimated Reading Time**: 30 minutes
