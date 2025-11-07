/**
 * T143: CDN (Content Delivery Network) Configuration and Utilities
 *
 * Comprehensive CDN setup for serving static assets with:
 * - Multiple CDN provider support (Cloudflare, CloudFront, Bunny, etc.)
 * - Automatic URL generation with versioning
 * - Cache-Control headers optimization
 * - CDN purge/invalidation utilities
 * - Asset fingerprinting for cache busting
 * - Multi-region support
 * - Fallback mechanisms
 *
 * @module cdn
 */

/**
 * Supported CDN providers
 */
export type CDNProvider = 'cloudflare' | 'cloudfront' | 'bunny' | 'fastly' | 'custom' | 'none';

/**
 * Asset types for CDN delivery
 */
export type AssetType = 'image' | 'video' | 'css' | 'js' | 'font' | 'document' | 'audio' | 'other';

/**
 * Cache control strategies
 */
export type CacheStrategy =
  | 'immutable'      // Long-term caching (1 year) for versioned assets
  | 'standard'       // Normal caching (1 week) for regular assets
  | 'short'          // Short-term caching (1 hour) for dynamic content
  | 'no-cache'       // No caching, always revalidate
  | 'private';       // Private, browser-only caching

/**
 * CDN configuration options
 */
export interface CDNConfig {
  /**
   * CDN provider to use
   */
  provider: CDNProvider;

  /**
   * CDN domain/URL (e.g., 'cdn.example.com' or CloudFront distribution URL)
   */
  domain?: string;

  /**
   * CloudFront distribution ID (for AWS CloudFront)
   */
  cloudFrontDistributionId?: string;

  /**
   * Cloudflare Zone ID (for Cloudflare CDN)
   */
  cloudflareZoneId?: string;

  /**
   * Cloudflare API token (for purging)
   */
  cloudflareApiToken?: string;

  /**
   * Bunny CDN storage zone name
   */
  bunnyStorageZone?: string;

  /**
   * Bunny CDN API key
   */
  bunnyApiKey?: string;

  /**
   * Enable asset versioning/fingerprinting
   */
  enableVersioning?: boolean;

  /**
   * Asset version (e.g., build hash, timestamp)
   */
  assetVersion?: string;

  /**
   * Fallback to local assets if CDN fails
   */
  enableFallback?: boolean;

  /**
   * Custom CDN regions for multi-region setup
   */
  regions?: {
    [region: string]: string; // region name -> CDN URL
  };

  /**
   * Default cache control strategies per asset type
   */
  cacheStrategies?: Partial<Record<AssetType, CacheStrategy>>;

  /**
   * Enable CDN (can be disabled for local development)
   */
  enabled?: boolean;
}

/**
 * Cache-Control header values for each strategy
 */
const CACHE_CONTROL_VALUES: Record<CacheStrategy, string> = {
  immutable: 'public, max-age=31536000, immutable', // 1 year
  standard: 'public, max-age=604800, stale-while-revalidate=86400', // 1 week
  short: 'public, max-age=3600, stale-while-revalidate=600', // 1 hour
  'no-cache': 'no-cache, no-store, must-revalidate',
  private: 'private, max-age=3600', // 1 hour, browser only
};

/**
 * Default cache strategies per asset type
 */
const DEFAULT_CACHE_STRATEGIES: Record<AssetType, CacheStrategy> = {
  image: 'immutable',
  video: 'standard',
  css: 'standard',
  js: 'standard',
  font: 'immutable',
  document: 'short',
  audio: 'standard',
  other: 'short',
};

/**
 * CDN Manager class for handling CDN operations
 */
export class CDNManager {
  private config: Required<CDNConfig>;

