import { prisma } from "@/lib/db";
import type { BlockKind } from "@/lib/schedule/types";
import type { AreaDTO } from "./types";

type AreaRow = Awaited<ReturnType<typeof prisma.userArea.findFirst>>;

function toDTO(a: NonNullable<AreaRow>): AreaDTO {
  return { id: a.id, key: a.key, label: a.label, kind: a.kind as BlockKind, order: a.order };
}

function slugify(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "area";
}

/** The user's (non-archived) areas, in display order. */
export async function getAreas(userId: string): Promise<AreaDTO[]> {
  const rows = await prisma.userArea.findMany({
    where: { userId, archived: false },
    orderBy: { order: "asc" },
  });
  return rows.map(toDTO);
}

/** Does `value` name a live area of this user's? Used to validate routine-item writes. */
export async function isAreaKey(userId: string, value: unknown): Promise<boolean> {
  if (typeof value !== "string" || value.length === 0) return false;
  const row = await prisma.userArea.findFirst({ where: { userId, key: value, archived: false } });
  return row !== null;
}

export async function createArea(userId: string, label: string, kind: BlockKind): Promise<AreaDTO> {
  const base = slugify(label);
  const existing = await prisma.userArea.findMany({ where: { userId }, select: { key: true } });
  const keys = new Set(existing.map((e) => e.key));
  let key = base;
  let n = 2;
  while (keys.has(key)) key = `${base}-${n++}`;

  const last = await prisma.userArea.findFirst({ where: { userId }, orderBy: { order: "desc" } });
  const row = await prisma.userArea.create({
    data: { userId, key, label, kind, order: (last?.order ?? 0) + 1 },
  });
  return toDTO(row);
}

export async function updateArea(
  userId: string,
  id: string,
  patch: { label?: string; kind?: BlockKind; order?: number }
): Promise<AreaDTO | null> {
  const row = await prisma.userArea.findFirst({ where: { id, userId } });
  if (!row) return null;
  const updated = await prisma.userArea.update({ where: { id }, data: patch });
  return toDTO(updated);
}

/** Archives rather than deletes, so existing RoutineItems keep a label to belong to. */
export async function archiveArea(userId: string, id: string): Promise<boolean> {
  const row = await prisma.userArea.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.userArea.update({ where: { id }, data: { archived: true } });
  return true;
}
