# Schedule App — Claude Code Context

## What this is
A personal mobile-first schedule and habit tracker app for a student-athlete. Built to replace a static PDF schedule with a live, interactive system. The user is a natural classic physique competitor preparing for two shows in October 2026, while also studying Psychology at UvA (Science Park, Amsterdam) and living on Zeeburgeiland.

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
Each block kind has a dark background + accent colour pair:
- sleep:    #141414 / #3A3A3A
- meal:     #1C1408 / #C8962A
- gym:      #081A10 / #4ADE80
- ma:       #1A0A08 / #F87171
- cardio:   #141414 / #94A3B8
- mobility: #1A0814 / #F472B6
- study:    #08101A / #60A5FA
- uni:      #0E0820 / #A78BFA
- commute:  #121210 / #7A7A6A
- prep:     #1A0E00 / #FB923C
- chores:   #1A0808 / #FCA5A5
- read:     #081408 / #86EFAC
- free:     #0E0E0E / #C8F060

## Critical schedule rules (never violate)
1. **Cardio on Upper days only**: Mon, Thu, Sat. NEVER on Tue or Fri (lower body days).
2. **Quads are the primary competitive advantage** — their recovery takes priority.
3. **Wed and Sun are rest days** (martial arts, no lifting, no cardio).
4. **Gym 06:00–07:30** on lifting days. Mobility 20 min in gym immediately after.
5. **Wake 05:30, sleep 21:45** — 8 hours. Non-negotiable.
6. **Cardio placement**: Mon 17:30 (after home from uni), Thu 12:30 (before uni, 6h+ post-gym), Sat 13:30.
7. **Martial arts 07:00–08:15 at Science Park** on Wed and Sun.
8. **Protein 164g every day** regardless of calorie level or day type.

## Nutrition targets (from prep blueprint)
| Day type | Calories | Protein | Carbs | Fat |
|----------|----------|---------|-------|-----|
| Heavy lift (Upper: Mon/Thu/Sat) | 2500 | 164g | 335g | 55g |
| Moderate lift (Lower: Tue/Fri)  | 2200 | 164g | 251g | 60g |
| True rest (MA days: Wed/Sun)    | 1700 | 164g | 104g | 70g |

## Competition timeline
- Show 1: Oct 17, 2026 — NPC Spain Naturals, Aranjuez (live rehearsal)
- Show 2: Oct 30–Nov 1, 2026 — Euronaturals Pro Qualifier, Madrid (9 IFBB Pro Cards)
- Stage weight target: ~75kg at 4–6% body fat
- Start weight: 86kg (June 1, 2026)

## File structure
```
app/
  (auth)/login/
  (app)/
    today/      ← main daily view
    week/       ← week overview + block toggles
    habits/     ← streaks + heatmap
    log/        ← daily history
    prep/       ← competition timeline + weight tracking
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
    blocks.ts   ← ALL schedule data lives here (not in DB)
    cascade.ts  ← auto-reschedule logic
    types.ts
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
- **In code** (`lib/schedule/blocks.ts`): all base schedule blocks, both semesters
- **In DB**: user logs (done/skipped), week overrides (toggled off blocks), block time adjustments (+15m), weight entries, push subscriptions, user settings (semester)

## Phase completion order
1. Scaffold (Next.js + auth + DB connection)
2. Schema + seed (Prisma schema + schedule data in TypeScript)
3. Today view (hero card, countdown, mark done, +15m cascade)
4. Week view (semester toggle, per-week block toggles)
5. Habits view (streaks, heatmap)
6. Log view (daily history)
7. Nutrition layer (day type detection, macro targets, meal timing)
8. Prep timeline (phase tracker, weight logging, show countdown)
9. PWA + push notifications (installable, block reminders)
10. Polish + deploy (Vercel + Neon production)
