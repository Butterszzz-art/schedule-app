# Phase 7 — Nutrition Layer

## Goal
Surface the correct calorie and macro targets for today based on the training day type, pulled directly from the competition prep blueprint. Shown as a card on the Today view and as a standalone section.

## Day type logic
Determine today's day type from the schedule:

```typescript
type DayType = 'heavy_lift' | 'moderate_lift' | 'rest'

function getDayType(dayKey: DayKey, sem: SemesterKey): DayType {
  const blocks = SCHEDULE[sem][dayKey]
  const hasGym = blocks.some(b => b.kind === 'gym')
  const hasMA  = blocks.some(b => b.kind === 'ma')
  
  if (!hasGym && !hasMA) return 'rest'
  if (hasMA) return 'rest'  // MA days = True Rest per blueprint
  
  // Gym days: Upper = heavy, Lower = moderate
  const gymBlock = blocks.find(b => b.kind === 'gym')
  if (gymBlock?.label.toLowerCase().includes('upper')) return 'heavy_lift'
  return 'moderate_lift'
}
```

## Targets per day type (from blueprint)

| Day type | Trigger | Calories | Protein | Carbs | Fat |
|----------|---------|----------|---------|-------|-----|
| Heavy lift | Upper body (Mon/Thu/Sat) | 2500 kcal | 164g | 335g | 55g |
| Moderate lift | Lower body (Tue/Fri) | 2200 kcal | 164g | 251g | 60g |
| True rest | MA days + rest (Wed/Sun) | 1700 kcal | 164g | 104g | 70g |

Weekly average: ~2130 kcal. Protein is **always 164g** regardless of day type.

## Components

### `<NutritionCard>` (add to Today view, below progress bar)
Compact card showing today's targets:
- Day type label: "HEAVY LIFT DAY" / "MODERATE LIFT DAY" / "REST DAY"
- Four macro pills: kcal / protein / carbs / fat
- Protein always shown in green (non-negotiable, flat every day)
- Carbs colour-coded: green on heavy days, yellow on moderate, red/low on rest
- Small note: "Protein: 164g every day regardless of calories"

### `<NutritionPage>` (optional standalone at `/nutrition`)
Expandable view showing all three day types in a table, the weekly average, and the cardio rule note: "Cardio is the last dial — only add if weekly average stalls despite diet adherence."

## Meal timing reminder
Below the macro card, show today's 5 meal times based on the schedule:
- Pull the 5 meal blocks from today's schedule
- Display as a simple list: M1 05:30 · M2 08:15 · M3 12:00 · M4 varies · M5 19:30
- Highlight the next upcoming meal in accent colour

## Done when
- Today view shows the correct day type and macros for Mon (heavy), Tue (moderate), Wed (rest), etc.
- Protein is always shown as 164g
- Meal timing list reflects actual block times from today's schedule
- Card is compact enough not to push the block list far down the screen
