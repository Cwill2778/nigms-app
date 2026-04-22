# Design Document: Admin Dashboard Enhancements

## Overview

This document describes the technical design for six enhancement areas to the NIGMS admin dashboard: sidebar navigation updates, interactive dashboard summary cards with side panels, a real-time instant messaging system, a rich client detail side panel, a comprehensive work order detail side panel, and an improved payments panel with client lookup and manual cash payment entry.

The application is a Next.js 14 App Router project using Supabase for auth, database, and realtime. All admin pages live under the `(admin)` route group. The design prioritizes keeping the existing page structure intact while layering side panel state on top of it.

---

## Architecture

### Side Panel Pattern

All detail views (client, work order, messaging) use a **slide-in drawer** pattern rather than page navigation. This is implemented as a single `SidePanel` wrapper component that:

- Renders as a fixed overlay on the right side of the viewport (`fixed inset-y-0 right-0 w-[600px]`)
- Uses a semi-transparent backdrop behind it
- Is controlled by React state in the parent page component
- Closes on Escape keydown (via `useEffect`) and on backdrop click
- Does not unmount the underlying page content

State management is local React state (`useState`) in each page component — no global state manager is needed. The panel receives a `content` prop (a React node) and an `onClose` callback.

```
Page Component (client component)
  ├── SidePanel (open/closed state here)
  │     └── [panel content: ClientDetailPanel | WorkOrderDetailPanel | MessagingPanel]
  └── [page content: table, cards, etc.]
```

### Sidebar Logout Action

`IndustrialSidebar` is already a `"use client"` component. The logout item cannot be a plain `<Link>` because it needs to call `supabase.auth.signOut()` before redirecting. The design extends `SidebarNavItem` with an optional `onClick` handler:

```ts
export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void; // if present, renders a <button> instead of <Link>
}
```

The admin layout passes a logout item with an `onClick` that calls `createBrowserClient().auth.signOut()` then `router.push('/login')`. Since the layout is a server component, the logout item is constructed in a small `AdminSidebarClient` wrapper component that is `"use client"` and handles the signOut action.

### Realtime Messaging

Supabase Realtime is used for the messaging feature. The `MessagingPanel` component subscribes to the `messages` table filtered by the admin's user ID as either sender or recipient. The subscription is set up in a `useEffect` and torn down on unmount.

```
MessagingPanel (client component)
  useEffect → supabase.channel('messages').on('postgres_changes', ...).subscribe()
  onUnmount → supabase.removeChannel(channel)
```

### Auto-Generated Numbers

All auto-generated identifiers are produced server-side in API route handlers to avoid race conditions:

- **Work Order Number**: `WO-{YYYY}-{NNNN}` — year + zero-padded sequential count of work orders in that year
- **Estimate Number**: `EST-{CLIENT_SEQ}-{NNNN}` — per-client sequential estimate count
- **Receipt Number**: `RCT-{YYYY}-{NNNN}` — year + zero-padded sequential count of all receipts

Generation uses a `SELECT COUNT(*) + 1` query within a transaction to avoid duplicates under concurrent load.

### Print Strategy

Printable documents (Estimate, Bill, IC Agreement, Change Orders, Receipt) use `window.print()` with print-specific CSS. Each printable section is wrapped in a `<div className="print-section">`. Global CSS includes:

```css
@media print {
  body > * { display: none; }
  .print-section { display: block !important; }
  .no-print { display: none !important; }
}
```

A `PrintButton` component calls `window.print()` and has `className="no-print"` so it disappears in the printed output.

---

## Components and Interfaces

### New / Modified Components

| Component | Type | Location | Purpose |
|---|---|---|---|
| `SidePanel` | client | `components/SidePanel.tsx` | Generic slide-in drawer wrapper |
| `AdminSidebarClient` | client | `components/AdminSidebarClient.tsx` | Wraps IndustrialSidebar, injects logout onClick |
| `DashboardSummaryCards` | client | `components/DashboardSummaryCards.tsx` | Clickable summary cards, manages panel state |
| `MessagingPanel` | client | `components/MessagingPanel.tsx` | Full messaging UI with Realtime subscription |
| `ClientDetailPanel` | client | `components/ClientDetailPanel.tsx` | Client profile, WOs, payments, messages, pictures |
| `WorkOrderDetailPanel` | client | `components/WorkOrderDetailPanel.tsx` | Full WO lifecycle management |
| `TimeTracker` | client | `components/TimeTracker.tsx` | Start/stop timer for billable hours |
| `EstimateDocument` | client | `components/EstimateDocument.tsx` | Printable estimate with estimate number |
| `BillDocument` | client | `components/BillDocument.tsx` | Printable bill/receipt |
| `ICAgreement` | client | `components/ICAgreement.tsx` | IC Agreement document with signature line |
| `ChangeOrderForm` | client | `components/ChangeOrderForm.tsx` | Add/view change orders |
| `ClientSearchInput` | client | `components/ClientSearchInput.tsx` | Debounced client search for payments panel |
| `PrintButton` | client | `components/PrintButton.tsx` | Calls window.print(), hidden in print output |

