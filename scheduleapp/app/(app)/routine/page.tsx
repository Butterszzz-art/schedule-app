import { auth } from "@/lib/auth";
import { getRoutine } from "@/lib/checklist/server";
import { getScheduleMode } from "@/lib/schedule/mode";
import { todayISODate } from "@/lib/time";
import { RoutineClient } from "@/components/checklist/RoutineClient";

export default async function RoutinePage() {
  const session = await auth();
  const userId = session!.user.id;

  const mode = getScheduleMode(todayISODate());
  const routine = await getRoutine(userId, mode);

  return <RoutineClient mode={mode} initialRoutine={routine} />;
}
