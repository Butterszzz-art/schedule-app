# Phase 10 — Polish + Deploy

## Goal
Final QA pass, visual polish, performance checks, then production deploy to Vercel with Neon Postgres.

## Visual polish checklist

### Typography
- Space Grotesk loaded via `next/font/google` (not a CDN link — faster, no flash)
- Font weights used: 400 (body), 600 (labels), 700 (headings/numbers)
- Tabular nums on all countdown timers and weights: `fontVariantNumeric: 'tabular-nums'`

### Animations
- Pulsing dot on active block: CSS `@keyframes pulse` (opacity + scale)
- Block cascade on +15m: 150ms staggered `translateY` transition per block
- Page transitions: simple fade (150ms opacity) between tab switches
- Progress bar fill: `transition: width 0.3s ease`
- Streak card border glow: `box-shadow` transition on milestone thresholds
- Reduce motion: wrap all animations in `@media (prefers-reduced-motion: reduce) { ... }` to disable

### Spacing and layout
- All screens: `padding: 14px 16px` sides, `padding-bottom: 84px` to clear fixed bottom nav
- Bottom nav height: 64px + safe-area-inset-bottom (for iPhone notch)
- Cards: `border-radius: 12px`, `border: 1px solid #1A1A1A`
- Section labels: `font-size: 11px`, `letter-spacing: 0.1em`, `text-transform: uppercase`, `color: #444`

### Colours (confirm throughout)
- Background: `#0A0A0A`
- Surface 1 (cards): per-kind dark background
- Borders: `#1A1A1A` default, kind accent when active
- Primary text: `#F0EDE8`
- Secondary text: `#666`
- Muted text: `#3A3A3A`
- Accent: `#C8F060` (acid green — streaks, progress, current block)

### Bottom nav
- Fixed, `backdrop-filter: blur(16px)`, `border-top: 1px solid #161616`
- Safe area padding on iOS: `padding-bottom: calc(20px + env(safe-area-inset-bottom))`
- Active tab: `#C8F060`, inactive: `#333`
- Tabs: Today · Week · Habits · Log · Prep (5 tabs)

## Performance checklist
- [ ] No layout shift on load (avoid font flash — use `next/font`)
- [ ] Today page server-renders the initial block list (fast first paint)
- [ ] API routes return in < 200ms (Neon connection pooling enabled)
- [ ] Images: none used (icon only, already optimised PNG)
- [ ] Bundle size: run `next build` and check — no unexpected large imports

## QA checklist

### Functionality
- [ ] Marking done/skipped persists after page refresh
- [ ] +15m cascade doesn't push past fixed blocks
- [ ] Disabled blocks don't count toward progress or streaks
- [ ] Semester switch updates Today, Week, Habits, and Log views
- [ ] Weight entries save and show variance vs target
- [ ] Streaks don't break on days with no expected blocks

### Mobile
- [ ] No horizontal scroll on 375px width (iPhone SE)
- [ ] Bottom nav doesn't cover content
- [ ] Tappable targets are at least 44px tall
- [ ] Countdown timer doesn't flicker or jump
- [ ] Install prompt shows on Safari mobile

### Edge cases
- [ ] Day boundary: app shows correct day after midnight
- [ ] Weekend: Sat/Sun schedule loads correctly
- [ ] All blocks done: hero card shows "All done" state
- [ ] No logs yet: Log view shows empty state message
- [ ] Prep page after Oct 17: Show 1 card is muted, countdown shows Show 2

## Vercel deploy

### Environment variables to set in Vercel dashboard
```
DATABASE_URL          ← Neon pooled connection string
NEXTAUTH_SECRET       ← same as local
NEXTAUTH_URL          ← https://your-vercel-url.vercel.app
VAPID_PUBLIC_KEY      ← from web-push generateVAPIDKeys()
VAPID_PRIVATE_KEY     ← from web-push generateVAPIDKeys()
CRON_SECRET           ← random string to authenticate cron endpoint
```

### Neon setup
- Use the **pooled** connection string for `DATABASE_URL` in production (Neon provides both)
- Run `npx prisma migrate deploy` (not `migrate dev`) in production

### Deploy steps
```bash
# 1. Push to GitHub
git add . && git commit -m "feat: complete schedule app" && git push

# 2. Import repo in Vercel dashboard
# 3. Add all env variables
# 4. Deploy
# 5. Run migrations: vercel env pull && npx prisma migrate deploy
```

### Custom domain (optional)
Point a subdomain (e.g. `schedule.yourdomain.com`) to Vercel — update `NEXTAUTH_URL` accordingly.

## Done when
- `vercel --prod` deploys without errors
- Production app is accessible on mobile browser
- Logging in works with production credentials
- Today view loads with correct blocks for the current day
- Push notifications arrive on the installed PWA
- All QA checklist items pass
