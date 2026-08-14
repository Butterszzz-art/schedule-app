import { SCHEDULE } from "./schedule/blocks";
import type { DayKey, SemesterKey } from "./schedule/types";

export type NutritionDayType = "heavy_lift" | "moderate_lift" | "rest";

export function getDayType(
  dayKey: DayKey,
  semester: SemesterKey
): NutritionDayType {
  const blocks = SCHEDULE[semester][dayKey];
  const hasGym = blocks.some((b) => b.kind === "gym");
  const hasMA = blocks.some((b) => b.kind === "ma");

  if (hasMA || !hasGym) return "rest"; // MA days = True Rest per blueprint

  // Gym days: Upper = heavy, Lower = moderate.
  const gymBlock = blocks.find((b) => b.kind === "gym");
  if (gymBlock?.label.toLowerCase().includes("upper")) return "heavy_lift";
  return "moderate_lift";
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
