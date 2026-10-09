import type { ScheduleMode } from "@/lib/schedule/types";
import type { RoutineItemDef } from "./types";

// The starting routine for each schedule mode -- what used to be the timed
// block schedule, minus the clock times. Seeded into RoutineItem the first
// time a mode is used (lib/checklist/server.ts), then edited in the
// Routine tab. Changing this file does NOT update an already-seeded
// routine; use "Restore default routine" in the Routine tab for that.
//
// Day indices: 0 = Mon ... 6 = Sun. Lift days Mon/Tue/Thu/Fri/Sat
// (upper Mon/Thu/Sat, lower Tue/Fri), rest days Wed/Sun.
// Hard rule in both modes: no cardio on Tue or Fri (quad recovery).

const ALL = [0, 1, 2, 3, 4, 5, 6];
const LIFT = [0, 1, 3, 4, 5];
const UPPER = [0, 3, 5];
const LOWER = [1, 4];
const REST = [2, 6];

type ItemInput = Pick<RoutineItemDef, "key" | "area" | "kind" | "label" | "days"> &
  Partial<Pick<RoutineItemDef, "hint" | "type" | "target" | "chunks">>;

function item(def: ItemInput): RoutineItemDef {
  return { hint: "", type: "check", target: 1, chunks: [], ...def };
}

const STUDY_HINT = "Longest block first, short break between";

function shared(): RoutineItemDef[] {
  return [
    item({ key: "gym-upper", area: "body", kind: "gym", label: "Gym · Upper body", days: UPPER }),
    item({ key: "gym-lower", area: "body", kind: "gym", label: "Gym · Lower body", days: LOWER }),
    item({ key: "meals", area: "fuel", kind: "meal", label: "Meals", type: "count", target: 5, hint: "Tap each one as you eat it", days: ALL }),
    item({ key: "protein", area: "fuel", kind: "meal", label: "Protein 164 g", days: ALL }),
    item({ key: "mini-prep", area: "fuel", kind: "prep", label: "Mini meal prep", hint: "~1h", days: [2] }),
    item({ key: "main-prep", area: "fuel", kind: "prep", label: "Meal prep (main)", hint: "~3h, batch for the week", days: [6] }),
    item({ key: "study-lift", area: "mind", kind: "study", label: "Study", type: "chunks", chunks: ["2h", "1.5h"], hint: STUDY_HINT, days: LIFT }),
    item({ key: "study-rest", area: "mind", kind: "study", label: "Study", type: "chunks", chunks: ["2h", "1.5h", "1h"], hint: STUDY_HINT, days: REST }),
    item({ key: "read", area: "mind", kind: "read", label: "Reading", hint: "30 min", days: ALL }),
    item({ key: "chores", area: "life", kind: "chores", label: "Chores", hint: "~1h", days: [2] }),
    item({ key: "laundry", area: "life", kind: "chores", label: "Laundry + clean", hint: "~1h", days: [6] }),
  ];
}

export const DEFAULT_ROUTINE: Record<ScheduleMode, RoutineItemDef[]> = {
  prep: [
    item({ key: "wake", area: "anchors", kind: "sleep", label: "Up by 06:30", days: ALL }),
    item({ key: "bed", area: "anchors", kind: "sleep", label: "Lights out 22:30", hint: "8 hours, non-negotiable", days: ALL }),
    item({ key: "posing", area: "body", kind: "posing", label: "Posing practice", hint: "Fasted, before M1 · ~20 min", days: ALL }),
    item({ key: "mobility", area: "body", kind: "mobility", label: "Mobility", hint: "20 min, straight after gym", days: LIFT }),
    item({ key: "cardio", area: "body", kind: "cardio", label: "Cardio", hint: "30 min", days: [0, 2, 3, 5, 6] }),
    ...shared(),
    item({ key: "ig", area: "content", kind: "content", label: "Instagram post + caption", hint: "~10 min · film clips during gym", days: ALL }),
    item({ key: "web", area: "content", kind: "content", label: "Website maintenance", hint: "45 min", days: [1, 3] }),
    item({ key: "yt", area: "content", kind: "content", label: "YouTube: film, edit, upload", hint: "~1h", days: [5] }),
  ],
  normal: [
    item({ key: "wake", area: "anchors", kind: "sleep", label: "Up by 05:30", days: ALL }),
    item({ key: "bed", area: "anchors", kind: "sleep", label: "Lights out 21:45", hint: "8 hours, non-negotiable", days: ALL }),
    item({ key: "ma", area: "body", kind: "ma", label: "Martial arts", hint: "Science Park", days: REST }),
    item({ key: "mobility", area: "body", kind: "mobility", label: "Mobility", hint: "20 min, straight after training", days: ALL }),
    item({ key: "cardio", area: "body", kind: "cardio", label: "Cardio", hint: "30 min", days: UPPER }),
    ...shared(),
  ],
};
