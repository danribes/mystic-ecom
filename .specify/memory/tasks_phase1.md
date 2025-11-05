# Tasks: Spirituality E-Commerce Platform

**Input**: Implementation plan from `.specify/memory/plan.md` and specification from `.specify/memory/spec.md`

**Prerequisites**: constitution.md, spec.md, plan.md all complete

**Organization**: Tasks are grouped by development phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions

## Phase 1: Project Setup & Infrastructure (Week 1)

**Purpose**: Initialize project structure and development environment



- [x] T001 Initialize Astro project with TypeScript support in root directory
- [x] T002 [P] Create project structure per plan.md (src/, tests/, database/, docker/ directories)
- [x] T003 [P] Setup package.json with dependencies (Astro, TypeScript, PostgreSQL driver, Redis client, Stripe SDK, bcrypt)
- [x] T004 [P] Configure tsconfig.json for strict type checking
- [x] T005 [P] Setup ESLint and Prettier with Astro configuration
- [x] T006 [P] Create .env.example with all required environment variables
- [x] T007 [P] Setup .gitignore (node_modules, .env, dist, uploads)
- [x] T008 Create docker-compose.yml with PostgreSQL and Redis services
- [x] T009 Create database/schema.sql with initial table definitions (users, courses, products, events, orders, cart_items, bookings, order_items)
- [x] T010 [P] Configure Vitest for unit testing (vitest.config.ts)
- [x] T011 [P] Configure Playwright for E2E testing (playwright.config.ts)
- [x] T012 Create astro.config.mjs with SSR and API route configuration

**Checkpoint**: Project structure initialized, Docker services running, dependencies installed

---

