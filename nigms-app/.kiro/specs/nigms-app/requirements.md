# Requirements Document

## Introduction

Nailed It General Maintenance Services (NIGMS) is a web application for a handyman business operated by Charles Willis. The application provides a public-facing booking and marketing site, a secure client portal for managing work orders and payments, and a protected admin dashboard for Charles to manage all clients, projects, and finances. The system integrates Stripe for payment processing and Resend for automated transactional emails, with Supabase handling authentication, database storage, and row-level security.

## Glossary

- **Admin**: Charles Willis, the sole administrator of the NIGMS application with full access to all client data, work orders, and payments.
- **Client**: A registered customer of NIGMS who accesses the system via a system-issued temporary username and password.
- **Work_Order**: A record representing a service request or project for a client, including status, description, and associated payments.
- **Payment**: A financial transaction record linked to a work order, capturing amount, method, and status.
- **Booking**: A public-facing service request submitted before a client account is created.
- **Deposit**: A 15% upfront partial payment required at booking time unless waived by a promo code.
- **Promo_Code**: A server-validated discount code (e.g., `NAILEDIT`) that waives the deposit requirement.
- **Temp_Credentials**: A system-generated temporary username and password issued to a new client upon account creation.
- **Permanent_Username**: A system-assigned, immutable username set at account creation time that cannot be changed by the client or the Admin after creation.
- **Password_Reset_Flag**: The `requires_password_reset` boolean column on the user's database profile, set to `true` when a temporary password is issued and cleared to `false` after the client sets a permanent password.
- **Restricted_Session**: An authenticated session state where `requires_password_reset = true`, granting access only to the `/update-password` route and blocking all other authenticated routes.
- **RLS**: Row Level Security — Supabase database policies that restrict data access based on the authenticated user's role.
- **Stripe**: Third-party payment processor used for all online transactions.
- **Resend**: Third-party transactional email service used for automated notifications.
- **Session**: An authenticated user session managed via secure HTTP-only cookies.

---

## Requirements

### Requirement 1: Public Landing Page and Project Showcase

**User Story:** As a site visitor, I want to view NIGMS's current and upcoming projects, so that I can evaluate the quality and scope of Charles's work before booking a service.

#### Acceptance Criteria

1. THE App SHALL display a public landing page accessible without authentication.
2. THE App SHALL render a list of current and upcoming projects sourced from the database on the public landing page.
3. WHEN a project entry is displayed, THE App SHALL show the project title, description, and status.
4. THE App SHALL be mobile-responsive and render correctly on screen widths from 320px to 1920px.
5. THE App SHALL provide a dark/light mode toggle in the main navigation that persists the user's preference across page loads.

---

### Requirement 2: Newsletter Signup

**User Story:** As a site visitor, I want to sign up for the NIGMS newsletter, so that I can receive updates about services and promotions.

#### Acceptance Criteria

1. THE App SHALL display a newsletter signup form on the public site.
2. WHEN a visitor submits the newsletter form with a valid email address, THE App SHALL store the email in the database and send a confirmation email via Resend.
3. IF a visitor submits the newsletter form with an email address that is already subscribed, THEN THE App SHALL display an informational message without creating a duplicate record.
4. IF a visitor submits the newsletter form with an invalid email format, THEN THE App SHALL display a validation error message before submission.

---

### Requirement 3: Public Booking Engine

**User Story:** As a site visitor, I want to book a service online, so that I can schedule work with NIGMS without calling.

#### Acceptance Criteria

1. THE App SHALL provide a public booking form that collects the visitor's name, email, phone number, service type, and preferred date.
2. WHEN a visitor submits a valid booking form, THE Booking_Engine SHALL create a pending work order record in the database.
3. THE Booking_Engine SHALL present the visitor with two payment options: pay the full service amount or pay a 15% deposit upfront.
4. WHEN a visitor selects the deposit option, THE Booking_Engine SHALL calculate 15% of the quoted service amount and initiate a Stripe payment session for that amount.
5. WHEN a visitor selects the pay-in-full option, THE Booking_Engine SHALL initiate a Stripe payment session for the full quoted service amount.
6. WHEN a visitor enters a promo code during booking, THE Booking_Engine SHALL validate the promo code server-side before applying any discount.
7. WHEN the promo code `NAILEDIT` is validated server-side, THE Booking_Engine SHALL waive the deposit requirement and allow the visitor to proceed without an upfront payment.
8. IF an invalid promo code is submitted, THEN THE Booking_Engine SHALL display an error message and retain the standard payment options.
9. WHEN a Stripe payment is successfully completed for a booking, THE App SHALL send a booking confirmation email to the visitor via Resend.

---

### Requirement 4: Legal Pages

**User Story:** As a site visitor, I want to read NIGMS's legal policies, so that I understand my rights and obligations before booking.

#### Acceptance Criteria

