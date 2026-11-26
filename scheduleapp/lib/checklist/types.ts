import type { BlockKind } from "@/lib/schedule/types";

export type ItemType = "check" | "count" | "chunks";

/** One line of the daily routine, stored in RoutineItem. `area` is a UserArea.key. */
export interface RoutineItemDef {
  key: string;
  area: string;
  kind: BlockKind;
  label: string;
  hint: string;
  type: ItemType;
  target: number; // count items only
  chunks: string[]; // chunk items only
  days: number[]; // 0 = Mon ... 6 = Sun
}

/** A RoutineItem row as it travels to the client. */
export interface RoutineItemDTO extends RoutineItemDef {
  id: string;
  order: number;
}

/** A user-defined checklist area. */
export interface AreaDTO {
  id: string;
  key: string;
  label: string;
  kind: BlockKind;
  order: number;
}

/** A checklist line resolved for one specific date. */
export type ChecklistItem = Omit<RoutineItemDef, "days">;

export type ExtraScope = "day" | "week";

export interface ExtraDTO {
  id: string;
  date: string; // week scope: that week's Monday
  scope: ExtraScope;
  label: string;
  doneOn: string | null;
}

export type GoalScope = "week" | "month";

/** A custom goal for one ISO week or one calendar month, ticked up to `target`. */
export interface GoalDTO {
  id: string;
  scope: GoalScope;
  period: string; // isoWeekKey() for "week", monthKey() for "month"
  title: string;
  target: number;
  progress: number;
}

/** checklist values for one date, keyed by item key. */
export type DayValues = Record<string, number>;
