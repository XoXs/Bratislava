# Bratislava Trip Planner Design System

## Product Context

A collaborative single-page travel planning app for a six-person Bratislava trip from 09.07. to 13.07. The core surface is a calendar-like day board with timeslot rows and editable activity cards.

## UX Priorities

- The first screen after login should feel like a serious planning workspace, not a marketing page.
- The day board is the primary work surface and must remain highly scannable.
- Activity cards should make the key decision data visible: title, time, category, place, cost, reservation status, likes, notes, and actions.
- Mobile should stack days vertically and preserve sticky navigation.
- A selected user acts as themselves; activity likes are personal, activities are for the full group by default.

## Visual Direction

- Modern, polished, clean, travel-planner UI.
- More premium than a plain table, closer to a calm Notion/Miro workspace.
- Avoid decorative orbs, heavy gradients, and one-note palettes.
- Keep cards rectangular with small radius, max 8px for most UI.
- Use compact tool controls with icons, not large text-heavy buttons where icons are sufficient.

## Palette

Use the existing palette as the base:

- Ink: `#172029`
- Warm page: `#f7f3eb`
- Soft paper: `#fbfaf7`
- Travel coral: `#ef7d57`
- Teal: `#258f84`
- Blue: `#6c8ae4`
- Pink accent: `#d676b8`
- Amber: `#c98716`
- Muted text: `#596671`, `#66727f`, `#6c7783`
- Borders: rgba ink at 0.09-0.14 alpha
- Surfaces: white with 0.66-0.94 alpha

## Typography

- Font stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Letter spacing: `0`
- Use strong, compact headings on cards.
- Avoid viewport-scaled body text.

## Shape, Spacing, Shadows

- Border radius: 8px for cards, buttons, fields; 10px only for large modal/login shell.
- Dense but breathable spacing: 8px, 10px, 12px, 14px, 16px, 18px, 22px.
- Shadows should be soft and functional, not glossy.

## Components

- Topbar: sticky, glassy white, user pill, switch action, add activity action.
- Tabs: sticky segmented navigation.
- Day column: colored day header, stacked timeslot sections.
- Activity card: category badge, title, time, description, linked location, embedded map preview, metadata chips, like avatars, note block, icon action row.
- Login: centered card, name buttons with initials.
- Modal: large editing surface with two-column form on desktop and single-column mobile.

## Allowed Implementation Files

Always pass these context files to SuperDesign:

- `src/App.tsx`
- `src/styles.css`
- `src/data.ts`
- `src/types.ts`
- `.superdesign/design-system.md`
