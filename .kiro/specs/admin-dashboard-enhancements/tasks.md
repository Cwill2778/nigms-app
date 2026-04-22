# Implementation Plan: Admin Dashboard Enhancements

## Overview

Incremental implementation of six admin dashboard enhancement areas: sidebar navigation updates, interactive summary cards with side panels, real-time instant messaging, client detail side panel, comprehensive work order detail side panel, and an improved payments panel with client lookup and manual cash payment entry.

All new components are TypeScript/React client components. API routes are Next.js App Router route handlers. Database changes are applied via Supabase SQL migrations.

---

## Tasks

- [x] 1. Database schema migrations
  - [x] 1.1 Create new tables: `messages`, `estimates`, `bills`, `change_orders`, `time_entries`, `client_addresses`, `work_order_pictures`
    - Write a SQL migration file at `nigms-app/supabase/migrations/` (or apply via Supabase dashboard) containing all `CREATE TABLE` statements from the design
    - Include all indexes defined in the design (`messages_sender_idx`, `messages_recipient_idx`, `messages_created_idx`)
    - _Requirements: 3.1, 3.3, 4.3, 5.4, 5.9, 5.16_

  - [x] 1.2 Add new columns to existing tables: `work_orders`, `users`, `payments`
    - Write `ALTER TABLE` statements for all new columns on `work_orders` (`wo_number`, `urgency`, `category`, `property_address`, `inspection_notes`, `accepted_at`, `completed_at`, `total_billable_minutes`)
    - Write `ALTER TABLE` statements for `users` (`first_name`, `last_name`, `phone`, `email`)
    - Write `ALTER TABLE` statements for `payments` (`receipt_number`, `notes`, `payment_date`)
    - _Requirements: 4.2, 5.2, 5.11, 6.6, 6.7_

- [x] 2. TypeScript type updates
  - [x] 2.1 Update `nigms-app/lib/types.ts` with all new and extended types from the design
    - Add new type aliases: `WorkOrderStatus` (add `'accepted'`), `UrgencyLevel`, `MaterialsPaidBy`, `ChangeOrderStatus`, `SenderRole`
    - Extend `WorkOrder`, `UserProfile`, and `Payment` interfaces with new fields
    - Add new interfaces: `Message`, `Estimate`, `EstimateLineItem`, `Bill`, `ChangeOrder`, `TimeEntry`, `ClientAddress`, `WorkOrderPicture`
    - _Requirements: 2.1, 3.3, 4.2, 5.2, 5.9, 5.11, 5.16, 6.5_

- [x] 3. Sidebar navigation — Settings and Logout links
  - [x] 3.1 Extend `SidebarNavItem` interface in `nigms-app/components/IndustrialSidebar.tsx` with optional `onClick?: () => void`
    - When `onClick` is present, render a `<button>` element instead of `<Link>`
    - Apply the same active-state and hover styling to the button as to links
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 3.2 Create `nigms-app/components/AdminSidebarClient.tsx` as a `"use client"` component
    - Accept `staticItems: SidebarNavItem[]` prop
    - Append a Settings item (`href: '/settings'`) and a Logout item with an `onClick` that calls `createBrowserClient().auth.signOut()` then `router.push('/login')`
    - Render `<IndustrialSidebar>` with the combined items
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.3 Update `nigms-app/app/(admin)/layout.tsx` to use `AdminSidebarClient` instead of `IndustrialSidebar`
    - Pass the existing `adminNavItems` array as `staticItems`
    - Import Settings and LogOut icons from `lucide-react`
    - _Requirements: 1.1, 1.2_

  - [ ]* 3.4 Write property test for sidebar active-state styling consistency
    - **Property 1: Consistent active-state styling for all sidebar items**
    - **Validates: Requirements 1.5**

