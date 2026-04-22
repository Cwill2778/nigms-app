# Requirements Document

## Introduction

This feature enhances the NIGMS admin dashboard — a Next.js / Supabase construction and property management application. The enhancements cover six areas: sidebar navigation updates, interactive dashboard summary cards with side panels, a real-time instant messaging system between admin and clients, a rich client detail side panel, a comprehensive work order detail side panel (replacing the broken "View" link), and an improved payments panel with client lookup and manual cash payment entry.

---

## Glossary

- **Admin**: An authenticated user with `role = 'admin'` in the `users` table.
- **Client**: An authenticated user with `role = 'client'` in the `users` table.
- **Dashboard**: The admin-facing page at `/admin-dashboard`.
- **Sidebar**: The `IndustrialSidebar` component rendered in the admin layout.
- **Side_Panel**: A slide-in drawer/overlay component that appears on the right side of the screen without navigating away from the current page.
- **Work_Order**: A record in the `work_orders` table representing a construction or maintenance job.
- **Work_Order_Number**: An auto-generated, human-readable identifier for a Work_Order (e.g., `WO-2024-0001`).
- **Estimate**: A printable document tied to a Work_Order that lists the projected cost of work.
- **Estimate_Number**: An auto-generated identifier for an Estimate tied to a specific Client.
- **Bill**: A finalized cost document generated after work is accepted and completed.
- **Receipt_Number**: An auto-generated identifier for a payment receipt.
- **Change_Order**: A document that modifies the original scope of work on an accepted Work_Order.
- **IC_Agreement**: The Initial Independent Contractor Agreement for residential remodeling work in Rome, Georgia, including all property lien rights owned by the contractor.
- **Message**: A text-based communication record between Admin and a Client stored in the `messages` table.
- **Conversation**: The ordered set of Messages between Admin and a single Client.
- **Time_Tracker**: A start/stop timer used to record billable hours on an accepted Work_Order.
- **Payment**: A record in the `payments` table representing money received from a Client.
- **Summary_Card**: A dashboard widget displaying a single aggregate metric that is clickable.
- **Category**: The type of construction or maintenance work (e.g., plumbing, framing, roofing).
- **Urgency_Level**: A classification of how quickly a Work_Order must be addressed (e.g., low, medium, high, emergency).

---

## Requirements

### Requirement 1: Sidebar Navigation — Settings and Logout Links

**User Story:** As an Admin, I want Settings and Logout links in the sidebar, so that I can access application settings and sign out without leaving the admin area.

#### Acceptance Criteria

1. THE Sidebar SHALL display a "Settings" navigation link positioned immediately below the "Payments" link.
2. THE Sidebar SHALL display a "Logout" navigation link positioned immediately below the "Settings" link.
3. WHEN the Admin clicks the "Logout" link, THE Sidebar SHALL invoke the Supabase `auth.signOut()` method and redirect the Admin to `/login`.
4. WHEN the Admin clicks the "Settings" link, THE Sidebar SHALL navigate to `/settings`.
5. THE Sidebar SHALL apply the same active-state styling to "Settings" and "Logout" as it applies to all other navigation items.

---

### Requirement 2: Dashboard Summary Cards as Clickable Links with Side Panels

**User Story:** As an Admin, I want each dashboard summary card to open a detail side panel, so that I can drill into the underlying data without leaving the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL display Summary_Cards for: Total Clients, Open Work Orders, Total Revenue, and Messages.
2. WHEN the Admin clicks a Summary_Card, THE Dashboard SHALL open a Side_Panel displaying the records that make up that card's metric.
3. WHILE a Side_Panel is open, THE Dashboard SHALL render the main dashboard content behind the panel without navigating away.
4. WHEN the Admin clicks outside the Side_Panel or presses the Escape key, THE Dashboard SHALL close the Side_Panel.
5. THE Dashboard SHALL display a "Messages" Summary_Card showing the count of unread Messages.
6. WHEN the Admin clicks the "Messages" Summary_Card, THE Dashboard SHALL open a Side_Panel containing the Instant Messaging interface described in Requirement 3.

---

### Requirement 3: Instant Messaging System

**User Story:** As an Admin, I want to send and receive instant messages with Clients, so that I can communicate in real time without using external tools.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of all Clients who have an active Conversation or have sent at least one Message.
2. WHEN the Admin selects a Client from the messaging list, THE Dashboard SHALL display the full Conversation history with that Client in chronological order.
3. WHEN the Admin submits a new message, THE Dashboard SHALL persist the Message to the `messages` table with `sender_role = 'admin'`, `sender_id` set to the Admin's user ID, and `recipient_id` set to the selected Client's user ID.
4. WHEN a Client sends a Message, THE Dashboard SHALL display the new Message in the Admin's Conversation view within 5 seconds without requiring a page reload, using Supabase Realtime subscriptions.
5. THE Dashboard SHALL display each Message with the sender's name, message text, and timestamp.
6. WHEN a Message from a Client has not been read by the Admin, THE Dashboard SHALL mark it as unread and include it in the unread count shown on the "Messages" Summary_Card.
7. WHEN the Admin opens a Conversation, THE Dashboard SHALL mark all unread Messages in that Conversation as read.
8. IF the `messages` table does not exist, THEN THE Dashboard SHALL display an error state indicating messaging is unavailable rather than crashing.

---

