import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isISODate, startOfIsoWeek } from "@/lib/time";

// Adds a one-off task: scope "day" (default) for one date, or scope "week"
// for the whole week containing `date` (stored against that week's Monday).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const scope = body?.scope ?? "day";

  if (
    !isISODate(date) ||
    !(scope === "day" || scope === "week") ||
    label.length === 0 ||
    label.length > 200
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const extra = await prisma.extraTask.create({
    data: {
      userId: session.user.id,
      date: scope === "week" ? startOfIsoWeek(date) : date,
      scope,
      label,
    },
  });

  return NextResponse.json(
    { id: extra.id, date: extra.date, scope, label: extra.label, doneOn: extra.doneOn },
    { status: 201 }
  );
}
