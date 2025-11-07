/**
 * Structured Data (JSON-LD) Helper Functions
 *
 * Helper functions for generating Schema.org structured data in JSON-LD format.
 * Used for enhancing SEO and enabling rich results in search engines.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Base Schema.org Thing type
 */
interface Thing {
  '@type': string;
  '@id'?: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string | string[];
}

/**
 * Schema.org Organization
 * @see https://schema.org/Organization
 */
export interface OrganizationSchema extends Thing {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  sameAs?: string[]; // Social media profiles
  foundingDate?: string;
  founder?: {
    '@type': 'Person';
    name: string;
  };
}

/**
 * Schema.org WebSite
 * @see https://schema.org/WebSite
 */
export interface WebSiteSchema extends Thing {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  publisher?: OrganizationSchema;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
  inLanguage?: string;
}

/**
 * Schema.org BreadcrumbList
 * @see https://schema.org/BreadcrumbList
 */
export interface BreadcrumbListSchema {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

/**
 * Schema.org Course
 * @see https://schema.org/Course
 */
export interface CourseSchema extends Thing {
  '@type': 'Course';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url?: string;
  };
  instructor?: {
    '@type': 'Person';
    name: string;
    description?: string;
    image?: string;
  } | {
    '@type': 'Person';
    name: string;
    description?: string;
    image?: string;
  }[];
  courseCode?: string;
  educationalLevel?: string;
  hasCourseInstance?: {
    '@type': 'CourseInstance';
    courseMode: string; // online, onsite, blended
    courseWorkload?: string; // ISO 8601 duration (e.g., "PT10H")
    instructor?: {
      '@type': 'Person';
      name: string;
    };
  }[];
  offers?: {
    '@type': 'Offer';
    price: string | number;
    priceCurrency: string;
    availability?: string;
    url?: string;
    validFrom?: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: ReviewSchema[];
}

/**
 * Schema.org Event
 * @see https://schema.org/Event
 */
export interface EventSchema extends Thing {
  '@type': 'Event';
  name: string;
  description: string;
  startDate: string; // ISO 8601 format
  endDate?: string; // ISO 8601 format
  location: {
    '@type': 'Place' | 'VirtualLocation';
    name?: string;
    address?: {
      '@type': 'PostalAddress';
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    url?: string; // For virtual events
  };
  organizer?: {
    '@type': 'Organization' | 'Person';
    name: string;
    url?: string;
  };
  performer?: {
    '@type': 'Person' | 'Organization';
    name: string;
  } | {
    '@type': 'Person' | 'Organization';
    name: string;
  }[];
  offers?: {
    '@type': 'Offer';
    price: string | number;
    priceCurrency: string;
    availability?: string;
    url?: string;
    validFrom?: string;
  } | {
    '@type': 'Offer';
    price: string | number;
    priceCurrency: string;
    availability?: string;
    url?: string;
    validFrom?: string;
  }[];
  eventStatus?: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled';
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
}

/**
 * Schema.org Product
 * @see https://schema.org/Product
 */
export interface ProductSchema extends Thing {
  '@type': 'Product';
  name: string;
  description: string;
  image?: string | string[];
  brand?: {
    '@type': 'Brand' | 'Organization';
    name: string;
  };
  sku?: string;
  mpn?: string;
  offers?: {
    '@type': 'Offer';
    price: string | number;
    priceCurrency: string;
    availability?: string;
    url?: string;
    priceValidUntil?: string;
    seller?: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: ReviewSchema[];
}

/**
 * Schema.org Review
 * @see https://schema.org/Review
 */
export interface ReviewSchema {
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished?: string; // ISO 8601 format
  reviewBody?: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
  itemReviewed?: {
    '@type': string;
    name: string;
  };
}

/**
 * Schema.org FAQPage
 * @see https://schema.org/FAQPage
 */
export interface FAQPageSchema {
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string; // The question
    acceptedAnswer: {
      '@type': 'Answer';
      text: string; // The answer
    };
  }[];
}

/**
 * Breadcrumb item for generating breadcrumb structured data
 */
export interface BreadcrumbItem {
  name: string;
  url?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate Organization structured data
 *
 * @param data Organization data
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const org = generateOrganizationSchema({
 *   name: 'Spirituality Platform',
 *   url: 'https://example.com',
 *   logo: 'https://example.com/logo.png',
 *   description: 'Online spiritual courses and events',
 *   email: 'contact@example.com',
 *   sameAs: [
 *     'https://facebook.com/spirituality',
 *     'https://twitter.com/spirituality'
 *   ]
 * });
 * ```
 */
export function generateOrganizationSchema(data: Omit<OrganizationSchema, '@type'>): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
  };

  if (data.logo) schema.logo = data.logo;
  if (data.description) schema.description = data.description;
  if (data.email) schema.email = data.email;
  if (data.telephone) schema.telephone = data.telephone;
  if (data.address) schema.address = data.address;
  if (data.sameAs) schema.sameAs = data.sameAs;
  if (data.foundingDate) schema.foundingDate = data.foundingDate;
  if (data.founder) schema.founder = data.founder;

  return schema;
}

/**
 * Generate WebSite structured data
 *
 * @param data Website data
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const website = generateWebSiteSchema({
 *   name: 'Spirituality Platform',
 *   url: 'https://example.com',
 *   description: 'Online spiritual courses and events',
 *   potentialAction: {
 *     '@type': 'SearchAction',
 *     target: {
 *       '@type': 'EntryPoint',
 *       urlTemplate: 'https://example.com/search?q={search_term_string}'
 *     },
 *     'query-input': 'required name=search_term_string'
 *   }
 * });
 * ```
 */
export function generateWebSiteSchema(data: Omit<WebSiteSchema, '@type'>): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
  };

