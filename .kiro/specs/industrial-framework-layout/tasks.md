# Implementation Plan: Industrial Framework Layout

## Overview

Implement the rugged industrial brand aesthetic across all routes of the Nailed It General Maintenance Solutions Next.js app. The plan covers: the Tailwind v4 border-radius reset, the `SteelFrameContainer` component, the `IndustrialSidebar` component, the `ThemeGuard` server utility, the `app_settings` Supabase migration, layout updates for all three route groups, and the full property-based and unit test suite.

## Tasks

- [x] 1. Apply global border-radius reset in Tailwind v4
  - Extend the existing `@theme inline` block in `nigms-app/app/globals.css` to add all `--radius-*` CSS variable overrides set to `0` (`--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-full`)
  - This must appear inside the existing `@theme inline { … }` block so Tailwind v4 picks it up before component-level utilities
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.1 Write CSS file-content test for border-radius reset
    - In `nigms-app/__tests__/globals.css.test.ts`, read the `globals.css` file as a string and assert every `--radius-*` token appears with value `0` inside the `@theme` block
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement `SteelFrameContainer` component
  - Create `nigms-app/components/SteelFrameContainer.tsx` as a server-safe React component (no `"use client"` directive)
  - Render a single outer `<div>` with classes `m-4 border-2 border-[#4A4A4A] flex flex-col min-h-[calc(100vh-2rem)]` wrapping `{children}`
  - Accept optional `className` prop merged into the outer div; do NOT add `overflow-hidden` or `overflow-clip`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.1 Write property test — border and inset always present
    - In `nigms-app/__tests__/steelFrame.border.property.test.ts`, use `fc.assert(fc.property(fc.string(), …))` to verify the rendered outer element always carries `border-2`, `border-[#4A4A4A]`, and `m-4` classes regardless of children
    - Tag: `// Feature: industrial-framework-layout, Property 1: SteelFrameContainer always applies border and inset`
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Write property test — no overflow clipping
    - In `nigms-app/__tests__/steelFrame.overflow.property.test.ts`, use `fc.assert(fc.property(…))` to verify the outer container element's class list never contains `overflow-hidden` or `overflow-clip`
    - Tag: `// Feature: industrial-framework-layout, Property 2: SteelFrameContainer never clips overflow`
    - _Requirements: 2.5_

  - [x] 2.3 Write unit/structure test for `SteelFrameContainer`
    - In `nigms-app/__tests__/steelFrame.structure.test.ts`, render with fixture children and assert DOM structure matches expected class names and children are present
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 3. Implement `IndustrialSidebar` component
  - Create `nigms-app/components/IndustrialSidebar.tsx` as a `"use client"` component
  - Accept `items: SidebarNavItem[]` prop where each item has `href`, `label`, and `icon`
  - Render `<aside>` with classes `hidden md:flex flex-col w-56 sticky top-0 h-screen bg-[#0a1f44] border-r-2 border-[#4A4A4A]`
  - Use `usePathname()` from `next/navigation` to detect the active route
  - Each nav link: `uppercase tracking-widest text-xs font-semibold` label, icon alongside label, `flex items-center gap-3 px-4 py-3`
  - Active item (href matches current pathname): apply `bg-[#162d5e] text-orange-400 border-l-4 border-orange-500`; inactive items: `text-gray-200 hover:text-orange-400`
  - Export `SidebarNavItem` interface from the same file
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.1 Write property test — labels always uppercase
    - In `nigms-app/__tests__/sidebar.uppercase.property.test.ts`, use `fc.assert(fc.property(fc.string({ minLength: 1 }), …))` to verify every label span has the `uppercase` CSS class regardless of the input string value
    - Tag: `// Feature: industrial-framework-layout, Property 3: Sidebar labels are always uppercase`
    - _Requirements: 3.2_

  - [x] 3.2 Write property test — active highlight exclusive to matching route
    - In `nigms-app/__tests__/sidebar.activeHighlight.property.test.ts`, use `fc.assert(fc.property(fc.array(fc.record({href: fc.webUrl(), label: fc.string({minLength:1})})), fc.string(), …))` to verify only items whose `href` matches the mocked pathname receive `border-l-4`, and all others do not
    - Tag: `// Feature: industrial-framework-layout, Property 4: Active item highlight is exclusive to matching route`
    - _Requirements: 3.6_

  - [x] 3.3 Write unit/structure test for `IndustrialSidebar`
    - In `nigms-app/__tests__/sidebar.structure.test.ts`, render with a fixture nav list and verify: `hidden md:flex` class present on `<aside>`, icon elements rendered alongside label spans, `sticky` class present
    - _Requirements: 3.1, 3.3, 3.5_

