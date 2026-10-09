import { auth } from "@/lib/auth";
import { loadWeek } from "@/lib/checklist/server";
import { getDayType, NUTRITION_TARGETS } from "@/lib/nutrition";
import { daysUntil, nextShow } from "@/lib/prep";
import { dayKeyForDate } from "@/lib/schedule/days";
import { getScheduleMode } from "@/lib/schedule/mode";
import { startOfIsoWeek, todayISODate } from "@/lib/time";
import { TodayClient, type DayNutrition } from "@/components/checklist/TodayClient";

export default async function TodayPage() {
  const session = await auth();
  // proxy.ts guarantees an authenticated session for every (app) route.
  const userId = session!.user.id;

  const today = todayISODate();
  const week = await loadWeek(userId, startOfIsoWeek(today));

  const nutritionByDate: Record<string, DayNutrition> = {};
  for (const date of week.dates) {
    const type = getDayType(dayKeyForDate(date), 1);
    const t = NUTRITION_TARGETS[type];
    nutritionByDate[date] = {
      label: type === "training" ? "Training day" : "Rest day",
      calories: t.calories,
      carbs: t.carbs,
      fat: t.fat,
    };
  }

  const show = nextShow(today);
  const days = daysUntil(show.date, today);
  const countdown =
    days >= 0 ? { days, name: show.name.split(" — ")[1] ?? show.name } : null;

  return (
    <TodayClient
      today={today}
      mode={getScheduleMode(today)}
      dates={week.dates}
      itemsByDate={week.itemsByDate}
      initialValues={week.valuesByDate}
      initialExtras={week.extras}
      initialWork={week.workByDate}
      nutritionByDate={nutritionByDate}
      countdown={countdown}
    />
  );
}
