import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const date = body?.date;
  if (typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const existing = await prisma.taskCompletion.findUnique({
    where: { taskId_date: { taskId: id, date } },
  });

  if (existing) {
    await prisma.taskCompletion.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }

  await prisma.taskCompletion.create({
    data: { taskId: id, userId: session.user.id, date },
  });
  return NextResponse.json({ completed: true });
}
