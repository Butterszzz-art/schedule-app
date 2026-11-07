import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function findOwned(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  return goal && goal.userId === userId ? goal : null;
}

// { progress: number } sets progress, clamped to [0, target].
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
  const progress = body?.progress;
  if (!Number.isInteger(progress) || progress < 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const goal = await findOwned(id, session.user.id);
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const clamped = Math.min(progress, goal.target);
  await prisma.goal.update({ where: { id }, data: { progress: clamped } });
  return NextResponse.json({ ok: true, progress: clamped });
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

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
