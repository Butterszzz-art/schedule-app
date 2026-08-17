import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
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

  // TaskCompletion rows cascade on delete per the schema's onDelete: Cascade.
  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}

export async function PATCH(
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
  const text = body?.text;
  const order = body?.order;

  const data: { text?: string; order?: number } = {};
  if (typeof text === "string" && text.trim()) data.text = text.trim();
  if (typeof order === "number") data.order = order;

  const updated = await prisma.task.update({ where: { id }, data });

  return NextResponse.json(updated);
}
