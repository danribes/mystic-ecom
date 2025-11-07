# T226: Event Page Structured Data - Learning Guide

**Task ID**: T226  
**Topic**: Event Schema Implementation for SEO  
**Level**: Intermediate  
**Date**: 2025-11-06

---

## Table of Contents
1. [What is Event Structured Data?](#what-is-event-structured-data)
2. [Why Event Schema Matters](#why-event-schema-matters)
3. [Event Schema Properties](#event-schema-properties)
4. [Implementation Guide](#implementation-guide)
5. [Best Practices](#best-practices)
6. [Testing and Validation](#testing-and-validation)
7. [Common Mistakes](#common-mistakes)

---

## What is Event Structured Data?

**Event structured data** is a specific Schema.org type that helps search engines understand events on your website. When implemented correctly, it enables rich event results in Google Search.

### Before Event Schema
```
Meditation Workshop - December 1st
example.com/events/meditation
Learn meditation techniques...
```
Plain search result with no visual elements.

### With Event Schema
```
Meditation Evening Workshop
📅 Friday, December 1, 2025 • 7:00 PM - 9:00 PM
📍 Zen Center, Boulder, CO
💵 $25.00 • In Stock
Spirituality Platform
[Event Details] [Add to Calendar]
```
Rich result with date, time, location, price, and availability.

---

## Why Event Schema Matters

### 1. Rich Results in Search
Events appear with enhanced information:
- Date and time
- Location with map
- Ticket price or free
- Availability (in stock/sold out)
- Event status (scheduled, cancelled, postponed)
- Add to calendar button

### 2. Google Calendar Integration
Google can add events directly to users' calendars from search results.

### 3. Event Discovery
Helps users find events through:
- Google Search
- Google Events
- Google Maps
- Local search queries

### 4. Higher Click-Through Rates
Studies show events with structured data get:
- **65% higher CTR** than plain listings
- **Better conversion** (users know details upfront)
- **Reduced bounce rate** (accurate expectations)

### 5. Mobile Experience
Rich event cards on mobile with:
- Quick event details
- One-tap directions
- Calendar integration
- Ticket purchase links

---

## Event Schema Properties

### Required Properties

#### 1. name
The event title.

```json
"name": "Meditation Evening Workshop"
```

**Best Practices**:
- Clear, descriptive title
- Include key topic/activity
- 60 characters or less

#### 2. description
Detailed event description.

```json
"description": "Join us for an evening of guided meditation with experienced instructors. Learn techniques for mindfulness and stress reduction..."
```

**Best Practices**:
- 200-300 characters optimal
- Explain what attendees will experience
- Include key benefits
- Mention instructors/speakers

#### 3. startDate
Event start date and time in ISO 8601 format.

```json
"startDate": "2025-12-01T19:00:00.000Z"
```

**ISO 8601 Format**:
- Full date and time with timezone
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2025-12-01T19:00:00.000Z`

#### 4. location
Where the event takes place.

```json
"location": {
  "@type": "Place",
  "name": "Zen Center",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Peaceful Way",
    "addressLocality": "Boulder",
    "addressRegion": "CO",
    "postalCode": "80301",
    "addressCountry": "US"
  }
}
```

**For Virtual Events**:
```json
"location": {
  "@type": "VirtualLocation",
  "url": "https://example.com/virtual-event"
}
```

---

### Recommended Properties

#### 5. endDate
Event end date and time.

```json
"endDate": "2025-12-01T21:00:00.000Z"
```

**Best Practices**:
- Always include if known
- Calculate from duration if needed
- Same ISO 8601 format as startDate

#### 6. image
Event image.

```json
"image": "https://example.com/images/meditation-workshop.jpg"
```

**Requirements**:
- Absolute URL (not relative)
- Minimum 1200px wide
- High quality
- Relevant to event

#### 7. organizer
The organization or person organizing the event.

```json
"organizer": {
  "@type": "Organization",
  "name": "Spirituality Platform",
  "url": "https://example.com"
}
```

**Person Organizer**:
```json
"organizer": {
  "@type": "Person",
  "name": "Sarah Johnson"
}
```

#### 8. offers
Ticket pricing information.

```json
"offers": {
  "@type": "Offer",
  "price": 25.00,
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "url": "https://example.com/events/meditation/book",
  "validFrom": "2025-11-01T00:00:00.000Z"
}
```

**Free Events**:
```json
"offers": {
  "@type": "Offer",
  "price": 0,
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock"
}
```

**Availability Values**:
- `https://schema.org/InStock` - Tickets available
- `https://schema.org/SoldOut` - Event full
- `https://schema.org/PreOrder` - Early bird

#### 9. eventStatus
Current status of the event.

```json
"eventStatus": "https://schema.org/EventScheduled"
```

**Status Values**:
- `https://schema.org/EventScheduled` - Going ahead as planned
- `https://schema.org/EventCancelled` - Event cancelled
- `https://schema.org/EventPostponed` - Delayed, new date TBD
- `https://schema.org/EventRescheduled` - Moved to new date

#### 10. eventAttendanceMode
How attendees participate.

```json
"eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
```

**Mode Values**:
- `https://schema.org/OfflineEventAttendanceMode` - In-person only
- `https://schema.org/OnlineEventAttendanceMode` - Virtual only
- `https://schema.org/MixedEventAttendanceMode` - Hybrid (both)

---

### Optional Properties

#### 11. performer
Featured speakers or performers.

```json
"performer": {
  "@type": "Person",
  "name": "Dr. Sarah Quantum"
}
```

**Multiple Performers**:
```json
"performer": [
  {
    "@type": "Person",
    "name": "Dr. Sarah Quantum"
  },
  {
    "@type": "Person",
    "name": "Prof. John Mindful"
  }
]
```

#### 12. geo (in location)
GPS coordinates for the venue.

```json
"location": {
  "@type": "Place",
  "name": "Zen Center",
  "address": {...},
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.0150,
    "longitude": -105.2705
  }
}
```

**Benefits**:
- More accurate map display
- Better local search results
- Directions integration

---

## Implementation Guide

### Step 1: Import Required Components

```astro
---
import StructuredData from '@/components/StructuredData.astro';
import { generateEventSchema } from '@/lib/structuredData';
---
```

### Step 2: Prepare Event Data

```astro
---
// Get site base URL
const siteUrl = Astro.site?.origin || Astro.url.origin;

// Construct event URL
const eventUrl = `${siteUrl}/events/${event.slug}`;

// Convert image to absolute URL
const eventImageUrl = event.image_url?.startsWith('http')
  ? event.image_url
  : event.image_url ? `${siteUrl}${event.image_url}` : `${siteUrl}/images/event-placeholder.jpg`;

// Format dates to ISO 8601
const startDate = new Date(event.event_date).toISOString();
const endTime = new Date(new Date(event.event_date).getTime() + (event.duration_hours * 60 * 60 * 1000));
const endDate = endTime.toISOString();

// Determine event status
const isSoldOut = event.available_spots === 0;
const eventStatus = isSoldOut ? 'EventSoldOut' : 'EventScheduled';
---
```

### Step 3: Generate Schema

```astro
---
const eventSchema = generateEventSchema({
  name: event.title,
  description: event.description,
  startDate: startDate,
  endDate: endDate,
  url: eventUrl,
  image: eventImageUrl,
  location: {
    '@type': 'Place',
    name: event.venue_name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: event.venue_address,
      addressLocality: event.venue_city,
      addressCountry: event.venue_country,
    },
    // Conditionally include geo coordinates
    ...(event.venue_lat && event.venue_lng && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: parseFloat(event.venue_lat),
        longitude: parseFloat(event.venue_lng),
      }
    })
  },
  organizer: {
    '@type': 'Organization',
    name: 'Your Organization',
    url: siteUrl,
  },
  offers: {
    '@type': 'Offer',
    price: parseFloat(event.price),
    priceCurrency: 'USD',
    availability: isSoldOut
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
    url: eventUrl,
    validFrom: new Date().toISOString(),
  },
  eventStatus: eventStatus,
  eventAttendanceMode: 'OfflineEventAttendanceMode',
});
---
```

### Step 4: Render in Head

```astro
<BaseLayout title={event.title} ...>
  <!-- Add to head slot -->
  <StructuredData schema={eventSchema} slot="head" />
  
  <!-- Page content -->
  <div class="event-detail">
    ...
  </div>
</BaseLayout>
```

---

## Best Practices

### 1. Use Absolute URLs

❌ **Wrong**:
```json
"image": "/images/event.jpg"
```

✅ **Correct**:
```json
"image": "https://example.com/images/event.jpg"
```

### 2. Use ISO 8601 Date Format

❌ **Wrong**:
```json
"startDate": "December 1, 2025 7:00 PM"
```

✅ **Correct**:
```json
"startDate": "2025-12-01T19:00:00.000Z"
```

**JavaScript Helper**:
```javascript
const startDate = new Date(event.event_date).toISOString();
```

### 3. Include End Date

❌ **Wrong**: Only startDate
```json
{
  "startDate": "2025-12-01T19:00:00.000Z"
}
```

✅ **Correct**: Both dates
```json
{
  "startDate": "2025-12-01T19:00:00.000Z",
  "endDate": "2025-12-01T21:00:00.000Z"
}
```

### 4. Dynamic Availability

❌ **Wrong**: Static availability
```json
"availability": "https://schema.org/InStock"
```

✅ **Correct**: Dynamic based on capacity
```javascript
availability: isSoldOut
  ? 'https://schema.org/SoldOut'
  : 'https://schema.org/InStock'
```

### 5. Complete Address Information

❌ **Wrong**: Incomplete address
```json
"address": {
  "@type": "PostalAddress",
  "addressLocality": "Boulder"
}
```

✅ **Correct**: Full address
```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "123 Peaceful Way",
  "addressLocality": "Boulder",
  "addressRegion": "CO",
  "postalCode": "80301",
  "addressCountry": "US"
}
```

### 6. Include Geo Coordinates When Available

```javascript
// Conditionally include coordinates
...(hasCoordinates && {
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.0150,
    longitude: -105.2705
  }
})
```

### 7. Use Schema.org URLs for Enums

❌ **Wrong**:
```json
"eventStatus": "EventScheduled"
```

✅ **Correct**:
```json
"eventStatus": "https://schema.org/EventScheduled"
```

### 8. Handle Free Events Correctly

```json
{
  "price": 0,
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock"
}
```

---

## Testing and Validation

### 1. Google Rich Results Test

**URL**: https://search.google.com/test/rich-results

**Steps**:
1. Enter your event page URL
2. Click "Test URL"
3. Wait for results
4. Check detected schema type (should be "Event")
5. Review all properties
6. Check for errors/warnings

**What to Verify**:
- ✅ Event type detected
- ✅ All required properties present
- ✅ No errors (red indicators)
- ✅ Minimal warnings
- ✅ Preview looks correct
- ✅ Dates in ISO 8601 format

### 2. Schema.org Validator

**URL**: https://validator.schema.org/

**Steps**:
1. View page source
2. Copy JSON-LD script content
3. Paste in validator
4. Check results

### 3. Browser DevTools

**Manual Check**:
1. Open event page
2. View page source (Ctrl+U / Cmd+U)
3. Search for `"@type": "Event"`
4. Verify schema is present
5. Copy JSON and validate format

### 4. Test Different Scenarios

- [ ] Available event (InStock)
- [ ] Sold out event (SoldOut)
- [ ] Free event (price = 0)
- [ ] Paid event
- [ ] Event with coordinates
- [ ] Event without coordinates
- [ ] Past event
- [ ] Future event

---

## Common Mistakes

### Mistake 1: Relative Image URLs

❌ **Wrong**:
```json
"image": "/images/event.jpg"
```

**Problem**: Search engines can't resolve relative URLs.

✅ **Fix**:
```json
"image": "https://example.com/images/event.jpg"
```

### Mistake 2: Wrong Date Format

❌ **Wrong**:
```json
"startDate": "12/01/2025 7:00 PM"
```

✅ **Fix**:
```json
"startDate": "2025-12-01T19:00:00.000Z"
```

### Mistake 3: Missing @type

❌ **Wrong**:
```json
"location": {
  "name": "Zen Center"
}
```

✅ **Fix**:
```json
"location": {
  "@type": "Place",
  "name": "Zen Center"
}
```

### Mistake 4: Static Availability

❌ **Wrong**: Always InStock even when sold out
```json
"availability": "https://schema.org/InStock"
```

✅ **Fix**: Dynamic based on capacity
```javascript
availability: isSoldOut
  ? 'https://schema.org/SoldOut'
  : 'https://schema.org/InStock'
```

### Mistake 5: Incomplete Address

❌ **Wrong**:
```json
"address": "Boulder, CO"
```

✅ **Fix**:
```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "123 Peaceful Way",
  "addressLocality": "Boulder",
  "addressRegion": "CO",
  "addressCountry": "US"
}
```

### Mistake 6: Missing eventStatus

❌ **Wrong**: No status provided
```json
{
  "name": "Workshop",
  "startDate": "2025-12-01T19:00:00Z"
}
```

✅ **Fix**:
```json
{
  "name": "Workshop",
  "startDate": "2025-12-01T19:00:00Z",
  "eventStatus": "https://schema.org/EventScheduled"
}
```

### Mistake 7: Not Using Schema.org URLs

❌ **Wrong**:
```json
"eventAttendanceMode": "Offline"
```

✅ **Fix**:
```json
"eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
```

---

## Real-World Example

Here's what our implementation generates for an event:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Meditation Evening Workshop",
  "description": "Join us for an evening of guided meditation with experienced instructors. Learn techniques for mindfulness, stress reduction, and inner peace.",
  "startDate": "2025-12-01T19:00:00.000Z",
  "endDate": "2025-12-01T21:00:00.000Z",
  "url": "https://example.com/events/meditation-evening",
  "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200",
  "location": {
    "@type": "Place",
    "name": "Zen Center",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Peaceful Way",
      "addressLocality": "Boulder",
      "addressRegion": "CO",
      "postalCode": "80301",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 40.0150,
      "longitude": -105.2705
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "Spirituality Platform",
    "url": "https://example.com"
  },
  "offers": {
    "@type": "Offer",
    "price": 25.00,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/events/meditation-evening",
    "validFrom": "2025-11-01T00:00:00.000Z"
  },
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
}
```

---

## Virtual Events

For online/virtual events, use VirtualLocation:

```json
{
  "@type": "Event",
  "name": "Online Meditation Session",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://zoom.us/j/123456789"
  },
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode"
}
```

---

## Hybrid Events

For hybrid in-person + online events:

```json
{
  "@type": "Event",
  "name": "Hybrid Yoga Workshop",
  "location": [
    {
      "@type": "Place",
      "name": "Yoga Studio",
      "address": {...}
    },
    {
      "@type": "VirtualLocation",
      "url": "https://zoom.us/j/123456789"
    }
  ],
  "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode"
}
```

---

## Key Takeaways

1. **Event schema enables rich results** in Google Search
2. **Required properties**: name, description, startDate, location
3. **Recommended properties**: endDate, url, image, organizer, offers, eventStatus, eventAttendanceMode
4. **Use absolute URLs** for all links and images
5. **ISO 8601 format** for dates (2025-12-01T19:00:00Z)
6. **Dynamic availability** based on ticket status
7. **Include geo coordinates** when available
8. **Complete address** information
9. **Test with Google Rich Results Test** before deploying
10. **Keep schema data** consistent with page content

---

## Resources

### Official Documentation
- **Event Schema**: https://schema.org/Event
- **Google Event Guidelines**: https://developers.google.com/search/docs/appearance/structured-data/event
- **Rich Results Test**: https://search.google.com/test/rich-results

### Tools
- **Schema Validator**: https://validator.schema.org/
- **ISO 8601 Dates**: https://www.iso.org/iso-8601-date-and-time-format.html
- **Geo Coordinates**: https://www.latlong.net/

---

## Conclusion

Event structured data is essential for event-based platforms. With proper implementation:
- Events appear with rich information in search
- Higher click-through rates from qualified users
- Better visibility in local searches
- Calendar integration
- Improved SEO performance

Follow this guide to implement Event schema correctly and enable rich event results in Google Search.

---

**Last Updated**: 2025-11-06  
**Author**: Claude Code (Anthropic)  
**Version**: 1.0  
**Related Tasks**: T224 (Structured Data Library), T225 (Course Schema)
