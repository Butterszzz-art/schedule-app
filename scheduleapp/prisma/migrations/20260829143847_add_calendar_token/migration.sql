-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "calendarToken" TEXT;

-- Backfill existing rows with a random token (nothing at the app layer
-- reads this until the column is populated + made required below).
UPDATE "UserSettings"
SET "calendarToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "calendarToken" IS NULL;

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "calendarToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_calendarToken_key" ON "UserSettings"("calendarToken");
