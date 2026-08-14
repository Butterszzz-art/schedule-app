# Phase 1 — Project Scaffold

## Goal
Bootstrap the full Next.js project with all dependencies, folder structure, environment config, and database connection. Nothing visual yet — just a working foundation that every later phase builds on.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM + Neon Postgres (hosted)
- **Auth**: Auth.js v5 (credentials only for now — single user app)
- **Deployment target**: Vercel

## Tasks

### 1. Init project
```bash
npx create-next-app@latest scheduleapp --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd scheduleapp
```

### 2. Install dependencies
```bash
npm install prisma @prisma/client
npm install next-auth@beta
npm install @auth/prisma-adapter
npm install bcryptjs
npm install @types/bcryptjs --save-dev
```

### 3. Prisma setup
Run `npx prisma init` and set `DATABASE_URL` in `.env` to the Neon Postgres connection string.

### 4. Create `.env.local`
```
DATABASE_URL=<neon-postgres-url>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### 5. Folder structure to create
```
app/
  (auth)/
    login/
      page.tsx
  (app)/
    layout.tsx
    page.tsx          ← redirects to /today
    today/
      page.tsx
    week/
      page.tsx
    habits/
      page.tsx
    log/
      page.tsx
  api/
    auth/
      [...nextauth]/
        route.ts
    blocks/
      route.ts
    logs/
      route.ts
components/
  ui/
  layout/
    BottomNav.tsx
    Header.tsx
lib/
  auth.ts
  db.ts
  schedule/
    blocks.ts         ← base schedule data
    cascade.ts        ← auto-reschedule logic
    types.ts
prisma/
  schema.prisma
```

### 6. Global layout
`app/layout.tsx` — set font to Space Grotesk (Google Fonts), background `#0A0A0A`, text `#F0EDE8`. Mobile viewport meta. Max-width 430px centred.

### 7. Auth setup
Create `lib/auth.ts` with Auth.js credentials provider. Single hardcoded user for now (email + bcrypt password). Protect all `(app)` routes with middleware.

### 8. DB client
`lib/db.ts` — singleton Prisma client pattern (standard Next.js pattern to avoid connection exhaustion in dev).

### 9. Health check
Add `app/api/health/route.ts` returning `{ ok: true, db: "connected" }` after a `prisma.$queryRaw` ping.

## Done when
- `npm run dev` starts without errors
- `/api/health` returns 200 with db connected
- Navigating to `/today` redirects to `/login` if unauthenticated
- Logging in with the hardcoded credentials lands on `/today`
- Prisma can connect to Neon

## Notes
- Do not build any UI pages yet — just the shell layout with empty page components
- Do not seed any data yet — that's Phase 2
- Keep `.env.local` out of git (confirm `.gitignore` has it)
