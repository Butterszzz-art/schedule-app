import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekKey = searchParams.get("weekKey");
  if (!weekKey) {
    return NextResponse.json({ error: "weekKey is required" }, { status: 400 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id, weekKey },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ tasks });
}
