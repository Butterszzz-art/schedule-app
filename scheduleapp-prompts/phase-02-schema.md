# Phase 2 — Database Schema + Seed

## Goal
Define the full Prisma schema covering users, the base schedule, daily logs, and week overrides. Seed the database with the complete 7-day schedule for both semesters.

## Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  logs      DayLog[]
  weekOverrides WeekOverride[]
  settings  UserSettings?
}

model UserSettings {
  id        String  @id @default(cuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])
  semester  Int     @default(1)   // 1 or 2
  updatedAt DateTime @updatedAt
}

// A single logged block for a specific date
model DayLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      String   // ISO date: "2026-09-01"
  blockId   String   // matches id in schedule data e.g. "s1m-gym"
  status    String   // "done" | "skipped"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date, blockId])
  @@index([userId, date])
}

// Per-week block toggles (disabled blocks for a specific ISO week)
model WeekOverride {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  weekKey   String   // ISO week: "2026-W38"
  dayKey    String   // "Mon" | "Tue" | ...
  blockId   String   // block to disable
  disabled  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([userId, weekKey, dayKey, blockId])
  @@index([userId, weekKey])
}

// Adjusted block times for a specific day (when user pushes +15m)
model BlockAdjustment {
  id        String   @id @default(cuid())
  userId    String
  date      String   // ISO date
  blockId   String
  startMins Int      // adjusted start in minutes from midnight
  createdAt DateTime @default(now())

  @@unique([userId, date, blockId])
}
```

## Schedule data in code (not DB)

The base schedule blocks live in `lib/schedule/blocks.ts` as a TypeScript constant — **not in the database**. The DB only stores what changes (logs, overrides, adjustments). This keeps queries simple and the schedule data versioned in code.

### `lib/schedule/types.ts`
```typescript
export type BlockKind =
  | 'sleep' | 'meal' | 'gym' | 'ma' | 'cardio'
  | 'mobility' | 'study' | 'uni' | 'commute'
  | 'prep' | 'chores' | 'read' | 'free'

export interface ScheduleBlock {
  id: string
  kind: BlockKind
  label: string
  start: number     // decimal hours e.g. 6.5 = 06:30
  dur: number       // duration in minutes
  fixed?: boolean   // true = cannot be cascaded past or disabled
}

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type SemesterKey = 1 | 2

export type WeekSchedule = Record<DayKey, ScheduleBlock[]>
export type SemesterSchedule = Record<SemesterKey, WeekSchedule>
```

### `lib/schedule/blocks.ts`
Port the full schedule data from the reference artifact (`schedule-app.jsx`) into typed TypeScript. Include both semesters. Key rules encoded in the data:
- Cardio blocks only appear on Upper days: Mon, Thu, Sat
- Mon cardio at 17.5 (after returning home from uni)
- Thu cardio at 12.5 (before uni, 6h+ post-gym)
- Sat cardio at 13.5
- Tue and Fri have NO cardio blocks — never add them
- Wed and Sun are rest days (MA, no lifting)
- fixed: true on all uni sessions that cannot be toggled

### `lib/schedule/cascade.ts`
```typescript
export function cascade(
  blocks: ScheduleBlock[],
  changedIdx: number,
  newEndMins: number
): ScheduleBlock[] {
  // Push all subsequent non-fixed blocks forward
  // Stop at any fixed block
  // Return new array (do not mutate)
}
```

## Seed script

`prisma/seed.ts` — create one user with:
- email: your chosen login email
- password: bcrypt hash of your chosen password

Run with `npx prisma db seed`.

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

## Migrations
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

## Done when
- `npx prisma studio` shows all tables created
- Seed user exists in the User table
- `lib/schedule/blocks.ts` exports both semesters with all 7 days
- Cascade function has unit tests (create `__tests__/cascade.test.ts`)
- No cardio blocks on Tue or Fri in either semester

## Notes
- Keep the schedule as static TypeScript data — do not try to store blocks in the DB
- The `blockId` in DayLog/WeekOverride/BlockAdjustment must exactly match the `id` fields in `blocks.ts`
- Add a comment at the top of `blocks.ts`: `// Cardio rule: Upper days only (Mon/Thu/Sat). Never after lower body (Tue/Fri).`
