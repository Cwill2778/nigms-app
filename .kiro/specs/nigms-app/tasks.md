# Implementation Plan: NIGMS App

## Overview

Implement the NIGMS App as a Next.js (App Router) + TypeScript application with Supabase, Stripe, and Resend. Tasks are sequenced foundation-first: project scaffold → types and lib modules → database schema → middleware → public routes → client portal → admin dashboard → integrations → final wiring.

## Tasks

- [x] 1. Scaffold project and install dependencies
  - Run `npx create-next-app@latest nigms-app --tailwind --eslint --app --typescript`
  - Install `@supabase/supabase-js @supabase/ssr stripe resend next-themes lucide-react fast-check`
  - Create `.env.local` with placeholder keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Configure `tailwind.config.ts` with `darkMode: 'class'`
  - _Requirements: 1.1_

- [x] 2. Define core TypeScript types and lib modules
  - [x] 2.1 Create `lib/types.ts` with `UserRole`, `WorkOrderStatus`, `PaymentStatus`, `PaymentMethod`, `UserProfile`, `WorkOrder`, `Payment` interfaces
    - Include all API request/response interfaces: `BookingRequest`, `PromoValidateRequest`, `PromoValidateResponse`, `CheckoutRequest`
    - _Requirements: 3.1, 5.1, 6.1, 7.1, 9.1, 10.1_

  - [x] 2.2 Create `lib/supabase.ts` with `createServerClient()` and `createBrowserClient()` exports
    - `createServerClient` uses `@supabase/ssr` with `cookies()` from `next/headers`
    - `createBrowserClient` uses `createBrowserClient` from `@supabase/ssr`
    - _Requirements: 5.2, 13.1_

  - [x] 2.3 Create `lib/stripe.ts` exporting a configured `Stripe` instance with `apiVersion: '2024-06-20'`
    - _Requirements: 3.4, 6.5, 11.1_

  - [x] 2.4 Create `lib/resend.ts` exporting a configured `Resend` instance
    - _Requirements: 12.5_

- [x] 3. Create Supabase database schema and RLS policies
  - [x] 3.1 Write `supabase/migrations/001_initial_schema.sql` with `users`, `work_orders`, `payments`, and `newsletter_subscribers` table definitions
    - Include all CHECK constraints, DEFAULT values, and foreign key references as specified in the design
    - _Requirements: 5.5, 9.1, 9.2, 9.3_

  - [x] 3.2 Write RLS policies in `supabase/migrations/002_rls_policies.sql`
    - `admin_all_users`, `client_read_own_user` on `users`
    - `admin_all_work_orders`, `client_own_work_orders` on `work_orders`
    - `admin_all_payments`, `client_own_payments` on `payments`
    - `admin_read_newsletter` on `newsletter_subscribers`
    - _Requirements: 5.6, 13.2, 13.3, 13.4, 13.6_

  - [x] 3.3 Write property test for client data isolation (Property 10)
    - **Property 10: Client data isolation via RLS**
    - **Validates: Requirements 5.6, 13.3**

  - [x] 3.4 Write property test for admin sees all records (Property 19)
    - **Property 19: Admin sees all records across all clients**
    - **Validates: Requirements 10.1, 10.2, 13.4**

  - [x] 3.5 Write property test for restricted session blocks DB access (Property 25)
    - **Property 25: Restricted session blocks work_orders and payments at DB level**
    - **Validates: Requirements 13.6**

- [x] 4. Implement middleware routing and auth enforcement
  - [x] 4.1 Create `middleware.ts` implementing the full routing decision tree from the design
    - Fetch session via `createServerClient`; fetch `role` and `requires_password_reset` from `public.users`
    - Enforce: admin routes → 403 for non-admin; restricted session → redirect to `/update-password`; normal client on `/update-password` → redirect to `/dashboard`; unauthenticated on protected routes → redirect to `/login`
    - Export `config.matcher` to run on all non-static routes
    - _Requirements: 5.7, 5.8, 5.9, 8.1, 8.2, 8.3, 8.4, 14.7_

  - [x] 4.2 Write property test for admin routes deny non-admin users (Property 16)
    - **Property 16: Admin routes deny access to all non-admin users**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 4.3 Write property test for restricted session blocks all routes (Property 11)
    - **Property 11: Restricted session blocks all non-update-password routes**
    - **Validates: Requirements 5.9, 14.7**

  - [x] 4.4 Write property test for normal session cannot access /update-password (Property 29)
    - **Property 29: Normal session cannot access /update-password**
    - **Validates: Requirements 14.8**

