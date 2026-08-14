import { describe, expect, it } from "vitest";
import { getDayType, NUTRITION_TARGETS } from "@/lib/nutrition";
import type { DayKey } from "@/lib/schedule/types";

describe("getDayType", () => {
  const cases: [DayKey, string][] = [
    ["Mon", "heavy_lift"],
    ["Tue", "moderate_lift"],
    ["Wed", "rest"],
    ["Thu", "heavy_lift"],
    ["Fri", "moderate_lift"],
    ["Sat", "heavy_lift"],
    ["Sun", "rest"],
  ];

  it.each(cases)("%s is %s for both semesters", (day, expected) => {
    expect(getDayType(day, 1)).toBe(expected);
    expect(getDayType(day, 2)).toBe(expected);
  });
});

describe("NUTRITION_TARGETS", () => {
  it("always shows 164g protein regardless of day type", () => {
    for (const target of Object.values(NUTRITION_TARGETS)) {
      expect(target.protein).toBe(164);
    }
  });

  it("matches the CLAUDE.md blueprint numbers", () => {
    expect(NUTRITION_TARGETS.heavy_lift).toMatchObject({
      calories: 2500,
      carbs: 335,
      fat: 55,
    });
    expect(NUTRITION_TARGETS.moderate_lift).toMatchObject({
      calories: 2200,
      carbs: 251,
      fat: 60,
    });
    expect(NUTRITION_TARGETS.rest).toMatchObject({
      calories: 1700,
      carbs: 104,
      fat: 70,
    });
  });
});
