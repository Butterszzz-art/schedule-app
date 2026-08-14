import type { ScheduleBlock } from "./types";

/**
 * When a block runs long, push every subsequent non-fixed block in the
 * same day forward by the same amount so the rest of the day still lines
 * up. Cascading stops the moment it hits a fixed block (e.g. a uni
 * lecture) — nothing after that point moves, since a fixed block can't be
 * pushed and there'd be no gap left to close for blocks beyond it.
 *
 * `blocks` is assumed sorted by `start` and is never mutated.
 */
export function cascade(
  blocks: ScheduleBlock[],
  changedIdx: number,
  newEndMins: number
): ScheduleBlock[] {
  if (changedIdx < 0 || changedIdx >= blocks.length) {
    return [...blocks];
  }

  const next = blocks.map((block) => ({ ...block }));
  const changed = next[changedIdx];

  const originalEndMins = changed.start * 60 + changed.dur;
  const deltaMins = newEndMins - originalEndMins;

  // Finished on time or early — nothing to cascade.
  if (deltaMins <= 0) {
    return next;
  }

  // The changed block itself ran long; reflect that in its duration.
  changed.dur += deltaMins;

  for (let i = changedIdx + 1; i < next.length; i++) {
    const block = next[i];
    if (block.fixed) break;
    block.start += deltaMins / 60;
  }

  return next;
}