  constructor(config: CDNConfig) {
    // Auto-generate domain for CloudFront if not provided
    const autoDomain = config.provider === 'cloudfront' && config.cloudFrontDistributionId && !config.domain
      ? `${config.cloudFrontDistributionId}.cloudfront.net`
      : config.domain || '';

    this.config = {
      provider: config.provider,
      domain: autoDomain,
      cloudFrontDistributionId: config.cloudFrontDistributionId || '',
      cloudflareZoneId: config.cloudflareZoneId || '',
      cloudflareApiToken: config.cloudflareApiToken || '',
      bunnyStorageZone: config.bunnyStorageZone || '',
      bunnyApiKey: config.bunnyApiKey || '',
      enableVersioning: config.enableVersioning === true,
      assetVersion: config.assetVersion || this.generateVersion(),
      enableFallback: config.enableFallback !== false,
      regions: config.regions || {},
      cacheStrategies: { ...DEFAULT_CACHE_STRATEGIES, ...config.cacheStrategies },
      enabled: config.enabled !== false,
    };
  }

  /**
   * Generate an asset version based on current timestamp
   */
  private generateVersion(): string {
    return Date.now().toString(36);
  }

  /**
   * Get CDN URL for an asset
   */
  getCDNUrl(assetPath: string, options?: {
    type?: AssetType;
    version?: string | boolean;
    region?: string;
    fallback?: boolean;
  }): string {
    // If fallback is explicitly requested, return local path
    if (options?.fallback === true) {
      return assetPath;
    }

    // If CDN is disabled, return local path
    if (!this.config.enabled || this.config.provider === 'none') {
      return assetPath;
    }

    // If no domain configured, return local path
    if (!this.config.domain && !options?.region) {
      return assetPath;
    }

    // Clean asset path
    const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

    // Add version if enabled
    let versionedPath = cleanPath;
    // Add version if: 1) version string provided, 2) version=true, or 3) enableVersioning=true
    const shouldVersion = typeof options?.version === 'string' ||
                         options?.version === true ||
                         (options?.version !== false && this.config.enableVersioning);
    if (shouldVersion) {
      const version = typeof options?.version === 'string' ? options.version : this.config.assetVersion;
      versionedPath = this.addVersionToPath(cleanPath, version);
    }

    // Get domain (region-specific or default)
    const domain = options?.region && this.config.regions[options.region]
      ? this.config.regions[options.region]
      : this.config.domain;

    // Build CDN URL
    const protocol = 'https://';
    const cdnDomain = domain.replace(/^https?:\/\//, '');

    return `${protocol}${cdnDomain}${versionedPath}`;
  }

  /**
   * Add version parameter to asset path
   */
  private addVersionToPath(path: string, version: string): string {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}v=${version}`;
  }

  /**
   * Get cache-control header for asset type
   */
  getCacheControl(assetType: AssetType, customStrategy?: CacheStrategy): string {
    const strategy = customStrategy || this.config.cacheStrategies[assetType];
    return CACHE_CONTROL_VALUES[strategy];
  }

  /**
   * Determine asset type from file extension
   */
  getAssetType(path: string): AssetType {
    const ext = path.split('.').pop()?.toLowerCase() || '';

    const typeMap: Record<string, AssetType> = {
      // Images
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
      svg: 'image', ico: 'image', avif: 'image', bmp: 'image',

      // Videos
      mp4: 'video', webm: 'video', ogv: 'video', mov: 'video', avi: 'video',

      // Styles
      css: 'css',

      // Scripts
      js: 'js', mjs: 'js', jsx: 'js',

      // Fonts
      woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font',

      // Documents
      pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
      xlsx: 'document', xls: 'document', pptx: 'document', ppt: 'document',

      // Audio
      mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
    };

    return typeMap[ext] || 'other';
  }

  /**
   * Get asset URL with automatic type detection and CDN routing
   */
  getAssetUrl(path: string, options?: {
    type?: AssetType;
    version?: string | boolean;
    region?: string;
    fallback?: boolean;
  }): string {
    const type = options?.type || this.getAssetType(path);

    try {
      return this.getCDNUrl(path, {
        type,
        version: options?.version,
        region: options?.region,
      });
    } catch (error) {
      // Fallback to local if enabled
      if (options?.fallback !== false && this.config.enableFallback) {
        console.warn(`CDN URL generation failed, falling back to local: ${error}`);
        return path;
      }
      throw error;
    }
  }

  /**
   * Purge/invalidate CDN cache
   */
  async purgeCache(paths?: string[]): Promise<PurgeResult> {
    if (!this.config.enabled) {
      return {
        success: true,
        message: 'CDN disabled, no purge needed',
        provider: 'none',
      };
    }

    switch (this.config.provider) {
      case 'cloudflare':
        return await this.purgeCloudflare(paths);

      case 'cloudfront':
        return await this.purgeCloudFront(paths);

      case 'bunny':
        return await this.purgeBunny(paths);

      case 'fastly':
        return await this.purgeFastly(paths);

      default:
        return {
          success: false,
          message: `Purge not supported for provider: ${this.config.provider}`,
          provider: this.config.provider,
          error: `Purge not supported for provider: ${this.config.provider}`,
        };
    }
  }

  /**
   * Purge Cloudflare cache
   */
  private async purgeCloudflare(paths?: string[]): Promise<PurgeResult> {
    if (!this.config.cloudflareZoneId || !this.config.cloudflareApiToken) {
      return {
        success: false,
        message: 'Cloudflare Zone ID and API token required',
        provider: 'cloudflare',
      };
    }

    try {
      const endpoint = `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflareZoneId}/purge_cache`;

      const body = paths && paths.length > 0
        ? { files: paths.map(p => this.getCDNUrl(p)) }
        : { purge_everything: true };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.errors?.[0]?.message || 'Purge failed');
      }

      return {
        success: true,
        message: paths ? `Purged ${paths.length} files` : 'Purged all cache',
        provider: 'cloudflare',
        purgedPaths: paths,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        provider: 'cloudflare',
        error,
      };
    }
  }

  /**
   * Purge AWS CloudFront cache
   */
  private async purgeCloudFront(paths?: string[]): Promise<PurgeResult> {
    if (!this.config.cloudFrontDistributionId) {
      return {
        success: false,
        message: 'CloudFront Distribution ID required',
        provider: 'cloudfront',
        error: 'CloudFront Distribution ID required',
      };
    }

    // Note: AWS SDK would be needed for actual implementation
    // This is a placeholder showing the structure
    const errorMsg = 'CloudFront purge not implemented - requires AWS SDK (@aws-sdk/client-cloudfront)';
    return {
      success: false,
      message: errorMsg,
      provider: 'cloudfront',
      error: errorMsg,
    };
  }

  /**
   * Purge Bunny CDN cache
   */
  private async purgeBunny(paths?: string[]): Promise<PurgeResult> {
    if (!this.config.bunnyStorageZone || !this.config.bunnyApiKey) {
      return {
        success: false,
        message: 'Bunny Storage Zone and API key required',
        provider: 'bunny',
      };
    }

    try {
      if (!paths || paths.length === 0) {
        // Purge all cache
        const endpoint = `https://api.bunny.net/pullzone/${this.config.bunnyStorageZone}/purgeCache`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'AccessKey': this.config.bunnyApiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Bunny purge failed: ${response.statusText}`);
        }

        return {
          success: true,
          message: 'Purged all cache',
          provider: 'bunny',
        };
      } else {
        // Purge specific URLs
        const results = await Promise.all(
          paths.map(async (path) => {
            const url = this.getCDNUrl(path);
            const endpoint = `https://api.bunny.net/purge?url=${encodeURIComponent(url)}`;

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'AccessKey': this.config.bunnyApiKey,
              },
            });

            return response.ok;
          })
        );

        const successCount = results.filter(r => r).length;

        return {
          success: successCount === paths.length,
          message: `Purged ${successCount}/${paths.length} files`,
          provider: 'bunny',
          purgedPaths: paths,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        provider: 'bunny',
        error,
      };
    }
  }

  /**
   * Purge Fastly cache
   */
  private async purgeFastly(paths?: string[]): Promise<PurgeResult> {
    // Fastly purge implementation placeholder
    const errorMsg = 'Fastly purge not implemented';
    return {
      success: false,
      message: errorMsg,
      provider: 'fastly',
      error: errorMsg,
    };
  }

  /**
   * Generate HTML link preload tags for critical assets
   */
  generatePreloadTags(assets: Array<{ url: string; type: AssetType }>): string {
    return assets
      .map(asset => {
        const asAttr = this.getPreloadAsAttribute(asset.type);
        const url = this.getAssetUrl(asset.url, { type: asset.type });

        return `<link rel="preload" href="${url}" as="${asAttr}" crossorigin>`;
      })
      .join('\n');
  }

  /**
   * Get 'as' attribute value for preload
   */
  private getPreloadAsAttribute(type: AssetType): string {
    const asMap: Record<AssetType, string> = {
      image: 'image',
      video: 'video',
      css: 'style',
      js: 'script',
      font: 'font',
      document: 'document',
      audio: 'audio',
      other: 'fetch',
    };

    return asMap[type];
  }

  /**
   * Test CDN connectivity and response time
   */
  async testCDN(testAssetPath: string = '/favicon.ico'): Promise<CDNTestResult> {
    if (!this.config.enabled || !this.config.domain) {
      return {
        success: false,
        message: 'CDN disabled or not configured',
        provider: this.config.provider,
        error: 'CDN disabled or not configured',
      };
    }

    const testUrl = this.getCDNUrl(testAssetPath);
    const startTime = Date.now();

    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      const responseTime = Date.now() - startTime;
      const cacheControl = response.headers.get('cache-control') || undefined;

      if (!response.ok) {
        return {
          success: false,
          url: testUrl,
          responseTime,
          statusCode: response.status,
          message: `CDN returned ${response.status} ${response.statusText}`,
          provider: this.config.provider,
          error: `HTTP ${response.status} ${response.statusText}`,
        };
      }

      return {
        success: true,
        url: testUrl,
        responseTime,
        statusCode: response.status,
        cacheControl,
        message: 'CDN is available',
        provider: this.config.provider,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        url: testUrl,
        responseTime,
        message: `CDN test failed: ${error.message}`,
        provider: this.config.provider,
        error: error.message,
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CDNConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }
}

