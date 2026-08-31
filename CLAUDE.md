# Schedule App — Claude Code Context

## What this is
A personal mobile-first schedule and habit tracker app for a natural classic physique bodybuilder-student. Built to replace a static PDF schedule with a live, interactive system. The user is preparing for two shows in Oct/Nov 2026 while studying Psychology at UvA (Science Park, Amsterdam) and living on Zeeburgeiland.

## Tech stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + Neon Postgres
- Auth.js v5 (credentials, single user)
- Vercel deployment

## Design system
- Background: `#0A0A0A`
- Primary text: `#F0EDE8`
- Accent: `#C8F060` (acid green)
- Font: Space Grotesk (400, 600, 700)
- Max width: 430px (mobile-first, centred)
- Cards: `border-radius: 12px`, `border: 1px solid #1A1A1A`
- Bottom nav: fixed, blurred, 5 tabs

## Block kind colour map
- sleep:    #141414 / #3A3A3A
- meal:     #1C1408 / #C8962A
- gym:      #081A10 / #4ADE80
- ma:       #1A0A08 / #F87171
- cardio:   #141414 / #94A3B8
- mobility: #1A0814 / #F472B6
- posing:   #1A1000 / #E09000   ← new
- study:    #08101A / #60A5FA
- uni:      #0E0820 / #A78BFA
- commute:  #121210 / #7A7A6A
- prep:     #1A0E00 / #FB923C
- chores:   #1A0808 / #FCA5A5
- read:     #081408 / #86EFAC
- free:     #0E0E0E / #C8F060
- content:  #0D0D1A / #818CF8   ← new (IG/YouTube/Websites, prep mode)

---

## Schedule modes — CRITICAL

The app has two distinct schedule modes that must be handled separately in `lib/schedule/blocks.ts`:

### Mode 1: PREP MODE
**Active: Aug 16, 2026 → Nov 2, 2026**
Determined by checking today's date against this range.

