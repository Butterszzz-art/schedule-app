# Phase 3 — Today View

## Goal
The main daily screen. Always shows what's happening now or next, lets you mark blocks done/skipped, push delays, and see your daily progress. Must be mode-aware — prep and normal schedules look different.

## Route
`app/(app)/today/page.tsx`

## Mode detection
```typescript
// In the server component:
const mode = getScheduleMode(new Date())
const semester = userSettings.semester
const todayBlocks = SCHEDULE[mode][semester][todayKey]
```

Show a subtle "PREP MODE" banner in amber below the header when mode === 'prep'.

## Data fetching (server component)
1. User's semester from `UserSettings`
2. Today's `DayLog` entries
3. Today's `WeekOverride` entries for current ISO week
4. Today's `BlockAdjustment` entries

## API routes

### `POST /api/logs`
Body: `{ blockId, date, status: "done" | "skipped" | null }`
Upsert or delete DayLog.

### `POST /api/adjustments`
Body: `{ blockId, date, startMins }`
Upsert BlockAdjustment, used by +15m.

## Components

### `<PrepModeBanner>` (prep mode only)
Slim amber bar: "🏆 PREP MODE — Aug 16 → Nov 2 · X days to Show 1"
Show days remaining to the next show. Tapping navigates to /prep.

### `<HeroCard>`
- Active block (now): pulsing green dot, block name, time range, "+15m" button, radial glow in block accent
- Next block (upcoming): countdown timer MM:SS, block name, time, "+15m" button
- All done: "All done today 🎯"
- Accent colour matches block kind

### `<ProgressBar>`
done / active_total (excludes disabled + sleep). Green at 100%.

### `<NutritionPill>` (compact, below progress bar)
Day type label + today's kcal/protein/carbs/fat in one line.
- Heavy lift (Upper): 2500 kcal · 335g C · 164g P · 55g F
- Moderate lift (Lower): 2200 kcal · 251g C · 164g P · 60g F
- True rest (Wed/Sun): 1700 kcal · 104g C · 164g P · 70g F
Protein always shown in green.

### `<BlockCard>`
One per visible block (hide sleep).
- Posing block: amber/gold accent, icon 🕴, shown first thing each day in prep mode
- Status: ○ → ✓ → ✕ → ○ cycling, calls POST /api/logs
- "+15m" on active block only → cascade → POST /api/adjustments
- Disabled blocks (WeekOverride): greyed, "OFF" badge, no status button
- Study blocks show their length: "Study · 2h", "Study · 1.5h", "Study · 45m"

### Cascade animation
When +15m pushed: blocks below shift down with 150ms stagger transition.

## Mode-specific block rendering

### Prep mode
- First block each day: posing (05:30, amber)
- Wed/Sun: posing → M1 → cardio → M2 → study blocks → chores/prep (no MA)
- Cardio appears on Mon/Thu/Sat/Wed/Sun

### Normal mode
- Wed/Sun: commute → MA → mobility → M2 → study/chores/prep
- Cardio only on Mon/Thu/Sat
- No posing blocks

## Done when
- `getScheduleMode()` drives which blocks render
- Prep mode banner shows with correct days-to-show countdown
- Posing block appears first in prep mode on every day
- Wed in prep mode: no MA, has posing + cardio + study blocks
- Wed in normal mode: has MA, no posing, no cardio
- Marking done/skipped persists after refresh
- +15m cascade does not push past fixed uni blocks
- Nutrition pill shows correct targets for today's day type
- Works on 375px mobile without horizontal scroll
