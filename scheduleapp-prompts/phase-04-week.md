# Phase 4 — Week View + Mode Banner + Semester Toggle

## Goal
Full week overview with block toggles, semester switching, and a clear mode indicator. The user needs to see at a glance what each day looks like and turn off individual blocks for the current week.

## Route
`app/(app)/week/page.tsx`

## Data fetching
1. User's semester from `UserSettings`
2. Current schedule mode from `getScheduleMode()`
3. All `WeekOverride` entries for the current ISO week
4. All `DayLog` entries for Mon–Sun this week (for completion bars)

## API routes

### `PATCH /api/settings`
Body: `{ semester: 1 | 2 }`

### `POST /api/overrides`
Body: `{ weekKey, dayKey, blockId, disabled: boolean }`

## Components

### `<ModeHeader>`
Prominent banner at top of week view:
- PREP MODE (amber): "🏆 Prep mode active · Posing daily · MA suspended · Cardio: Mon/Thu/Sat/Wed/Sun"
- NORMAL MODE (muted): "📅 Normal schedule · MA: Wed & Sun · Cardio: Mon/Thu/Sat"
Mode is computed from date — not toggleable by user.

### `<SemesterToggle>`
Two pills: "Sem 1 · Sep–Oct" / "Sem 2 · Nov–Dec"
- Changes uni blocks only — mode stays date-driven
- Persists to DB via PATCH /api/settings

### `<DayRow>` (one per day, collapsible)
Header (always visible):
- Day name + training badge:
  - Mon/Thu: "UPPER 💪"
  - Tue/Fri: "LOWER 💪"
  - Wed (prep): "REST · Posing + Cardio"
  - Wed (normal): "REST · MA 🥋"
  - Sat: "UPPER 💪"
  - Sun (prep): "REST · Posing + Cardio"
  - Sun (normal): "REST · MA 🥋"
- Completion bar for the day
- Count of disabled blocks ("2 off")
- Chevron

Expanded (block list):
- Each non-sleep block as a toggleable row
- Green dot = active, grey = disabled this week
- Tap to toggle → POST /api/overrides
- FIXED blocks: "FIXED" badge, not tappable
- Show block label + scheduled start time
- Study blocks show duration: "Study · 2h", "Study · 1.5h"

### Fixed block rule
Cannot disable: any block with `fixed: true` in the schedule data.
This includes all mandatory uni sessions, practicals, and the 09:00 tutorials.
Posing blocks can be disabled on specific days (user might have a reason).

## Visual distinctions
- Rest days (Wed/Sun): red-tinted day header
- Prep mode days: amber dot next to posing block in the list
- Today's row: green left border
- Past days this week: muted text

## Done when
- Mode banner reflects actual current date (prep vs normal)
- Semester toggle changes uni blocks only
- Disabling a block removes it from Today view and progress count
- FIXED blocks cannot be toggled
- Rest day headers clearly show what replaces MA in prep mode
- Toggled state resets automatically next ISO week
