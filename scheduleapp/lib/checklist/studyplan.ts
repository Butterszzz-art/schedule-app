import { dayIndexForDate } from "@/lib/schedule/days";
import type { ChecklistItem } from "./types";

// Self-study for Review Jaar 2 PB, on top of the normal Study items.
// Dated, so it lives in code rather than the weekly routine.
//   Nov 9 - Dec 6:   ~12 h/week (2 x 1h, Mon-Sat), up to 16 h on lighter weeks
//   Dec 7 - Dec 15:  ~4 h/week (1h Mon/Tue/Thu/Fri); Dec 16 is exam day
//   Dec 17 - Jan 10: 50-60 h total (2 x 1h every day = 50 h)
interface Phase {
  from: string;
  to: string;
  days: number[]; // 0 = Mon ... 6 = Sun
  chunks: string[];
  hint: string;
}

const PHASES: Phase[] = [
  { from: "2026-11-09", to: "2026-12-06", days: [0, 1, 2, 3, 4, 5], chunks: ["1h", "1h"], hint: "~12 h/week · up to 16 h on lighter weeks" },
  { from: "2026-12-07", to: "2026-12-15", days: [0, 1, 3, 4], chunks: ["1h"], hint: "~4 h/week until the Dec 16 exams" },
  { from: "2026-12-17", to: "2027-01-10", days: [0, 1, 2, 3, 4, 5, 6], chunks: ["1h", "1h"], hint: "50–60 h total by Jan 10 · add a block when you can" },
];

export function studyPlanItemsForDate(date: string): ChecklistItem[] {
  const day = dayIndexForDate(date);
  const phase = PHASES.find((p) => date >= p.from && date <= p.to && p.days.includes(day));
  if (!phase) return [];
  return [
    {
      key: "plan:review-study",
      area: "mind",
      kind: "study",
      label: "Review self-study",
      hint: phase.hint,
      type: "chunks",
      target: 1,
      chunks: phase.chunks,
    },
  ];
}
