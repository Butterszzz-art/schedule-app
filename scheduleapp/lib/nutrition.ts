import { dayType } from "./schedule/blocks";
import type { DayKey, SemesterKey } from "./schedule/types";

export type NutritionDayType = "training" | "rest";

// Upper/Lower/Rest is a pure day-of-week classification (see
// lib/schedule/blocks.ts's dayType()) that's identical in both schedule
// modes -- Wed/Sun are nutritionally "rest" whether they get MA (normal
// mode) or posing+cardio+study (prep mode). `semester` is accepted for
// call-site stability but unused; nutrition targets don't depend on it.
//
// v5 blueprint (prep-blueprint-v5.html, 2026-08-24) collapsed the old
// heavy-lift/moderate-lift split into a flat training/rest split once
// true maintenance was corrected to 2900 kcal -- see NUTRITION_TARGETS.
export function getDayType(
  dayKey: DayKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site stability
  semester: SemesterKey
): NutritionDayType {
  return dayType(dayKey) === "rest" ? "rest" : "training";
}

export interface NutritionTarget {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// From the prep blueprint v5 (prep-blueprint-v5.html, 2026-08-24 correction
// of the v4 PDF). Protein is always 164g; only carbs/fat swing by day type.
export const NUTRITION_TARGETS: Record<NutritionDayType, NutritionTarget> = {
  training: {
    label: "TRAINING DAY",
    calories: 2400,
    protein: 164,
    carbs: 246,
    fat: 69,
  },
  rest: {
    label: "REST DAY",
    calories: 2240,
    protein: 164,
    carbs: 196,
    fat: 89,
  },
};

// (5 training days + 2 rest days) / 7, per lib/schedule/blocks.ts's dayType().
export const WEEKLY_AVERAGE_CALORIES = 2354;