### Requirement 4: Client Detail Side Panel

**User Story:** As an Admin, I want to open a detailed side panel for any Client, so that I can view all relevant information about that Client in one place.

#### Acceptance Criteria

1. WHEN the Admin clicks on a Client's name or row in the Clients list, THE Dashboard SHALL open a Side_Panel for that Client.
2. THE Side_Panel SHALL display the Client's first name, last name, phone numbers, and email addresses.
3. THE Side_Panel SHALL display all property addresses associated with the Client, supporting multiple addresses per Client.
4. THE Side_Panel SHALL display all Work_Orders associated with the Client, ordered by creation date descending.
5. THE Side_Panel SHALL display all Payments made by the Client, ordered by date descending.
6. THE Side_Panel SHALL display all Messages exchanged between the Admin and the Client, ordered chronologically.
7. THE Side_Panel SHALL display all pictures shared in the context of the Client's Work_Orders.
8. IF a Client has no Work_Orders, THEN THE Side_Panel SHALL display a "No work orders yet" message in the work orders section.
9. IF a Client has no Payments, THEN THE Side_Panel SHALL display a "No payments yet" message in the payments section.

---

### Requirement 5: Work Order Detail Side Panel

**User Story:** As an Admin, I want clicking "View" on a work order to open a comprehensive side panel, so that I can manage the full lifecycle of a Work_Order from a single interface.

#### Acceptance Criteria

1. WHEN the Admin clicks "View" on a Work_Order in the Work Orders table, THE Dashboard SHALL open a Side_Panel displaying the full Work_Order detail instead of navigating to a separate page.
2. THE Side_Panel SHALL display the Work_Order_Number, property location, Urgency_Level, Category, Client responsible for the bill, and scope of work.
3. THE Side_Panel SHALL display the initial jobsite inspection notes and any associated pictures.
4. THE Side_Panel SHALL display a printable Estimate with an auto-generated Estimate_Number tied to the Client.
5. THE Side_Panel SHALL display action buttons: "Accept", "Reject", and "Modify".
6. WHEN the Admin clicks "Reject", THE Side_Panel SHALL update the Work_Order status to `cancelled` and close the work order lifecycle.
7. WHEN the Admin clicks "Modify", THE Side_Panel SHALL display an editable form pre-populated with the current Work_Order fields and save changes on submission.
8. WHEN the Admin clicks "Accept", THE Side_Panel SHALL reveal the billable hours section and the tasks section.
9. WHILE a Work_Order is in `accepted` status, THE Side_Panel SHALL display the Time_Tracker with start and stop controls, total accumulated hours, and a list of completed tasks.
10. WHEN the Admin starts the Time_Tracker, THE Side_Panel SHALL record the start timestamp and begin accumulating time.
11. WHEN the Admin stops the Time_Tracker, THE Side_Panel SHALL record the stop timestamp and add the elapsed duration to the Work_Order's total billable hours.
12. WHEN the Admin marks a Work_Order as complete, THE Side_Panel SHALL send a status-change notification to the Client.
13. THE Side_Panel SHALL display the IC_Agreement document with a printable signature line for the Client, including all property lien rights owned by the contractor, specific to residential remodeling in Rome, Georgia.
14. WHEN generating a Bill, THE Side_Panel SHALL prompt the Admin to specify whether the company, the Client, or both purchased materials, the total materials cost, and the amount to bill the Client.
15. THE Side_Panel SHALL auto-generate a Bill with a Receipt_Number and display whether a balance remains or has been zeroed out.
16. THE Side_Panel SHALL allow the Admin to add Change_Orders to an accepted Work_Order when the scope of work changes or additional tasks are added.
17. THE Side_Panel SHALL provide print controls for the Estimate, Bill, IC_Agreement, Change_Orders, and all other legal disclosures.
18. IF the Work_Order record cannot be loaded, THEN THE Side_Panel SHALL display an error message and a retry option.

---

### Requirement 6: Payments Panel — Client Lookup and Manual Cash Payments

**User Story:** As an Admin, I want to look up a Client and manually record a cash payment, so that I can keep payment records accurate for Clients who pay in person.

#### Acceptance Criteria

1. THE Payments_Panel SHALL provide a search field that accepts Client ID, first name, last name, property address, or phone number as search input.
2. WHEN the Admin enters a search term, THE Payments_Panel SHALL display matching Clients within 300ms of the last keystroke using debounced search.
3. WHEN the Admin selects a Client from the search results, THE Payments_Panel SHALL display that Client's current outstanding balance and payment history.
4. THE Payments_Panel SHALL allow the Admin to enter a payment amount, payment date, and optional notes for a manual (cash) payment.
5. WHEN the Admin submits a manual payment, THE Payments_Panel SHALL persist a Payment record with `method = 'manual'` and `status = 'paid'` to the `payments` table.
6. WHEN a manual payment is saved, THE Payments_Panel SHALL auto-generate a printable receipt showing the payment amount, date, Client name, Work_Order reference, and whether a balance remains or the account is paid in full.
7. THE receipt SHALL include a Receipt_Number that is unique and auto-generated.
8. IF the submitted payment amount exceeds the outstanding balance, THEN THE Payments_Panel SHALL display a warning asking the Admin to confirm before saving.
9. IF the payment amount is zero or negative, THEN THE Payments_Panel SHALL display a validation error and prevent submission.
