# Phase 5 — Habits View + Streaks

## Goal
Per-category streaks, totals, and a 7-day heatmap. The posing habit only appears during prep mode. Everything is driven by real DayLog data.

## Route
`app/(app)/habits/page.tsx`

## Habit categories
Show posing category only when current mode is 'prep':

| Key | Label | Icon | Kinds | Prep only? |
|-----|-------|------|-------|------------|
| gym | Gym | 💪 | gym | No |
| posing | Posing | 🕴 | posing | YES |
| cardio | Cardio | 🏃 | cardio | No |
| mobility | Mobility | 🧘 | mobility | No |
| study | Study | 📚 | study | No |
| nutrition | Nutrition | 🍱 | meal, prep | No |
| reading | Reading | 📖 | read | No |
| chores | Chores | 🧹 | chores | No |

## Streak calculation
```typescript
function calcStreaks(
  allLogs: Record<string, Record<string, string>>,
  mode: ScheduleMode,
  sem: SemesterKey
) {
  // For each date in allLogs (sorted asc):
  //   Get the day's weekday (Mon/Tue/etc)
  //   Get that day's schedule: SCHEDULE[mode][sem][dayKey]
  //   For each habit category:
  //     Check if any blocks of that kind exist on this day
  //     If yes and at least one marked "done": streak++, total++
  //     If yes and none marked "done": streak = 0 (break)
  //     If no blocks of that kind on this day: skip (don't break)
  // Return: { [categoryKey]: { streak, best, total } }
}
```

Key rule: a day with no scheduled blocks of a kind does NOT break the streak.
Example: gym streak should not break on Wed/Sun (no gym those days).
Example: posing streak should not break on days before prep started.

## Components

### `<WeeklyScore>`
Top of page. One big number: overall % completion across all habits this week.
Label: "this week". Colour: acid green.

### `<StreakGrid>`
2-column grid of `<StreakCard>`.

### `<StreakCard>`
- Icon (20px)
- Label
- Streak number (large, bold)
- "day streak" label
- Total completed (small, muted)
- Border glow:
  - 3–6 days: `#4ADE8044`
  - 7–29 days: `#4ADE80`
  - 30+ days: `#C8F060` (gold treatment)
- Posing card: amber accent `#E09000`, only shown in prep mode

### `<HeatmapSection>`
Title "Last 7 days". One row per category (posing row only in prep mode).

Each row:
- Category icon + name (left, 60px wide)
- 7 day squares
- Colours:
  - No blocks expected: `#141414` (invisible)
  - Blocks expected, none done: `#1E1E1E` (missed)
  - Partial: `#4ADE8033`
  - Full: `#C8F060`
  - Today (ongoing): square with `#333` border
- Day letter below: M T W T F S S

## Prep mode note
If current mode is prep, show a small amber line below the streak grid:
"🏆 Posing streak counts toward show readiness — protect it."

## Done when
- Posing card appears in prep mode, hidden in normal mode
- Gym streak does not break on Wed/Sun
- Posing streak does not break on days before Aug 16
- Heatmap correctly shows missed vs completed vs no-expectation days
- Weekly score is accurate
- Streak glow updates when milestones are hit
