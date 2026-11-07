import type { GoalDTO } from "./types";

/** 0..1 progress toward a goal's target. */
export function goalFraction(g: Pick<GoalDTO, "target" | "progress">): number {
  if (g.target <= 0) return 0;
  return Math.min(1, Math.max(0, g.progress) / g.target);
}
