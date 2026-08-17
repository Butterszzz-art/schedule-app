import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/tasks/categories";
import type { CategoryKey } from "@/lib/tasks/categories";

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.key));
const VALID_DAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

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
    include: { completions: true },
  });

  const completionsByDate: Record<string, string[]> = {};
  for (const task of tasks) {
    for (const completion of task.completions) {
      (completionsByDate[completion.date] ??= []).push(task.id);
    }
  }

  const tasksOut = tasks.map((task) => ({
    id: task.id,
    weekKey: task.weekKey,
    dayKey: task.dayKey,
    category: task.category,
    text: task.text,
    order: task.order,
  }));

  return NextResponse.json({ tasks: tasksOut, completionsByDate });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const weekKey = body?.weekKey;
  const dayKey = body?.dayKey;
  const category = body?.category;
  const text = body?.text;

  if (
    typeof weekKey !== "string" ||
    typeof dayKey !== "string" ||
    !VALID_DAYS.has(dayKey) ||
    typeof category !== "string" ||
    !VALID_CATEGORIES.has(category as CategoryKey) ||
    typeof text !== "string" ||
    !text.trim()
  ) {
    return NextResponse.json({ error: "Invalid task payload" }, { status: 400 });
  }

  const userId = session.user.id;

  const maxOrder = await prisma.task.aggregate({
    where: { userId, weekKey, dayKey, category },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      userId,
      weekKey,
      dayKey,
      category,
      text: text.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
