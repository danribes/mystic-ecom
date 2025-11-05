# Tasks: Spirituality E-Commerce Platform

**Input**: Implementation plan from `.specify/memory/plan.md` and specification from `.specify/memory/spec.md`

**Prerequisites**: constitution.md, spec.md, plan.md all complete

**Organization**: Tasks are grouped by development phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions
## Phase 5: User Story 5 - Admin Management (Weeks 5-6) 🎯 MVP

**Goal**: Admins can create, update, and manage courses and view orders

**Independent Test**: Login as admin → create new course → upload content → publish course → view orders

### Tests for User Story 5

- [x] T063 [P] [US5] E2E test for admin course management in tests/e2e/admin-flow.spec.ts

### Admin Dashboard & Layout

- [x] T064 [P] [US5] Create src/layouts/AdminLayout.astro - Admin layout with navigation
- [x] T065 [US5] Create src/pages/admin/index.astro - Admin dashboard with stats (total courses, orders, revenue)

### Course Management

- [x] T066 [P] [US5] Create src/pages/admin/courses/index.astro - Course list with edit/delete buttons
- [x] T067 [P] [US5] Create src/pages/admin/courses/new.astro - Create new course form
- [x] T068 [US5] Create src/pages/admin/courses/[id]/edit.astro - Edit course form
- [x] T069 [US5] Create src/api/admin/courses.ts - POST/PUT/DELETE endpoints for course CRUD
- [x] T070 [US5] Add file upload functionality for course images and materials

### Order Management

- [x] T071 [P] [US5] Create src/pages/admin/orders.astro - Orders list with filters
- [x] T072 [US5] Create src/api/admin/orders.ts - GET endpoint with filters and export to CSV

### Admin Notifications

- [x] T073 [US5] Create src/lib/twilio.ts - Twilio WhatsApp integration for admin notifications
- [x] T074 [US5] Add admin email + WhatsApp notification on new order in webhook handler

**Checkpoint**: Phase 1 (MVP) complete - core e-commerce functionality working

---

