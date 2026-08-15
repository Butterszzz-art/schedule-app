import { dayType } from "./schedule/blocks";
import type { DayKey, SemesterKey } from "./schedule/types";

export type NutritionDayType = "heavy_lift" | "moderate_lift" | "rest";

// Upper/Lower/Rest is a pure day-of-week classification (see
// lib/schedule/blocks.ts's dayType()) that's identical in both schedule
// modes -- Wed/Sun are nutritionally "rest" whether they get MA (normal
// mode) or posing+cardio+study (prep mode). `semester` is accepted for
// call-site stability but unused; nutrition targets don't depend on it.
export function getDayType(
  dayKey: DayKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site stability
  semester: SemesterKey
): NutritionDayType {
  switch (dayType(dayKey)) {
    case "upper":
      return "heavy_lift";
    case "lower":
      return "moderate_lift";
    case "rest":
      return "rest";
  }
}

export interface NutritionTarget {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// From the prep blueprint (CLAUDE.md). Protein is always 164g.
export const NUTRITION_TARGETS: Record<NutritionDayType, NutritionTarget> = {
  heavy_lift: {
    label: "HEAVY LIFT DAY",
    calories: 2500,
    protein: 164,
    carbs: 335,
    fat: 55,
  },
  moderate_lift: {
    label: "MODERATE LIFT DAY",
    calories: 2200,
    protein: 164,
    carbs: 251,
    fat: 60,
  },
  rest: {
    label: "REST DAY",
    calories: 1700,
    protein: 164,
    carbs: 104,
    fat: 70,
  },
};

export const WEEKLY_AVERAGE_CALORIES = 2130;
