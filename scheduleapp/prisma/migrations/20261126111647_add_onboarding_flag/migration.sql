-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- Accounts that already have at least one area predate onboarding and
-- have already set up their own routine -- don't send them through it.
UPDATE "UserSettings" s
SET "onboardingComplete" = true
WHERE EXISTS (SELECT 1 FROM "UserArea" a WHERE a."userId" = s."userId");
