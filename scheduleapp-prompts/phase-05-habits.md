# Phase 5 — Habits View + Streaks

## Goal
Show per-category habit streaks, totals, and a 7-day heatmap. This is the motivation layer — it should make streaks feel worth protecting.

## Route
`app/(app)/habits/page.tsx`

## Habit categories
Each category maps to one or more block kinds:

| Key | Label | Icon | Block kinds |
|-----|-------|------|-------------|
| gym | Gym | 💪 | gym |
| ma | Martial Arts | 🥋 | ma |
| cardio | Cardio | 🏃 | cardio |
| mobility | Mobility | 🧘 | mobility |
| study | Study | 📚 | study |
| nutrition | Nutrition | 🍱 | meal, prep |
| reading | Reading | 📖 | read |
| chores | Chores | 🧹 | chores |

## Data fetching
Server component fetches ALL `DayLog` entries for the current user, sorted by date ascending. Pass to client component.

## Streak calculation logic
For each habit category, across all logged dates in order:
- A day **counts** for a category if at least one block of that kind is logged as "done"
- A day **breaks** the streak if the schedule had blocks of that kind on that day AND none were marked done (or they were marked skipped)
- Days where the schedule has no blocks of that kind (e.g. gym on a rest day) are **ignored** — they neither extend nor break the streak

```typescript
function calcStreaks(allLogs: Record<string, Record<string, string>>, sem: SemesterKey) {
  // allLogs: { "2026-09-01": { "s1m-gym": "done", ... }, ... }
  // For each category:
  //   iterate dates in order
  //   check if the day's schedule (for that day's weekday) has blocks of that kind
  //   if yes: done → streak++, not done → streak = 0
  //   if no: skip
  // Return: { [categoryKey]: { streak: number, best: number, total: number } }
}
```

## Components

### `<StreakGrid>`
2-column grid of `<StreakCard>` components.

### `<StreakCard>`
Per habit category:
- Icon (large, 24px)
- Category label
- Current streak number (large, bold)
- "day streak" label
- Total completed count (small, muted)
- Card border glows in accent colour at 3+ days, bright green at 7+, gold at 30+

### `<HeatmapSection>`
Below the grid. Title "Last 7 days". One row per category.
Each row:
- Category icon + name on the left
- 7 day columns (Mon–Sun for the current week, or last 7 calendar days)
- Each cell: small coloured square
  - Empty/no blocks that day: `#141414` (no expectation)
  - Blocks expected, none done: `#1A1A1A` (missed)
  - Partially done: `#4ADE8044` (partial)
  - All done: `#C8F060` (full, acid green)
  - Today (not yet over): outlined, `#333` border
- Day letter label below each column (M T W T F S S)

### `<WeeklyScore>`
At the top, above the grid. One number: the week's overall completion percentage across all habit categories. Large display number in acid green. Label: "this week".

## Done when
- Streaks calculate correctly from real DayLog data
- Marking a block done on Today view updates the streak on Habits view after navigation
- 7-day heatmap reflects actual completion per category per day
- Rest days (no gym block) don't break the gym streak
- Cards glow appropriately at 3/7/30 day milestones
- Weekly score is accurate
