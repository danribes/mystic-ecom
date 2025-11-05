# T132: Load Testing with 100+ Concurrent Users - Learning Guide

**Task ID**: T132
**Topic**: Load Testing and Performance Validation
**Level**: Intermediate to Advanced
**Estimated Reading Time**: 40-50 minutes

---

## Table of Contents

1. [What is Load Testing?](#what-is-load-testing)
2. [Why Load Testing Matters](#why-load-testing-matters)
3. [Types of Performance Testing](#types-of-performance-testing)
4. [Key Performance Metrics](#key-performance-metrics)
5. [Introducing Artillery](#introducing-artillery)
6. [Test Configuration Explained](#test-configuration-explained)
7. [Test Phases and Load Patterns](#test-phases-and-load-patterns)
8. [Creating Realistic User Scenarios](#creating-realistic-user-scenarios)
9. [Setting Performance Thresholds](#setting-performance-thresholds)
10. [Interpreting Results](#interpreting-results)
11. [Best Practices](#best-practices)
12. [Common Pitfalls](#common-pitfalls)

---

## What is Load Testing?

Load testing is the process of simulating multiple concurrent users accessing your application to validate its performance under expected (and unexpected) traffic conditions.

**Simple Analogy**: Like stress-testing a bridge before opening it to traffic - you need to know it can handle the expected load safely.

### Core Concept

```
Normal Usage:
User 1 → Server → Response (Fast)

Under Load:
User 1 → ┐
User 2 → │
User 3 → ├─ Server → Responses (Still Fast?)
User 4 → │
...      │
User N → ┘
```

**Question**: Does your application still respond quickly when 100+ users access it simultaneously?

**Load Testing Answers**:
- ✅ Can the system handle expected traffic?
- ✅ What is the maximum capacity?
- ✅ Where are the bottlenecks?
- ✅ How does it behave under stress?

---

## Why Load Testing Matters

### Real-World Scenario

**Without Load Testing**:
```
Production Day 1:
- 10 users: ✅ Fast response (200ms)
- 50 users: ✅ Still good (400ms)
- 100 users: ⚠️ Slowing down (2s)
- 200 users: ❌ Timeouts, errors, angry users
- 500 users: 💥 Server crash
```

**With Load Testing**:
```
Before Production:
- Identified bottlenecks at 150 users
- Optimized database queries
- Increased connection pool size
- Added caching

Production Day 1:
- 10 users: ✅ Fast (50ms)
- 100 users: ✅ Fast (100ms)
- 500 users: ✅ Still responsive (300ms)
- Happy users, happy business
```

### Business Impact

**Poor Performance Costs**:
- 💰 Lost revenue (slow = abandoned carts)
- 😡 Frustrated users (bad reviews)
- 🔥 Crisis management (downtime)
- 💸 Emergency scaling costs

**Good Performance Wins**:
- ⚡ Fast user experience
- 💰 Higher conversion rates
- 😊 Satisfied customers
- 📈 Scalable growth

### Statistics

- **47%** of users expect a page to load in 2 seconds or less
- **40%** will abandon a website that takes more than 3 seconds to load
- **1 second** delay can reduce conversions by 7%

**Load testing prevents these issues before production.**

---

## Types of Performance Testing

### 1. Load Testing

**Purpose**: Validate system behavior under expected load

```yaml
# Example: Normal traffic
Duration: 60 seconds
Users: 100 concurrent
Pattern: Constant
Goal: Confirm system handles typical load
```

**Use Case**: "Can we handle Black Friday traffic?"

### 2. Stress Testing

**Purpose**: Find the breaking point

```yaml
# Example: Push to failure
Duration: Until failure
Users: Start at 100, increase by 50 every minute
Pattern: Increasing
Goal: Find maximum capacity
```

**Use Case**: "What's our maximum capacity?"

### 3. Spike Testing

**Purpose**: Test sudden traffic surges

```yaml
# Example: Sudden spike
Phase 1: 50 users (baseline)
Phase 2: 500 users (instant surge)
Phase 3: 50 users (recovery)
Goal: Validate auto-scaling and recovery
```

**Use Case**: "What happens when we get featured on TechCrunch?"

### 4. Soak Testing

**Purpose**: Test sustained load over time

```yaml
# Example: Long-term stability
Duration: 24 hours
Users: 100 concurrent (constant)
Goal: Find memory leaks, resource exhaustion
```

**Use Case**: "Will we have issues after running 24/7?"

### 5. Scalability Testing

**Purpose**: Validate scaling capabilities

```yaml
# Example: Test scaling
Phase 1: 100 users → Add server
Phase 2: 200 users → Add server
Phase 3: 400 users → Measure improvement
Goal: Validate horizontal/vertical scaling
```

**Use Case**: "Does adding servers improve performance linearly?"

---

## Key Performance Metrics

### 1. Response Time

**Definition**: Time from request to response

```
Metrics:
- Average (mean): 250ms
- Median (p50): 200ms
- p95: 500ms (95% of requests faster than this)
- p99: 1000ms (99% of requests faster than this)
```

**Why p95/p99 Matter**:
- Average can be misleading (outliers skew it)
- p95/p99 represent worst-case user experience
- SLAs often use percentile-based metrics

**Example**:
```
100 requests:
- 95 complete in < 200ms (excellent)
- 5 complete in 5-10s (slow outliers)

Average: 500ms (looks OK)
p95: 200ms (shows 95% are fast)
p99: 8s (shows worst 1% are slow)
```

### 2. Throughput

**Definition**: Requests processed per second

```
Throughput = Successful Requests / Time

Example:
- 10,000 requests in 100 seconds
- Throughput: 100 requests/second
```

**Goal**: Maximize throughput while maintaining response times

### 3. Error Rate

**Definition**: Percentage of failed requests

```
Error Rate = (Failed Requests / Total Requests) × 100

Example:
- Total: 10,000 requests
- Failed: 50 requests
- Error Rate: 0.5%
```

**Target**: Usually < 0.1% for production (< 1% acceptable for some systems)

### 4. Concurrent Users

**Definition**: Number of simultaneous active users

```
Concurrent Users ≠ Total Users

Example:
- Total users: 10,000
- Active at same time: 500
- Concurrent users: 500
```

**Important**: This is what load testing simulates

### 5. Resource Utilization

**Metrics**:
- CPU usage (%)
- Memory usage (%)
- Database connections
- Network bandwidth
- Disk I/O

**Goal**: Stay below 70% to allow for spikes

---

## Introducing Artillery

### What is Artillery?

Artillery is a modern, powerful load testing toolkit for HTTP, WebSocket, and other protocols.

**Why Artillery?**:
- ✅ Easy YAML configuration
- ✅ Realistic user scenarios
- ✅ Built-in performance metrics
- ✅ CI/CD friendly
- ✅ Open source and extensible

### Installation

```bash
# As dev dependency
npm install --save-dev artillery

# Or globally
npm install -g artillery

# Verify installation
artillery version
```

### Basic Usage

```bash
# Run a test
artillery run config.yml

# Run with custom variables
artillery run --target http://localhost:3000 config.yml

# Generate HTML report
artillery run --output report.json config.yml
artillery report report.json
```

---

## Test Configuration Explained

### Basic Structure

```yaml
config:
  target: 'http://localhost:4321'  # Base URL
  phases:                           # Load patterns
    - duration: 60
      arrivalRate: 10
  ensure:                           # Performance thresholds
    maxErrorRate: 1
    p95: 1000

scenarios:                          # User behaviors
  - name: "User flow"
    flow:
      - get:
          url: "/"
```

### Target Configuration

```yaml
config:
  target: 'http://localhost:4321'

  # HTTP configuration
  http:
    timeout: 10                     # Request timeout (seconds)
    maxSockets: 50                  # Max concurrent connections

  # TLS configuration (for HTTPS)
  tls:
    rejectUnauthorized: false       # Accept self-signed certs
```

### Phases Explained

A phase defines a load pattern over time.

```yaml
phases:
  # Constant load
  - duration: 60                    # Run for 60 seconds
    arrivalRate: 10                 # 10 new users per second
    name: "Sustained load"

  # Ramp-up
  - duration: 30                    # Run for 30 seconds
    arrivalRate: 5                  # Start at 5 users/s
    rampTo: 50                      # End at 50 users/s
    name: "Gradual increase"

  # Pause
  - pause: 10                       # Wait 10 seconds
```

**Arrival Rate vs Concurrent Users**:
- **Arrival Rate**: New users per second
- **Concurrent Users**: Active users at any moment

```
Example:
- Arrival Rate: 10/s
- Scenario Duration: 5s
- Concurrent Users: 10 × 5 = 50
```

---

## Test Phases and Load Patterns

### Phase 1: Warm-up

**Purpose**: Gradually increase load to activate caches, connection pools, and JIT compilers

```yaml
- duration: 30
  arrivalRate: 5
  rampTo: 50
  name: "Warm-up phase"
```

**Why It Matters**:
- Cold starts can cause false failures
- Caches need time to populate
- Connection pools need to establish connections
- Database query plans need to be cached

**Without Warm-up**:
```
0s: Server cold, caches empty
1s: 100 users → All cache misses → Slow
Result: False failures, misleading metrics
```

**With Warm-up**:
```
0-30s: Gradual ramp to 50 users
30s: Caches warm, connections ready
31s: Peak load starts → Ready to handle it
Result: Accurate metrics
```

### Phase 2: Peak Load

**Purpose**: Sustained load testing at target concurrent users

```yaml
- duration: 60
  arrivalRate: 100
  name: "Peak load - 100 concurrent users"
```

**Why 60 Seconds?**:
- Long enough to detect issues (memory leaks, connection exhaustion)
- Short enough for rapid iteration
- Industry standard for sustained load

**What to Watch**:
- ✅ Response times remain stable
- ✅ Error rate stays low
- ✅ Resource usage plateaus
- ❌ Memory increasing (leak)
- ❌ Response times degrading
- ❌ Errors increasing over time

### Phase 3: Spike Test

**Purpose**: Test sudden traffic surges

```yaml
- duration: 30
  arrivalRate: 150
  name: "Spike test - 150 concurrent users"
```

**Real-World Scenarios**:
- Product launch
- Marketing campaign goes viral
- News mention
- Peak shopping hours

**What This Tests**:
- Auto-scaling response time
- Circuit breaker patterns
- Queue handling
- Graceful degradation

### Phase 4: Cool Down

**Purpose**: Monitor recovery and resource cleanup

```yaml
- duration: 30
  arrivalRate: 50
  rampTo: 25
  name: "Cool down phase"
```

**Why It Matters**:
- Tests resource cleanup
- Validates connection pool releases connections
- Ensures no lingering issues after peak
- Monitors recovery time

---

## Creating Realistic User Scenarios

### Basic Scenario Structure

```yaml
scenarios:
  - name: "Scenario name"
    weight: 40              # 40% of traffic
    flow:
      - get:
          url: "/"
      - think: 2            # Wait 2 seconds
      - post:
          url: "/api/data"
          json:
            key: "value"
```

### Think Time

**Purpose**: Simulate real user behavior

```yaml
- get:
    url: "/products"
- think: 3                  # User browses for 3 seconds
- get:
    url: "/products/123"
```

**Without Think Time**:
```
User makes 10 requests instantly
= Unrealistic
= Artificially high load
```

**With Think Time**:
```
User makes request → Think 2s → Next request
= Realistic behavior
= Accurate load simulation
```

**Recommended Think Times**:
- Reading content: 2-5 seconds
- Form filling: 5-10 seconds
- Quick actions: 1-2 seconds

### Weighted Scenarios

**Purpose**: Match real user behavior distribution

```yaml
scenarios:
  - name: "Browse"
    weight: 60              # 60% of users browse

  - name: "Search"
    weight: 30              # 30% search

  - name: "Purchase"
    weight: 10              # 10% purchase
```

**Why Weights Matter**:

```
Without weights (equal distribution):
- 33% browse, 33% search, 33% purchase
- Unrealistic: Most users browse, few purchase

With weights (realistic):
- 60% browse, 30% search, 10% purchase
- Matches actual user behavior
- Accurate load distribution
```

### Complete Scenario Example

```yaml
- name: "Complete user journey"
  weight: 50
  flow:
    # Land on homepage
    - get:
        url: "/"
        expect:
          - statusCode: 200
        capture:
          - json: "$.csrfToken"
            as: "csrfToken"

    # Browse products
    - think: 2
    - get:
        url: "/products"
        expect:
          - statusCode: 200

    # View specific product
    - think: 3
    - get:
        url: "/products/{{ $randomNumber(1, 100) }}"
        expect:
          - statusCode: 200

    # Add to cart
    - think: 2
    - post:
        url: "/api/cart"
        json:
          productId: "{{ $randomNumber(1, 100) }}"
          quantity: 1
        headers:
          X-CSRF-Token: "{{ csrfToken }}"
        expect:
          - statusCode: 200
```

### Built-in Functions

Artillery provides helpful functions:

```yaml
# Random number
productId: "{{ $randomNumber(1, 1000) }}"

# Random string
email: "user-{{ $randomString(8) }}@example.com"

# Random from list
category: "{{ $randomItem(['tech', 'books', 'sports']) }}"

# Environment variable
apiKey: "{{ $env.API_KEY }}"
```

---

## Setting Performance Thresholds

### SLA Definition

**SLA (Service Level Agreement)**: Promise of performance

```yaml
ensure:
  maxErrorRate: 1           # Max 1% errors
  p95: 1000                 # 95% under 1 second
  p99: 2000                 # 99% under 2 seconds
```

**Purpose**: Automated pass/fail criteria

### Choosing Thresholds

#### Error Rate

```yaml
maxErrorRate: 5             # Max 5% errors

# Industry standards:
# - Critical services: < 0.1%
# - Standard services: < 1%
# - Acceptable: < 5%
```

**Consider**:
- User impact (can they retry?)
- Business criticality
- Industry standards

#### Response Time Percentiles

```yaml
p95: 1000                   # 95th percentile < 1000ms
p99: 2000                   # 99th percentile < 2000ms

# Industry standards:
# - Interactive: p95 < 100ms, p99 < 200ms
# - API endpoints: p95 < 500ms, p99 < 1000ms
# - Pages: p95 < 1000ms, p99 < 2000ms
# - Background: p95 < 5000ms, p99 < 10000ms
```

**Why p95/p99?**:
- Represents worst-case user experience
- Catches edge cases
- More meaningful than average

#### Example Thresholds by Service Type

**High-Performance API**:
```yaml
ensure:
  maxErrorRate: 0.1
  p95: 50
  p99: 100
```

**Standard Web Application**:
```yaml
ensure:
  maxErrorRate: 1
  p95: 1000
  p99: 2000
```

**Background Processing**:
```yaml
ensure:
  maxErrorRate: 5
  p95: 5000
  p99: 10000
```

---

## Interpreting Results

### Success Metrics

```
Test Results:
✅ Total requests: 50,000
✅ Successful: 49,950 (99.9%)
✅ Error rate: 0.1%
✅ p95: 450ms (target: 1000ms)
✅ p99: 890ms (target: 2000ms)

Verdict: ✅ PASSED - Excellent performance
```

### Failure Scenarios

#### High Error Rate

```
Error rate: 15% (target: < 5%)

Possible Causes:
- Database connection pool exhausted
- Memory exhaustion
- Timeout too aggressive
- Actual application bugs

Action:
1. Check logs for specific errors
2. Monitor resource usage
3. Increase connection pool if needed
4. Fix application bugs
```

#### Slow Response Times

```
p95: 2500ms (target: 1000ms)
p99: 5000ms (target: 2000ms)

Possible Causes:
- Slow database queries (missing indexes)
- No caching
- N+1 query problems
- Insufficient resources (CPU, memory)

Action:
1. Profile database queries
2. Add database indexes
3. Implement caching
4. Optimize slow endpoints
```

#### Degrading Performance

```
Minute 1: p95 = 200ms
Minute 2: p95 = 400ms
Minute 3: p95 = 800ms
Minute 4: p95 = 1600ms

Possible Causes:
- Memory leak
- Connection pool exhaustion over time
- Log file growing too large
- Resource cleanup not happening

Action:
1. Check memory usage over time
2. Monitor connection pool utilization
3. Look for resource leaks
4. Implement proper cleanup
```

### Resource Analysis

#### CPU Usage

```
CPU Usage During Test:
Baseline: 10%
Peak: 85%
Average: 60%

Analysis:
✅ Stays below 90% (good headroom)
✅ Returns to baseline after test
⚠️ Consider optimizing if consistently > 70%
```

#### Memory Usage

```
Memory Usage:
Start: 200MB
Peak: 800MB
End: 210MB

Analysis:
✅ Returns to baseline (no leak)
✅ Reasonable growth under load
⚠️ Monitor if keeps growing
```

#### Database Connections

```
Connection Pool:
Max: 20 connections
Peak Usage: 18 connections
Average: 12 connections

Analysis:
⚠️ Nearly exhausted (18/20)
Action: Increase pool size to 30
```

---

## Best Practices

### 1. Test Realistic Scenarios

```yaml
# ❌ Bad: Hammer one endpoint
- get:
    url: "/api/data"
- get:
    url: "/api/data"
- get:
    url: "/api/data"

# ✅ Good: Realistic user journey
- get:
    url: "/"
- think: 2
- get:
    url: "/products"
- think: 3
- get:
    url: "/products/123"
```

### 2. Use Weighted Scenarios

```yaml
# ✅ Match real traffic distribution
scenarios:
  - name: "Browse"
    weight: 60              # Most users browse

  - name: "Search"
    weight: 25

  - name: "Purchase"
    weight: 10              # Few users purchase

  - name: "Support"
    weight: 5
```

### 3. Always Include Warm-up

```yaml
phases:
  # ✅ Warm-up first
  - duration: 30
    arrivalRate: 5
    rampTo: 50
    name: "Warm-up"

  # Then peak load
  - duration: 60
    arrivalRate: 100
    name: "Peak load"
```

### 4. Monitor While Testing

```bash
# Run load test
artillery run config.yml

# In another terminal, monitor resources
htop              # CPU, memory
docker stats      # Container resources
pg_top            # PostgreSQL queries
redis-cli INFO    # Redis stats
```

### 5. Test Before Production

```
Development → Staging → Load Test → Production

Never:
Production → Load Test → 💥
```

### 6. Start Small, Scale Up

```yaml
# Day 1: Test with realistic load
- arrivalRate: 50

# Day 2: Test 2x expected
- arrivalRate: 100

# Day 3: Test breaking point
- arrivalRate: 200
```

### 7. Test Critical Paths

**Priority 1 (Must test)**:
- User registration/login
- Payment processing
- Search functionality
- Core product features

**Priority 2 (Should test)**:
- Admin operations
- Reporting
- Settings pages

**Priority 3 (Nice to test)**:
- Edge cases
- Rarely used features

### 8. Document and Version Tests

```
tests/load/
  ├── user-flows.yml          # Standard user journeys
  ├── api-endpoints.yml       # API load testing
  ├── spike-test.yml          # Spike testing
  └── soak-test.yml           # Long-running tests

# Version in git
git add tests/load/
git commit -m "Add load testing configuration"
```

---

## Common Pitfalls

### 1. Testing Without Warm-up

```yaml
# ❌ Bad: Start at peak immediately
phases:
  - duration: 60
    arrivalRate: 100

Problem: Cold start causes false failures
```

**Solution**: Add warm-up phase

### 2. Unrealistic Scenarios

```yaml
# ❌ Bad: No think time
- get: { url: "/page1" }
- get: { url: "/page2" }
- get: { url: "/page3" }

Problem: Humans don't click instantly
```

**Solution**: Add think time

### 3. Testing Production

```
❌ Bad: Run load test against production

Risks:
- Slow down real users
- Trigger alerts
- Cost money (cloud resources)
- Corrupt data
```

**Solution**: Test staging environment with production-like data and infrastructure

### 4. Ignoring Resource Limits

```
Local Test Environment:
- 2 CPU cores
- 4GB RAM
- SQLite database

Production:
- 32 CPU cores
- 128GB RAM
- PostgreSQL cluster

Problem: Test results not representative
```

**Solution**: Test on production-like infrastructure

### 5. Not Monitoring During Tests

```
❌ Bad:
1. Start load test
2. Wait for results
3. Check results
4. Discover high CPU but don't know why

✅ Good:
1. Start load test
2. Monitor: CPU, memory, database, logs
3. See CPU spike at minute 3
4. Check logs, find slow query
5. Fix and retest
```

### 6. Testing Only Happy Path

```yaml
# ❌ Bad: Only test successful requests
- post:
    url: "/api/login"
    json:
      email: "valid@email.com"
      password: "correctPassword"

# ✅ Good: Test failures too
- post:
    url: "/api/login"
    json:
      email: "{{ $randomEmail() }}"
      password: "{{ $randomString(10) }}"
    # Will fail most times - tests error handling
```

### 7. Not Setting Realistic Thresholds

```yaml
# ❌ Too lenient
ensure:
  maxErrorRate: 50            # 50% errors acceptable?
  p95: 60000                  # 60 seconds acceptable?

# ❌ Too strict
ensure:
  maxErrorRate: 0.001         # 0.001% errors (impossible)
  p95: 10                     # 10ms (unrealistic)

# ✅ Realistic
ensure:
  maxErrorRate: 1             # 1% errors acceptable
  p95: 1000                   # 1 second for p95
```

---

## Conclusion

Load testing is essential for:
- **Validating Scalability**: Can we handle growth?
- **Finding Bottlenecks**: Where are the limits?
- **Preventing Outages**: Fix before production
- **Building Confidence**: Sleep well at night

**Key Takeaways**:
1. Always warm up before peak load
2. Test realistic user scenarios with think time
3. Use weighted scenario distribution
4. Set meaningful performance thresholds
5. Monitor resources during tests
6. Test staging, not production
7. Start small and scale up
8. Document and version your tests

**Next Steps**:
- Run load tests regularly (weekly/monthly)
- Integrate into CI/CD pipeline
- Monitor production with APM tools
- Continuously optimize based on results

**Further Reading**:
- [Artillery Documentation](https://www.artillery.io/docs)
- [Performance Testing Best Practices](https://www.atlassian.com/continuous-delivery/software-testing/performance-testing)
- [Google SRE Book - Load Balancing](https://sre.google/sre-book/load-balancing-frontend/)

Happy Load Testing! ⚡

---

**Guide Version**: 1.0
**Last Updated**: November 5, 2025
**Task**: T132 - Load Testing with 100+ Concurrent Users
