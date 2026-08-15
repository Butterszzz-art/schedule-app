# Phase 2 — Database Schema + Schedule Data

## Goal
Define the Prisma schema and write the complete TypeScript schedule data for both modes (prep/normal) and both semesters. This is the foundation everything else reads from.

## Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String
  createdAt     DateTime       @default(now())
  logs          DayLog[]
  weekOverrides WeekOverride[]
  adjustments   BlockAdjustment[]
  weightEntries WeightEntry[]
  pushSubs      PushSubscription[]
  settings      UserSettings?
}

model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  semester  Int      @default(1)   // 1 or 2
  updatedAt DateTime @updatedAt
}

model DayLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      String   // "2026-09-01"
  blockId   String   // matches id in blocks.ts
  status    String   // "done" | "skipped"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([userId, date, blockId])
  @@index([userId, date])
}

model WeekOverride {
  id       String  @id @default(cuid())
  userId   String
  user     User    @relation(fields: [userId], references: [id])
  weekKey  String  // "2026-W38"
  dayKey   String  // "Mon" | "Tue" | ...
  blockId  String
  disabled Boolean @default(true)
  createdAt DateTime @default(now())
  @@unique([userId, weekKey, dayKey, blockId])
  @@index([userId, weekKey])
}

model BlockAdjustment {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      String
  blockId   String
  startMins Int      // adjusted start in minutes from midnight
  createdAt DateTime @default(now())
  @@unique([userId, date, blockId])
}

model WeightEntry {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      String
  weight    Float    // kg
  createdAt DateTime @default(now())
  @@unique([userId, date])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

## `lib/schedule/types.ts`

```typescript
export type BlockKind =
  | 'sleep' | 'meal' | 'gym' | 'ma' | 'cardio'
  | 'mobility' | 'posing' | 'study' | 'uni'
  | 'commute' | 'prep' | 'chores' | 'read' | 'free'

export interface ScheduleBlock {
  id: string
  kind: BlockKind
  label: string
  start: number      // decimal hours e.g. 6.5 = 06:30
  dur: number        // duration in minutes
  fixed?: boolean    // cannot be cascaded past or disabled
}

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type SemesterKey = 1 | 2
export type ScheduleMode = 'prep' | 'normal'
export type WeekSchedule = Record<DayKey, ScheduleBlock[]>
```

## `lib/schedule/mode.ts`

```typescript
import { ScheduleMode } from './types'

const PREP_START = new Date('2026-08-16T00:00:00')
const PREP_END   = new Date('2026-11-02T23:59:59')

export function getScheduleMode(date: Date = new Date()): ScheduleMode {
  return date >= PREP_START && date <= PREP_END ? 'prep' : 'normal'
}

export function isPrep(date?: Date): boolean {
  return getScheduleMode(date) === 'prep'
}
```

## `lib/schedule/blocks.ts`

Write the full schedule as:
```typescript
export const SCHEDULE: Record<ScheduleMode, Record<SemesterKey, WeekSchedule>> = {
  prep: {
    1: { Mon: [...], Tue: [...], Wed: [...], Thu: [...], Fri: [...], Sat: [...], Sun: [...] },
    2: { Mon: [...], Tue: [...], Wed: [...], Thu: [...], Fri: [...], Sat: [...], Sun: [...] },
  },
  normal: {
    1: { ... },
    2: { ... },
  }
}
```

### PREP MODE rules (Aug 16 – Nov 2)
- No MA blocks anywhere
- Posing block daily at 05:30, dur: 25 min, kind: 'posing'
- Cardio on Mon (17:30), Thu (13:00), Sat (13:30), Wed (06:30), Sun (06:30) — NOT Tue or Fri
- Study blocks are descending: 2h block → short break meal → 1.5h block on gym days; add 1h block on Wed/Sun free days
- Wed/Sun: posing → M1 → cardio → M2 → study blocks → chores/prep as usual

### NORMAL MODE rules (outside prep)
- MA blocks on Wed/Sun: 07:00–08:15 (kind: 'ma'), commute to SP at 06:33
- No posing blocks
- Cardio only on Mon (17:30), Thu (13:00), Sat (13:30)
- Wed/Sun: MA → mobility → study/chores/prep

### Both modes — shared rules
- Gym 06:00–07:30 Mon/Tue/Thu/Fri. Sat: 06:30–08:00
- Mobility 20 min post-gym (kind: 'mobility', fixed: false)
- Wake 05:30, sleep 21:45
- Meals: M1 pre-gym/activity, M2 post-gym, M3 ~12:00, M4 mid-afternoon, M5 19:30
- Reading 21:00–21:30 daily
- Chores: Wed 16:00 (1h) + Sun 07:30 (1h)
- Meal prep: Wed 17:00 mini batch (1h) + Sun 12:30 main batch (3h)
- Lectures before 13:00 are skipped — only mandatory sessions and ≥13:00 lectures attended

### Semester differences (uni blocks only)
Sem 1 uni blocks:
- Mon: Wetensch. lecture 13:00, Tutorial 15:00 (fixed)
- Tue: Van Perceptie 13:00, Lin. Algebra 15:00 (fixed)
- Wed: Practical 09:00 (mandatory, fixed)
- Thu: Tutorial 09:00 (mandatory, fixed), Lin.Alg PS study block 16:00
- Fri: Seminar 13:00, Lecture 15:00 (fixed)

Sem 2 uni blocks:
- Mon: Seminar 11:00 (mandatory, fixed), Computer lab 13:00, Leren&Geh 15:00, Experimentatie 17:00 (all fixed)
- Tue: Exp. 13:00, Lin. Algebra 15:00, Exp. eve 17:00 (fixed)
- Wed: Computer lab 13:00 (fixed)
- Thu: Leren&Geh 13:00 (fixed), Lin.Alg PS 16:00
- Fri: Exp. seminar 09:00 (mandatory, fixed), Lin.Alg+L&G 13:00, Seminar 15:00 (fixed)

## `lib/schedule/cascade.ts`

```typescript
export function cascade(
  blocks: ScheduleBlock[],
  changedIdx: number,
  newEndMins: number
): ScheduleBlock[] {
  const result = blocks.map(b => ({ ...b }))
  let cursor = newEndMins
  for (let i = changedIdx + 1; i < result.length; i++) {
    if (result[i].fixed) break
    const origStart = Math.round(result[i].start * 60)
    if (origStart >= cursor) break
    result[i].start = cursor / 60
    cursor += result[i].dur
  }
  return result
}
```

## Seed script
`prisma/seed.ts` — create one user with bcrypt-hashed password.

## Migrations
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

## Done when
- All tables created in Neon
- `SCHEDULE.prep[1].Wed` has posing + cardio + study blocks, no MA
- `SCHEDULE.normal[1].Wed` has MA blocks, no posing
- `SCHEDULE.prep[1].Tue` has NO cardio block
- `SCHEDULE.prep[1].Mon` has cardio at 17:30
- `getScheduleMode(new Date('2026-09-01'))` returns 'prep'
- `getScheduleMode(new Date('2026-12-01'))` returns 'normal'
- Cascade unit tests pass
