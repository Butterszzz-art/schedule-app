// Cardio rule: never Tue or Fri (lower body days, quad recovery priority).
// Mon/Thu/Sat always get cardio; Wed/Sun only get it in PREP mode.
//
// ── Two schedule modes ──────────────────────────────────────────────────
// PREP mode (Aug 16 - Nov 2, 2026, see mode.ts): posing practice daily,
// martial arts suspended, cardio expands to 5 days/week. NORMAL mode is
// everything outside that window: martial arts on Wed/Sun, no posing,
// cardio only 3 days/week. Mode is derived from the date, never stored --
// see getScheduleMode() in mode.ts and getBlocksForDate() below.
//
// PREP mode's block data (times, structure, IDs-worth-of-detail) is
// ported directly from the reference prototype (schedule-app.jsx), which
// is the source of truth for it. NORMAL mode has no equivalent reference
// -- schedule-app.jsx's own SCHEDULE.normal is a placeholder duplicate of
// prep ("simplified: same for now") -- so it's constructed here from
// CLAUDE.md's written NORMAL MODE rules plus the same meal/study/reading
// rhythm conventions PREP mode uses. Where CLAUDE.md's "shared" chore/meal
// -prep anchor times (e.g. "Sun chores 07:30") don't fit NORMAL mode's
// later morning (MA doesn't end until 08:15, vs PREP's posing+cardio
// finishing by 07:25), times were shifted later to avoid overlaps -- the
// activity order and durations follow the spec; the exact clock times
// past that are a reasonable best-effort, easy to adjust in Week view.
//
// This intentionally does NOT bake in university class times, in either
// mode: the real UvA timetable is irregular week to week (different
// courses/times each week, plus one-off exams and practicals), so a
// static per-weekday template can't represent it accurately -- unlike
// schedule-app.jsx's P1_UNI/P2_UNI, which do this and are NOT ported here
// for that reason. Real class sessions live in lib/schedule/uni.ts, keyed
// by actual calendar date, and get merged in per day by
// getBlocksForDate() below, in both modes.

import type {
  DayKey,
  FullSchedule,
  ScheduleBlock,
  ScheduleMode,
  SemesterKey,
  WeekSchedule,
} from "./types";
import { getScheduleMode } from "./mode";
import { UNI_SESSIONS } from "./uni";

const UPPER_DAYS: DayKey[] = ["Mon", "Thu", "Sat"];
const REST_DAYS: DayKey[] = ["Wed", "Sun"];

export type DayType = "upper" | "lower" | "rest";

/** Upper/lower/lift-vs-rest classification -- constant across both modes. */
export function dayType(day: DayKey): DayType {
  if (UPPER_DAYS.includes(day)) return "upper";
  if (REST_DAYS.includes(day)) return "rest";
  return "lower";
}

function id(mode: ScheduleMode, semester: SemesterKey, day: DayKey, kind: string) {
  return `${mode}${semester}-${day.toLowerCase()}-${kind}`;
}

// ── PREP mode ────────────────────────────────────────────────────────────
// Ported from schedule-app.jsx's mkGymDay/PREP. Sleep is modelled as two
// blocks per day (overnight tail 00:00-05:30, then bedtime 21:45-05:30
// next day) so "still asleep" reads correctly before wake -- both get
// filtered out of every view the same way a single sleep block was.

