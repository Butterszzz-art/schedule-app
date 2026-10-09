import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isISODate } from "@/lib/time";

async function findOwned(id: string, userId: string) {
  const extra = await prisma.extraTask.findUnique({ where: { id } });
  return extra && extra.userId === userId ? extra : null;
}

// { doneOn: "YYYY-MM-DD" } ticks it off on that day; { doneOn: null } un-ticks it.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const doneOn = body?.doneOn;
  if (!(doneOn === null || isISODate(doneOn))) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!(await findOwned(id, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.extraTask.update({ where: { id }, data: { doneOn } });
  return NextResponse.json({ ok: true, doneOn });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  if (!(await findOwned(id, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.extraTask.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
