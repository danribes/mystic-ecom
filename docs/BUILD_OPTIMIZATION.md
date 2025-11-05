# Build Optimization Guide

This guide explains the production build optimization implemented in T144.

## Overview

The build system includes:
- **Asset Minification**: JavaScript and CSS minification
- **Code Splitting**: Automatic chunking for better caching
- **Bundle Analysis**: Size analysis and optimization recommendations
- **Cache Headers**: Optimized caching strategies
- **Compression**: Gzip compression analysis

## Build Scripts

### Development Build

```bash
npm run build
```

Standard Astro build with default configuration.

### Production Build

```bash
npm run build:prod
```

Optimized build using `astro.config.production.mjs` with:
- Enhanced minification
- Code splitting
- Tree shaking
- Asset optimization

### Build Analysis

```bash
npm run build:analyze
```

Builds and analyzes the output:
- Bundle size report
- Compression statistics
- Size threshold checks
- Optimization recommendations

## Production Configuration

### Key Optimizations

1. **Minification**
   - JavaScript: ESBuild minification
   - CSS: Native CSS minification
   - HTML: Compression enabled

2. **Code Splitting**
   - Vendor chunks (separate for Stripe, Redis, PostgreSQL)
   - Component chunks
   - Library chunks
   - Automatic chunking for better caching

3. **Asset Naming**
   - Content hash in filenames
   - Cache busting automatic
   - Format: `[name].[hash].js`

4. **Target**
   - ES2020 for modern browsers
   - Tree shaking enabled
   - Dead code elimination

## Bundle Size Thresholds

Default limits:
- **Total Bundle**: 5 MB (warning at 3 MB)
- **JavaScript**: 2 MB total
- **CSS**: 500 KB total
- **Single Asset**: 1 MB (warning at 500 KB)

## Build Analysis Report

Example output:

```
============================================================
📦 Bundle Size Report
============================================================

Overall Statistics:
  Total Size:      2.45 MB
  Total Gzip:      856 KB
  Compression:     65.06%
  Asset Count:     43

By Asset Type:
  JS        1.82 MB      (gzip: 624 KB, 65.7%) - 18 files
  CSS       485 KB       (gzip: 156 KB, 67.8%) - 3 files
  IMAGE     128 KB       (gzip: 68 KB, 46.9%) - 15 files
  OTHER     35 KB        (gzip: 8 KB, 77.1%) - 7 files

Largest Assets (Top 10):
   1. 652 KB       _astro/vendor.abc123.js (gzip: 218 KB, 66.6%)
   2. 448 KB       _astro/components.def456.js (gzip: 152 KB, 66.1%)
   3. 285 KB       _astro/main.ghi789.css (gzip: 92 KB, 67.7%)
   ...
```

## Optimization Recommendations

The analyzer provides automatic recommendations:

### Size Warnings
- Large assets (> 500 KB)
- Total JS size (> 1 MB)
- Total CSS size (> 200 KB)

### Performance Tips
- Code splitting suggestions
- Lazy loading opportunities
- Bundle combination recommendations

### Compression Analysis
- Low compression ratio alerts
- Binary file detection
- Already-compressed file identification

## Cache Headers

Automatic cache headers based on asset type:

| Asset Type | Cache-Control | Duration |
|------------|---------------|----------|
| **Hashed assets** | `public, max-age=31536000, immutable` | 1 year |
| **HTML** | `public, max-age=0, must-revalidate` | No cache |
| **API** | `no-store, no-cache` | No cache |
| **Images** | `public, max-age=2592000, immutable` | 30 days |
| **Static** | `public, max-age=86400, must-revalidate` | 1 day |

## Code Splitting Strategy

### Vendor Chunks

Large libraries are split into separate chunks:

```javascript
// Stripe SDK
if (id.includes('stripe')) return 'vendor-stripe';

// Redis client
if (id.includes('redis')) return 'vendor-redis';

// PostgreSQL driver
if (id.includes('pg')) return 'vendor-pg';

// Other vendors
return 'vendor';
```

### Component Chunks

UI components bundled separately:

```javascript
if (id.includes('/components/')) {
  return 'components';
}
```

