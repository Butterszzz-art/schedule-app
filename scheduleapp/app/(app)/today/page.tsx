import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyForDate, getBlocksForDate } from "@/lib/schedule/blocks";
import { getDayType, NUTRITION_TARGETS } from "@/lib/nutrition";
import type { SemesterKey, TodayBlockView } from "@/lib/schedule/types";
import { isoWeekKey, todayISODate } from "@/lib/time";
import { TodayClient } from "@/components/today/TodayClient";

export default async function TodayPage() {
  const session = await auth();
  // proxy.ts guarantees an authenticated session for every (app) route.
  const userId = session!.user.id;

  const date = todayISODate();
  const weekKey = isoWeekKey(date);
  const dayKey = dayKeyForDate(date);

  const [settings, logs, overrides, adjustments] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.dayLog.findMany({ where: { userId, date } }),
    prisma.weekOverride.findMany({
      where: { userId, weekKey, dayKey, disabled: true },
    }),
    prisma.blockAdjustment.findMany({ where: { userId, date } }),
  ]);

  const semester = (settings?.semester ?? 1) as SemesterKey;

  const logByBlock = new Map(logs.map((l) => [l.blockId, l.status]));
  const disabledIds = new Set(overrides.map((o) => o.blockId));
  const adjustmentByBlock = new Map(
    adjustments.map((a) => [a.blockId, a.startMins])
  );

  const blocks: TodayBlockView[] = getBlocksForDate(date, semester)
    .filter((b) => b.kind !== "sleep")
    .map((b) => {
      const adjustedStartMins = adjustmentByBlock.get(b.id);
      return {
        id: b.id,
        kind: b.kind,
        label: b.label,
        start: adjustedStartMins != null ? adjustedStartMins / 60 : b.start,
        dur: b.dur,
        fixed: !!b.fixed,
        status: (logByBlock.get(b.id) ?? null) as TodayBlockView["status"],
        disabled: disabledIds.has(b.id),
      };
    })
    .sort((a, b) => a.start - b.start);

  const nutritionDayType = getDayType(dayKey, semester);
  const nutritionTarget = NUTRITION_TARGETS[nutritionDayType];

  return (
    <TodayClient
      initialBlocks={blocks}
      date={date}
      nutritionDayType={nutritionDayType}
      nutritionTarget={nutritionTarget}
    />
  );
}
