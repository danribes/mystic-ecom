/**
 * Image Optimization Utilities
 *
 * Provides utilities for optimizing image delivery including:
 * - Responsive image srcset generation
 * - WebP format support with fallbacks
 * - Lazy loading configuration
 * - Image dimension calculation
 *
 * Part of T142: Optimize image loading
 */

export interface ImageOptimizationOptions {
  /**
   * Original image source URL
   */
  src: string;

  /**
   * Alt text for accessibility
   */
  alt: string;

  /**
   * Base width for responsive images (default: 800)
   */
  baseWidth?: number;

  /**
   * Array of widths for srcset (if not provided, defaults are generated)
   */
  widths?: number[];

  /**
   * Whether to generate WebP sources
   */
  enableWebP?: boolean;

  /**
   * Loading strategy: 'lazy', 'eager', or 'auto'
   */
  loading?: 'lazy' | 'eager' | 'auto';

  /**
   * CSS classes to apply to the image
   */
  className?: string;

  /**
   * Aspect ratio for layout shift prevention (e.g., '16/9', '4/3')
   */
  aspectRatio?: string;

  /**
   * Sizes attribute for responsive images
   */
  sizes?: string;

  /**
   * Image quality (1-100, default: 80)
   */
  quality?: number;

  /**
   * Fetch priority: 'high', 'low', or 'auto'
   */
  fetchpriority?: 'high' | 'low' | 'auto';
}

export interface ResponsiveImageData {
  src: string;
  srcset: string;
  srcsetWebP?: string;
  sizes: string;
  alt: string;
  loading: 'lazy' | 'eager';
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  fetchpriority?: 'high' | 'low' | 'auto';
}

/**
 * Default responsive image widths
 */
const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536, 1920];

/**
 * Default sizes attribute for responsive images
 */
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

/**
 * Checks if the URL is an external URL
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

/**
 * Checks if the URL is a placeholder image
 */
export function isPlaceholderImage(url: string): boolean {
  return url.includes('placeholder') || url.includes('default-');
}

/**
 * Generates a WebP version of the image path
 * For local images: /images/photo.jpg -> /images/photo.webp
 * For external images: returns the same URL (external services should handle WebP)
 */
export function getWebPPath(imagePath: string): string {
  if (isExternalUrl(imagePath)) {
    // For external URLs, return as-is (CDN should handle WebP serving)
    return imagePath;
  }

  // Replace extension with .webp
  return imagePath.replace(/\.(jpe?g|png|gif)$/i, '.webp');
}

/**
 * Generates responsive image URL with width parameter
 * For local images: /images/photo.jpg -> /images/photo-640w.jpg
 * For external images with query params: adds &w=640
 * For external images without query params: adds ?w=640
 */
export function getResponsiveImageUrl(imagePath: string, width: number, quality?: number): string {
  if (isExternalUrl(imagePath)) {
    // For external URLs, append width as query parameter
    const separator = imagePath.includes('?') ? '&' : '?';
    const qualityParam = quality ? `&q=${quality}` : '';
    return `${imagePath}${separator}w=${width}${qualityParam}`;
  }

  // For local images, insert width before extension
  const extension = imagePath.match(/\.[^.]+$/)?.[0] || '';
  const base = imagePath.slice(0, -extension.length);
  return `${base}-${width}w${extension}`;
}

/**
 * Generates srcset string for responsive images
 */
