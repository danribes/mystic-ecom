# Tasks: Spirituality E-Commerce Platform

**Input**: Implementation plan from `.specify/memory/plan.md` and specification from `.specify/memory/spec.md`

**Prerequisites**: constitution.md, spec.md, plan.md all complete

**Organization**: Tasks are grouped by development phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions
## Phase 2: Foundational Infrastructure (Weeks 1-2)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Caching

- [x] T013 Create database/schema.sql with all tables per plan.md
- [x] T014 [P] Create database migration framework in database/migrations/
- [x] T015 [P] Create seed data script for development in database/seeds/dev.sql
- [x] T016 Create src/lib/db.ts - PostgreSQL connection pool with error handling
- [x] T017 Create src/lib/redis.ts - Redis client configuration for sessions and caching

### Authentication & Sessions

- [x] T018 Create src/lib/auth.ts - Password hashing (bcrypt), verification, user creation
- [x] T019 [P] Implement session management with Redis in src/lib/session.ts
- [x] T020 Create authentication middleware in src/middleware/auth.ts (check session, attach user to request)
- [x] T021 Create admin middleware in src/middleware/admin.ts (verify admin role)

### Base Layouts & Components

- [x] T022 [P] Create src/layouts/BaseLayout.astro - Main site layout with header/footer
- [x] T023 [P] Create src/components/Header.astro - Navigation with login/cart indicators
- [x] T024 [P] Create src/components/Footer.astro - Footer with links
- [x] T025 [P] Create src/styles/global.css - Base styles, CSS variables, responsive breakpoints

### Error Handling & Utilities

- [x] T026 [P] Create src/lib/errors.ts - Custom error classes and error handler
- [x] T027 [P] Create src/lib/validation.ts - Input validation utilities
- [x] T028 [P] Create src/lib/utils.ts - Common utility functions (format currency, dates, etc.)

**Checkpoint**: Foundation complete - database connected, auth working, basic layouts ready

---

