import { dayType } from "./schedule/days";
import type { DayKey, SemesterKey } from "./schedule/types";

export type NutritionDayType = "training" | "rest";

// Upper/Lower/Rest is a pure day-of-week classification (see
// lib/schedule/days.ts's dayType()) that's identical in both schedule
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

// Prep target from 2026-10-20 until the shows: a flat 1750 kcal every day.
// Macros are a rough goal only (exact numbers are tracked in another app):
// 4 meals of ~34 P / 36 C / 11 F plus a ~230 g plain skyr snack (~25 P / 9 C).
// Revisit after Show 2 (Nov 1). Previous v5 blueprint split was
// 2400 kcal training / 2240 kcal rest, 164 g protein.
const PREP_TARGET = { calories: 1750, protein: 160, carbs: 155, fat: 45 };

export const NUTRITION_TARGETS: Record<NutritionDayType, NutritionTarget> = {
  training: { label: "TRAINING DAY", ...PREP_TARGET },
  rest: { label: "REST DAY", ...PREP_TARGET },
};

export const WEEKLY_AVERAGE_CALORIES = 1750;

/** Rough per-meal split, shown as a guide (not a strict target). */
export const MEAL_GUIDE = "Each meal ~34 P / 36 C / 11 F · snack ~230 g plain AH skyr (~25 P / 9 C)";