### Modified Existing Components

- `IndustrialSidebar` — add optional `onClick` to `SidebarNavItem`, render `<button>` when present
- `WorkOrderTable` — replace `<Link href="/admin/work-orders/${wo.id}">` with `<button onClick={() => onViewWorkOrder(wo.id)}>`, add `onViewWorkOrder` prop
- `ClientTable` — add `onViewClient` prop, make rows clickable
- `app/(admin)/layout.tsx` — replace `<IndustrialSidebar>` with `<AdminSidebarClient>` to inject logout

### SidePanel Component Interface

```ts
interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl'; // default 'lg' = 600px
}
```

### AdminSidebarClient Interface

```ts
// "use client" component
// Receives the static nav items from the server layout
// Adds logout item with onClick handler
interface AdminSidebarClientProps {
  staticItems: SidebarNavItem[];
}
```

---

## Data Models

### New Database Tables

#### `messages`
```sql
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id),
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'client')),
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_sender_idx ON messages(sender_id);
CREATE INDEX messages_recipient_idx ON messages(recipient_id);
CREATE INDEX messages_created_idx ON messages(created_at);
```

#### `estimates`
```sql
CREATE TABLE estimates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   uuid NOT NULL REFERENCES work_orders(id),
  client_id       uuid NOT NULL REFERENCES auth.users(id),
  estimate_number text NOT NULL UNIQUE,
  line_items      jsonb NOT NULL DEFAULT '[]',
  total_amount    numeric(10,2) NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `bills`
```sql
CREATE TABLE bills (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id       uuid NOT NULL REFERENCES work_orders(id),
  client_id           uuid NOT NULL REFERENCES auth.users(id),
  receipt_number      text NOT NULL UNIQUE,
  materials_cost      numeric(10,2) NOT NULL DEFAULT 0,
  materials_paid_by   text NOT NULL CHECK (materials_paid_by IN ('company', 'client', 'both')),
  client_materials_cost numeric(10,2) NOT NULL DEFAULT 0,
  labor_cost          numeric(10,2) NOT NULL DEFAULT 0,
  total_billed        numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid         numeric(10,2) NOT NULL DEFAULT 0,
  balance_remaining   numeric(10,2) GENERATED ALWAYS AS (total_billed - amount_paid) STORED,
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

#### `change_orders`
```sql
CREATE TABLE change_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   uuid NOT NULL REFERENCES work_orders(id),
  description     text NOT NULL,
  additional_cost numeric(10,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `time_entries`
```sql
CREATE TABLE time_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id),
  started_at    timestamptz NOT NULL,
  stopped_at    timestamptz,
  duration_minutes integer GENERATED ALWAYS AS (
    CASE WHEN stopped_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (stopped_at - started_at))::integer / 60
    ELSE NULL END
  ) STORED,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

#### `client_addresses`
```sql
CREATE TABLE client_addresses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES auth.users(id),
  label      text,           -- e.g. "Primary", "Rental Property"
  street     text NOT NULL,
  city       text NOT NULL,
  state      text NOT NULL DEFAULT 'GA',
  zip        text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `work_order_pictures`
```sql
CREATE TABLE work_order_pictures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id),
  client_id     uuid NOT NULL REFERENCES auth.users(id),
  storage_path  text NOT NULL,  -- Supabase Storage path
  caption       text,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);
