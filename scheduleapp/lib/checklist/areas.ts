import type { BlockKind } from "@/lib/schedule/types";
import type { Area } from "./types";

// Display order + headings for the Today list. `kind` picks the dot colour.
export const AREAS: { key: Area; label: string; kind: BlockKind }[] = [
  { key: "anchors", label: "Anchors", kind: "sleep" },
  { key: "body", label: "Training", kind: "gym" },
  { key: "uni", label: "Uni", kind: "uni" },
  { key: "fuel", label: "Fuel", kind: "meal" },
  { key: "mind", label: "Study & reading", kind: "study" },
  { key: "content", label: "Content", kind: "content" },
  { key: "life", label: "Home", kind: "chores" },
];

export const AREA_KEYS = AREAS.map((a) => a.key);

/** Areas a custom routine item can be added to (anchors + uni are fixed). */
export const EDITABLE_AREAS = AREAS.filter((a) => a.key !== "anchors" && a.key !== "uni");

export function isArea(value: unknown): value is Area {
  return typeof value === "string" && (AREA_KEYS as string[]).includes(value);
}
