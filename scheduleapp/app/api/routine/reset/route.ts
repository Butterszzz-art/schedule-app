import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRoutine, seedRoutine } from "@/lib/checklist/server";

// Throws away edits to a mode's routine and re-seeds the defaults.
// Past ticks (ChecklistEntry) are keyed by item key, so they survive.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mode = body?.mode;
  if (!(mode === "prep" || mode === "normal")) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;
  await prisma.routineItem.deleteMany({ where: { userId, mode } });
  await seedRoutine(userId, mode);

  return NextResponse.json({ routine: await getRoutine(userId, mode) });
}