```

### Columns Added to Existing Tables

#### `work_orders` — new columns
```sql
ALTER TABLE work_orders ADD COLUMN wo_number       text UNIQUE;
ALTER TABLE work_orders ADD COLUMN urgency         text CHECK (urgency IN ('low', 'medium', 'high', 'emergency'));
ALTER TABLE work_orders ADD COLUMN category        text;
ALTER TABLE work_orders ADD COLUMN property_address text;
ALTER TABLE work_orders ADD COLUMN inspection_notes text;
ALTER TABLE work_orders ADD COLUMN accepted_at     timestamptz;
ALTER TABLE work_orders ADD COLUMN completed_at    timestamptz;
ALTER TABLE work_orders ADD COLUMN total_billable_minutes integer NOT NULL DEFAULT 0;
```

#### `users` — new columns
```sql
ALTER TABLE users ADD COLUMN first_name  text;
ALTER TABLE users ADD COLUMN last_name   text;
ALTER TABLE users ADD COLUMN phone       text;
ALTER TABLE users ADD COLUMN email       text;
```

#### `payments` — new columns
```sql
ALTER TABLE payments ADD COLUMN receipt_number text UNIQUE;
ALTER TABLE payments ADD COLUMN notes          text;
ALTER TABLE payments ADD COLUMN payment_date   date;
```

### Updated TypeScript Types (`lib/types.ts`)

```ts
// New status values
export type WorkOrderStatus = 'pending' | 'in_progress' | 'accepted' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';
export type MaterialsPaidBy = 'company' | 'client' | 'both';
export type ChangeOrderStatus = 'pending' | 'accepted' | 'rejected';
export type SenderRole = 'admin' | 'client';

// Extended WorkOrder
export interface WorkOrder {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  quoted_amount: number | null;
  wo_number: string | null;
  urgency: UrgencyLevel | null;
  category: string | null;
  property_address: string | null;
  inspection_notes: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  total_billable_minutes: number;
  created_at: string;
  updated_at: string;
}

// Extended UserProfile
export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  requires_password_reset: boolean;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

// Extended Payment
export interface Payment {
  id: string;
  work_order_id: string;
  client_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  receipt_number: string | null;
  notes: string | null;
  payment_date: string | null;
  created_at: string;
}

