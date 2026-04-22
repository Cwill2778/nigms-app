# Design Document: Industrial Framework Layout

## Overview

The Industrial Framework Layout introduces a global brand theme across all routes of the **Nailed It General Maintenance Solutions** Next.js application. The aesthetic is rugged and utilitarian — zero border-radius, steel-frame borders, a vertical sidebar on desktop, and a database constraint that permanently anchors the active theme to the `rugged_standard` configuration.

The implementation targets the existing **Next.js 15 App Router** project using **Tailwind CSS v4** (configured via `@theme inline` in `globals.css`), **Supabase** for persistence, and **next-themes** for dark/light toggling.

### Key Design Decisions

- **Tailwind v4 `@theme` override** is used for the border-radius reset (not a separate config file) because the project already uses `@import "tailwindcss"` + `@theme inline` in `globals.css`. Adding a custom theme block there is the idiomatic Tailwind v4 approach.
- **`SteelFrameContainer` is a pure layout component** (no server-side logic) so it can be used in both server and client route group layouts without wrapping `"use client"`.
- **`IndustrialSidebar` is a client component** because it needs `usePathname()` for active-route detection.
- **`ThemeGuard` logic lives in server components / server actions only** to prevent the `rugged_standard` UUID from reaching the client bundle.
- **A new migration** (`004_app_settings.sql`) creates the `app_settings` table with a DB-level `CHECK` constraint and `DEFAULT` value to enforce the `rugged_standard` UUID.

---

## Architecture

```mermaid
graph TD
    A[RootLayout<br/>app/layout.tsx] --> B[ThemeGuard<br/>lib/theme-guard.ts]
    B -->|validates theme_id| C[Supabase DB<br/>app_settings]
    A --> D[ThemeProvider<br/>next-themes]

    D --> PubLayout[PublicLayout<br/>(public)/layout.tsx]
    D --> CliLayout[ClientLayout<br/>(client)/layout.tsx]
    D --> AdmLayout[AdminLayout<br/>(admin)/layout.tsx]

    PubLayout --> SF1[SteelFrameContainer]
    CliLayout --> SF2[SteelFrameContainer]
    AdmLayout --> SF3[SteelFrameContainer]

    SF2 --> Sidebar2[IndustrialSidebar<br/>client nav]
    SF3 --> Sidebar3[IndustrialSidebar<br/>admin nav]

    SF1 --> Content1[Page Content]
    SF2 --> Content2[Page Content]
    SF3 --> Content3[Page Content]
```

### Layer Summary

| Layer | Responsibility |
|---|---|
| `globals.css` `@theme` block | Border-radius reset via Tailwind v4 CSS variable override |
| `ThemeGuard` (server) | Reads `app_settings.theme_id`, verifies UUID match server-side |
| `SteelFrameContainer` (server component) | Renders the `2px solid #4A4A4A` steel border + `1rem` inset on every route |
| `IndustrialSidebar` (client component) | Vertical nav panel, visible ≥ 768px, collapses to existing `Navbar` below |
| Migration `004_app_settings.sql` | Creates `app_settings` table with DB-level constraint enforcing `rugged_standard` UUID |

---

## Components and Interfaces

### 1. Theme Injector (`globals.css` `@theme` block)

The border-radius reset is applied by extending the `@theme inline` block in `nigms-app/app/globals.css`. All Tailwind v4 default `--radius-*` CSS variables are overridden to `0`.

```css
@theme inline {
  /* existing vars ... */
  --radius:    0;
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
  --radius-2xl: 0;
  --radius-3xl: 0;
  --radius-full: 0;
}
```

Because `globals.css` is imported in the root `RootLayout`, this cascade applies before any component-level Tailwind utility classes. Inline `style=` overrides are unaffected (browser CSS specificity rule).

---

### 2. `SteelFrameContainer` Component

**File:** `nigms-app/components/SteelFrameContainer.tsx`

A server-safe React layout wrapper. Renders a `2px solid #4A4A4A` border with a `1rem` inset margin from the viewport/parent edge. Does not clip overflow.

```tsx
interface SteelFrameContainerProps {
  children: React.ReactNode;
  className?: string;
}
```

Rendered output structure:
```
<div class="m-4 border-2 border-[#4A4A4A] flex flex-col min-h-[calc(100vh-2rem)]">
  {children}
</div>
```

- `m-4` = `1rem` inset on all sides
- `border-2 border-[#4A4A4A]` = 2px solid steel-grey border
- No `overflow-hidden` — content scrolls naturally
- Color is hardcoded (`#4A4A4A`), so it is identical in both dark and light mode

---

### 3. `IndustrialSidebar` Component

**File:** `nigms-app/components/IndustrialSidebar.tsx`

A `"use client"` component. Uses `usePathname()` from `next/navigation` for active-route detection. Visible only at `md:` breakpoint and above; the existing `Navbar` component handles mobile navigation.