- [x] 4. Generic SidePanel component
  - [x] 4.1 Create `nigms-app/components/SidePanel.tsx` as a `"use client"` component
    - Implement `SidePanelProps` interface: `open`, `onClose`, `title`, `children`, `width?: 'md' | 'lg' | 'xl'`
    - Render as `fixed inset-y-0 right-0` overlay with semi-transparent backdrop
    - Add `useEffect` to listen for `Escape` keydown and call `onClose`
    - Close on backdrop click
    - Do not unmount underlying page content when closed (use CSS visibility/transform)
    - _Requirements: 2.3, 2.4_

  - [ ]* 4.2 Write property test for Escape key closing any open side panel
    - **Property 3: Escape key closes any open side panel**
    - **Validates: Requirements 2.4**

- [x] 5. Dashboard summary cards with side panels
  - [x] 5.1 Create `nigms-app/components/DashboardSummaryCards.tsx` as a `"use client"` component
    - Accept props: `totalClients`, `openWorkOrders`, `totalRevenue`, `unreadMessages`
    - Render four clickable cards: Total Clients, Open Work Orders, Total Revenue, Messages
    - Manage `activePanel` state (`'clients' | 'workOrders' | 'revenue' | 'messages' | null`)
    - On card click, set `activePanel` and open `SidePanel` with appropriate content placeholder
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 5.2 Update `nigms-app/app/(admin)/admin-dashboard/page.tsx` to use `DashboardSummaryCards`
    - Fetch unread message count from `messages` table (`sender_role = 'client'` and `read_at IS NULL`)
    - Pass all four metrics to `DashboardSummaryCards`
    - Convert page to a server component that passes data down to the client component
    - _Requirements: 2.1, 2.5, 3.6_

  - [ ]* 5.3 Write property test for summary card click opening the correct panel
    - **Property 2: Side panel opens for any summary card click**
    - **Validates: Requirements 2.2**