// New types
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_role: SenderRole;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Estimate {
  id: string;
  work_order_id: string;
  client_id: string;
  estimate_number: string;
  line_items: EstimateLineItem[];
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Bill {
  id: string;
  work_order_id: string;
  client_id: string;
  receipt_number: string;
  materials_cost: number;
  materials_paid_by: MaterialsPaidBy;
  client_materials_cost: number;
  labor_cost: number;
  total_billed: number;
  amount_paid: number;
  balance_remaining: number;
  created_at: string;
}

export interface ChangeOrder {
  id: string;
  work_order_id: string;
  description: string;
  additional_cost: number;
  status: ChangeOrderStatus;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  work_order_id: string;
  started_at: string;
  stopped_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface ClientAddress {
  id: string;
  client_id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  is_primary: boolean;
  created_at: string;
}

export interface WorkOrderPicture {
  id: string;
  work_order_id: string;
  client_id: string;
  storage_path: string;
  caption: string | null;
  uploaded_at: string;
}
```

### New API Routes

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/messages` | Fetch all conversations (grouped by client) |
| `POST` | `/api/admin/messages` | Send a message |
| `PATCH` | `/api/admin/messages/read` | Mark messages as read |
| `GET` | `/api/admin/clients/[id]/detail` | Full client detail (profile + WOs + payments + messages + pictures) |
| `GET` | `/api/admin/work-orders/[id]/detail` | Full WO detail (WO + estimate + bill + change orders + time entries) |
| `POST` | `/api/admin/work-orders/[id]/accept` | Accept a work order, generate WO number |
| `POST` | `/api/admin/work-orders/[id]/reject` | Reject a work order |
| `PATCH` | `/api/admin/work-orders/[id]` | Update work order fields |
| `POST` | `/api/admin/work-orders/[id]/time-entries` | Start a time entry |
| `PATCH` | `/api/admin/work-orders/[id]/time-entries/[entryId]` | Stop a time entry |
| `POST` | `/api/admin/work-orders/[id]/estimates` | Create/update estimate |
| `POST` | `/api/admin/work-orders/[id]/bills` | Generate bill with receipt number |
| `POST` | `/api/admin/work-orders/[id]/change-orders` | Add a change order |
| `GET` | `/api/admin/clients/search` | Debounced client search (name, phone, address, ID) |
| `POST` | `/api/admin/payments/manual` | Record manual cash payment (extended with receipt gen) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Consistent active-state styling for all sidebar items

*For any* nav item passed to the sidebar, when the current pathname matches that item's `href`, the active styling classes (`bg-[#162d5e]`, `text-orange-400`, `border-l-4 border-orange-500`) should be applied to that item and no other item.

**Validates: Requirements 1.5**

---

### Property 2: Side panel opens for any summary card click

*For any* summary card type (Total Clients, Open Work Orders, Total Revenue, Messages), clicking that card should result in the side panel being open and the panel content corresponding to that card type.

**Validates: Requirements 2.2**

---

### Property 3: Escape key closes any open side panel

*For any* open side panel (regardless of which card or row opened it), pressing the Escape key should result in the panel being closed and the main content remaining visible.

**Validates: Requirements 2.4**

---

### Property 4: Messaging client list reflects all clients with messages

*For any* set of message records in the database, the client list shown in the messaging panel should contain exactly the set of unique client IDs that appear as either `sender_id` or `recipient_id` in those records (excluding the admin's own ID).

**Validates: Requirements 3.1**

---

### Property 5: Conversation messages are in chronological order

*For any* conversation between admin and a client, the messages displayed should be ordered by `created_at` ascending, such that for any two adjacent messages in the rendered list, the earlier message has a `created_at` timestamp less than or equal to the later message.

**Validates: Requirements 3.2, 4.6**

---

### Property 6: Sent messages have correct metadata

*For any* message body and recipient client ID, when the admin submits a message, the persisted record should have `sender_role = 'admin'`, `sender_id` equal to the authenticated admin's user ID, and `recipient_id` equal to the selected client's ID.

**Validates: Requirements 3.3**

---

### Property 7: Message rendering includes all required fields

*For any* message object with a sender name, body text, and `created_at` timestamp, the rendered message component should include all three pieces of information in the output.

**Validates: Requirements 3.5**

---

### Property 8: Unread count equals unread client messages

*For any* set of messages, the computed unread count displayed on the Messages summary card should equal the number of messages where `sender_role = 'client'` and `read_at IS NULL`.

**Validates: Requirements 3.6**

---

### Property 9: Opening a conversation marks all its messages as read

*For any* conversation containing one or more messages with `read_at IS NULL`, after the admin opens that conversation, all messages in that conversation should have a non-null `read_at` value.

**Validates: Requirements 3.7**

---

### Property 10: Client panel renders all contact fields

*For any* client profile with `first_name`, `last_name`, `phone`, and `email` fields populated, the rendered client detail panel should include all four of those values.

**Validates: Requirements 4.2**

---

### Property 11: Client panel shows all addresses and work orders in correct order

*For any* client with N addresses and M work orders, the rendered client detail panel should display all N addresses and all M work orders, with work orders ordered by `created_at` descending.

**Validates: Requirements 4.3, 4.4**

---

### Property 12: Work order panel opens instead of navigating

*For any* work order row in the work orders table, clicking the "View" button should result in the side panel being open with that work order's data, without a page navigation occurring.

**Validates: Requirements 5.1**

---

### Property 13: Work order panel renders all required fields

*For any* work order with `wo_number`, `property_address`, `urgency`, `category`, `client_id`, and `description` populated, the rendered work order detail panel should include all of those values.

**Validates: Requirements 5.2**

---

### Property 14: Modify form is pre-populated with current values

*For any* work order, when the admin opens the modify form, every editable field in the form should be pre-populated with the current value from the work order record.

**Validates: Requirements 5.7**

---

### Property 15: Time tracker elapsed duration is correct

*For any* time entry with a `started_at` and `stopped_at` timestamp, the computed `duration_minutes` should equal `floor((stopped_at - started_at) / 60)` seconds.

**Validates: Requirements 5.11**

---

### Property 16: Auto-generated numbers are unique and correctly formatted

*For any* two distinct payment records, their generated `receipt_number` values should be different. The same uniqueness property holds for `wo_number` across work orders and `estimate_number` across estimates. Each number should match its expected format pattern (`RCT-YYYY-NNNN`, `WO-YYYY-NNNN`, `EST-SEQ-NNNN`).

**Validates: Requirements 5.4, 5.15, 6.7**

---

### Property 17: Change orders are linked to the correct work order

*For any* accepted work order and any change order data submitted for it, the persisted change order record should have `work_order_id` equal to that work order's ID.

**Validates: Requirements 5.16**

---

### Property 18: Client search results match the search term

*For any* search term entered in the payments panel client search, all returned client records should match that term in at least one of: `first_name`, `last_name`, `phone`, `id`, or any associated `client_addresses.street`.

**Validates: Requirements 6.2**

---

### Property 19: Manual payment persisted with correct method and status

*For any* valid payment amount, client ID, and work order ID submitted through the manual payment form, the persisted payment record should have `method = 'manual'` and `status = 'paid'`.

**Validates: Requirements 6.5**

---

### Property 20: Generated receipt contains all required fields

*For any* saved manual payment, the generated receipt should include the payment amount, payment date, client name, work order reference, receipt number, and a balance status indicator (paid in full or balance remaining).

**Validates: Requirements 6.6**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `messages` table missing or query fails | `MessagingPanel` catches the error and renders an "Messaging unavailable" state; does not crash the dashboard |
| Work order fails to load in panel | `WorkOrderDetailPanel` shows an error message with a "Retry" button that re-fetches |
| Time tracker stop called without active entry | Button is disabled when no active entry exists; API returns 400 if called anyway |
| Payment amount ≤ 0 | Client-side validation prevents submission; API also validates and returns 422 |
| Payment amount exceeds outstanding balance | Client shows a confirmation dialog before allowing submission |
| Supabase Realtime disconnects | `MessagingPanel` shows a "Reconnecting…" indicator and attempts to resubscribe |
| Auto-number generation race condition | Numbers are generated inside a serializable transaction; unique constraint on the column provides a final safety net |
| Work order accept/reject API failure | Panel shows an inline error toast; status is not changed in the UI until the API confirms success |

---

## Testing Strategy

### Unit Tests (example-based)

- Sidebar renders Settings and Logout links in correct order
- Logout button calls `signOut` and redirects to `/login`
- Dashboard renders all four summary cards
- Opening a panel keeps main content in the DOM
- Work order panel shows Accept/Reject/Modify buttons in pending status
- Bill generation form prompts for materials info
- IC Agreement section renders with signature line
- Print buttons are present for each document type
- Empty state messages render when client has no work orders or payments
- Overpayment warning dialog appears when amount exceeds balance
- Zero/negative payment amount shows validation error

### Property-Based Tests

Using [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-compatible PBT library). Each test runs a minimum of 100 iterations.

- **Feature: admin-dashboard-enhancements, Property 1**: Sidebar active styling is applied consistently for any nav item
- **Feature: admin-dashboard-enhancements, Property 2**: Any summary card click opens the panel
- **Feature: admin-dashboard-enhancements, Property 3**: Escape key closes any open panel
- **Feature: admin-dashboard-enhancements, Property 4**: Messaging client list matches message senders/recipients
- **Feature: admin-dashboard-enhancements, Property 5**: Conversation messages are always in chronological order
- **Feature: admin-dashboard-enhancements, Property 6**: Sent messages have correct sender metadata
- **Feature: admin-dashboard-enhancements, Property 7**: Message rendering includes sender, body, and timestamp
- **Feature: admin-dashboard-enhancements, Property 8**: Unread count equals count of unread client messages
- **Feature: admin-dashboard-enhancements, Property 9**: Opening a conversation marks all its messages as read
- **Feature: admin-dashboard-enhancements, Property 10**: Client panel renders all contact fields
- **Feature: admin-dashboard-enhancements, Property 11**: Client panel shows all addresses and work orders in correct order
- **Feature: admin-dashboard-enhancements, Property 12**: Work order View button opens panel without navigation
- **Feature: admin-dashboard-enhancements, Property 13**: Work order panel renders all required fields
- **Feature: admin-dashboard-enhancements, Property 14**: Modify form is pre-populated with current values
- **Feature: admin-dashboard-enhancements, Property 15**: Time tracker duration calculation is correct
- **Feature: admin-dashboard-enhancements, Property 16**: Auto-generated numbers are unique and correctly formatted
- **Feature: admin-dashboard-enhancements, Property 17**: Change orders are linked to the correct work order
- **Feature: admin-dashboard-enhancements, Property 18**: Client search results match the search term
- **Feature: admin-dashboard-enhancements, Property 19**: Manual payment persisted with correct method and status
- **Feature: admin-dashboard-enhancements, Property 20**: Generated receipt contains all required fields

### Integration Tests

- Supabase Realtime: send a message from a client session, verify it appears in the admin messaging panel within 5 seconds
- End-to-end manual payment flow: submit payment → verify DB record → verify receipt number is unique

### IC Agreement Content

The `ICAgreement` component renders a static document with the following structure:

1. **Header**: Company name, contractor license number, date, work order reference
2. **Parties**: Contractor (NIGMS) and Client name/address
3. **Scope of Work**: References the work order description and estimate
4. **Compensation**: References the estimate total and payment terms
5. **Independent Contractor Status**: Standard IC language
6. **Lien Rights** (Georgia-specific): Contractor retains all lien rights under O.C.G.A. § 44-14-361 et seq. for residential remodeling work performed in Rome, Georgia. Client acknowledges that failure to pay may result in a materialman's lien being filed against the property.
7. **Dispute Resolution**: References the arbitration agreement at `/legal/arbitration`
8. **Signature Lines**: Client signature, date, and printed name; Contractor signature and date

The document is rendered as a React component and printed via `window.print()` with the `.print-section` class.
