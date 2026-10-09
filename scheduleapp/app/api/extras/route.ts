import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isISODate } from "@/lib/time";

// Adds a one-off "Also today" item.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const label = typeof body?.label === "string" ? body.label.trim() : "";

  if (!isISODate(date) || label.length === 0 || label.length > 200) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const extra = await prisma.extraTask.create({
    data: { userId: session.user.id, date, label },
  });

  return NextResponse.json(
    { id: extra.id, date: extra.date, label: extra.label, doneOn: extra.doneOn },
    { status: 201 }
  );
}
