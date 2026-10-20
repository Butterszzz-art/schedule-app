import { describe, expect, it } from "vitest";
import { getDayType, NUTRITION_TARGETS } from "@/lib/nutrition";
import type { DayKey } from "@/lib/schedule/types";

describe("getDayType", () => {
  const cases: [DayKey, string][] = [
    ["Mon", "training"],
    ["Tue", "training"],
    ["Wed", "rest"],
    ["Thu", "training"],
    ["Fri", "training"],
    ["Sat", "training"],
    ["Sun", "rest"],
  ];

  it.each(cases)("%s is %s for both semesters", (day, expected) => {
    expect(getDayType(day, 1)).toBe(expected);
    expect(getDayType(day, 2)).toBe(expected);
  });
});

describe("NUTRITION_TARGETS", () => {
  it("is a flat 1750 kcal on every day type during prep", () => {
    for (const target of Object.values(NUTRITION_TARGETS)) {
      expect(target).toMatchObject({ calories: 1750, protein: 160, carbs: 155, fat: 45 });
    }
  });
});
