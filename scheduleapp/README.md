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
  the fixed daily rhythm (sleep/gym/MA/cardio/posing/meals) as a
  mode-and-semester-keyed template. Real university class sessions live
  separately in `lib/schedule/uni.ts`, keyed by actual calendar date,
  because the real UvA timetable is irregular week to week — a repeating
  template can't represent it. `getBlocksForDate()` merges the two per day.
- **Two schedule modes, derived from the date, never stored.**
  `lib/schedule/mode.ts`'s `getScheduleMode(date)` returns `'prep'`
  (Aug 16 – Nov 2, 2026: posing daily, MA suspended, cardio 5 days/week) or
  `'normal'` (everything else: MA on Wed/Sun, no posing, cardio 3
  days/week). `SCHEDULE` is `Record<ScheduleMode, Record<SemesterKey,
  WeekSchedule>>`. Normal mode's exact block data isn't sourced from
  anything (the reference prototype `schedule-app.jsx` never implemented
  it — its own `SCHEDULE.normal` is a same-as-prep placeholder); it's this
  codebase's own construction from CLAUDE.md's written rules, adjustable
  in `lib/schedule/blocks.ts`.
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

1. Push to GitHub (the repo root is one level above this app — see below).
2. Import the repo into Vercel, and set **Settings → General → Root
   Directory** to `scheduleapp`. This is easy to miss: the repo also
   contains `scheduleapp-prompts/` as a sibling directory, so the Next.js
   app is *not* at the repo root. Without this, Vercel won't find
   `package.json` and "builds" a static, routeless deployment in a few
   hundred ms — every path 404s, with no build error to point at.
3. Set the env vars listed above in the Vercel dashboard (`AUTH_URL`
   should be the deployment's real `https://…vercel.app` URL).
4. Redeploy.

### Push notification reminders need an external cron, not Vercel Cron

`/api/cron/notify` needs to be polled roughly every minute to catch each
block's short notification window (see `lib/notify.ts`). Vercel's own Cron
Jobs are capped at once/day on the Hobby plan, so `vercel.json`
deliberately does **not** define a `crons` entry (a sub-daily one blocks
the whole deployment on Hobby).

Instead, point a free external scheduler — e.g. [cron-job.org](https://cron-job.org)
— at `https://<your-app>.vercel.app/api/cron/notify` every minute, with
header `Authorization: Bearer <CRON_SECRET>` (same value as the env var).
`/api/push/send` uses the same bearer check if you wire up an additional
trigger there. If you're on Vercel Pro instead, you can add the `crons`
entry back to `vercel.json` and skip the external scheduler.
