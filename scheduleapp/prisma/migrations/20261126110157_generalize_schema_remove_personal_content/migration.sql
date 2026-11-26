-- Mainstream-pivot Phase 1: drop prep/nutrition/uni/side-job content and
-- make checklist areas user-defined (UserArea) instead of a hardcoded set.

-- The show-prep window (2026-08-16 - 2026-11-02) has passed; the live
-- routine is on "normal" mode. Drop the prep-mode rows before dropping
-- RoutineItem.mode, since (userId, key) will become unique and several
-- keys (wake, bed, meals, gym-upper, ...) exist in both modes today.
DELETE FROM "RoutineItem" WHERE "mode" = 'prep';

-- DropForeignKey
ALTER TABLE "DayLog" DROP CONSTRAINT "DayLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "WeekOverride" DROP CONSTRAINT "WeekOverride_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCompletion" DROP CONSTRAINT "TaskCompletion_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCompletion" DROP CONSTRAINT "TaskCompletion_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkLog" DROP CONSTRAINT "WorkLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkShift" DROP CONSTRAINT "WorkShift_userId_fkey";

-- DropIndex
DROP INDEX "RoutineItem_userId_mode_idx";

-- DropIndex
DROP INDEX "RoutineItem_userId_mode_key_key";

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "semester";

-- AlterTable
ALTER TABLE "RoutineItem" DROP COLUMN "mode";

-- DropTable
DROP TABLE "DayLog";

-- DropTable
DROP TABLE "WeekOverride";

-- DropTable
DROP TABLE "WeightEntry";

-- DropTable
DROP TABLE "BlockAdjustment";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "TaskCompletion";

-- DropTable
DROP TABLE "WorkLog";

-- DropTable
DROP TABLE "WorkShift";

-- CreateTable
CREATE TABLE "UserArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserArea_userId_idx" ON "UserArea"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserArea_userId_key_key" ON "UserArea"("userId", "key");

-- CreateIndex
CREATE INDEX "RoutineItem_userId_idx" ON "RoutineItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineItem_userId_key_key" ON "RoutineItem"("userId", "key");

-- AddForeignKey
ALTER TABLE "UserArea" ADD CONSTRAINT "UserArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill one UserArea per (userId, area) still referenced by a surviving
-- RoutineItem, so existing routines keep rendering under the new,
-- user-configurable area model instead of coming up empty.
INSERT INTO "UserArea" (id, "userId", key, label, kind, "order", archived, "createdAt")
SELECT
  gen_random_uuid()::text,
  r."userId",
  r.area,
  CASE r.area
    WHEN 'anchors' THEN 'Anchors'
    WHEN 'body' THEN 'Training'
    WHEN 'fuel' THEN 'Fuel'
    WHEN 'mind' THEN 'Study & reading'
    WHEN 'content' THEN 'Content'
    WHEN 'work' THEN 'Work'
    WHEN 'life' THEN 'Home'
    ELSE initcap(replace(r.area, '-', ' '))
  END,
  CASE r.area
    WHEN 'anchors' THEN 'sleep'
    WHEN 'body' THEN 'gym'
    WHEN 'fuel' THEN 'meal'
    WHEN 'mind' THEN 'study'
    WHEN 'content' THEN 'content'
    WHEN 'work' THEN 'work'
    WHEN 'life' THEN 'chores'
    ELSE r.kind
  END,
  r.ord,
  false,
  now()
FROM (
  SELECT DISTINCT ON ("userId", area) "userId", area, kind, "order" AS ord
  FROM "RoutineItem"
  ORDER BY "userId", area, "order"
) r;
