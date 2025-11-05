# Image Optimization Migration Guide

This guide explains how to migrate existing image implementations to use the new `OptimizedImage` component from T142.

## Benefits of OptimizedImage

- **Lazy Loading**: Automatically lazy loads images below the fold
- **Responsive Images**: Generates srcset for multiple device widths
- **WebP Support**: Provides WebP images with JPEG/PNG fallbacks
- **Layout Shift Prevention**: Uses aspect ratio to prevent content jumping
- **Performance Presets**: Pre-configured settings for common use cases

## Quick Migration Examples

### Before: Simple img tag

```astro
<img
  src={imageUrl}
  alt={course.title}
  class="h-full w-full object-cover"
  loading="lazy"
/>
```

### After: OptimizedImage component

```astro
import OptimizedImage from '@/components/OptimizedImage.astro';

<OptimizedImage
  src={imageUrl}
  alt={course.title}
  preset="card"
  class="h-full w-full"
  objectFit="cover"
/>
```

## Migration by Component Type

### CourseCard / ProductCard / EventCard

**Before:**
```astro
<img
  src={imageUrl}
  alt={course.title}
  class="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
  loading="lazy"
/>
```

**After:**
```astro
import OptimizedImage from '@/components/OptimizedImage.astro';

<OptimizedImage
  src={imageUrl}
  alt={course.title}
  preset="card"
  class="h-full w-full transition-transform duration-slow group-hover:scale-105"
  objectFit="cover"
  aspectRatio="16/9"
/>
```

### Hero Images

**Before:**
```astro
<img
  src="/images/hero.jpg"
  alt="Hero image"
  class="w-full h-auto"
/>
```

**After:**
```astro
import OptimizedImage from '@/components/OptimizedImage.astro';

<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  preset="hero"
  class="w-full h-auto"
  blurPlaceholder={true}
/>
```

### Thumbnails

**Before:**
```astro
<img
  src={product.thumbnail}
  alt={product.title}
  class="w-20 h-20 object-cover rounded"
  loading="lazy"
/>
```

**After:**
```astro
import OptimizedImage from '@/components/OptimizedImage.astro';

<OptimizedImage
  src={product.thumbnail}
  alt={product.title}
  preset="thumbnail"
  class="w-20 h-20 rounded"
  objectFit="cover"
/>
```

### Avatar Images

**Before:**
```astro
<img
  src={user.avatar}
  alt={user.name}
  class="h-6 w-6 rounded-full object-cover"
/>
```

**After:**
```astro
import OptimizedImage from '@/components/OptimizedImage.astro';

<OptimizedImage
  src={user.avatar}
  alt={user.name}
  preset="avatar"
  class="h-6 w-6 rounded-full"
/>
```

## Available Presets

### `hero`
- **Use for**: Large hero/banner images
- **Loading**: Eager (loads immediately)
- **Fetch Priority**: High (LCP optimization)
- **Widths**: 640, 768, 1024, 1280, 1536, 1920, 2560
- **Quality**: 85

### `card`
- **Use for**: Card images in grids/lists
- **Loading**: Lazy
- **Widths**: 320, 640, 768
- **Quality**: 80

### `thumbnail`
- **Use for**: Small preview images
- **Loading**: Lazy
- **Widths**: 150, 300, 450
- **Quality**: 75

### `avatar`
- **Use for**: User profile pictures
- **Loading**: Lazy
- **Widths**: 48, 96, 144
- **Quality**: 75

### `fullWidth`
- **Use for**: Full-width content images
- **Loading**: Lazy
- **Widths**: 640, 768, 1024, 1280, 1536
- **Quality**: 85

## Custom Configuration

If presets don't fit your needs, use custom configuration:

```astro
<OptimizedImage
  src={imageUrl}
  alt="Custom image"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
  quality={90}
  loading="eager"
  fetchpriority="high"
  aspectRatio="4/3"
  class="custom-class"
/>
```

## Performance Best Practices

### 1. Use Appropriate Presets

Choose the preset that matches your use case to avoid downloading unnecessarily large images.

### 2. Set Aspect Ratios

Always set `aspectRatio` to prevent layout shift:

```astro
<OptimizedImage
  src={imageUrl}
  alt="Image"
  aspectRatio="16/9"
/>
```

### 3. Prioritize Above-the-Fold Images

For hero images and content in the viewport:

```astro
<OptimizedImage
  src={heroImage}
  alt="Hero"
  loading="eager"
  fetchpriority="high"
/>
```

### 4. Enable Blur Placeholders for Important Images

```astro
<OptimizedImage
  src={imageUrl}
  alt="Image"
  blurPlaceholder={true}
/>
```

### 5. Use Auto Loading for Lists

For image lists, the first 3 images load eagerly:

```astro
{images.map((image, index) => (
  <OptimizedImage
    src={image.url}
    alt={image.alt}
    index={index}
    loading="auto"
  />
))}
```

## Preload Critical Images

For LCP optimization, preload hero images in the `<head>`:

```astro
---
import { generatePreloadConfig } from '@/lib/imageOptimization';

const preloadConfig = generatePreloadConfig({
  src: '/images/hero.jpg',
  alt: 'Hero image',
  fetchpriority: 'high'
});
---

<head>
  <link
    rel="preload"
    href={preloadConfig.href}
    as={preloadConfig.as}
    type={preloadConfig.type}
    imagesrcset={preloadConfig.imageSrcset}
    imagesizes={preloadConfig.imageSizes}
    fetchpriority={preloadConfig.fetchpriority}
  />
</head>
```

## Components to Update

Priority order for migration:

1. **High Priority** (LCP impact):
   - Hero images on homepage
   - Featured course/product cards
   - Event banners

2. **Medium Priority** (User experience):
   - Course/Product/Event card images
   - Gallery images
   - Profile images

3. **Low Priority** (below fold):
   - Footer images
   - Small icons
   - Background images

## Testing Checklist

After migrating a component:

- [ ] Images load correctly on desktop and mobile
- [ ] WebP images are served (check Network tab)
- [ ] Lazy loading works (images load when scrolling)
- [ ] No layout shift when images load
- [ ] Placeholder blur effect works (if enabled)
- [ ] Alt text is preserved
- [ ] CSS classes are applied correctly

## Troubleshooting

### Images Not Loading

Check that:
- Image URLs are correct
- Image files exist in `/public/images/`
- No CORS issues for external images

### WebP Not Working

- Browser supports WebP (Chrome, Firefox, Edge, Safari 14+)
- WebP files are generated or CDN supports WebP

### Layout Shift

- Always set `aspectRatio` prop
- Use intrinsic `width` and `height` when known

### Blur Placeholder Not Showing

- Set `blurPlaceholder={true}`
- Check browser console for errors

## Performance Impact

Expected improvements:

- **Image Size**: 20-35% smaller with WebP
- **Load Time**: 30-50% faster with lazy loading
- **LCP**: 15-25% improvement with preloading
- **CLS**: Near-zero with aspect ratio

## Next Steps

1. Audit all image usage: `grep -r "<img" src/`
2. Prioritize components by LCP impact
3. Migrate one component at a time
4. Test on real devices
5. Monitor Core Web Vitals

## Resources

- [Web.dev - Optimize Images](https://web.dev/fast/#optimize-your-images)
- [MDN - Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [WebP Documentation](https://developers.google.com/speed/webp)
