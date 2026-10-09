import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function findOwned(id: string, userId: string) {
  const item = await prisma.routineItem.findUnique({ where: { id } });
  return item && item.userId === userId ? item : null;
}

// { days: number[] } -- which weekdays (0 = Mon ... 6 = Sun) the item shows up.
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
  const days = body?.days;
  if (
    !Array.isArray(days) ||
    days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!(await findOwned(id, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const unique = [...new Set(days as number[])].sort((a, b) => a - b);
  await prisma.routineItem.update({ where: { id }, data: { days: unique } });
  return NextResponse.json({ ok: true, days: unique });
}

// Archives rather than deletes, so the default routine isn't re-seeded
// and past ticks still have a label to belong to.
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

  await prisma.routineItem.update({ where: { id }, data: { archived: true } });
  return NextResponse.json({ archived: true });
}