1. THE App SHALL provide a publicly accessible Arbitration Agreement page.
2. THE App SHALL provide a publicly accessible Terms of Use page.
3. THE App SHALL provide a publicly accessible Privacy Policy page.
4. THE App SHALL provide a publicly accessible "How We Use and Collect Your Data" page.
5. THE App SHALL include links to all four legal pages in the public site footer.

---

### Requirement 5: Client Authentication

**User Story:** As a client, I want to log in with my system-issued credentials, so that I can securely access my account information.

#### Acceptance Criteria

1. THE Auth_System SHALL authenticate clients using a system-issued temporary username and password.
2. WHEN a client submits valid credentials, THE Auth_System SHALL create an authenticated session stored in a secure HTTP-only cookie.
3. IF a client submits invalid credentials, THEN THE Auth_System SHALL display an authentication error message without revealing which field is incorrect.
4. WHEN a client session expires or the client logs out, THE Auth_System SHALL invalidate the session cookie and redirect the client to the login page.
5. THE Auth_System SHALL never store plain-text passwords in the database.
6. WHILE a client is authenticated, THE App SHALL enforce RLS policies so the client can only read and write their own records in the `users`, `work_orders`, and `payments` tables.
7. WHEN a client submits valid credentials and the Password_Reset_Flag is `false`, THE Auth_System SHALL route the client to the Client Dashboard.
8. WHEN a client submits valid credentials and the Password_Reset_Flag is `true`, THE Auth_System SHALL immediately redirect the client to the `/update-password` route and establish a Restricted_Session.
9. WHILE a client session is a Restricted_Session, THE Auth_System SHALL block access to all routes except `/update-password` and redirect any other route request to `/update-password`.

---

### Requirement 6: Client Portal Dashboard

**User Story:** As a client, I want a dashboard showing my work and payment history, so that I can track the status of my projects and outstanding balances.

#### Acceptance Criteria

1. WHILE a client is authenticated, THE Client_Portal SHALL display the client's current project status, work order history, and payment history.
2. THE Client_Portal SHALL display each work order with its title, description, current status, and associated payment amounts.
3. THE Client_Portal SHALL display each payment record with its amount, date, and status.
4. WHEN a client has an outstanding balance on a work order, THE Client_Portal SHALL display a "Pay Balance" action for that work order.
5. WHEN a client initiates a balance payment, THE Client_Portal SHALL create a Stripe payment session for the outstanding amount and redirect the client to the Stripe-hosted payment page.
6. WHEN a Stripe payment is successfully completed by a client, THE App SHALL update the corresponding payment record status in the database and send a payment confirmation email to the client via Resend.

---

### Requirement 7: Client Work Order Creation

**User Story:** As a client, I want to create new work orders from my portal, so that I can request additional services without contacting Charles directly.

#### Acceptance Criteria

1. WHILE a client is authenticated, THE Client_Portal SHALL provide a form to create a new work order.
2. WHEN a client submits a valid new work order form, THE Client_Portal SHALL create a work order record in the database with a status of `pending` and associated with the client's user ID.
3. IF a client submits a new work order form with missing required fields, THEN THE Client_Portal SHALL display field-level validation errors without submitting the form.

---

### Requirement 8: Admin Authentication and Authorization

**User Story:** As Charles, I want my admin dashboard to be strictly protected, so that no client or unauthenticated user can access administrative functions.

#### Acceptance Criteria

1. THE Auth_System SHALL restrict all routes under `app/(admin)/` to users with the `admin` role.
2. WHEN an unauthenticated user attempts to access an admin route, THE Auth_System SHALL redirect the user to the login page.
3. WHEN an authenticated client attempts to access an admin route, THE Auth_System SHALL return a 403 Forbidden response.
4. THE Auth_System SHALL enforce admin role checks at the server level on every admin route request, not solely at the UI level.

---

### Requirement 9: Admin Client Management

**User Story:** As Charles, I want to add and manage client accounts, so that I can onboard new customers and maintain their access.

#### Acceptance Criteria

1. WHEN the Admin adds a new client, THE Admin_Dashboard SHALL create a user record in the database and generate a system-issued temporary username and password using the `scripts/generate_temp_auth.js` script.
2. WHEN a new client account is created, THE Admin_Dashboard SHALL assign a Permanent_Username to the client's user record that cannot be modified after creation.
3. WHEN a new client account is created, THE Admin_Dashboard SHALL set the Password_Reset_Flag to `true` on the client's database profile.
4. WHEN the Admin resets a client's password, THE Admin_Dashboard SHALL generate a new temporary password, update the database record, set the Password_Reset_Flag to `true`, and send the new credentials to the client via Resend.
5. WHEN a new client account is created, THE App SHALL send an account creation email to the client via Resend containing the temporary username and password.
6. WHEN the Admin closes a client account, THE Admin_Dashboard SHALL deactivate the client's user record so the client can no longer authenticate.
7. THE Admin_Dashboard SHALL display a searchable list of all clients with their account status.

---

### Requirement 10: Admin Work Order and Payment Management