- [x] 6. Instant messaging system
  - [x] 6.1 Create API routes for messaging
    - `GET /api/admin/messages` — fetch all conversations grouped by client (distinct client IDs from `messages` where admin is sender or recipient)
    - `POST /api/admin/messages` — insert a message with `sender_role = 'admin'`, `sender_id` from session, `recipient_id` from request body
    - `PATCH /api/admin/messages/read` — set `read_at = now()` for all messages in a conversation where `read_at IS NULL`
    - All routes must verify the caller has `role = 'admin'`
    - _Requirements: 3.1, 3.3, 3.7_

  - [x] 6.2 Create `nigms-app/components/MessagingPanel.tsx` as a `"use client"` component
    - Fetch client list from `GET /api/admin/messages` on mount
    - Display list of clients with active conversations; show unread badge per client
    - On client selection, fetch and display full conversation ordered by `created_at` ascending
    - Call `PATCH /api/admin/messages/read` when a conversation is opened
    - Render each message with sender name, body, and formatted timestamp
    - Show "Messaging unavailable" error state if API fails; do not crash
    - _Requirements: 3.1, 3.2, 3.5, 3.7, 3.8_

  - [x] 6.3 Add Supabase Realtime subscription to `MessagingPanel`
    - In `useEffect`, subscribe to `postgres_changes` on the `messages` table filtered to the admin's conversations
    - On new message event, append to the current conversation if it matches the selected client
    - Show "Reconnecting…" indicator on channel error
    - Tear down channel on component unmount
    - _Requirements: 3.4_

  - [x] 6.4 Add message compose input to `MessagingPanel`
    - Text input + send button at the bottom of the conversation view
    - On submit, call `POST /api/admin/messages` and optimistically append the message to the UI
    - Clear input after successful send
    - _Requirements: 3.3_

  - [x] 6.5 Wire `MessagingPanel` into `DashboardSummaryCards`
    - When the "Messages" card is clicked, open `SidePanel` with `<MessagingPanel>` as content
    - Pass the admin's user ID to `MessagingPanel`
    - _Requirements: 2.6, 3.1_

  - [ ]* 6.6 Write property test for messaging client list reflecting all clients with messages
    - **Property 4: Messaging client list reflects all clients with messages**
    - **Validates: Requirements 3.1**

  - [ ]* 6.7 Write property test for conversation messages in chronological order
    - **Property 5: Conversation messages are in chronological order**
    - **Validates: Requirements 3.2, 4.6**

  - [ ]* 6.8 Write property test for sent messages having correct metadata
    - **Property 6: Sent messages have correct sender metadata**
    - **Validates: Requirements 3.3**

  - [ ]* 6.9 Write property test for message rendering including all required fields
    - **Property 7: Message rendering includes sender, body, and timestamp**
    - **Validates: Requirements 3.5**

  - [ ]* 6.10 Write property test for unread count equaling unread client messages
    - **Property 8: Unread count equals count of unread client messages**
    - **Validates: Requirements 3.6**

  - [ ]* 6.11 Write property test for opening a conversation marking all messages as read
    - **Property 9: Opening a conversation marks all its messages as read**
    - **Validates: Requirements 3.7**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Client detail side panel
  - [x] 8.1 Create `GET /api/admin/clients/[id]/detail` API route
    - Fetch client profile, all associated `client_addresses`, all `work_orders` (ordered by `created_at` DESC), all `payments` (ordered by `created_at` DESC), all `messages` (ordered by `created_at` ASC), and all `work_order_pictures`
    - Return a single JSON object with all sections
    - Verify caller has `role = 'admin'`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 8.2 Create `nigms-app/components/ClientDetailPanel.tsx` as a `"use client"` component
    - Accept `clientId: string` and `onClose: () => void` props
    - Fetch from `GET /api/admin/clients/[id]/detail` on mount
    - Display: first name, last name, phone, email; all addresses; all work orders with empty state; all payments with empty state; all messages; all pictures
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 8.3 Update `nigms-app/app/(admin)/clients/ClientTable.tsx` to support `onViewClient` prop
    - Add `onViewClient?: (clientId: string) => void` prop
    - Make each row clickable; call `onViewClient(client.id)` on click
    - _Requirements: 4.1_

  - [x] 8.4 Update `nigms-app/app/(admin)/clients/page.tsx` to open `ClientDetailPanel` in a `SidePanel`
    - Convert page to a client component (or extract a client wrapper)
    - Manage `selectedClientId` state
    - Render `<SidePanel>` with `<ClientDetailPanel>` when a client is selected
    - _Requirements: 4.1_

  - [ ]* 8.5 Write property test for client panel rendering all contact fields
    - **Property 10: Client panel renders all contact fields**
    - **Validates: Requirements 4.2**

  - [ ]* 8.6 Write property test for client panel showing all addresses and work orders in correct order
    - **Property 11: Client panel shows all addresses and work orders in correct order**
    - **Validates: Requirements 4.3, 4.4**

