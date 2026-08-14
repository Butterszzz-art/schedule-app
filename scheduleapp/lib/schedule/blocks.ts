// Cardio rule: Upper days only (Mon/Thu/Sat). Never after lower body (Tue/Fri).
//
// This file encodes the fixed daily *rhythm* — sleep, training, meals —
// from the critical rules in CLAUDE.md. It intentionally does NOT bake in
// university class times: the real UvA timetable is irregular week to
// week (different courses/times each week, plus one-off exams and
// practicals), so a single repeating weekly template can't represent it
// accurately. Real class sessions live separately in lib/schedule/uni.ts,
// keyed by actual calendar date, and get merged in per day by
// getBlocksForDate() below.
//
// Cardio and meal *durations* aren't specified anywhere in CLAUDE.md
// beyond cardio start times — 30 min placeholders are used below and are
// easy to adjust (they don't affect the cardio-day or gym/MA rules).
//
// Semester 1 and 2 currently share the same rhythm template: none of the
// CLAUDE.md rules (wake/sleep, gym, MA, cardio) are semester-specific —
// only the real uni.ts data differs by date.

import type {
  DayKey,
  ScheduleBlock,
  SemesterKey,
  SemesterSchedule,
  WeekSchedule,
} from "./types";
import { UNI_SESSIONS } from "./uni";

const UPPER_DAYS: DayKey[] = ["Mon", "Thu", "Sat"];
const REST_DAYS: DayKey[] = ["Wed", "Sun"];

// Cardio placement, from CLAUDE.md: Mon 17:30 (after home from uni),
// Thu 12:30 (before uni), Sat 13:30. Never Tue/Fri.
const CARDIO_START: Partial<Record<DayKey, number>> = {
  Mon: 17.5,
  Thu: 12.5,
  Sat: 13.5,
};

// Lunch shifted earlier on Sat to leave a clean gap before 13:30 cardio.
const LUNCH_START: Partial<Record<DayKey, number>> = {
  Sat: 12.5,
};

function buildDay(semester: SemesterKey, day: DayKey): ScheduleBlock[] {
  const id = (kind: string) => `s${semester}-${day.toLowerCase()}-${kind}`;
  const blocks: ScheduleBlock[] = [];
  const isRest = REST_DAYS.includes(day);
  const isUpper = UPPER_DAYS.includes(day);

  if (isRest) {
    // Wed and Sun: martial arts only, no lifting, no cardio.
    blocks.push({
      id: id("ma"),
      kind: "ma",
      label: "Martial arts — Science Park",
      start: 7,
      dur: 75, // 07:00–08:15
      fixed: true,
    });
    blocks.push({
      id: id("meal-breakfast"),
      kind: "meal",
      label: "Breakfast",
      start: 8.5,
      dur: 30,
    });
  } else {
    blocks.push({
      id: id("gym"),
      kind: "gym",
      label: isUpper ? "Gym — Upper" : "Gym — Lower",
      start: 6,
      dur: 90, // 06:00–07:30
      fixed: true,
    });
    blocks.push({
      id: id("mobility"),
      kind: "mobility",
      label: "Mobility",
      start: 7.5,
      dur: 20, // immediately after gym
      fixed: true,
    });
    blocks.push({
      id: id("meal-breakfast"),
      kind: "meal",
      label: "Breakfast",
      start: 8,
      dur: 30,
    });
  }

  if (isUpper) {
    const cardioStart = CARDIO_START[day]!;
    const cardio: ScheduleBlock = {
      id: id("cardio"),
      kind: "cardio",
      label: "Cardio",
      start: cardioStart,
      dur: 30,
      fixed: true,
    };
    if (day === "Thu") {
      // Cardio before uni, lunch right after.
      blocks.push(cardio);
      blocks.push({
        id: id("meal-lunch"),
        kind: "meal",
        label: "Lunch",
        start: cardioStart + 0.5,
        dur: 30,
      });
    } else {
      blocks.push({
        id: id("meal-lunch"),
        kind: "meal",
        label: "Lunch",
        start: LUNCH_START[day] ?? 13,
        dur: 30,
      });
      blocks.push(cardio);
    }
  } else if (!isRest) {
    // Lower days (Tue/Fri): no cardio.
    blocks.push({
      id: id("meal-lunch"),
      kind: "meal",
      label: "Lunch",
      start: 13,
      dur: 30,
    });
  } else {
    blocks.push({
      id: id("meal-lunch"),
      kind: "meal",
      label: "Lunch",
      start: 13,
      dur: 30,
    });
  }

  blocks.push({
    id: id("meal-dinner"),
    kind: "meal",
    label: "Dinner",
    start: 19,
    dur: 30,
  });
  blocks.push({
    id: id("free"),
    kind: "free",
    label: "Free / wind down",
    start: 20,
    dur: 105,
  });
  blocks.push({
    id: id("sleep"),
    kind: "sleep",
    label: "Sleep",
    start: 21.75, // 21:45 -> 05:30 next day (465 min, ~7h45)
    dur: 465,
    fixed: true,
  });

  return blocks.sort((a, b) => a.start - b.start);
}

function buildWeek(semester: SemesterKey): WeekSchedule {
  const days: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.reduce((week, day) => {
    week[day] = buildDay(semester, day);
    return week;
  }, {} as WeekSchedule);
}

export const SCHEDULE: SemesterSchedule = {
  1: buildWeek(1),
  2: buildWeek(2),
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
 * The fixed daily rhythm for `date`, with any real uni sessions on that
 * date merged in and the whole day sorted by start time. This is what
 * Today/Week views should render — never SCHEDULE[semester][day] alone.
 */
export function getBlocksForDate(
  date: string,
  semester: SemesterKey
): ScheduleBlock[] {
  const day = dayKeyForDate(date);
  const rhythm = SCHEDULE[semester][day];
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
