import type { BlockKind } from "@/lib/schedule/types";
import type { WeeklyTarget } from "./logic";
import type { GoalDTO } from "./types";

// Pure maths for the Momentum card (reward ring + reward path). No DB, no
// React -- the streak itself lives in server.ts since it needs a date range
// of ChecklistEntry rows.

/** One stop on the reward path: a weekly target or a custom weekly goal. */
export interface MomentumNode {
  key: string;
  label: string;
  kind: BlockKind | "goal";
  target: number;
  done: number;
  // Owed (skipped but still catchable, see progress.ts/logic.ts) -- shown
  // dimmed on the node's ring, never counted as done and never treated as
  // a miss.
  owed: number;
}

export function momentumNodesFromTargets(targets: WeeklyTarget[]): MomentumNode[] {
  return targets.map((t) => ({
    key: t.key,
    label: t.label,
    kind: t.kind,
    target: t.target,
    done: t.done,
    owed: t.owed,
  }));
}

export function momentumNodesFromGoals(goals: GoalDTO[]): MomentumNode[] {
  return goals.map((g) => ({
    key: g.id,
    label: g.title,
    kind: "goal",
    target: g.target,
    done: Math.min(g.progress, g.target),
    owed: 0,
  }));
}

/**
 * Done/target across every node, 0-100. Owed items don't add to this --
 * they're still catchable, not done yet -- so the ring only fills on real
 * completions; it just never counts them as a miss either.
 */
export function momentumPct(nodes: MomentumNode[]): number {
  const target = nodes.reduce((s, n) => s + n.target, 0);
  if (target <= 0) return 0;
  const done = nodes.reduce((s, n) => s + Math.min(n.done, n.target), 0);
  return Math.round((done / target) * 100);
}

export type NodeState = "done" | "near" | "normal";

/** "near" gets a pulse in the UI -- it's the thing one more rep away from unlocking. */
export function nodeState(node: MomentumNode): NodeState {
  if (node.target <= 0) return "normal";
  const f = Math.min(node.done, node.target) / node.target;
  if (f >= 1) return "done";
  if (f >= 0.7) return "near";
  return "normal";
}
