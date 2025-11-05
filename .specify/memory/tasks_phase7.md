# Tasks: Spirituality E-Commerce Platform

**Input**: Implementation plan from `.specify/memory/plan.md` and specification from `.specify/memory/spec.md`

**Prerequisites**: constitution.md, spec.md, plan.md all complete

**Organization**: Tasks are grouped by development phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions
## Phase 7: User Story 4 - Digital Products (Weeks 11-14)

**Goal**: Users can purchase and download digital spiritual products

**Independent Test**: Browse products → purchase product → receive immediate download link → re-download from dashboard

### Tests for User Story 4

- [x] T091 [P] [US4] E2E test for digital product purchase in tests/e2e/product-purchase.spec.ts

### Product Services

- [x] T092 [P] [US4] Implement product service in src/lib/products.ts (getProducts, getProductById, generateDownloadLink)
- [x] T093 [US4] Implement download tracking in src/lib/analytics.ts

### Product Pages

- [x] T094 [P] [US4] Create src/pages/products/index.astro - Digital products catalog
- [x] T095 [P] [US4] Create src/components/ProductCard.astro - Product card with file format/size info
- [x] T096 [US4] Create src/pages/products/[id].astro - Product detail with preview (if applicable)

### Downloads & API

- [x] T097 [US4] Create src/api/products/download/[id].ts - GET endpoint for secure download link generation
- [x] T098 [US4] Create src/pages/dashboard/downloads.astro - My downloads page with re-download links
- [x] T099 [US4] Add product support to cart and checkout system (extend cart service)

### Admin Product Management

- [x] T100 [P] [US4] Create src/pages/admin/products/index.astro - Products list
- [x] T101 [P] [US4] Create src/pages/admin/products/new.astro - Create product form with file upload
- [x] T102 [US4] Create src/pages/admin/products/[id]/edit.astro - Edit product form
- [x] T103 [US4] Create src/api/admin/products.ts - POST/PUT/DELETE endpoints for product CRUD
- [x] T104 [US4] Setup cloud storage integration for product files (S3 or equivalent)

**Checkpoint**: User Story 4 complete - digital product sales functional

---