  if (data.description) schema.description = data.description;
  if (data.publisher) schema.publisher = data.publisher;
  if (data.potentialAction) schema.potentialAction = data.potentialAction;
  if (data.inLanguage) schema.inLanguage = data.inLanguage;

  return schema;
}

/**
 * Generate BreadcrumbList structured data
 *
 * @param breadcrumbs Array of breadcrumb items
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const breadcrumbs = generateBreadcrumbListSchema([
 *   { name: 'Home', url: 'https://example.com' },
 *   { name: 'Courses', url: 'https://example.com/courses' },
 *   { name: 'Meditation', url: 'https://example.com/courses/meditation' }
 * ]);
 * ```
 */
export function generateBreadcrumbListSchema(breadcrumbs: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Generate Course structured data
 *
 * @param data Course data
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const course = generateCourseSchema({
 *   name: 'Meditation Fundamentals',
 *   description: 'Learn meditation from scratch',
 *   provider: {
 *     '@type': 'Organization',
 *     name: 'Spirituality Platform'
 *   },
 *   offers: {
 *     '@type': 'Offer',
 *     price: 99,
 *     priceCurrency: 'USD'
 *   }
 * });
 * ```
 */
export function generateCourseSchema(data: Omit<CourseSchema, '@type'>): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: data.name,
    description: data.description,
    provider: data.provider,
  };

  if (data.url) schema.url = data.url;
  if (data.image) schema.image = data.image;
  if (data.instructor) schema.instructor = data.instructor;
  if (data.courseCode) schema.courseCode = data.courseCode;
  if (data.educationalLevel) schema.educationalLevel = data.educationalLevel;
  if (data.hasCourseInstance) schema.hasCourseInstance = data.hasCourseInstance;
  if (data.offers) schema.offers = data.offers;
  if (data.aggregateRating) schema.aggregateRating = data.aggregateRating;
  if (data.review) schema.review = data.review;

  return schema;
}

/**
 * Generate Event structured data
 *
 * @param data Event data
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const event = generateEventSchema({
 *   name: 'Meditation Retreat',
 *   description: '3-day meditation retreat',
 *   startDate: '2025-12-01T09:00:00Z',
 *   endDate: '2025-12-03T17:00:00Z',
 *   location: {
 *     '@type': 'Place',
 *     name: 'Mountain Retreat Center',
 *     address: {
 *       '@type': 'PostalAddress',
 *       addressLocality: 'Boulder',
 *       addressRegion: 'CO',
 *       addressCountry: 'US'
 *     }
 *   }
 * });
 * ```
 */
export function generateEventSchema(data: Omit<EventSchema, '@type'>): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    location: data.location,
  };