- [x] 9. Work order detail side panel — core structure and lifecycle actions
  - [x] 9.1 Create `GET /api/admin/work-orders/[id]/detail` API route
    - Fetch work order, associated estimate, bill, change orders, and time entries
    - Return a single JSON object
    - Verify caller has `role = 'admin'`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 Create `nigms-app/components/WorkOrderDetailPanel.tsx` as a `"use client"` component — core structure
    - Accept `workOrderId: string` and `onClose: () => void` props
    - Fetch from `GET /api/admin/work-orders/[id]/detail` on mount
    - Display: `wo_number`, `property_address`, `urgency`, `category`, client name, `description`, `inspection_notes`, associated pictures
    - Show error message with "Retry" button if fetch fails
    - _Requirements: 5.1, 5.2, 5.3, 5.18_

  - [x] 9.3 Add Accept / Reject / Modify action buttons to `WorkOrderDetailPanel`
    - Show "Accept", "Reject", "Modify" buttons when work order status is `pending` or `in_progress`
    - "Reject" calls `POST /api/admin/work-orders/[id]/reject`, updates status to `cancelled` in UI only after API confirms
    - "Modify" reveals an inline editable form pre-populated with current work order fields
    - "Accept" calls `POST /api/admin/work-orders/[id]/accept`, reveals billable hours and tasks sections on success
    - Show inline error toast on API failure; do not change UI status until confirmed
    - _Requirements: 5.5, 5.6, 5.7, 5.8_

  - [x] 9.4 Update `nigms-app/app/(admin)/work-orders/WorkOrderTable.tsx` to use `onViewWorkOrder` prop
    - Add `onViewWorkOrder?: (workOrderId: string) => void` prop
    - Replace `<Link href="/admin/work-orders/${wo.id}">` with `<button onClick={() => onViewWorkOrder?.(wo.id)}>` styled identically
    - _Requirements: 5.1_

  - [x] 9.5 Update `nigms-app/app/(admin)/work-orders/page.tsx` to open `WorkOrderDetailPanel` in a `SidePanel`
    - Convert page to a client component (or extract a client wrapper)
    - Manage `selectedWorkOrderId` state
    - Render `<SidePanel>` with `<WorkOrderDetailPanel>` when a work order is selected
    - _Requirements: 5.1_

  - [ ]* 9.6 Write property test for work order View button opening panel without navigation
    - **Property 12: Work order View button opens panel without navigation**
    - **Validates: Requirements 5.1**

  - [ ]* 9.7 Write property test for work order panel rendering all required fields
    - **Property 13: Work order panel renders all required fields**
    - **Validates: Requirements 5.2**

  - [ ]* 9.8 Write property test for Modify form being pre-populated with current values
    - **Property 14: Modify form is pre-populated with current values**
    - **Validates: Requirements 5.7**

- [x] 10. Work order API routes — accept, reject, modify, time entries
  - [x] 10.1 Create `POST /api/admin/work-orders/[id]/accept` route
    - Generate `wo_number` as `WO-{YYYY}-{NNNN}` using `SELECT COUNT(*) + 1` within a transaction
    - Set `status = 'accepted'`, `accepted_at = now()`
    - Return updated work order
    - _Requirements: 5.8_

  - [x] 10.2 Create `POST /api/admin/work-orders/[id]/reject` route
    - Set `status = 'cancelled'`
    - Return updated work order
    - _Requirements: 5.6_

  - [x] 10.3 Create `PATCH /api/admin/work-orders/[id]` route
    - Accept partial work order fields in request body
    - Update only provided fields
    - Return updated work order
    - _Requirements: 5.7_

  - [x] 10.4 Create `POST /api/admin/work-orders/[id]/time-entries` route
    - Insert a new `time_entries` row with `started_at = now()` and `stopped_at = null`
    - Return the new time entry
    - _Requirements: 5.10_

  - [x] 10.5 Create `PATCH /api/admin/work-orders/[id]/time-entries/[entryId]` route
    - Set `stopped_at = now()` on the specified entry
    - Update `work_orders.total_billable_minutes` by adding the entry's `duration_minutes`
    - Return 400 if entry already has a `stopped_at`
    - _Requirements: 5.11_

  - [ ]* 10.6 Write property test for time tracker elapsed duration calculation
    - **Property 15: Time tracker duration calculation is correct**
    - **Validates: Requirements 5.11**

- [x] 11. Time tracker component
  - [x] 11.1 Create `nigms-app/components/TimeTracker.tsx` as a `"use client"` component
    - Accept `workOrderId: string`, `totalBillableMinutes: number`, `activeEntry: TimeEntry | null` props
    - Show "Start" button when no active entry; call `POST /api/admin/work-orders/[id]/time-entries`
    - Show "Stop" button when an active entry exists; call `PATCH /api/admin/work-orders/[id]/time-entries/[entryId]`
    - Display a live elapsed timer (seconds counter) while running
    - Display total accumulated hours from `totalBillableMinutes`
    - Disable "Stop" button when no active entry exists
    - _Requirements: 5.9, 5.10, 5.11_

  - [x] 11.2 Integrate `TimeTracker` into `WorkOrderDetailPanel`
    - Show `TimeTracker` only when work order status is `accepted`
    - Pass `workOrderId`, `totalBillableMinutes`, and `activeEntry` (open time entry with no `stopped_at`)
    - _Requirements: 5.8, 5.9_

