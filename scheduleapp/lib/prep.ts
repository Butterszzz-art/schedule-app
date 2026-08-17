// Static prep-blueprint data (CLAUDE.md's competition timeline). This is
// content, not user data, so it lives in code like lib/schedule/blocks.ts.

export interface PrepPhase {
  name: string;
  start: string;
  end: string;
  color: string;
}

// NOTE: real dates differ from the v4 PDF blueprint (prep-blueprint-v4.pdf),
// which says Vacation was Jul 25-Aug 4 -- per user correction (2026-08-17),
// Vacation actually ran Aug 9-19. Base Cut and Real Prep shifted to match
// (Base Cut extends to Aug 9; Real Prep starts Aug 19 and keeps Final
// Push's original 6-week length, so Real Prep is now just 17 days instead
// of 4.5 weeks -- Final Push still starts Sep 5 and ends the fixed Oct 17
// show date unchanged).
export const PREP_PHASES: PrepPhase[] = [
  { name: "Base Cut", start: "2026-06-01", end: "2026-08-09", color: "#4ADE80" },
  { name: "Vacation", start: "2026-08-09", end: "2026-08-19", color: "#60A5FA" },
  { name: "Real Prep", start: "2026-08-19", end: "2026-09-05", color: "#FB923C" },
  { name: "Final Push", start: "2026-09-05", end: "2026-10-17", color: "#F87171" },
];

export interface Show {
  name: string;
  date: string;
  venue: string;
  cards: string | null;
}

export const SHOWS: Show[] = [
  {
    name: "Show 1 — NPC Spain Naturals",
    date: "2026-10-17",
    venue: "Aranjuez, Madrid",
    cards: null,
  },
  {
    name: "Show 2 — Euronaturals Pro Qualifier",
    date: "2026-10-30",
    venue: "Madrid",
    cards: "9 IFBB Pro Cards",
  },
];

export const START_WEIGHT = 86;
export const TARGET_WEIGHT = 75;

export interface WeightTarget {
  date: string;
  target: number;
}

export const WEIGHT_TARGETS: WeightTarget[] = [
  { date: "2026-06-08", target: 85.2 },
  { date: "2026-06-15", target: 84.5 },
  { date: "2026-06-22", target: 83.7 },
  { date: "2026-06-29", target: 83.0 },
  { date: "2026-07-06", target: 82.2 },
  { date: "2026-07-13", target: 81.5 },
  { date: "2026-07-20", target: 80.7 },
  // "Depart" moved Jul 25 -> Aug 9 to match Base Cut's corrected end date
  // (goal: arrive at vacation at or below 80kg). The PDF's Aug 11/Aug 18
  // checkpoints are dropped -- both now fall inside Vacation (Aug 9-19),
  // which per the blueprint isn't a tracked-deficit phase ("eat clean at
  // maintenance, don't track obsessively").
  { date: "2026-08-09", target: 80.0 }, // depart
  { date: "2026-08-19", target: 81.0 }, // return
  { date: "2026-08-25", target: 78.5 },
  { date: "2026-09-01", target: 77.8 },
  { date: "2026-09-08", target: 77.0 },
  { date: "2026-09-15", target: 76.3 },
  { date: "2026-09-22", target: 75.7 },
  { date: "2026-09-29", target: 75.2 },
  { date: "2026-10-10", target: 74.5 }, // peak week
  { date: "2026-10-17", target: 75.0 }, // stage
];

export interface PriorityGap {
  area: string;
  note: string;
}

export const PRIORITY_GAPS: PriorityGap[] = [
  { area: "Upper chest", note: "Incline press as primary movement 2×/week" },
  {
    area: "Rear/medial delts",
    note: "Lateral raises, rear delt flyes, face pulls — every upper session",
  },
  { area: "Traps", note: "Heavy shrugs and rack pulls every back day" },
  { area: "Posing", note: "15 min daily — film from jury angle" },
];

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Days from `today` to `date` (negative if `date` already passed). */
export function daysUntil(date: string, today: string): number {
  return daysBetween(today, date);
}

export function weeksOut(date: string, today: string): number {
  const days = daysUntil(date, today);
  return days <= 0 ? 0 : Math.ceil(days / 7);
}

/** The phase containing `today`, or null if before/after the whole prep block. */
export function getCurrentPhase(today: string): PrepPhase | null {
  for (let i = 0; i < PREP_PHASES.length; i++) {
    const phase = PREP_PHASES[i];
    const isLast = i === PREP_PHASES.length - 1;
    if (today >= phase.start && (isLast ? today <= phase.end : today < phase.end)) {
      return phase;
    }
  }
  return null;
}

/** Show 1 until it has passed, then Show 2. */
export function nextShow(today: string): Show {
  return SHOWS.find((s) => today <= s.date) ?? SHOWS[SHOWS.length - 1];
}

/** The nearest upcoming (or today's) weekly checkpoint; the last one once prep is over. */
export function currentWeightTarget(today: string): WeightTarget {
  return (
    WEIGHT_TARGETS.find((t) => t.date >= today) ??
    WEIGHT_TARGETS[WEIGHT_TARGETS.length - 1]
  );
}

export interface WeightVariance {
  diff: number; // current - target; negative = ahead of schedule
  aheadOfSchedule: boolean;
}

export function weightVariance(current: number, target: number): WeightVariance {
  const diff = Math.round((current - target) * 10) / 10;
  return { diff, aheadOfSchedule: diff <= 0 };
}