/**
 * Purge result interface
 */
export interface PurgeResult {
  success: boolean;
  message: string;
  provider: CDNProvider;
  purgedPaths?: string[];
  error?: any;
}

/**
 * CDN test result interface
 */
export interface CDNTestResult {
  success: boolean;
  url?: string;
  responseTime?: number;
  statusCode?: number;
  cacheControl?: string;
  message: string;
  provider: CDNProvider;
  error?: string;
}

/**
 * Global CDN instance (lazy-loaded)
 */
let cdnInstance: CDNManager | null = null;

/**
 * Initialize global CDN instance
 */
export function initializeCDN(config: CDNConfig): CDNManager {
  cdnInstance = new CDNManager(config);
  return cdnInstance;
}

/**
 * Get global CDN instance (creates with default config if not initialized)
 */
export function getCDN(): CDNManager {
  if (!cdnInstance) {
    // Default configuration from environment variables
    const config: CDNConfig = {
      provider: (process.env.CDN_PROVIDER as CDNProvider) || 'none',
      domain: process.env.CDN_DOMAIN,
      cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID,
      cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
      cloudFrontDistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      bunnyStorageZone: process.env.BUNNY_STORAGE_ZONE,
      bunnyApiKey: process.env.BUNNY_API_KEY,
      enableVersioning: process.env.CDN_ENABLE_VERSIONING !== 'false',
      assetVersion: process.env.ASSET_VERSION,
      enabled: process.env.CDN_ENABLED !== 'false',
    };

    cdnInstance = new CDNManager(config);
  }

  return cdnInstance;
}

/**
 * Helper function: Get CDN URL for asset
 */
export function cdnUrl(assetPath: string, options?: {
  type?: AssetType;
  version?: string | boolean;
  region?: string;
  fallback?: boolean;
}): string {
  return getCDN().getAssetUrl(assetPath, options);
}

/**
 * Helper function: Get cache control header
 */
export function getCacheControlHeader(assetType: AssetType, customStrategy?: CacheStrategy): string {
  return getCDN().getCacheControl(assetType, customStrategy);
}

/**
 * Helper function: Purge CDN cache
 */
export async function purgeCDNCache(paths?: string[]): Promise<PurgeResult> {
  return await getCDN().purgeCache(paths);
}

/**
 * Export CDN types and classes
 */
export type { CDNConfig, CDNProvider, AssetType, CacheStrategy };
