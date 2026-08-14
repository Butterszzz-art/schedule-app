import { describe, expect, it } from "vitest";
import { cascade } from "@/lib/schedule/cascade";
import type { ScheduleBlock } from "@/lib/schedule/types";

function block(
  id: string,
  start: number,
  dur: number,
  fixed = false
): ScheduleBlock {
  return { id, kind: "free", label: id, start, dur, fixed };
}

describe("cascade", () => {
  it("does not mutate the input array", () => {
    const blocks = [block("a", 6, 60), block("b", 8, 30)];
    const snapshot = JSON.parse(JSON.stringify(blocks));
    cascade(blocks, 0, 8 * 60);
    expect(blocks).toEqual(snapshot);
  });

  it("does nothing when the block finishes on time or early", () => {
    const blocks = [block("a", 6, 60), block("b", 8, 30)];
    const onTime = cascade(blocks, 0, 7 * 60);
    expect(onTime).toEqual(blocks);

    const early = cascade(blocks, 0, 6.5 * 60);
    expect(early[0].dur).toBe(60);
    expect(early[1].start).toBe(8);
  });

  it("pushes subsequent blocks forward by the overrun", () => {
    // a: 06:00-07:00, b: 08:00-08:30, c: 09:00-10:00
    const blocks = [block("a", 6, 60), block("b", 8, 30), block("c", 9, 60)];
    // "a" actually ends at 07:15 -> 15 min overrun
    const result = cascade(blocks, 0, 7.25 * 60);

    expect(result[0].dur).toBe(75); // 60 + 15
    expect(result[1].start).toBe(8.25); // 08:00 + 15m
    expect(result[2].start).toBe(9.25); // 09:00 + 15m
  });

  it("stops cascading at the first fixed block", () => {
    const blocks = [
      block("a", 6, 60),
      block("b", 8, 30),
      block("uni", 9, 90, true),
      block("c", 11, 60),
    ];
    const result = cascade(blocks, 0, 7.25 * 60);

    expect(result[1].start).toBe(8.25); // pushed
    expect(result[2].start).toBe(9); // fixed block never moves
    expect(result[3].start).toBe(11); // beyond the fixed block, untouched
  });

  it("only cascades blocks after the changed index", () => {
    const blocks = [block("a", 6, 60), block("b", 8, 30), block("c", 9, 60)];
    const result = cascade(blocks, 1, 8.75 * 60); // "b" overruns by 15m

    expect(result[0].start).toBe(6); // before changedIdx, untouched
    expect(result[1].dur).toBe(45);
    expect(result[2].start).toBe(9.25);
  });

  it("returns a cloned array unchanged for an out-of-range index", () => {
    const blocks = [block("a", 6, 60)];
    const result = cascade(blocks, 5, 999);
    expect(result).toEqual(blocks);
    expect(result).not.toBe(blocks);
  });
});