function prepGymDay(
  semester: SemesterKey,
  day: DayKey,
  gymLabel: string,
  extras: ScheduleBlock[]
): ScheduleBlock[] {
  const bid = (k: string) => id("prep", semester, day, k);
  return [
    { id: bid("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
    { id: bid("posing"), kind: "posing", label: "Posing", start: 5.5, dur: 25 },
    { id: bid("meal-m1"), kind: "meal", label: "M1", start: 5.92, dur: 20 },
    { id: bid("gym"), kind: "gym", label: gymLabel, start: 6, dur: 90, fixed: true },
    { id: bid("mobility"), kind: "mobility", label: "Mobility", start: 7.5, dur: 20 },
    { id: bid("commute-home"), kind: "commute", label: "→ Home", start: 7.83, dur: 20 },
    { id: bid("meal-m2"), kind: "meal", label: "M2", start: 8.17, dur: 30 },
    { id: bid("study-1"), kind: "study", label: "Study · 2h", start: 8.67, dur: 120 },
    { id: bid("meal-break"), kind: "meal", label: "break", start: 10.67, dur: 20 },
    { id: bid("study-2"), kind: "study", label: "Study · 1.5h", start: 11, dur: 90 },
    { id: bid("meal-m3"), kind: "meal", label: "M3", start: 12.5, dur: 30 },
    ...extras,
    { id: bid("meal-m5"), kind: "meal", label: "M5", start: 19.5, dur: 40 },
    { id: bid("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
    { id: bid("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
  ];
}

function buildPrepWeek(semester: SemesterKey): WeekSchedule {
  const bidWed = (k: string) => id("prep", semester, "Wed", k);
  const bidSat = (k: string) => id("prep", semester, "Sat", k);
  const bidSun = (k: string) => id("prep", semester, "Sun", k);

  return {
    Mon: prepGymDay(semester, "Mon", "Upper body", [
      { id: id("prep", semester, "Mon", "commute-sp"), kind: "commute", label: "→ SP", start: 12.5, dur: 25 },
      { id: id("prep", semester, "Mon", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      { id: id("prep", semester, "Mon", "cardio"), kind: "cardio", label: "Cardio", start: 17.5, dur: 30, fixed: true },
      { id: id("prep", semester, "Mon", "commute-home2"), kind: "commute", label: "→ Home", start: 18, dur: 20 },
    ]),
    Tue: prepGymDay(semester, "Tue", "Lower body", [
      { id: id("prep", semester, "Tue", "commute-sp"), kind: "commute", label: "→ SP", start: 12.5, dur: 25 },
      { id: id("prep", semester, "Tue", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      { id: id("prep", semester, "Tue", "commute-home2"), kind: "commute", label: "→ Home", start: 17, dur: 20 },
      // NO cardio -- lower body day.
    ]),
    Wed: [
      { id: bidWed("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
      { id: bidWed("posing"), kind: "posing", label: "Posing", start: 5.5, dur: 25 },
      { id: bidWed("meal-m1"), kind: "meal", label: "M1", start: 5.92, dur: 20 },
      { id: bidWed("cardio"), kind: "cardio", label: "Cardio", start: 6.5, dur: 30, fixed: true },
      { id: bidWed("meal-m2"), kind: "meal", label: "M2", start: 7.0, dur: 25 },
      { id: bidWed("study-1"), kind: "study", label: "Study · 2h", start: 7.5, dur: 120 },
      { id: bidWed("meal-break1"), kind: "meal", label: "break", start: 9.5, dur: 20 },
      { id: bidWed("study-2"), kind: "study", label: "Study · 1.5h", start: 9.83, dur: 90 },
      { id: bidWed("meal-break2"), kind: "meal", label: "break", start: 11.33, dur: 20 },
      { id: bidWed("study-3"), kind: "study", label: "Study · 1h", start: 11.67, dur: 60 },
      { id: bidWed("meal-m3"), kind: "meal", label: "M3", start: 12.67, dur: 30 },
      { id: bidWed("meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      { id: bidWed("chores"), kind: "chores", label: "Chores", start: 16, dur: 60 },
      { id: bidWed("mealprep"), kind: "prep", label: "Mini Prep", start: 17, dur: 60 },
      { id: bidWed("meal-m5"), kind: "meal", label: "M5", start: 19.5, dur: 40 },
      { id: bidWed("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
      { id: bidWed("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
    ],
    Thu: prepGymDay(semester, "Thu", "Upper body", [
      { id: id("prep", semester, "Thu", "cardio"), kind: "cardio", label: "Cardio", start: 13, dur: 30, fixed: true },
      { id: id("prep", semester, "Thu", "commute-sp"), kind: "commute", label: "→ SP", start: 13.5, dur: 20 },
      { id: id("prep", semester, "Thu", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      { id: id("prep", semester, "Thu", "commute-home2"), kind: "commute", label: "→ Home", start: 17, dur: 20 },
    ]),
    Fri: prepGymDay(semester, "Fri", "Lower body", [
      { id: id("prep", semester, "Fri", "commute-sp"), kind: "commute", label: "→ SP", start: 12.5, dur: 25 },
      { id: id("prep", semester, "Fri", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      { id: id("prep", semester, "Fri", "commute-home2"), kind: "commute", label: "→ Home", start: 17, dur: 20 },
      // NO cardio -- lower body day.
    ]),
    Sat: [
      { id: bidSat("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
      { id: bidSat("posing"), kind: "posing", label: "Posing", start: 5.5, dur: 25 },
      { id: bidSat("meal-m1"), kind: "meal", label: "M1", start: 5.92, dur: 20 },
      { id: bidSat("gym"), kind: "gym", label: "Upper body", start: 6.5, dur: 90, fixed: true },
      { id: bidSat("mobility"), kind: "mobility", label: "Mobility", start: 8, dur: 20 },
      { id: bidSat("commute-home"), kind: "commute", label: "→ Home", start: 8.33, dur: 20 },
      { id: bidSat("meal-m2"), kind: "meal", label: "M2", start: 8.67, dur: 30 },
      { id: bidSat("study-1"), kind: "study", label: "Study · 2h", start: 9.17, dur: 120 },
      { id: bidSat("meal-break"), kind: "meal", label: "break", start: 11.17, dur: 20 },
      { id: bidSat("study-2"), kind: "study", label: "Study · 1.5h", start: 11.5, dur: 90 },
      { id: bidSat("meal-m3"), kind: "meal", label: "M3", start: 13, dur: 30 },
      { id: bidSat("cardio"), kind: "cardio", label: "Cardio", start: 13.5, dur: 30, fixed: true },
      { id: bidSat("free"), kind: "free", label: "Leisure", start: 14, dur: 150 },
      { id: bidSat("meal-m4"), kind: "meal", label: "M4", start: 16.5, dur: 30 },
      { id: bidSat("meal-m5"), kind: "meal", label: "M5", start: 19.5, dur: 40 },
      { id: bidSat("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
      { id: bidSat("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
    ],
    Sun: [
      { id: bidSun("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
      { id: bidSun("posing"), kind: "posing", label: "Posing", start: 5.5, dur: 25 },
      { id: bidSun("meal-m1"), kind: "meal", label: "M1", start: 5.92, dur: 20 },
      { id: bidSun("cardio"), kind: "cardio", label: "Cardio", start: 6.5, dur: 30, fixed: true },
      { id: bidSun("meal-m2"), kind: "meal", label: "M2", start: 7.0, dur: 25 },
      { id: bidSun("chores"), kind: "chores", label: "Laundry+Clean", start: 7.5, dur: 60 },
      { id: bidSun("study-1"), kind: "study", label: "Study · 2h", start: 8.5, dur: 120 },
      { id: bidSun("meal-break1"), kind: "meal", label: "break", start: 10.5, dur: 20 },
      { id: bidSun("study-2"), kind: "study", label: "Study · 1.5h", start: 10.83, dur: 90 },
      { id: bidSun("meal-m3"), kind: "meal", label: "M3", start: 12.33, dur: 30 },
      { id: bidSun("mealprep"), kind: "prep", label: "Meal Prep (main)", start: 12.83, dur: 180 },
      { id: bidSun("study-3"), kind: "study", label: "Study · 1h", start: 15.83, dur: 60 },
      { id: bidSun("meal-m4"), kind: "meal", label: "M4", start: 19.5, dur: 40 },
      { id: bidSun("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
      { id: bidSun("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
    ],
  };
}

// ── NORMAL mode ──────────────────────────────────────────────────────────
// Not in schedule-app.jsx (its SCHEDULE.normal is a same-as-prep
// placeholder) -- constructed from CLAUDE.md's NORMAL MODE + shared rules.
// No posing, no midday uni-commute pairs (real per-date uni.ts merge
// makes a fixed commute time unreliable -- see file header), same M1-M5 /
// study / reading rhythm PREP mode uses otherwise.

function normalGymDay(
  semester: SemesterKey,
  day: DayKey,
  gymLabel: string,
  gymStart: number,
  extras: ScheduleBlock[]
): ScheduleBlock[] {
  const bid = (k: string) => id("normal", semester, day, k);
  const gymEnd = gymStart + 1.5;
  const mobStart = gymEnd;
  const commuteStart = mobStart + 20 / 60;
  const m2Start = commuteStart + 20 / 60;
  const study1Start = m2Start + 0.5;
  return [
    { id: bid("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
    { id: bid("meal-m1"), kind: "meal", label: "M1", start: 5.5, dur: 20 },
    { id: bid("gym"), kind: "gym", label: gymLabel, start: gymStart, dur: 90, fixed: true },
    { id: bid("mobility"), kind: "mobility", label: "Mobility", start: mobStart, dur: 20 },
    { id: bid("commute-home"), kind: "commute", label: "→ Home", start: commuteStart, dur: 20 },
    { id: bid("meal-m2"), kind: "meal", label: "M2", start: m2Start, dur: 30 },
    { id: bid("study-1"), kind: "study", label: "Study · 2h", start: study1Start, dur: 120 },
    { id: bid("meal-break"), kind: "meal", label: "break", start: study1Start + 2, dur: 20 },
    { id: bid("study-2"), kind: "study", label: "Study · 1.5h", start: study1Start + 2 + 1 / 3, dur: 90 },
    { id: bid("meal-m3"), kind: "meal", label: "M3", start: 12.5, dur: 30 },
    ...extras,
    { id: bid("meal-m5"), kind: "meal", label: "M5", start: 19.5, dur: 40 },
    { id: bid("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
    { id: bid("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
  ];
}

function buildNormalWeek(semester: SemesterKey): WeekSchedule {
  const bidWed = (k: string) => id("normal", semester, "Wed", k);
  const bidSun = (k: string) => id("normal", semester, "Sun", k);

  return {
    Mon: normalGymDay(semester, "Mon", "Upper body", 6, [
      { id: id("normal", semester, "Mon", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      { id: id("normal", semester, "Mon", "cardio"), kind: "cardio", label: "Cardio", start: 17.5, dur: 30, fixed: true },
    ]),
    Tue: normalGymDay(semester, "Tue", "Lower body", 6, [
      { id: id("normal", semester, "Tue", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      // NO cardio -- lower body day.
    ]),
    // MA -> mobility -> study/chores/prep, per CLAUDE.md. Commute to SP at
    // 06:33 (CLAUDE.md's stated time); everything after is this file's own
    // best-effort construction -- see the file header note on why exact
    // clock times had to shift from the "shared" anchor times.
    Wed: [
      { id: bidWed("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
      { id: bidWed("commute-sp"), kind: "commute", label: "→ Science Park", start: 6.55, dur: 25 },
      { id: bidWed("ma"), kind: "ma", label: "Martial arts", start: 7, dur: 75, fixed: true },
      { id: bidWed("mobility"), kind: "mobility", label: "Mobility", start: 8.25, dur: 20 },
      { id: bidWed("commute-home"), kind: "commute", label: "→ Home", start: 8.583, dur: 25 },
      { id: bidWed("meal-m1"), kind: "meal", label: "M1", start: 9, dur: 30 },
      { id: bidWed("study-1"), kind: "study", label: "Study · 2h", start: 9.5, dur: 120 },
      { id: bidWed("meal-m2"), kind: "meal", label: "M2", start: 11.5, dur: 20 },
      { id: bidWed("study-2"), kind: "study", label: "Study · 1.5h", start: 11.833, dur: 90 },
      { id: bidWed("meal-m3"), kind: "meal", label: "M3", start: 13.333, dur: 30 },
      { id: bidWed("study-3"), kind: "study", label: "Study · 1h", start: 13.833, dur: 60 },
      { id: bidWed("meal-m4"), kind: "meal", label: "M4", start: 15, dur: 30 },
      { id: bidWed("chores"), kind: "chores", label: "Chores", start: 16, dur: 60 },
      { id: bidWed("mealprep"), kind: "prep", label: "Mini Prep", start: 17, dur: 60 },
      { id: bidWed("meal-m5"), kind: "meal", label: "M5", start: 19.5, dur: 40 },
      { id: bidWed("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
      { id: bidWed("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
    ],
    Thu: normalGymDay(semester, "Thu", "Upper body", 6, [
      { id: id("normal", semester, "Thu", "cardio"), kind: "cardio", label: "Cardio", start: 13, dur: 30, fixed: true },
      { id: id("normal", semester, "Thu", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
    ]),
    Fri: normalGymDay(semester, "Fri", "Lower body", 6, [
      { id: id("normal", semester, "Fri", "meal-m4"), kind: "meal", label: "M4", start: 15.5, dur: 30 },
      // NO cardio -- lower body day.
    ]),
    Sat: normalGymDay(semester, "Sat", "Upper body", 6.5, [
      { id: id("normal", semester, "Sat", "cardio"), kind: "cardio", label: "Cardio", start: 13.5, dur: 30, fixed: true },
      { id: id("normal", semester, "Sat", "meal-m4"), kind: "meal", label: "M4", start: 16.5, dur: 30 },
    ]),
    Sun: [
      { id: bidSun("sleep-am"), kind: "sleep", label: "Sleep", start: 0, dur: 330, fixed: true },
      { id: bidSun("commute-sp"), kind: "commute", label: "→ Science Park", start: 6.55, dur: 25 },
      { id: bidSun("ma"), kind: "ma", label: "Martial arts", start: 7, dur: 75, fixed: true },
      { id: bidSun("mobility"), kind: "mobility", label: "Mobility", start: 8.25, dur: 20 },
      { id: bidSun("commute-home"), kind: "commute", label: "→ Home", start: 8.583, dur: 25 },
      { id: bidSun("meal-m1"), kind: "meal", label: "M1", start: 9, dur: 25 },
      { id: bidSun("chores"), kind: "chores", label: "Laundry+Clean", start: 9.5, dur: 60 },
      { id: bidSun("study-1"), kind: "study", label: "Study · 2h", start: 10.5, dur: 120 },
      { id: bidSun("mealprep"), kind: "prep", label: "Meal Prep (main)", start: 12.5, dur: 180 },
      { id: bidSun("meal-m2"), kind: "meal", label: "M2", start: 15.5, dur: 30 },
      { id: bidSun("study-2"), kind: "study", label: "Study · 1.5h", start: 16, dur: 90 },
      { id: bidSun("meal-m3"), kind: "meal", label: "M3", start: 17.5, dur: 30 },
      { id: bidSun("study-3"), kind: "study", label: "Study · 1h", start: 18, dur: 60 },
      { id: bidSun("meal-m4"), kind: "meal", label: "M4", start: 19.5, dur: 40 },
      { id: bidSun("read"), kind: "read", label: "Reading", start: 21, dur: 30 },
      { id: bidSun("sleep-pm"), kind: "sleep", label: "Sleep", start: 21.75, dur: 480, fixed: true },
    ],
  };
}

function sortWeek(week: WeekSchedule): WeekSchedule {
  const sorted = {} as WeekSchedule;
  (Object.keys(week) as DayKey[]).forEach((day) => {
    sorted[day] = [...week[day]].sort((a, b) => a.start - b.start);
  });
  return sorted;
}

export const SCHEDULE: FullSchedule = {
  prep: { 1: sortWeek(buildPrepWeek(1)), 2: sortWeek(buildPrepWeek(2)) },
  normal: { 1: sortWeek(buildNormalWeek(1)), 2: sortWeek(buildNormalWeek(2)) },
};

// Matches JS Date#getUTCDay() index order (0 = Sunday).
const DAY_KEYS: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dayKeyForDate(date: string): DayKey {
  const [y, m, d] = date.split("-").map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_KEYS[utcDay];
}

export function getUniSessionsForDate(date: string) {
  return UNI_SESSIONS.filter((s) => s.date === date).sort(
    (a, b) => a.start - b.start
  );
}

/**
 * The fixed daily rhythm for `date` -- mode (prep/normal) derived from the
 * date itself, never stored -- with any real uni sessions on that date
 * merged in and the whole day sorted by start time. This is what
 * Today/Week views should render -- never SCHEDULE[mode][semester][day]
 * alone.
 */
export function getBlocksForDate(
  date: string,
  semester: SemesterKey
): ScheduleBlock[] {
  const mode = getScheduleMode(date);
  const day = dayKeyForDate(date);
  const rhythm = SCHEDULE[mode][semester][day];
  const uniBlocks: ScheduleBlock[] = getUniSessionsForDate(date).map((s) => ({
    id: s.id,
    kind: "uni",
    label: s.note ? `${s.courseName} — ${s.note}` : s.courseName,
    start: s.start,
    dur: (s.end - s.start) * 60,
    fixed: true,
  }));
  return [...rhythm, ...uniBlocks].sort((a, b) => a.start - b.start);
}
