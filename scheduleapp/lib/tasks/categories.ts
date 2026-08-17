export type CategoryKey = "school" | "content" | "websites" | "personal";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  bg: string;
  accent: string;
}

// Same dark-bg + accent-colour pattern as lib/schedule/colors.ts's
// BLOCK_COLORS, so the tasks tab reads as part of the same app.
export const CATEGORIES: CategoryDef[] = [
  { key: "school", label: "School", bg: "#0A1628", accent: "#60A5FA" },
  { key: "content", label: "Content", bg: "#130A2D", accent: "#A78BFA" },
  { key: "websites", label: "Websites", bg: "#2D1400", accent: "#FB923C" },
  { key: "personal", label: "Personal", bg: "#0A2D0A", accent: "#86EFAC" },
];

export const CATEGORY_BY_KEY: Record<CategoryKey, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<CategoryKey, CategoryDef>;

// Suggestion chips shown when a category has 0 tasks for the selected day.
export const CATEGORY_SUGGESTIONS: Record<CategoryKey, string[]> = {
  school: ["Review lecture notes", "Problem set", "Read chapter"],
  content: ["Film gym reel", "Edit YouTube", "Plan IG content"],
  websites: ["Push update", "Fix bug", "Review analytics"],
  personal: ["Log weight", "Meal prep", "Weekly review"],
};
