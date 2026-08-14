export type BlockKind =
  | "sleep"
  | "meal"
  | "gym"
  | "ma"
  | "cardio"
  | "mobility"
  | "study"
  | "uni"
  | "commute"
  | "prep"
  | "chores"
  | "read"
  | "free";

export interface ScheduleBlock {
  id: string;
  kind: BlockKind;
  label: string;
  start: number; // decimal hours e.g. 6.5 = 06:30
  dur: number; // duration in minutes
  fixed?: boolean; // true = cannot be cascaded past or disabled
}

export type BlockStatus = "done" | "skipped" | null;

// A block as rendered on the Today view: base schedule data merged with
// this date's DayLog status, BlockAdjustment start-time override, and
// WeekOverride disabled flag.
export interface TodayBlockView {
  id: string;
  kind: BlockKind;
  label: string;
  start: number; // effective (post-adjustment) decimal hours
  dur: number;
  fixed: boolean;
  status: BlockStatus;
  disabled: boolean;
}

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type SemesterKey = 1 | 2;

export type WeekSchedule = Record<DayKey, ScheduleBlock[]>;
export type SemesterSchedule = Record<SemesterKey, WeekSchedule>;

// A real, dated university class session (lecture/seminar/tutorial/exam/...),
// imported from a UvA timetable export. Unlike ScheduleBlock, these are
// keyed by actual calendar date rather than day-of-week, because the real
// timetable is irregular week to week (see lib/schedule/uni.ts).
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
