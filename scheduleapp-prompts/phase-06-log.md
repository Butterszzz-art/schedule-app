# Phase 6 — Log View

## Goal
A scrollable history of every past day showing planned vs actual, completion rate, and individual block outcomes. The source of truth for how well the schedule is being followed.

## Route
`app/(app)/log/page.tsx`

## Data fetching
Server component fetches last 30 days of `DayLog` entries. Group by date, sorted newest first.

## Components

### `<LogFeed>`
Scrollable list of `<DayEntry>` components. Show last 30 days. Days with zero logged blocks are hidden (nothing to show). Show a message if fewer than 3 days logged: "Start marking blocks complete in Today view."

### `<DayEntry>`
Per day:
- **Header row**: Day name + date (e.g. "Mon 01 Sep") on left, completion % on right (green at ≥80%, yellow at ≥50%, grey below)
- **Progress bar**: thin, colour-coded by completion %
- **Block list**: every block that was logged that day (done or skipped), in time order
  - Done: ✓ in green, time in accent colour, label in muted white
  - Skipped: ✕ in red, time greyed, label struck through
  - Unmarked blocks are not shown (only show what was explicitly logged)
- **Footer**: "X done · Y skipped · Z unmarked"

### `<DaySummaryBadge>`
Compact inline badges for key habits on that day. Shows icons only: 💪 if gym done, 🥋 if MA done, 🏃 if cardio done, 📚 if any study done. Greyed if not done. Shown in the header row.

## Filters (optional, add if time allows)
Simple pill filters at top: "All" / "Gym days" / "Rest days" / "Missed blocks". Toggle which days show in the feed.

## Empty state
If no logs exist at all: large centred message "No history yet. Mark your first block complete in Today." with a button linking to `/today`.

## Done when
- All logged days appear in reverse chronological order
- Completion % is accurate (done / non-sleep non-disabled total)
- Badge icons correctly reflect what was completed that day
- Scrolling is smooth on mobile
- Zero-log days are not shown in the feed