- [x] 12. Estimate, Bill, and IC Agreement documents
  - [x] 12.1 Create `POST /api/admin/work-orders/[id]/estimates` route
    - Accept `line_items` array and `notes` in request body
    - Generate `estimate_number` as `EST-{CLIENT_SEQ}-{NNNN}` using `SELECT COUNT(*) + 1` per client within a transaction
    - Upsert the estimate record (one estimate per work order)
    - Return the estimate with generated number
    - _Requirements: 5.4_

  - [x] 12.2 Create `nigms-app/components/EstimateDocument.tsx` as a `"use client"` component
    - Accept `estimate: Estimate`, `workOrder: WorkOrder`, `client: UserProfile` props
    - Render a printable estimate with estimate number, line items table, total, and notes
    - Wrap in `<div className="print-section">`
    - Include `<PrintButton>` component
    - _Requirements: 5.4_

  - [x] 12.3 Create `POST /api/admin/work-orders/[id]/bills` route
    - Accept `materials_cost`, `materials_paid_by`, `client_materials_cost`, `labor_cost`, `total_billed` in request body
    - Generate `receipt_number` as `RCT-{YYYY}-{NNNN}` using `SELECT COUNT(*) + 1` within a transaction
    - Insert bill record; return bill with generated receipt number
    - _Requirements: 5.14, 5.15_

  - [x] 12.4 Create `nigms-app/components/BillDocument.tsx` as a `"use client"` component
    - Accept `bill: Bill`, `workOrder: WorkOrder`, `client: UserProfile` props
    - Render printable bill with receipt number, materials breakdown, labor cost, total billed, amount paid, and balance remaining (or "Paid in Full")
    - Wrap in `<div className="print-section">`
    - Include `<PrintButton>`
    - _Requirements: 5.15_

  - [x] 12.5 Create `nigms-app/components/ICAgreement.tsx` as a `"use client"` component
    - Render the full IC Agreement document with all eight sections from the design (header, parties, scope, compensation, IC status, lien rights under O.C.G.A. § 44-14-361, dispute resolution, signature lines)
    - Accept `workOrder: WorkOrder`, `client: UserProfile`, `estimate: Estimate | null` props
    - Wrap in `<div className="print-section">`
    - Include `<PrintButton>`
    - _Requirements: 5.13_

  - [x] 12.6 Create `nigms-app/components/PrintButton.tsx` as a `"use client"` component
    - Render a button that calls `window.print()` on click
    - Apply `className="no-print"` so it is hidden in print output
    - _Requirements: 5.17_

  - [x] 12.7 Add print CSS to `nigms-app/app/globals.css`
    - Add `@media print` block: hide `body > *`, show `.print-section`, hide `.no-print`
    - _Requirements: 5.17_

  - [x] 12.8 Integrate `EstimateDocument`, `BillDocument`, and `ICAgreement` into `WorkOrderDetailPanel`
    - Show estimate section with line item editor and `EstimateDocument` preview
    - Show bill generation form (materials info prompt) and `BillDocument` after bill is created
    - Show `ICAgreement` section always (for accepted work orders)
    - _Requirements: 5.4, 5.13, 5.14, 5.15_

  - [ ]* 12.9 Write property test for auto-generated numbers being unique and correctly formatted
    - **Property 16: Auto-generated numbers are unique and correctly formatted**
    - **Validates: Requirements 5.4, 5.15, 6.7**

