# Tasks: Spirituality E-Commerce Platform

**Input**: Implementation plan from `.specify/memory/plan.md` and specification from `.specify/memory/spec.md`

**Prerequisites**: constitution.md, spec.md, plan.md all complete

**Organization**: Tasks are grouped by development phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions
## Phase 3: User Story 1 - Browse and Purchase Online Courses (Weeks 2-4) 🎯 MVP

**Goal**: Users can browse course catalog, add courses to cart, checkout via Stripe, and access purchased courses

**Independent Test**: Browse courses → add to cart → checkout with test Stripe card → receive confirmation email → access course in dashboard

### Tests for User Story 1

- [x] T029 [P] [US1] Unit test for cart calculations in tests/unit/cart.test.ts
- [x] T030 [P] [US1] Integration test for course purchase flow in tests/integration/purchase.test.ts
- [x] T031 [P] [US1] E2E test for complete checkout in tests/e2e/purchase-flow.spec.ts

### Database & Services for User Story 1

- [x] T032 [P] [US1] Implement course service in src/lib/courses.ts (getCourses, getCourseById, enrollUser)
- [x] T033 [P] [US1] Implement cart service in src/lib/cart.ts (add, remove, get, clear, calculate total)
- [x] T034 [US1] Implement order service in src/lib/orders.ts (createOrder, getOrderById, getUserOrders)
- [x] T035 [US1] Implement Stripe integration in src/lib/stripe.ts (createCheckoutSession, validateWebhook)

### Course Pages

- [x] T036 [P] [US1] Create src/pages/courses/index.astro - Course catalog with grid layout (API implemented)
- [x] T037 [P] [US1] Create src/components/CourseCard.astro - Course card component with image, title, price, rating
- [x] T038 [US1] Create src/pages/courses/[id].astro - Course detail page with full description, curriculum, reviews
- [x] T039 [US1] Add "Add to Cart" button functionality to course detail page

### Shopping Cart & Checkout (US1)

- [x] T040 [P] [US1] Create src/pages/cart.astro with shopping cart page layout and cart items list
- [x] T041 [P] [US1] Create src/components/CartItem.astro with quantity controls and remove button
- [x] T042 [US1] Create src/pages/api/cart/add.ts - POST endpoint to add course to cart
- [x] T043 [US1] Create src/pages/api/cart/remove.ts - DELETE endpoint to remove from cart
- [x] T044 [US1] Create src/pages/api/cart/index.ts - GET endpoint to retrieve cart items
- [x] T045 [US1] Create src/pages/checkout.astro - Checkout page with order summary
- [x] T046 [US1] Create src/pages/api/checkout/create-session.ts - POST endpoint to create Stripe checkout session
- [x] T047 [US1] Create src/pages/api/checkout/webhook.ts - POST endpoint for Stripe webhook (create order, send email, clear cart)

### Email Notifications

- [x] T048 [US1] Create src/lib/email.ts - Resend integration for transactional emails (completed with T060)
- [x] T049 [US1] Create email template for order confirmation with course access link

### User Dashboard

- [x] T050 [P] [US1] Create src/layouts/DashboardLayout.astro - Dashboard layout with sidebar navigation
- [x] T051 [US1] Create src/pages/dashboard/index.astro - User dashboard with enrolled courses
- [x] T052 [US1] Create src/pages/dashboard/courses.astro - My courses page with access links

**Checkpoint**: User Story 1 complete - users can browse, purchase, and access courses

---

