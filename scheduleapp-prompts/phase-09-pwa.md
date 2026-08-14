# Phase 9 — PWA + Push Notifications

## Goal
Make the app installable on iOS and Android as a home screen app. Add push notifications for upcoming blocks so the schedule runs itself — the app reminds you, you don't have to check it.

## PWA setup

### `public/manifest.json`
```json
{
  "name": "Schedule",
  "short_name": "Schedule",
  "description": "Personal schedule and habit tracker",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#0A0A0A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Generate icons: a simple dark square with "S" in acid green (#C8F060). Use `sharp` or a canvas script to generate the two PNG sizes.

### Add to `app/layout.tsx`
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0A0A0A" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### Service worker
Use `next-pwa` package:
```bash
npm install next-pwa
```
Configure in `next.config.js`. This handles caching automatically.

## Push notifications

### DB addition
```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

### `POST /api/push/subscribe`
Save a Web Push subscription to the DB.

### `POST /api/push/send` (internal, called by cron)
Send a push notification to all subscriptions for a user.

### Client-side subscription
In `<NotificationSetup>` component (add to settings page):
```typescript
// Request permission
// Subscribe to push
// POST subscription to /api/push/subscribe
```

### Notification triggers
Use Vercel Cron Jobs (`vercel.json`):
```json
{
  "crons": [
    { "path": "/api/cron/notify", "schedule": "* * * * *" }
  ]
}
```

`/api/cron/notify` runs every minute, checks if any block starts in the next 10 minutes for any user, and sends a push notification if one hasn't been sent already.

Notification content:
- Title: block label (e.g. "Upper body")
- Body: "Starts in 10 minutes · 06:00–07:30"
- Icon: `/icon-192.png`

Use `web-push` npm package for sending.

### Notification types to send
- Gym / MA starting in 10 minutes
- Cardio starting in 10 minutes
- Meal blocks (M1, M2, M3, M4, M5) — 5 minutes before
- Reading / sleep — 15 minutes before

### iOS note
iOS only supports push notifications for installed PWAs (added to home screen). Add an install prompt banner that appears on first visit from Safari, guiding the user to "Add to Home Screen".

## Install prompt
`<InstallBanner>` component — shows only on mobile Safari when the app is not installed. Dismissible, stores dismissal in localStorage.

## Done when
- App can be installed from Safari on iPhone
- App runs in standalone mode (no browser chrome)
- Push notifications arrive for gym sessions
- Cron job runs on Vercel without errors
- Notification permission prompt is shown on first load