Key differences from normal:
- **Martial arts SUSPENDED** — no MA blocks on any day
- **Wake 06:30, sleep 22:30** (retimed 2026-08-30, was 05:30/21:45) — still 8h non-negotiable, PREP mode only
- **Posing practice daily at 06:30** (fasted, ~20 min) before M1 and gym
- **M1 06:50 → commute to gym 07:10 → gym 07:30** — a real "→ Gym" commute block sits between M1 and gym now (didn't exist before the retime)
- **Cardio on 5 days**: Mon 17:30 · Thu 14:20 · Sat 14:20 · Wed 07:00 · Sun 07:00
  - Wed and Sun get cardio because MA is gone and there's no lifting fatigue
  - Still NO cardio on Tue or Fri (lower body days — quad recovery)
- **Content blocks daily**: Instagram post 20:00–20:10 every day; Website maintenance 20:15–21:00 Tue/Thu; YouTube 14:50–15:50 Saturday (see Content creation schedule below)
- **Wed/Sun slots repurposed**: posing → cardio → full study morning → chores/prep as usual
- **Study blocks are descending**: 2h → 1.5h with break between on gym days; 2h → 1.5h → 1h on rest days (Wed/Sun)

### Mode 2: NORMAL MODE
**Active: outside the prep window (before Aug 16 or after Nov 2)**
- Martial arts Wed/Sun 07:00–08:15 at Science Park
- Cardio on Upper days only: Mon/Thu/Sat
- No posing blocks
- Wed/Sun: MA → mobility → study/chores/prep

---

## Critical schedule rules (apply to BOTH modes unless noted)

1. **NO cardio on Tue or Fri** — lower body days, quad recovery is a competitive priority
2. **Gym 07:30–09:00** on lifting days in PREP mode, all days incl. Sat (retimed 2026-08-30, was 06:00–07:30 / Sat 06:30–08:00). NORMAL mode keeps the original **06:00–07:30** (Sat 06:30–08:00).
3. **Mobility 20 min** immediately after gym, before leaving
4. **Wake/sleep**: PREP mode 06:30 / 22:30 (retimed 2026-08-30, was 05:30/21:45). NORMAL mode still 05:30 / 21:45 — the retime wasn't applied there. Both are 8 hours non-negotiable.
5. **Protein 164g every day** regardless of calorie level
6. **Posing practice 06:30 daily** — PREP MODE only. Fasted. ~20 min. (was 05:30/~25 min before the 2026-08-30 retime)
7. **Study blocks are descending in length**: 2h → 1.5h → (1h on full free days) with short breaks between. Never stack two long blocks without a break.
8. **Lectures before 13:00 are skipped** — only attend mandatory sessions and anything starting ≥ 13:00

## Nutrition targets
Per prep-blueprint-v5.html (2026-08-24 correction — true maintenance was
2700kcal, corrected to 2900kcal; collapses the old heavy/moderate lift
split into a flat training/rest split):

| Day type | Trigger | Calories | Protein | Carbs | Fat |
|----------|---------|----------|---------|-------|-----|
| Training | Lift day (Mon/Tue/Thu/Fri/Sat) | 2400 | 164g | 246g | 69g |
| Rest | Nothing (Wed/Sun) | 2240 | 164g | 196g | 89g |

## Content creation schedule (PREP mode, added 2026-08-30)
| Task | When | Duration |
|------|------|----------|
| Instagram filming | During gym session (existing block) | 0 extra time |
| Instagram post/caption | Daily 20:00–20:10 | 10 min |
| YouTube (film + edit + upload) | Saturday 14:50–15:50 | 1h |
| Website maintenance | Tuesday + Thursday 20:15–21:00 | 45 min × 2 |

Instagram content is filmed during gym — no separate block needed. These are `content` block kind entries (see colour map above); not tracked as a habit category.

## Schedule mode detection in code
```typescript
export type ScheduleMode = 'prep' | 'normal'

export function getScheduleMode(date: Date = new Date()): ScheduleMode {
  const prepStart = new Date('2026-08-16')
  const prepEnd   = new Date('2026-11-02')
  return date >= prepStart && date <= prepEnd ? 'prep' : 'normal'
}
```

All schedule-related functions must accept a `mode` parameter and return the correct block set.

## Competition timeline
- Show 1: Oct 17, 2026 — NPC Spain Naturals, Aranjuez (live rehearsal)
- Show 2: Oct 30 – Nov 1, 2026 — Euronaturals Pro Qualifier, Madrid (9 IFBB Pro Cards)
- Stage target: ~77kg at 4–6% body fat (revised from ~75kg per prep-blueprint-v5.html — abs, not scale weight, are the limiting factor at this point)
- Start weight: 86kg (Jun 1, 2026)
- Prep phases: Base Cut → Vacation (Aruba) → Real Prep → Final Push

## Semester definitions
- Semester 1: Sep – Oct 2026 (overlaps with prep)
- Semester 2: Nov – Dec 2026 (overlaps with post-show)

Both semesters exist in both modes. Mode takes priority over semester for shared blocks (posing, cardio placement, MA). Semester only controls which uni blocks appear.

## Habit categories
| Key | Label | Icon | Block kinds tracked |
|-----|-------|------|---------------------|
| gym | Gym | 💪 | gym |
| posing | Posing | 🕴 | posing (prep mode only) |
| cardio | Cardio | 🏃 | cardio |
| mobility | Mobility | 🧘 | mobility |
| study | Study | 📚 | study |
| nutrition | Nutrition | 🍱 | meal, prep |
| reading | Reading | 📖 | read |
| chores | Chores | 🧹 | chores |

Posing habit only tracked during prep mode. Outside prep, the posing card is hidden.

## File structure
```
app/
  (auth)/login/
  (app)/
    today/
    week/
    habits/
    log/
    prep/
  api/
    auth/[...nextauth]/
    logs/
    adjustments/
    overrides/
    settings/
    weight/
    push/
    cron/
lib/
  auth.ts
  db.ts
  schedule/
    blocks.ts     ← ALL schedule data, both modes, both semesters
    cascade.ts    ← auto-reschedule logic
    types.ts      ← ScheduleMode, ScheduleBlock, DayKey, etc.
    mode.ts       ← getScheduleMode(), isPrep(), etc.
components/
  ui/
  layout/
    BottomNav.tsx
    Header.tsx
prisma/
  schema.prisma
  seed.ts
```

## What lives in DB vs code
- **Code**: all block definitions, both modes, both semesters, cascade logic, mode detection
- **DB**: logs (done/skipped), week overrides, block time adjustments, weight entries, push subscriptions, semester setting, mode is computed from date (not stored)

## Phase completion order
1. Scaffold
2. Schema + seed (include mode-aware block data)
3. Today view (mode-aware hero card, posing block, correct cardio days)
4. Week view (semester toggle + mode banner)
5. Habits view (posing habit only in prep mode)
6. Log view
7. Nutrition layer
8. Prep timeline (phase tracker, weight logging, show countdown)
9. PWA + push notifications
10. Polish + deploy
