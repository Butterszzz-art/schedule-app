import { auth } from "@/lib/auth";
import { getAreas } from "@/lib/checklist/areas";
import { loadWeek } from "@/lib/checklist/server";
import { startOfIsoWeek, todayISODate } from "@/lib/time";
import { TodayClient } from "@/components/checklist/TodayClient";

export default async function TodayPage() {
  const session = await auth();
  // proxy.ts guarantees an authenticated session for every (app) route.
  const userId = session!.user.id;

  const today = todayISODate();
  const [week, areas] = await Promise.all([
    loadWeek(userId, startOfIsoWeek(today)),
    getAreas(userId),
  ]);

  return (
    <TodayClient
      today={today}
      areas={areas}
      dates={week.dates}
      itemsByDate={week.itemsByDate}
      initialValues={week.valuesByDate}
      initialExtras={week.extras}
    />
  );
}
