import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isHHMM } from "@/lib/checklist/shifts";
import { isISODate } from "@/lib/time";

// Adds a side-job shift: { date, start: "HH:MM", end: "HH:MM", note? }.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const start = body?.start;
  const end = body?.end;
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!isISODate(date) || !isHHMM(start) || !isHHMM(end) || start === end || note.length > 120) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const shift = await prisma.workShift.create({
    data: { userId: session.user.id, date, start, end, note },
  });

  return NextResponse.json(
    { id: shift.id, date: shift.date, start: shift.start, end: shift.end, note: shift.note },
    { status: 201 }
  );
}
