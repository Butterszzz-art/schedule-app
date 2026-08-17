import type { DayKey } from "@/lib/schedule/types";
import type { CategoryKey } from "./categories";

// Client-side shape of a Task, as it comes back over JSON (Dates -> strings).
export interface TaskDTO {
  id: string;
  weekKey: string;
  dayKey: DayKey;
  category: CategoryKey;
  text: string;
  order: number;
}
