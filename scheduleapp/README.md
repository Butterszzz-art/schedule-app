# Schedule

A personal mobile-first schedule and habit tracker — Today view, week overrides,
habit streaks, history, nutrition targets, and a competition prep timeline. Built
for a single user; see [`CLAUDE.md`](../CLAUDE.md) at the repo root for the full
project context and design system.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript, Tailwind CSS v4
- Prisma 7 + Neon Postgres (driver adapter, `@prisma/adapter-pg`)
- Auth.js v5 (credentials, single user)
- Web Push (`web-push`) + a hand-written service worker for PWA installability
  and reminders — not `next-pwa`, which is a webpack-era plugin incompatible
  with Turbopack

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, etc. — see below
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open http://localhost:3000 and log in with the email/password from `.env`
(`AUTH_USER_EMAIL` / `AUTH_USER_PASSWORD` — the seed script hashes the password
into the `User` table; the app never reads that env var again after seeding).

## Environment variables

See [`.env.example`](.env.example) for the full list with generation
instructions. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon) |
| `AUTH_SECRET`, `AUTH_URL` | Auth.js session signing / base URL |
| `AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD` | Seed-time only — creates the one `User` row |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push |
| `CRON_SECRET` | Bearer token Vercel Cron (and `/api/push/send`) must present |

## Scripts

```bash
npm run dev              # start dev server
npm run build             # production build
npm run test              # vitest (unit tests for lib/*)
npm run lint               # eslint
npm run db:migrate        # prisma migrate dev
npm run db:seed           # prisma db seed
npm run db:studio         # prisma studio
node scripts/generate-icons.mjs                    # regenerate PWA icons
node scripts/parse-timetable.mjs path/to/export.csv  # regenerate lib/schedule/uni.ts
                                                       # from a fresh UvA timetable export
```

## Architecture notes

- **Schedule data lives in code, not the DB.** `lib/schedule/blocks.ts` holds
  the fixed daily rhythm (sleep/gym/MA/cardio/meals) as a semester-keyed
  template. Real university class sessions live separately in
  `lib/schedule/uni.ts`, keyed by actual calendar date, because the real
  UvA timetable is irregular week to week — a repeating template can't
  represent it. `getBlocksForDate()` merges the two per day.
- **The DB only stores what changes**: `DayLog` (done/skipped), `WeekOverride`
  (per-week block toggles), `BlockAdjustment` (+15m pushes), `WeightEntry`,
  `PushSubscription`, `NotifiedBlock` (push dedup), `UserSettings` (semester).
- **Semester 2's uni data is currently empty** — that timetable isn't
  published yet. Re-run `scripts/parse-timetable.mjs` once it is.
- Full build history and the reasoning behind each deviation from the
  original phase prompts (in `../scheduleapp-prompts/`) is in the git log —
  each phase was committed and verified end-to-end against a live DB before
  moving to the next.

## Deploying

See the deploy checklist shared alongside this repo, or `../scheduleapp-prompts/phase-10-deploy.md`
for the original plan. Short version: push to GitHub, import into Vercel,
set the env vars above (use Neon's **pooled** connection string), run
`npx prisma migrate deploy` against production, then `vercel --prod`.
