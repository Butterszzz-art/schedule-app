import type { BlockKind } from "./types";

// From CLAUDE.md's block kind colour map: dark background + accent pair.
export const BLOCK_COLORS: Record<BlockKind, { bg: string; accent: string }> = {
  sleep: { bg: "#141414", accent: "#3A3A3A" },
  meal: { bg: "#1C1408", accent: "#C8962A" },
  gym: { bg: "#081A10", accent: "#4ADE80" },
  ma: { bg: "#1A0A08", accent: "#F87171" },
  cardio: { bg: "#141414", accent: "#94A3B8" },
  mobility: { bg: "#1A0814", accent: "#F472B6" },
  posing: { bg: "#1A1000", accent: "#E09000" },
  study: { bg: "#08101A", accent: "#60A5FA" },
  uni: { bg: "#0E0820", accent: "#A78BFA" },
  commute: { bg: "#121210", accent: "#7A7A6A" },
  prep: { bg: "#1A0E00", accent: "#FB923C" },
  chores: { bg: "#1A0808", accent: "#FCA5A5" },
  read: { bg: "#081408", accent: "#86EFAC" },
  free: { bg: "#0E0E0E", accent: "#C8F060" },
  content: { bg: "#0D0D1A", accent: "#818CF8" },
};