```tsx
interface SidebarNavItem {
  href: string;
  label: string;        // rendered in UPPERCASE via CSS `uppercase` class
  icon: React.ReactNode;
}

interface IndustrialSidebarProps {
  items: SidebarNavItem[];
}
```

Layout structure:
```
<aside class="hidden md:flex flex-col w-56 sticky top-0 h-screen
              bg-[#0a1f44] border-r-2 border-[#4A4A4A]">
  {items.map(item => (
    <Link href={item.href}
          class="flex items-center gap-3 px-4 py-3 uppercase tracking-widest
                 text-gray-200 hover:text-orange-400
                 [active: bg-[#162d5e] text-orange-400 border-l-4 border-orange-500]">
      {item.icon}
      <span class="text-xs font-semibold">{item.label}</span>
    </Link>
  ))}
</aside>
```

- `hidden md:flex` — invisible below 768px, flex column at desktop
- `sticky top-0 h-screen` — stays fixed relative to scroll
- Active item: `bg-[#162d5e]` background + `border-l-4 border-orange-500` left-bar indicator
- Labels use `uppercase tracking-widest` for the all-caps tool-chest aesthetic

**Integration into layouts:** The sidebar is placed **inside** `SteelFrameContainer`, alongside a `<main>` flex sibling, so it is always within the steel border frame.

Layout pattern for authenticated route groups:
```tsx
<SteelFrameContainer>
  <div class="flex flex-1">
    <IndustrialSidebar items={navItems} />
    <main class="flex-1 overflow-y-auto">{children}</main>
  </div>
</SteelFrameContainer>
```

---

### 4. `ThemeGuard` Module

**File:** `nigms-app/lib/theme-guard.ts`

A server-only utility (no `"use client"` directive). Reads the `theme_id` from `app_settings` using the Supabase server client and verifies it matches `RUGGED_STANDARD_UUID` (stored only in `process.env.RUGGED_STANDARD_THEME_ID`, never inlined into client bundles).

```ts
export type ThemeGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function validateThemeGuard(): Promise<ThemeGuardResult>
```

- On match → returns `{ ok: true }`
- On mismatch → logs `console.error("[ThemeGuard] theme_id mismatch …")` and returns `{ ok: false, reason: "theme_id mismatch" }`
- On DB error → logs error and returns `{ ok: false, reason: "db_error" }`

The result is checked in `RootLayout` (server component). If `ok: false`, the layout still renders Industrial_Framework defaults — it does **not** fall back to soft styles. The error is surfaced only in server logs.

---

### 5. Route Group Layout Updates

Each of the three layout files is updated to wrap content in `SteelFrameContainer`. The public layout gets the steel frame only (no sidebar). The client and admin layouts get the sidebar + main flex structure.

**`(public)/layout.tsx`** — new file (public routes currently have no layout):
```tsx
import SteelFrameContainer from '@/components/SteelFrameContainer';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <SteelFrameContainer>{children}</SteelFrameContainer>
      <Footer />
    </>
  );
}
```

**`(client)/layout.tsx`** — updated:
```tsx
<SteelFrameContainer>
  <div className="flex flex-1">
    <IndustrialSidebar items={clientNavItems} />
    <main className="flex-1">{children}</main>
  </div>
</SteelFrameContainer>
```

**`(admin)/layout.tsx`** — updated:
```tsx
<SteelFrameContainer>
  <div className="flex flex-1">
    <IndustrialSidebar items={adminNavItems} />
    <main className="flex-1">{children}</main>
  </div>
</SteelFrameContainer>
```

---

## Data Models

### `app_settings` Table

A new Supabase migration (`004_app_settings.sql`) creates this table.

```sql
-- UUID for the rugged_standard theme (fixed, never changes)
-- Stored as an environment secret; the app reads it at runtime.
-- Value is also enforced as the only allowed value via CHECK constraint.

CREATE TABLE public.app_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  theme_id   UUID NOT NULL DEFAULT 'fd3e8a11-0000-0000-0000-000000000001'
               CHECK (theme_id = 'fd3e8a11-0000-0000-0000-000000000001'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single required row
INSERT INTO public.app_settings (key, theme_id)
VALUES ('global', 'fd3e8a11-0000-0000-0000-000000000001')
ON CONFLICT (key) DO NOTHING;
```

The UUID `fd3e8a11-0000-0000-0000-000000000001` is the `rugged_standard` value. The `CHECK` constraint makes any UPDATE that changes `theme_id` to a different UUID fail at the database level.

### Environment Variable

```
RUGGED_STANDARD_THEME_ID=fd3e8a11-0000-0000-0000-000000000001
```

This variable is read **only** inside `theme-guard.ts` (a server module). It is never passed to client components or referenced in any `"use client"` file.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The project uses **fast-check** (already installed) and **vitest** for property-based testing.

---

### Property 1: SteelFrameContainer always applies border and inset