- [x] 4. Checkpoint — Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `ThemeGuard` server utility and Supabase migration
  - Create `nigms-app/lib/theme-guard.ts` (no `"use client"` directive) with the exported `validateThemeGuard(): Promise<ThemeGuardResult>` function and `ThemeGuardResult` type
  - Read `theme_id` from `app_settings` where `key = 'global'` using the Supabase server client
  - Compare against `process.env.RUGGED_STANDARD_THEME_ID` — return `{ ok: true }` on match
  - On mismatch: log `console.error("[ThemeGuard] theme_id mismatch …")` and return `{ ok: false, reason: "theme_id mismatch" }`
  - On DB error or missing env var: log and return `{ ok: false, reason: "db_error" }` or `{ ok: false, reason: "missing_env_var" }`
  - Create `nigms-app/supabase/migrations/004_app_settings.sql` with the `app_settings` table definition, `CHECK` constraint enforcing the `rugged_standard` UUID `fd3e8a11-0000-0000-0000-000000000001`, and the seed `INSERT … ON CONFLICT DO NOTHING`
  - Add `RUGGED_STANDARD_THEME_ID=fd3e8a11-0000-0000-0000-000000000001` to `.env.local` (server-only; never reference in `"use client"` files)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.1 Write property test — ThemeGuard ok iff UUID matches
    - In `nigms-app/__tests__/themeGuard.property.test.ts`, mock the Supabase query and use `fc.assert(fc.property(fc.string(), …))` to verify `validateThemeGuard()` returns `{ ok: true }` iff the mocked UUID equals the env var value, and `{ ok: false }` for any other string
    - Tag: `// Feature: industrial-framework-layout, Property 5: ThemeGuard returns ok:true iff theme_id matches`
    - _Requirements: 4.2, 4.3_

  - [x] 5.2 Write unit tests for `ThemeGuard`
    - In `nigms-app/__tests__/themeGuard.unit.test.ts`, cover: matching UUID → `{ ok: true }`, mismatching UUID → `{ ok: false }`, DB error path → `{ ok: false, reason: "db_error" }`, missing env var → `{ ok: false, reason: "missing_env_var" }`
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 6. Integrate `ThemeGuard` into `RootLayout`
  - In `nigms-app/app/layout.tsx`, call `validateThemeGuard()` (awaited, server-side) and log the result if `ok: false`; the layout MUST continue rendering the industrial defaults regardless of the result — no redirect or throw
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 7. Update route group layouts to use `SteelFrameContainer` and `IndustrialSidebar`
  - Create `nigms-app/app/(public)/layout.tsx` (currently missing): wrap content in `<Navbar />`, `<SteelFrameContainer>{children}</SteelFrameContainer>`, `<Footer />` — no sidebar for public routes
  - Update `nigms-app/app/(client)/layout.tsx`: replace the existing `<main>` wrapper with `<SteelFrameContainer><div className="flex flex-1"><IndustrialSidebar items={clientNavItems} /><main className="flex-1">{children}</main></div></SteelFrameContainer>`; define `clientNavItems` with links to `/dashboard` and `/work-orders/new` with appropriate lucide-react icons
  - Update `nigms-app/app/(admin)/layout.tsx`: same pattern as client layout using `adminNavItems` with links to `/admin-dashboard`, `/clients`, `/work-orders`, `/payments` with appropriate lucide-react icons; remove the outer `<Navbar />` and `<Footer />` from the main flex wrapper since sidebar replaces desktop nav (keep Navbar visible on mobile via its existing responsive classes)
  - Ensure `IndustrialSidebar` is rendered inside `SteelFrameContainer` on all authenticated layouts
  - _Requirements: 2.3, 3.1, 3.4, 3.7_

  - [x] 7.1 Write integration tests for layouts
    - In `nigms-app/__tests__/layouts.integration.test.ts`, render each layout (mocking Supabase auth + session) and verify `SteelFrameContainer` is present in the rendered tree for all three route groups
    - _Requirements: 2.3, 3.7_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** (`fc.assert`) with a minimum of 100 iterations each
- All test files go under `nigms-app/__tests__/`; component render tests need `@testing-library/react` with `jsdom` environment override per file
- `ThemeGuard` and `RUGGED_STANDARD_THEME_ID` must never appear in `"use client"` files — server-side only
- The `CHECK` constraint in `004_app_settings.sql` enforces the rugged_standard UUID at the database level, satisfying requirement 4.5 independently of application code
