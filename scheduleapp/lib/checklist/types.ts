import type { BlockKind } from "@/lib/schedule/types";

export type Area = "anchors" | "body" | "uni" | "fuel" | "mind" | "content" | "life";
export type ItemType = "check" | "count" | "chunks";

/** One line of the daily routine, as defined in code or stored in RoutineItem. */
export interface RoutineItemDef {
  key: string;
  area: Area;
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

/** A checklist line resolved for one specific date. */
export type ChecklistItem = Omit<RoutineItemDef, "days">;

export interface ExtraDTO {
  id: string;
  date: string;
  label: string;
  doneOn: string | null;
}

/** checklist values for one date, keyed by item key. */
export type DayValues = Record<string, number>;