- [x] 5. Implement root layout and theme system
  - [x] 5.1 Update `app/layout.tsx` to wrap children in `ThemeProvider` from `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
    - Add `suppressHydrationWarning` to `<html>`
    - _Requirements: 1.5_

  - [x] 5.2 Create `components/ThemeToggle.tsx` as a client component using `useTheme()` with sun/moon icon from `lucide-react`
    - _Requirements: 1.5_

  - [x] 5.3 Write property test for theme preference round-trip (Property 2)
    - **Property 2: Theme preference round-trip**
    - **Validates: Requirements 1.5**

- [x] 6. Build shared UI components
  - [x] 6.1 Create `components/Navbar.tsx` with dark/light toggle, auth-state-aware navigation links, and mobile-responsive layout
    - _Requirements: 1.4, 1.5_

  - [x] 6.2 Create `components/Footer.tsx` with links to all four legal pages
    - _Requirements: 4.5_

  - [x] 6.3 Create `components/StatusBadge.tsx`, `components/WorkOrderCard.tsx`, `components/PaymentRow.tsx`
    - `StatusBadge`: color-coded badge for `WorkOrderStatus` and `PaymentStatus` values
    - `WorkOrderCard`: displays title, description, status badge, payment amounts, and conditional "Pay Balance" action
    - `PaymentRow`: displays amount, date, status badge in a table row
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 6.4 Create `components/FormError.tsx`, `components/LoadingSpinner.tsx`, `components/ConfirmDialog.tsx`, `components/PromoCodeInput.tsx`
    - _Requirements: 3.8, 7.3, 14.5_

- [x] 7. Implement public landing page and project showcase
  - [x] 7.1 Create `app/(public)/page.tsx` as the public landing page fetching projects from Supabase
    - Render `ProjectGrid` component with project title, description, and status for each entry
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Create `components/ProjectGrid.tsx` rendering a responsive grid of project cards
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 7.3 Write property test for project list renders all entries (Property 1)
    - **Property 1: Project list renders all entries with required fields**
    - **Validates: Requirements 1.2, 1.3**

- [x] 8. Implement legal pages
  - Create `app/(public)/legal/arbitration/page.tsx`, `terms/page.tsx`, `privacy/page.tsx`, `data-use/page.tsx` as static server components
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Implement newsletter signup
  - [x] 9.1 Create `app/api/newsletter/route.ts` POST handler
    - Validate email format; insert into `newsletter_subscribers` via service-role client; handle duplicate email with informational response; call `sendNewsletterConfirmationEmail` on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 9.2 Create `components/NewsletterForm.tsx` as a client component with email validation, submission state, and error/success display
    - _Requirements: 2.1, 2.4_

  - [x] 9.3 Write property test for newsletter deduplication (Property 3)
    - **Property 3: Newsletter deduplication**
    - **Validates: Requirements 2.3**

  - [x] 9.4 Write property test for newsletter email validation (Property 4)
    - **Property 4: Newsletter email validation rejects non-emails**
    - **Validates: Requirements 2.4**

- [x] 10. Implement promo code validation API
  - [x] 10.1 Create `app/api/promo/validate/route.ts` POST handler
    - Store valid codes in a server-side constant (never in client bundle); return `{ valid: boolean, waivesDeposit: boolean }`; `NAILEDIT` returns `{ valid: true, waivesDeposit: true }`
    - _Requirements: 3.6, 3.7, 3.8, 13.5_

  - [x] 10.2 Write property test for invalid promo codes are always rejected (Property 6)
    - **Property 6: Invalid promo codes are always rejected**
    - **Validates: Requirements 3.8**

- [x] 11. Implement deposit calculation utility and booking engine
  - [x] 11.1 Create `lib/booking.ts` with `calculateDeposit(amount: number): number` pure function
    - Returns `Math.round(amount * 0.15 * 100) / 100`
    - _Requirements: 3.3, 3.4_

  - [x] 11.2 Write property test for deposit calculation is always 15% (Property 5)
    - **Property 5: Deposit calculation is always 15%**
    - **Validates: Requirements 3.4**

  - [x] 11.3 Create `app/api/booking/route.ts` POST handler
    - Validate required fields; create `work_orders` record with `status = 'pending'`; create Stripe checkout session for deposit or full amount; return checkout URL
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 11.4 Create `app/(public)/book/page.tsx` with `BookingForm` multi-step component
    - Collect name, email, phone, service type, preferred date; include `PromoCodeInput`; show deposit vs. full payment options; redirect to Stripe on submit
    - _Requirements: 3.1, 3.3, 3.6, 3.7, 3.8_

  - [x] 11.5 Write property test for booking creates a pending work order (Property 7)
    - **Property 7: Booking creates a pending work order**
    - **Validates: Requirements 3.2**

- [x] 12. Implement email functions
  - [x] 12.1 Create `lib/email.ts` with all six typed email functions: `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendWorkOrderStatusEmail`, `sendPaymentConfirmationEmail`, `sendNewsletterConfirmationEmail`, `sendBookingConfirmationEmail`
    - Each function catches Resend errors, logs with context, and returns without throwing
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [~] 12.2 Write property test for email errors never block primary operations (Property 24)
    - **Property 24: Email errors never block primary operations**
    - **Validates: Requirements 12.6**

- [x] 13. Implement Stripe webhook handler
  - [x] 13.1 Create `app/api/webhooks/stripe/route.ts` POST handler
    - Read raw body via `req.text()`; verify signature with `stripe.webhooks.constructEvent`; return 400 on failure
    - Handle `payment_intent.succeeded`: update `payments.status = 'paid'`, call `sendPaymentConfirmationEmail`
    - Handle `payment_intent.payment_failed`: update `payments.status = 'failed'`
    - Return 200 within 5 seconds for valid events
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.3_

  - [~] 13.2 Write property test for webhook signature verification (Property 22)
    - **Property 22: Webhook signature verification gates all processing**
    - **Validates: Requirements 11.2, 11.3**

  - [~] 13.3 Write property test for webhook updates payment status correctly (Property 23)
    - **Property 23: Webhook updates payment status correctly**
    - **Validates: Requirements 11.4, 11.5, 6.6, 12.3**

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement login page and auth flow
  - [x] 15.1 Create `app/login/page.tsx` with username/password form
    - On submit call Supabase `signInWithPassword`; display generic "Invalid credentials" error on failure (no field hint); redirect based on `requires_password_reset` flag
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 5.8_

  - [~] 15.2 Write property test for session cookie is always HttpOnly (Property 8)
    - **Property 8: Session cookie is always HttpOnly**
    - **Validates: Requirements 5.2, 13.1**

  - [~] 15.3 Write property test for invalid credentials produce a generic error (Property 9)
    - **Property 9: Invalid credentials produce a generic error**
    - **Validates: Requirements 5.3**

- [x] 16. Implement forced password reset screen
  - [x] 16.1 Create `app/update-password/page.tsx` with new password + confirmation fields
    - Display `username` as read-only text (no input element); validate password match and non-empty before submit; on success call Supabase `updateUser`, set `requires_password_reset = false` in `public.users`, redirect to `/dashboard`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [~] 16.2 Write property test for password mismatch produces a validation error (Property 26)
    - **Property 26: Password mismatch always produces a validation error**
    - **Validates: Requirements 14.5**

  - [~] 16.3 Write property test for successful password reset clears the reset flag (Property 27)
    - **Property 27: Successful password reset clears the reset flag**
    - **Validates: Requirements 14.4**

  - [~] 16.4 Write property test for username is read-only on the password reset screen (Property 28)
    - **Property 28: Username is read-only on the password reset screen**
    - **Validates: Requirements 14.2**

- [x] 17. Implement client portal layout and dashboard
  - [x] 17.1 Create `app/(client)/layout.tsx` with auth guard (redirect to `/login` if no session; redirect to `/update-password` if reset flag is true)
    - _Requirements: 5.7, 5.8, 5.9_

  - [x] 17.2 Create `app/(client)/dashboard/page.tsx` as a Server Component
    - Fetch client's work orders and payments from Supabase; render `DashboardSummary`, `WorkOrderList`, and payment history
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 17.3 Create `components/DashboardSummary.tsx` showing project status and outstanding balance
    - _Requirements: 6.1_

  - [~] 17.4 Write property test for client dashboard renders all work orders and payments (Property 12)
    - **Property 12: Client dashboard renders all work orders and payments**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [~] 17.5 Write property test for Pay Balance action appears for positive outstanding balance (Property 13)
    - **Property 13: Pay Balance action appears for any positive outstanding balance**
    - **Validates: Requirements 6.4**

- [x] 18. Implement client balance payment flow
  - [x] 18.1 Create `app/api/payments/checkout/route.ts` POST handler
    - Accept `{ workOrderId, type, amount }`; create Stripe checkout session with `metadata.workOrderId` and `metadata.clientId`; return `{ url }`
    - _Requirements: 6.5_

  - [x] 18.2 Create `components/PayBalanceButton.tsx` as a client component
    - POST to `/api/payments/checkout`; redirect to returned Stripe URL
    - _Requirements: 6.4, 6.5_

- [x] 19. Implement client work order creation
  - [x] 19.1 Create `app/(client)/work-orders/new/page.tsx` with `NewWorkOrderForm`
    - Validate required fields (title) client-side; on submit POST to Supabase; set `status = 'pending'` and `client_id = auth.uid()`
    - _Requirements: 7.1, 7.2, 7.3_

  - [~] 19.2 Write property test for new work order created with pending status and correct client ID (Property 14)
    - **Property 14: New work order is always created with pending status and correct client ID**
    - **Validates: Requirements 7.2**

  - [~] 19.3 Write property test for work order form validation rejects incomplete submissions (Property 15)
    - **Property 15: Work order form validation rejects incomplete submissions**
    - **Validates: Requirements 7.3**

- [x] 20. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 21. Implement admin layout and client management
  - [x] 21.1 Create `app/(admin)/layout.tsx` with admin auth guard (403 for non-admin, redirect to `/login` for unauthenticated)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 21.2 Create `scripts/generate_temp_auth.js` Node.js script
    - Generate random 8-char alphanumeric username and 12-char password; call Supabase Admin API to create auth user; insert into `public.users` with `requires_password_reset = true`; print credentials to stdout
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 21.3 Create `app/api/admin/clients/route.ts` POST handler
    - Invoke temp credential generation logic; insert `public.users` record; call `sendWelcomeEmail`; return new client record
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 12.1_

  - [x] 21.4 Create `app/(admin)/clients/page.tsx` with `ClientTable` component
    - Searchable, sortable list of all clients with account status; link to client detail page
    - _Requirements: 9.7_

  - [x] 21.5 Create `app/(admin)/clients/[id]/page.tsx` with client detail view
    - Show client info; include password reset action (generates new temp password, sets reset flag, calls `sendPasswordResetEmail`); include account deactivation action
    - _Requirements: 9.4, 9.6_

  - [~] 21.6 Write property test for new client always has requires_password_reset = true (Property 17)
    - **Property 17: New client always has requires_password_reset = true**
    - **Validates: Requirements 9.3**

  - [~] 21.7 Write property test for welcome email is sent for every new client (Property 18)
    - **Property 18: Welcome email is sent for every new client**
    - **Validates: Requirements 9.5, 12.1**

- [x] 22. Implement admin work order and payment management
  - [x] 22.1 Create `app/(admin)/work-orders/page.tsx` with `WorkOrderTable` component
    - Filterable by status and client; fetch all work orders via admin Supabase client
    - _Requirements: 10.1_

  - [x] 22.2 Create `app/(admin)/work-orders/[id]/page.tsx` with `StatusUpdateForm`
    - Inline status change; on submit update `work_orders.status` and call `sendWorkOrderStatusEmail`; Resend failure logs but does not roll back DB write
    - _Requirements: 10.3, 12.2_

  - [x] 22.3 Create `app/(admin)/payments/page.tsx` with `PaymentTable` and `ManualPaymentForm`
    - `PaymentTable`: filterable by status and client
    - `ManualPaymentForm`: record offline payment; create `payments` record with `method = 'manual'`; call `sendPaymentConfirmationEmail`
    - _Requirements: 10.2, 10.4, 10.5, 12.4_

  - [~] 22.4 Write property test for work order status update persists and triggers email (Property 20)
    - **Property 20: Work order status update persists and triggers email**
    - **Validates: Requirements 10.3, 12.2**

  - [~] 22.5 Write property test for manual payment creates a record and triggers email (Property 21)
    - **Property 21: Manual payment creates a record and triggers email**
    - **Validates: Requirements 10.4, 10.5, 12.4**

- [x] 23. Implement admin dashboard overview
  - Create `app/(admin)/dashboard/page.tsx` with summary stats: total clients, open work orders, recent payments
  - _Requirements: 8.1_

- [~] 24. Wire root entry point and remaining public routes
  - [x] 24.1 Update `app/page.tsx` to redirect authenticated admin to `/dashboard` (admin), authenticated client to `/dashboard` (client), or render the public landing page
    - _Requirements: 1.1_

  - [x] 24.2 Create `app/(public)/projects/page.tsx` as a dedicated project showcase page
    - _Requirements: 1.2, 1.3_

- [x] 25. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- Checkpoints at tasks 14, 20, and 25 ensure incremental validation
- RLS policies are the authoritative data access layer — never rely solely on UI guards
- Email failures (Resend errors) must never block primary DB operations
