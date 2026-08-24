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
  it("always shows 164g protein regardless of day type", () => {
    for (const target of Object.values(NUTRITION_TARGETS)) {
      expect(target.protein).toBe(164);
    }
  });

  it("matches the v5 blueprint numbers (prep-blueprint-v5.html)", () => {
    expect(NUTRITION_TARGETS.training).toMatchObject({
      calories: 2400,
      carbs: 246,
      fat: 69,
    });
    expect(NUTRITION_TARGETS.rest).toMatchObject({
      calories: 2240,
      carbs: 196,
      fat: 89,
    });
  });
});
