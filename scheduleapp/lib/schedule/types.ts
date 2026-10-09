export type BlockKind =
  | "sleep"
  | "meal"
  | "gym"
  | "ma"
  | "cardio"
  | "mobility"
  | "posing"
  | "study"
  | "uni"
  | "commute"
  | "prep"
  | "chores"
  | "read"
  | "free"
  | "content"
  | "work";

// 'prep': Aug 16 - Nov 2, 2026 (show prep window) -- posing daily, MA
// suspended, cardio expands to 5 days. 'normal': everything outside that
// window. Derived from a date, never stored -- see lib/schedule/mode.ts.
export type ScheduleMode = "prep" | "normal";

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type SemesterKey = 1 | 2;

// A real, dated university class session (lecture/seminar/tutorial/exam/...),
// imported from a UvA timetable export. Keyed by actual calendar date
// because the real timetable is irregular week to week (see
// lib/schedule/uni.ts).
export interface UniSession {
  id: string;
  date: string; // ISO date: "2026-09-01"
  courseCode: string;
  courseName: string;
  type: string; // "Lecture" | "Seminar" | "Tutorial" | "Practical" | "Question session" | "Examination" | ...
  start: number; // decimal hours
  end: number; // decimal hours
  location: string;
  note: string; // sub-topic / comment, e.g. "1.1 Introductie"
}