*For any* React children content, the `SteelFrameContainer` component SHALL render an outer element that carries the `border-2` and `border-[#4A4A4A]` CSS classes AND a `m-4` inset class, regardless of what children are passed.

**Validates: Requirements 2.1, 2.2**

---

### Property 2: SteelFrameContainer never clips overflow

*For any* React children content, the rendered output of `SteelFrameContainer` SHALL NOT contain the CSS class `overflow-hidden` or `overflow-clip` anywhere in the outer container element's class list.

**Validates: Requirements 2.5**

---

### Property 3: Sidebar labels are always uppercase

*For any* `SidebarNavItem` with an arbitrary label string, the `IndustrialSidebar` component SHALL render that label's span element with the `uppercase` CSS class applied.

**Validates: Requirements 3.2**

---

### Property 4: Active item highlight is exclusive to matching route

*For any* array of `SidebarNavItem` objects and any current pathname string, exactly the items whose `href` matches the pathname SHALL receive the active highlight class (e.g., `border-l-4`), and all other items SHALL NOT have that class.

**Validates: Requirements 3.6**

---

### Property 5: ThemeGuard returns ok:true iff theme_id matches

*For any* UUID value returned by a mock `app_settings` query, `validateThemeGuard()` SHALL return `{ ok: true }` if and only if that UUID equals `RUGGED_STANDARD_THEME_ID`; for any other UUID it SHALL return `{ ok: false }`.

**Validates: Requirements 4.2, 4.3**

---

## Error Handling

### ThemeGuard Mismatch

If `validateThemeGuard()` returns `{ ok: false }`, the root layout logs a server-side error and continues rendering with the industrial defaults. It does **not** throw or redirect — users see the correct industrial UI regardless, and the error is surfaced in server/observability logs for the operator.

### ThemeGuard DB Error

If the Supabase query itself fails (network error, RLS denial, missing table), `validateThemeGuard()` catches the exception, logs `console.error("[ThemeGuard] DB error: …")`, and returns `{ ok: false, reason: "db_error" }`. Same graceful-fallback behaviour applies.

### Sidebar Rendering Without Session (Public Routes)

The public layout does not include `IndustrialSidebar`. If a public route somehow attempts to render it, the component receives an empty `items` array and renders an empty `<aside>` — no crash.

### SteelFrameContainer Without Children

`SteelFrameContainer` renders correctly with zero children — the border and inset are still visible, producing an empty framed area. No special handling needed.

### Missing `RUGGED_STANDARD_THEME_ID` Env Var

If the environment variable is not set, `theme-guard.ts` treats the comparison as a mismatch (empty string ≠ UUID) and returns `{ ok: false, reason: "missing_env_var" }` with a server-side error log. Industrial defaults still render.

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples and structural assertions. Property-based tests (via **fast-check**) verify universal invariants across randomized input.

### Property-Based Tests

Each property test runs a minimum of **100 iterations** via fast-check's `fc.assert(fc.property(...))`.

| Test | Property | fast-check Arbitraries |
|---|---|---|
| `steelFrame.border.property.test.ts` | Property 1 — border + inset always present | `fc.string()`, `fc.array(fc.string())` as children text |
| `steelFrame.overflow.property.test.ts` | Property 2 — no overflow-hidden | Same as above |
| `sidebar.uppercase.property.test.ts` | Property 3 — labels uppercase | `fc.string({ minLength: 1 })` as label |
| `sidebar.activeHighlight.property.test.ts` | Property 4 — active highlight exclusive | `fc.array(fc.record({href: fc.string(), label: fc.string()}))` + `fc.string()` as pathname |
| `themeGuard.property.test.ts` | Property 5 — ok iff UUID matches | `fc.string()` as mock UUID return value |

Tag format in each test file:
```
// Feature: industrial-framework-layout, Property N: <property text>
```

### Unit / Example Tests

- **`themeGuard.unit.test.ts`**: Two concrete examples — matching UUID returns `{ ok: true }`, mismatching UUID returns `{ ok: false }`. Also tests the DB-error path.
- **`sidebar.structure.test.ts`**: Renders `IndustrialSidebar` with a fixture nav list and verifies: `hidden md:flex` class present, icon elements present alongside label spans, sticky positioning class present.
- **`steelFrame.structure.test.ts`**: Renders `SteelFrameContainer` with fixture children and asserts DOM structure matches expected class names.
- **`layouts.integration.test.ts`**: Renders each layout file (mocking Supabase auth) and verifies `SteelFrameContainer` is present in the rendered tree for all three route groups.

### CSS / Configuration Checks

- **`globals.css.test.ts`**: Reads the CSS file and asserts that all `--radius-*` tokens appear with value `0` in the `@theme` block. This is a file-content assertion, not a browser render test.

### Test Environment

All tests run in **vitest** with `environment: 'node'` (existing config). React component rendering uses `@testing-library/react` with `jsdom` environment override per test file where needed. No browser automation is required.