- [x] 13. Change orders
  - [x] 13.1 Create `POST /api/admin/work-orders/[id]/change-orders` route
    - Accept `description` and `additional_cost` in request body
    - Insert change order with `work_order_id` set to the route param ID and `status = 'pending'`
    - Return the new change order
    - _Requirements: 5.16_

  - [x] 13.2 Create `nigms-app/components/ChangeOrderForm.tsx` as a `"use client"` component
    - Accept `workOrderId: string`, `changeOrders: ChangeOrder[]` props
    - Display existing change orders list
    - Provide a form to add a new change order (description + additional cost)
    - On submit, call `POST /api/admin/work-orders/[id]/change-orders` and append to list
    - Wrap in `<div className="print-section">` for printability
    - Include `<PrintButton>`
    - _Requirements: 5.16, 5.17_

  - [x] 13.3 Integrate `ChangeOrderForm` into `WorkOrderDetailPanel`
    - Show `ChangeOrderForm` only when work order status is `accepted`
    - Pass `workOrderId` and initial `changeOrders` from the detail fetch
    - _Requirements: 5.16_

  - [ ]* 13.4 Write property test for change orders being linked to the correct work order
    - **Property 17: Change orders are linked to the correct work order**
    - **Validates: Requirements 5.16**

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Payments panel enhancements
  - [x] 15.1 Create `GET /api/admin/clients/search` API route
    - Accept `q` query parameter
    - Search `users` table by `first_name`, `last_name`, `phone`, `id` (ILIKE or exact match)
    - Join `client_addresses` to also match on `street`
    - Return matching clients with `id`, `first_name`, `last_name`, `phone`, `email`
    - Limit to 10 results
    - _Requirements: 6.1, 6.2_

  - [x] 15.2 Create `nigms-app/components/ClientSearchInput.tsx` as a `"use client"` component
    - Render a text input that debounces keystrokes by 300ms
    - On debounced change, call `GET /api/admin/clients/search?q=...`
    - Display a dropdown of matching clients
    - On client selection, call `onSelect(client)` prop and clear the dropdown
    - _Requirements: 6.1, 6.2_

  - [x] 15.3 Update `nigms-app/app/(admin)/payments/ManualPaymentForm.tsx` to use `ClientSearchInput`
    - Replace the existing client dropdown with `<ClientSearchInput>`
    - On client selection, fetch and display the client's outstanding balance and payment history
    - Add `payment_date` date input and `notes` textarea to the form
    - Add client-side validation: show error if amount ≤ 0; show confirmation dialog if amount exceeds outstanding balance
    - _Requirements: 6.3, 6.4, 6.8, 6.9_

  - [x] 15.4 Update `POST /api/admin/payments/manual` route to generate receipt number and support new fields
    - Accept `payment_date` and `notes` in addition to existing fields
    - Generate `receipt_number` as `RCT-{YYYY}-{NNNN}` (reuse same generation logic as bills)
    - Persist payment with `method = 'manual'`, `status = 'paid'`, `receipt_number`, `payment_date`, `notes`
    - Return the saved payment including `receipt_number`
    - Validate: return 422 if `amount <= 0`
    - _Requirements: 6.5, 6.6, 6.7, 6.9_

  - [x] 15.5 Add printable receipt to `ManualPaymentForm` after successful payment submission
    - After a successful save, render a receipt section showing: payment amount, payment date, client name, work order reference, receipt number, and balance status ("Paid in Full" or remaining balance)
    - Wrap in `<div className="print-section">`
    - Include `<PrintButton>`
    - _Requirements: 6.6, 6.7_

  - [ ]* 15.6 Write property test for client search results matching the search term
    - **Property 18: Client search results match the search term**
    - **Validates: Requirements 6.2**

  - [ ]* 15.7 Write property test for manual payment persisted with correct method and status
    - **Property 19: Manual payment persisted with correct method and status**
    - **Validates: Requirements 6.5**

  - [ ]* 15.8 Write property test for generated receipt containing all required fields
    - **Property 20: Generated receipt contains all required fields**
    - **Validates: Requirements 6.6**

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 7, 14, and 16 ensure incremental validation
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) and validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Auto-number generation (WO, EST, RCT) uses `SELECT COUNT(*) + 1` inside a serializable transaction; unique constraints provide a final safety net
- Print strategy uses `window.print()` with `.print-section` / `.no-print` CSS classes defined in `globals.css`
