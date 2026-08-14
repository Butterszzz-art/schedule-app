# Phase 3 — Today View

## Goal
Build the core daily view. This is the screen that gets opened every morning and checked throughout the day. It must be fast, glanceable, and require minimal taps.

## Route
`app/(app)/today/page.tsx`

## Data fetching
Server component fetches:
1. Today's blocks from `lib/schedule/blocks.ts` based on current day + user's semester setting
2. Today's `DayLog` entries from DB for the current user + today's date
3. Today's `WeekOverride` entries for the current ISO week
4. Today's `BlockAdjustment` entries (time shifts from +15m pushes)

Pass all to a `<TodayClient>` client component.

## API routes needed

### `POST /api/logs`
Body: `{ blockId, date, status: "done" | "skipped" | null }`
- Upsert a DayLog entry
- If status is null, delete the record (un-marking)

### `POST /api/adjustments`
Body: `{ blockId, date, startMins }`
- Upsert a BlockAdjustment
- Used when user pushes +15m

## Components

### `<HeroCard>`
The top card. Always shows the current or next non-sleep block.
- If a block is currently active: show "🟢 NOW", block name, time range, "+15m" button
- If between blocks: show "COMING UP", block name, live countdown timer `MM:SS`
- If all blocks done: show "All done today 🎯" in accent green
- Pulsing green dot on active block
- Accent colour matches the block's kind colour
- Radial glow behind the card in the block's accent colour at 8% opacity

### `<ProgressBar>`
Slim bar below the hero. Shows `done / active_total` and percentage. Active total excludes disabled blocks (from WeekOverride) and sleep blocks. Turns accent green at 100%.

### `<BlockCard>`
One per visible block (exclude sleep). Props: block, status, isCurrent, isNext, isDisabled.
- Left accent strip in block's kind colour when current
- Status cycling: ○ (pending) → ✓ (done) → ✕ (skipped) → ○
- Tapping the status button calls `POST /api/logs`
- "+15m" button only shown on the current active block
  - Calls `POST /api/adjustments` then re-cascades all subsequent blocks client-side
  - Show a subtle cascade animation (blocks shift down with a 150ms stagger)
- Disabled blocks show "OFF" badge and greyed out, no status button
- Done blocks get line-through on label, reduced opacity

### Cascade behaviour
When +15m is pressed:
1. Optimistic UI update — immediately shift blocks in local state
2. POST the adjustment to the API
3. If the API fails, revert

## Live clock
`useEffect` with `setInterval(1000)` updating displayed time and hero countdown. The countdown should be in seconds for accuracy.

## Design
- Background `#0A0A0A`
- Font: Space Grotesk
- Block cards: dark background matching kind colour at low opacity
- Current block has a 1px border in its accent colour
- Bottom nav always visible (fixed)

## Done when
- Today's blocks render in correct order for the current day
- Blocks from the wrong day or semester do not appear
- Marking a block done persists after page refresh
- +15m shifts the active block and cascades subsequent non-fixed blocks
- Disabled blocks (from WeekOverride) show as greyed out and don't count toward progress
- Hero countdown ticks in real time
- Works on a 375px wide mobile screen without horizontal scroll
