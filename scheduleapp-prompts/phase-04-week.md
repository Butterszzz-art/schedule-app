# Phase 4 — Week View + Semester Toggle

## Goal
Let the user see the full week at a glance and toggle individual blocks on/off for the current week. Semester switching lives in the header and persists to the DB.

## Route
`app/(app)/week/page.tsx`

## Data fetching
Server component fetches:
1. User's semester setting from `UserSettings`
2. All `WeekOverride` entries for the current ISO week
3. All `DayLog` entries for the current week (Mon–Sun) to show completion state

## API routes needed

### `PATCH /api/settings`
Body: `{ semester: 1 | 2 }`
- Upsert `UserSettings` for the current user
- Returns updated settings

### `POST /api/overrides`
Body: `{ weekKey, dayKey, blockId, disabled: boolean }`
- Upsert a WeekOverride entry
- `disabled: false` effectively re-enables a block (or delete the record)

## Components

### `<SemesterToggle>`
Two pill buttons in the header: "Sem 1 · Sep–Oct" and "Sem 2 · Nov–Dec".
- Active pill has accent border + tinted background
- On switch: PATCH `/api/settings`, update local state, re-render the week with new blocks
- Persist semester in `UserSettings` table

### `<WeekGrid>`
Seven `<DayRow>` components, one per day.

### `<DayRow>`
Collapsed by default. Shows:
- Day name + lift type badge ("UPPER 💪" / "LOWER 💪" / "MARTIAL ARTS 🥋 REST")
- Count of disabled blocks for this week e.g. "2 off"
- Completion bar: done/total for this day based on DayLog entries
- Chevron to expand

Expanded shows all non-sleep blocks as toggleable rows:
- Green dot → block is active this week
- Grey dot + strikethrough → block is disabled this week
- Tap to toggle (calls `POST /api/overrides`)
- FIXED blocks show a "FIXED" badge in grey — tap does nothing, fixed blocks cannot be disabled
- Block label + scheduled time shown on each row

### Fixed block rule
The following block kinds are always fixed and cannot be toggled off:
- All `uni` blocks marked `fixed: true` in the schedule data
- Specifically: practicals, tutorials, Lin. Algebra seminars, mandatory sessions

### Visual state
- Today's day row has a subtle green left border
- Days in the past this week show muted colours
- Rest days (Wed/Sun) have a red tinted header

## Semester switch behaviour
When semester changes:
- The week grid re-renders with the new semester's block set
- Existing overrides for the current week are preserved but may not match any blocks in the new semester — ignore mismatches silently
- The hero card on Today view also updates

## Done when
- Switching semester persists after page refresh
- Toggling a block off removes it from Today view's active count
- FIXED blocks cannot be toggled
- Today's completion bars are accurate based on actual DayLog entries
- Expanding a day row shows all blocks with correct times
- Rest days are visually distinct