### Library Chunks

Utility libraries grouped:

```javascript
if (id.includes('/lib/')) {
  return 'lib';
}
```

## Build Optimization Utilities

### Format Size

```typescript
formatSize(1536000);
// Output: "1.46 MB"
```

### Compression Ratio

```typescript
getCompressionRatio(1000000, 350000);
// Output: 65.00
```

### Asset Type Detection

```typescript
getAssetType('main.js');        // 'js'
getAssetType('styles.css');     // 'css'
getAssetType('photo.webp');     // 'image'
```

### Bundle Analysis

```typescript
const stats = analyzeBundleStats(assets);
// Returns: BundleStats with size, compression, breakdown
```

## Performance Impact

Expected improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Bundle Size** | 3.2 MB | 2.4 MB | 25% smaller |
| **Gzip Size** | 1.1 MB | 850 KB | 23% smaller |
| **JavaScript** | 2.5 MB | 1.8 MB | 28% smaller |
| **CSS** | 680 KB | 485 KB | 29% smaller |
| **Load Time** | 4.2s | 2.8s | 33% faster |

## Continuous Integration

### Size Budget Check

Add to CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Build and Analyze
  run: npm run build:analyze

- name: Check Bundle Size
  run: |
    if [ $? -ne 0 ]; then
      echo "Bundle size exceeds limits!"
      exit 1
    fi
```

### Performance Budget

Track bundle sizes over time:

```bash
# Store current sizes
npm run build:analyze > bundle-report.txt

# Compare with previous build
diff bundle-report.txt bundle-report-prev.txt
```

## Troubleshooting

### Build Fails

**Issue**: Build fails with out of memory error

**Solution**: Increase Node.js memory:
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build:prod
```

### Large Bundles

**Issue**: JavaScript bundle > 2 MB

**Solution**:
1. Enable code splitting
2. Lazy load routes
3. Remove unused dependencies
4. Use dynamic imports

### Slow Builds

**Issue**: Production build takes > 5 minutes

**Solution**:
1. Disable source maps: `sourcemap: false`
2. Use faster minifier: `minify: 'esbuild'`
3. Reduce optimizeDeps includes

### Cache Not Working

**Issue**: Assets not cached properly

**Solution**:
1. Verify hash in filename
2. Check CDN cache headers
3. Clear CDN cache
4. Verify `Cache-Control` headers

## Best Practices

### 1. Regular Analysis

Run build analysis regularly:

```bash
# Weekly
npm run build:analyze

# Before deployment
npm run build:analyze
```

### 2. Monitor Bundle Growth

Track bundle size over time:
- Set up automated monitoring
- Alert on 10%+ growth
- Review dependencies quarterly

### 3. Code Splitting

Use dynamic imports for large features:

```javascript
// Bad: Import everything
import { HugeLibrary } from 'huge-lib';

// Good: Dynamic import
const { HugeLibrary } = await import('huge-lib');
```

### 4. Tree Shaking

Ensure dependencies support tree shaking:

```javascript
// Bad: Side effects
import 'library/polyfills';

// Good: Named imports
import { feature } from 'library';
```

### 5. Asset Optimization

Optimize assets before bundling:
- Compress images (WebP, optimized JPEG)
- Minimize SVGs
- Use icon fonts sparingly
- Lazy load images

## Deployment

### Cloudflare Pages

Cloudflare automatically:
- Compresses assets (Brotli/Gzip)
- Serves from global CDN
- Applies cache headers
- Handles HTTP/2 push

Configuration in `public/_headers`:

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-store
```

### Manual Deployment

For manual deployments:

1. Build production:
   ```bash
   npm run build:prod
   ```

2. Analyze output:
   ```bash
   npm run build:analyze
   ```

3. Deploy `dist/` folder

4. Verify:
   ```bash
   curl -I https://yoursite.com/_astro/main.abc123.js
   # Check Cache-Control header
   ```

## References

- [Vite Build Optimizations](https://vitejs.dev/guide/build.html)
- [Astro Build Configuration](https://docs.astro.build/en/reference/configuration-reference/#build-options)
- [Code Splitting Patterns](https://web.dev/code-splitting/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)