  if (data.endDate) schema.endDate = data.endDate;
  if (data.url) schema.url = data.url;
  if (data.image) schema.image = data.image;
  if (data.organizer) schema.organizer = data.organizer;
  if (data.performer) schema.performer = data.performer;
  if (data.offers) schema.offers = data.offers;
  if (data.eventStatus) schema.eventStatus = `https://schema.org/${data.eventStatus}`;
  if (data.eventAttendanceMode) schema.eventAttendanceMode = `https://schema.org/${data.eventAttendanceMode}`;

  return schema;
}

/**
 * Generate Product structured data
 *
 * @param data Product data
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const product = generateProductSchema({
 *   name: 'Meditation Cushion',
 *   description: 'Premium meditation cushion',
 *   image: 'https://example.com/cushion.jpg',
 *   brand: {
 *     '@type': 'Brand',
 *     name: 'Zen Supply'
 *   },
 *   offers: {
 *     '@type': 'Offer',
 *     price: 49.99,
 *     priceCurrency: 'USD',
 *     availability: 'https://schema.org/InStock'
 *   }
 * });
 * ```
 */
export function generateProductSchema(data: Omit<ProductSchema, '@type'>): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
  };

  if (data.url) schema.url = data.url;
  if (data.image) schema.image = data.image;
  if (data.brand) schema.brand = data.brand;
  if (data.sku) schema.sku = data.sku;
  if (data.mpn) schema.mpn = data.mpn;
  if (data.offers) schema.offers = data.offers;
  if (data.aggregateRating) schema.aggregateRating = data.aggregateRating;
  if (data.review) schema.review = data.review;

  return schema;
}

/**
 * Generate Review structured data
 *
 * @param data Review data
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const review = generateReviewSchema({
 *   author: {
 *     '@type': 'Person',
 *     name: 'Jane Smith'
 *   },
 *   datePublished: '2025-11-06',
 *   reviewBody: 'Excellent course!',
 *   reviewRating: {
 *     '@type': 'Rating',
 *     ratingValue: 5,
 *     bestRating: 5
 *   }
 * });
 * ```
 */
export function generateReviewSchema(data: ReviewSchema): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: data.author,
    reviewRating: data.reviewRating,
  };

  if (data.datePublished) schema.datePublished = data.datePublished;
  if (data.reviewBody) schema.reviewBody = data.reviewBody;
  if (data.itemReviewed) schema.itemReviewed = data.itemReviewed;

  return schema;
}

/**
 * Generate FAQPage structured data
 *
 * @param questions Array of FAQ questions and answers
 * @returns JSON-LD object
 *
 * @example
 * ```typescript
 * const faq = generateFAQPageSchema([
 *   {
 *     question: 'What is meditation?',
 *     answer: 'Meditation is a practice of mindfulness...'
 *   },
 *   {
 *     question: 'How long should I meditate?',
 *     answer: 'Beginners should start with 5-10 minutes...'
 *   }
 * ]);
 * ```
 */
export function generateFAQPageSchema(questions: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Validate and sanitize JSON-LD object
 *
 * @param schema JSON-LD object
 * @returns Validated schema
 */
export function validateSchema(schema: Record<string, unknown>): Record<string, unknown> {
  // Ensure @context is present
  if (!schema['@context']) {
    schema['@context'] = 'https://schema.org';
  }

  // Ensure @type is present
  if (!schema['@type']) {
    throw new Error('Schema must have @type property');
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(schema).filter(([_, value]) => value !== undefined)
  );
}

/**
 * Combine multiple schemas into an array
 *
 * @param schemas Array of schema objects
 * @returns Combined schema array
 *
 * @example
 * ```typescript
 * const combined = combineSchemas([
 *   generateOrganizationSchema({...}),
 *   generateWebSiteSchema({...})
 * ]);
 * ```
 */
export function combineSchemas(schemas: Record<string, unknown>[]): Record<string, unknown>[] {
  return schemas.map(validateSchema);
}
