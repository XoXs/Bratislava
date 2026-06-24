# Extractable Components

The current app is intentionally compact and keeps UI components inside `src/App.tsx`. No separate layout components are worth extracting into SuperDesign components yet.

## AppShell

- Source: `src/App.tsx`
- Category: layout
- Description: Root shell with topbar, metrics, tabs, planner board, and panels.
- Extractable props: currentTab, currentUser
- Hardcoded: travel dates, tab labels, icon names, CSS class names

## ActivityCard

- Source: `src/App.tsx`
- Category: basic
- Description: Draggable activity card with category badge, map preview, metadata, likes, notes, and actions.
- Extractable props: likedByCurrentUser, booked, category
- Hardcoded: action icon names, badge structure, map iframe structure
