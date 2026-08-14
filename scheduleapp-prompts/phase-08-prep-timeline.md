# Phase 8 — Prep Timeline Tracker

## Goal
A dedicated screen tracking competition prep progress: current phase, weeks out, weight targets vs actuals, and show countdown. This is the big picture view — the schedule app knows you're an athlete preparing for a show, not just a student.

## Route
`app/(app)/prep/page.tsx`
Add "Prep" tab to bottom nav (replace or add to existing tabs).

## Static prep data (hardcoded from blueprint)

```typescript
const PREP_PHASES = [
  { name: "Base Cut",   start: "2026-06-01", end: "2026-07-25", color: "#4ADE80" },
  { name: "Vacation",   start: "2026-07-25", end: "2026-08-04", color: "#60A5FA" },
  { name: "Real Prep",  start: "2026-08-04", end: "2026-09-05", color: "#FB923C" },
  { name: "Final Push", start: "2026-09-05", end: "2026-10-17", color: "#F87171" },
]

const SHOWS = [
  { name: "Show 1 — NPC Spain Naturals", date: "2026-10-17", venue: "Aranjuez, Madrid", cards: null },
  { name: "Show 2 — Euronaturals Pro Qualifier", date: "2026-10-30", venue: "Madrid", cards: "9 IFBB Pro Cards" },
]

const WEIGHT_TARGETS = [
  { date: "2026-06-08", target: 85.2 },
  { date: "2026-06-15", target: 84.5 },
  { date: "2026-06-22", target: 83.7 },
  { date: "2026-06-29", target: 83.0 },
  { date: "2026-07-06", target: 82.2 },
  { date: "2026-07-13", target: 81.5 },
  { date: "2026-07-20", target: 80.7 },
  { date: "2026-07-25", target: 80.0 },  // depart
  { date: "2026-08-04", target: 81.0 },  // return
  { date: "2026-08-11", target: 80.0 },
  { date: "2026-08-18", target: 79.2 },
  { date: "2026-08-25", target: 78.5 },
  { date: "2026-09-01", target: 77.8 },
  { date: "2026-09-08", target: 77.0 },
  { date: "2026-09-15", target: 76.3 },
  { date: "2026-09-22", target: 75.7 },
  { date: "2026-09-29", target: 75.2 },
  { date: "2026-10-10", target: 74.5 },  // peak week
  { date: "2026-10-17", target: 75.0 },  // stage
]
```

## DB addition needed
```prisma
model WeightEntry {
  id        String   @id @default(cuid())
  userId    String
  date      String   // ISO date
  weight    Float    // kg
  createdAt DateTime @default(now())

  @@unique([userId, date])
}
```

Add `POST /api/weight` to log a weight entry.

## Components

### `<PrepHeader>`
Top of prep page:
- Current phase name + phase colour accent
- "X weeks out" from Show 1 (or Show 2 if Show 1 has passed)
- Start weight (86kg) → Current → Target (75kg) shown as a simple progress arrow
- Days until next show with a countdown

### `<PhaseTimeline>`
Horizontal scrollable timeline showing all 4 phases as coloured segments. Current position marked with a vertical line labelled "TODAY". Shows phase names and date ranges. Vacation phase shown in blue.

### `<WeightTracker>`
- Input field + "Log weight" button (POST to `/api/weight`)
- Weekly target for this week shown prominently
- Variance: actual vs target in green (ahead) or red (behind)
- Last 4 logged weights shown as a mini list with dates
- Rule shown below: "Use weekly average — not single-day readings. React to trends over 7–10 days."

### `<ShowCard>`
One per show. Shows:
- Show name, date, venue
- Days remaining (countdown)
- For Show 1: "Live rehearsal — test peak week protocol"
- For Show 2: "9 IFBB Pro Cards on the table"
- Show 1 card goes muted after Oct 17

### `<PriorityGaps>`
Static list from the blueprint. Each item as a card:
- Upper chest: "Incline press as primary movement 2×/week"
- Rear/medial delts: "Lateral raises, rear delt flyes, face pulls — every upper session"
- Traps: "Heavy shrugs and rack pulls every back day"
- Posing: "15 min daily — film from jury angle"

## Done when
- Current prep phase is correctly identified from today's date
- Weeks out countdown is accurate for both shows
- Weight entries can be logged and persist
- Weekly target shows for the current week (from WEIGHT_TARGETS array)
- Variance is shown correctly (green/red)
- Phase timeline shows correct current position
