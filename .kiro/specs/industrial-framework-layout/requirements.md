# Requirements Document

## Introduction

The Industrial Framework Layout feature establishes a global brand aesthetic across every route of the Nailed It General Maintenance Solutions application. The theme enforces a rugged, utilitarian visual identity: zero border-radius, hard steel-frame borders, a vertical sidebar for navigation, and a database-enforced theme setting that prevents accidental reversion to soft/modern defaults. All UI decisions are driven by a "tool-chest" metaphor — structured, high-contrast, and built for professionals.

## Glossary

- **Industrial_Framework**: The global layout system responsible for enforcing the rugged brand aesthetic across all application routes.
- **Theme_Injector**: The subsystem responsible for applying the global Tailwind configuration overrides (e.g., border-radius reset) at application initialization.
- **Steel_Frame_Container**: A layout wrapper component that renders a 2px solid `#4A4A4A` border with a `1rem` inset offset around page content.
- **Sidebar**: The vertical navigation component rendered on desktop viewports, styled to mimic a tool-chest layout with high-contrast icons and all-caps labels.
- **Theme_Guard**: The data-layer constraint that ensures the active theme record in `app_settings` is always linked to the `rugged_standard` UUID.
- **Page**: Any rendered route within the application, including public, client, and admin route groups.
- **Desktop_Viewport**: A screen width of 768px (md breakpoint) or greater.

---

## Requirements

### Requirement 1: Global Border-Radius Reset

**User Story:** As a brand owner, I want all rounded corners removed globally, so that the application consistently communicates a rugged, industrial aesthetic instead of a soft or modern one.

#### Acceptance Criteria

1. WHILE the application is initializing, THE Theme_Injector SHALL apply a Tailwind theme override that sets the global `border-radius` to `0` for all default radius tokens (e.g., `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`).
2. THE Theme_Injector SHALL apply the border-radius reset before any page content is rendered to the user.
3. IF a component applies a Tailwind border-radius utility class that originates from the default config, THEN THE Theme_Injector SHALL ensure the override takes precedence.
4. THE Theme_Injector SHALL not affect explicitly hardcoded inline `border-radius` values set outside the Tailwind configuration.

---

### Requirement 2: Steel-Frame Page Container

**User Story:** As a brand owner, I want every page wrapped in a Steel-Frame container, so that all content is visually framed by the industrial brand border system.

#### Acceptance Criteria

1. WHEN a Page is rendered, THE Steel_Frame_Container SHALL wrap the page content with a `2px solid #4A4A4A` border.
2. THE Steel_Frame_Container SHALL apply a `1rem` inset offset between the container border and the viewport/parent edge.
3. THE Steel_Frame_Container SHALL be rendered on every route, including public, client, and admin route groups.
4. WHILE the application is in dark mode, THE Steel_Frame_Container SHALL maintain the same `#4A4A4A` border color to ensure consistent frame visibility.
5. IF the page content exceeds the viewport height, THEN THE Steel_Frame_Container SHALL not clip or hide overflowing content, allowing natural scroll behavior.

---

### Requirement 3: Vertical Sidebar Navigation (Desktop)

**User Story:** As a user on a desktop device, I want a vertical sidebar for navigation, so that I can quickly orient myself within the application using a structured, tool-chest-style interface.

#### Acceptance Criteria

1. WHERE navigation is present, THE Sidebar SHALL render as a vertical panel on Desktop_Viewport screens.
2. THE Sidebar SHALL display navigation labels in all-caps formatting.
3. THE Sidebar SHALL render high-contrast icons alongside each navigation label.
4. WHEN the viewport width is below the Desktop_Viewport breakpoint (768px), THE Sidebar SHALL collapse and THE Industrial_Framework SHALL fall back to the existing horizontal navigation (Navbar component).
5. THE Sidebar SHALL remain visible and statically positioned as a persistent left-hand panel during page scrolling on Desktop_Viewport screens.
6. WHEN a navigation item is active (matching the current route), THE Sidebar SHALL apply a visually distinct highlight style to that item using a high-contrast indicator.
7. THE Sidebar SHALL render within the Steel_Frame_Container boundary, not outside it.

---

### Requirement 4: Theme Persistence via Database Constraint

**User Story:** As a system administrator, I want the active theme to be locked to the `rugged_standard` UUID in the database, so that no deployment, migration, or code change accidentally reverts the application to a soft or modern theme.

#### Acceptance Criteria

1. THE Theme_Guard SHALL ensure the `app_settings` table contains a row where `theme_id` is set to the `rugged_standard` UUID.
2. WHEN the application initializes, THE Theme_Guard SHALL read the `theme_id` value from the `app_settings` table and confirm it matches the `rugged_standard` UUID before rendering the Industrial_Framework.
3. IF the `theme_id` value in `app_settings` does not match the `rugged_standard` UUID, THEN THE Theme_Guard SHALL log an error and fall back to rendering the Industrial_Framework defaults without reverting to soft/modern styles.
4. THE Theme_Guard SHALL not expose the `rugged_standard` UUID value in client-side JavaScript bundles; the comparison SHALL occur server-side only.
5. THE Theme_Guard SHALL be enforced as a database-level default or constraint so that INSERT or UPDATE operations that omit `theme_id` cannot silently revert to a non-industrial theme.
