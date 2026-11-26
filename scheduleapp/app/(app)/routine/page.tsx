import { auth } from "@/lib/auth";
import { getAreas } from "@/lib/checklist/areas";
import { getRoutine } from "@/lib/checklist/server";
import { RoutineClient } from "@/components/checklist/RoutineClient";

export default async function RoutinePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [areas, routine] = await Promise.all([getAreas(userId), getRoutine(userId)]);

  return <RoutineClient areas={areas} initialRoutine={routine} />;
}