export function generateSrcset(imagePath: string, widths: number[], quality?: number): string {
  return widths
    .map(width => {
      const url = getResponsiveImageUrl(imagePath, width, quality);
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generates srcset string for WebP images
 */
export function generateWebPSrcset(imagePath: string, widths: number[], quality?: number): string {
  const webpPath = getWebPPath(imagePath);
  return generateSrcset(webpPath, widths, quality);
}

/**
 * Calculates image dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number
): { width: number; height: number } {
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: targetWidth,
    height: Math.round(targetWidth * aspectRatio)
  };
}

/**
 * Parses aspect ratio string (e.g., '16/9', '4:3') and returns decimal
 */
export function parseAspectRatio(ratio: string): number {
  const [width, height] = ratio.split(/[/:]/);
  return parseInt(height) / parseInt(width);
}

/**
 * Determines if image should be lazy loaded based on context
 */
export function shouldLazyLoad(loading: 'lazy' | 'eager' | 'auto', index?: number): 'lazy' | 'eager' {
  if (loading === 'auto') {
    // First 3 images load eagerly (above the fold), rest lazy load
    return index !== undefined && index < 3 ? 'eager' : 'lazy';
  }
  return loading;
}

/**
 * Generates complete responsive image data
 */
export function generateResponsiveImageData(options: ImageOptimizationOptions): ResponsiveImageData {
  const {
    src,
    alt,
    baseWidth = 800,
    widths = DEFAULT_WIDTHS,
    enableWebP = true,
    loading = 'lazy',
    className,
    aspectRatio,
    sizes = DEFAULT_SIZES,
    quality = 80,
    fetchpriority
  } = options;

  // Don't optimize placeholder images
  if (isPlaceholderImage(src)) {
    return {
      src,
      srcset: src,
      sizes,
      alt,
      loading: 'lazy',
      className,
      aspectRatio
    };
  }

  const srcset = generateSrcset(src, widths, quality);
  const srcsetWebP = enableWebP ? generateWebPSrcset(src, widths, quality) : undefined;

  return {
    src,
    srcset,
    srcsetWebP,
    sizes,
    alt,
    loading: loading === 'auto' ? 'lazy' : loading,
    className,
    aspectRatio,
    fetchpriority
  };
}

/**
 * Generates blur placeholder data URL
 * Creates a tiny base64 encoded placeholder for blur-up loading
 */
export function generateBlurPlaceholder(width: number = 10, height: number = 10): string {
  // Simple SVG placeholder with blur effect
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#e5e7eb" filter="url(#blur)"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Gets optimal image format based on browser support
 * This is typically handled by the <picture> element, but useful for programmatic checks
 */
export function getOptimalFormat(formats: string[]): string {
  // Preference order: WebP > PNG > JPEG
  if (formats.includes('webp')) return 'webp';
  if (formats.includes('png')) return 'png';
  if (formats.includes('jpeg') || formats.includes('jpg')) return 'jpeg';
  return formats[0] || 'jpeg';
}

/**
 * Validates image URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Check if it's a valid URL or path
  try {
    if (isExternalUrl(url)) {
      new URL(url);
    }
    return true;
  } catch {
    // If it's not a valid URL, check if it's a valid path
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Preload configuration for critical images (LCP)
 */
export interface PreloadConfig {
  href: string;
  as: 'image';
  type?: string;
  imageSrcset?: string;
  imageSizes?: string;
  fetchpriority?: 'high' | 'low' | 'auto';
}

/**
 * Generates preload link configuration for critical images
 * Use this for above-the-fold hero images to improve LCP
 */
export function generatePreloadConfig(options: ImageOptimizationOptions): PreloadConfig {
  const imageData = generateResponsiveImageData(options);

  return {
    href: imageData.src,
    as: 'image',
    type: imageData.srcsetWebP ? 'image/webp' : undefined,
    imageSrcset: imageData.srcset,
    imageSizes: imageData.sizes,
    fetchpriority: options.fetchpriority || 'high'
  };
}

/**
 * Image optimization presets for common use cases
 */
export const IMAGE_PRESETS = {
  hero: {
    widths: [640, 768, 1024, 1280, 1536, 1920, 2560],
    sizes: '100vw',
    loading: 'eager' as const,
    fetchpriority: 'high' as const,
    quality: 85
  },
  thumbnail: {
    widths: [150, 300, 450],
    sizes: '(max-width: 640px) 150px, 300px',
    loading: 'lazy' as const,
    quality: 75
  },
  card: {
    widths: [320, 640, 768],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    loading: 'lazy' as const,
    quality: 80
  },
  avatar: {
    widths: [48, 96, 144],
    sizes: '48px',
    loading: 'lazy' as const,
    quality: 75
  },
  fullWidth: {
    widths: [640, 768, 1024, 1280, 1536],
    sizes: '100vw',
    loading: 'lazy' as const,
    quality: 85
  }
} as const;

/**
 * Get preset configuration
 */
export function getPreset(presetName: keyof typeof IMAGE_PRESETS): Partial<ImageOptimizationOptions> {
  return IMAGE_PRESETS[presetName];
}