**User Story:** As Charles, I want to view and manage all work orders and payments globally, so that I can keep accurate records and process transactions on behalf of clients.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display all work orders across all clients with filtering by status and client.
2. THE Admin_Dashboard SHALL display all payment records across all clients with filtering by status and client.
3. WHEN the Admin updates a work order's status, THE Admin_Dashboard SHALL persist the new status to the database and trigger an automated status-change email to the associated client via Resend.
4. WHEN the Admin records a manual payment for a client, THE Admin_Dashboard SHALL create a payment record in the database linked to the relevant work order.
5. WHEN the Admin records a manual payment, THE App SHALL send a payment confirmation email to the client via Resend.

---

### Requirement 11: Stripe Webhook Processing

**User Story:** As the system, I want to reliably process Stripe payment events, so that payment records are always accurate regardless of client-side interruptions.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL expose a POST endpoint at `/api/webhooks/stripe` to receive Stripe event notifications.
2. WHEN a Stripe webhook event is received, THE Webhook_Handler SHALL verify the Stripe signature before processing the event payload.
3. IF a Stripe webhook event fails signature verification, THEN THE Webhook_Handler SHALL return a 400 response and discard the event.
4. WHEN a `payment_intent.succeeded` event is received and verified, THE Webhook_Handler SHALL update the corresponding payment record status to `paid` in the database.
5. WHEN a `payment_intent.payment_failed` event is received and verified, THE Webhook_Handler SHALL update the corresponding payment record status to `failed` in the database.
6. THE Webhook_Handler SHALL return a 200 response to Stripe within 5 seconds of receiving a valid event to prevent Stripe from retrying the delivery.

---

### Requirement 12: Automated Email Notifications

**User Story:** As a stakeholder, I want automated emails sent at key lifecycle events, so that clients are always informed without manual effort from Charles.

#### Acceptance Criteria

1. WHEN a new client account is created, THE Email_Service SHALL send a welcome email containing the client's temporary username and password.
2. WHEN a work order status is updated by the Admin, THE Email_Service SHALL send a status-change notification email to the associated client.
3. WHEN a payment is successfully processed via Stripe, THE Email_Service SHALL send a payment confirmation email to the payer.
4. WHEN a manual payment is recorded by the Admin, THE Email_Service SHALL send a payment confirmation email to the associated client.
5. THE Email_Service SHALL send all emails via the Resend API using authenticated sender credentials.
6. IF the Resend API returns an error when sending an email, THEN THE Email_Service SHALL log the error with the associated event details without blocking the primary operation.

---

### Requirement 13: Data Security and Session Management

**User Story:** As a user of the system, I want my data and session to be handled securely, so that my personal and financial information is protected.

#### Acceptance Criteria

1. THE App SHALL store all authenticated sessions in secure, HTTP-only cookies that are not accessible via client-side JavaScript.
2. THE App SHALL never store plain-text passwords in the database; all passwords SHALL be hashed using Supabase Auth's built-in hashing.
3. THE Database SHALL enforce RLS policies on the `users`, `work_orders`, and `payments` tables so that each client can only access records associated with their own user ID.
4. THE Database SHALL enforce RLS policies that grant the Admin unrestricted read and write access to all records in the `users`, `work_orders`, and `payments` tables.
5. THE App SHALL validate all promo codes server-side; promo code logic SHALL NOT be executable from the client.
6. WHILE a client session is a Restricted_Session, THE Database SHALL deny read access to the `work_orders` and `payments` tables for that client via RLS policies.
7. WHILE a client session is a Restricted_Session, THE App SHALL not expose payment history, work order data, or any other sensitive dashboard data in API responses.

---

### Requirement 14: Forced Password Reset Flow

**User Story:** As a client logging in for the first time, I want to be required to set a permanent password, so that my account is secured beyond the temporary credentials issued by Charles.

#### Acceptance Criteria

1. WHEN a client is redirected to `/update-password`, THE Password_Reset_Screen SHALL display a form requiring a new password and a password confirmation field.
2. THE Password_Reset_Screen SHALL display the client's Permanent_Username as read-only; THE Password_Reset_Screen SHALL NOT provide any input field or control that allows the client to change their username.
3. WHEN a client submits the password reset form with a new password and a matching confirmation, THE Password_Reset_Screen SHALL update the client's password in the database.
4. WHEN the password update is successfully persisted, THE Password_Reset_Screen SHALL set the Password_Reset_Flag to `false` on the client's database profile and redirect the client to the Client Dashboard.
5. IF a client submits the password reset form with a new password and a non-matching confirmation, THEN THE Password_Reset_Screen SHALL display a validation error and retain the form without submitting.
6. IF a client submits the password reset form with an empty password field, THEN THE Password_Reset_Screen SHALL display a validation error and retain the form without submitting.
7. WHILE a client session is a Restricted_Session, THE App SHALL reject any direct navigation attempt to client dashboard routes, work order routes, or payment routes and redirect the client to `/update-password`.
8. WHILE a client is authenticated and the Password_Reset_Flag is `false`, THE App SHALL not render or link to the `/update-password` route from the Client Dashboard.
