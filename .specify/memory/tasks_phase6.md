# Tasks: Spirituality E-Commerce Platform

**Input**: Implementation plan from `.specify/memory/plan.md` and specification from `.specify/memory/spec.md`

**Prerequisites**: constitution.md, spec.md, plan.md all complete

**Organization**: Tasks are grouped by development phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions
## Phase 6: User Story 3 - Book On-Site Events (Weeks 7-10)

**Goal**: Users can discover, book, and attend physical spiritual events

**Independent Test**: Browse events → filter by location → book event → receive email + WhatsApp confirmation with venue details

### Tests for User Story 3

- [x] T075 [P] [US3] Integration test for booking flow with capacity checking in tests/integration/booking.test.ts
- [x] T076 [P] [US3] E2E test for event booking in tests/e2e/event-booking.spec.ts

### Event Services & Database

- [x] T077 [P] [US3] Implement event service in src/lib/events.ts (getEvents, getEventById, bookEvent, checkCapacity)
- [x] T078 [US3] Implement booking service in src/lib/bookings.ts (createBooking, getBookingById, getUserBookings)

### Event Pages

- [x] T079 [P] [US3] Create src/pages/events/index.astro - Events catalog with filter by category/date
- [x] T080 [P] [US3] Create src/components/EventCard.astro - Event card with date, venue, capacity indicator
- [x] T081 [US3] Create src/pages/events/[id].astro - Event detail with venue map (Google Maps/Mapbox integration)
- [x] T082 [US3] Add "Book Now" button with capacity check to event detail page

### Booking API

- [x] T083 [US3] Create src/api/events/book.ts - POST endpoint for event booking (check capacity, create booking, process payment)
- [x] T084 [US3] Add WhatsApp notification for event confirmation in booking endpoint
- [x] T085 [US3] Create email template for event confirmation with venue address and map link

### Admin Event Management

- [x] T086 [P] [US3] Create src/pages/admin/events/index.astro - Events list with capacity tracking
- [x] T087 [P] [US3] Create src/pages/admin/events/new.astro - Create event form with venue address input
- [x] T088 [US3] Create src/pages/admin/events/[id]/edit.astro - Edit event form
- [x] T089 [US3] Create src/api/admin/events.ts - POST/PUT/DELETE endpoints for event CRUD
- [x] T090 [US3] Add booking management interface for admins (view attendees, send updates)

**Checkpoint**: User Story 3 complete - event booking system functional

---

