import { describe, expect, it } from "vitest";
import { isNudgeTime, nudgeBody } from "@/lib/notify";

describe("isNudgeTime", () => {
  const AT = 20 * 60 + 30;

  it("fires at the configured time", () => {
    expect(isNudgeTime(AT, AT)).toBe(true);
  });

  it("stays open for the 2-minute window", () => {
    expect(isNudgeTime(AT + 1.5, AT)).toBe(true);
    expect(isNudgeTime(AT + 2, AT)).toBe(false);
  });

  it("does not fire earlier than the configured time", () => {
    expect(isNudgeTime(AT - 1, AT)).toBe(false);
  });

  it("works for a different configured time", () => {
    expect(isNudgeTime(21 * 60, 21 * 60)).toBe(true);
    expect(isNudgeTime(20 * 60 + 30, 21 * 60)).toBe(false);
  });
});

describe("nudgeBody", () => {
  it("is null when everything is done", () => {
    expect(nudgeBody(0)).toBeNull();
  });

  it("uses the singular for one item", () => {
    expect(nudgeBody(1)).toBe("1 thing left on today's list");
  });

  it("counts several items", () => {
    expect(nudgeBody(4)).toBe("4 things left on today's list");
  });
});
