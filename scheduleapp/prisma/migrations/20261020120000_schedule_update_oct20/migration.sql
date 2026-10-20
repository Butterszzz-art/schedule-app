-- Data-only migration: schedule update applied from 2026-10-20.
-- Brings already-seeded routines in line with lib/checklist/defaults.ts.
-- Only touches rows still carrying the old default text, so edits made in
-- the Routine tab are left alone.

-- Sleep anchors: 05:45 / 21:45 on normal days (shift days are worked out in code).
UPDATE "RoutineItem" SET "label" = 'Up by 05:45', "updatedAt" = NOW()
WHERE "key" = 'wake' AND "label" IN ('Up by 06:30', 'Up by 05:30');

UPDATE "RoutineItem" SET "label" = 'Lights out 21:45', "updatedAt" = NOW()
WHERE "key" = 'bed' AND "label" = 'Lights out 22:30';

-- Posing moves to after the gym.
UPDATE "RoutineItem" SET "hint" = 'After gym (rest days: any time) · ~20 min', "updatedAt" = NOW()
WHERE "key" = 'posing' AND "hint" = 'Fasted, before M1 · ~20 min';

-- Prep nutrition: 1750 kcal, ~160 g protein.
UPDATE "RoutineItem" SET "label" = 'Protein ~160 g', "updatedAt" = NOW()
WHERE "key" = 'protein' AND "label" = 'Protein 164 g';

-- PT clients: evening check-ins Mon + Thu, programming Sun, for every seeded mode.
INSERT INTO "RoutineItem" ("id", "userId", "mode", "key", "area", "kind", "label", "hint", "type", "target", "chunks", "days", "order", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text || r."userId" || r."mode" || v."key"),
       r."userId", r."mode", v."key", 'work', 'work', v."label", v."hint", 'check', 1, ARRAY[]::TEXT[], v."days", r."maxOrder" + v."n", NOW()
FROM (
  SELECT "userId", "mode", MAX("order") AS "maxOrder" FROM "RoutineItem" GROUP BY "userId", "mode"
) r
CROSS JOIN (VALUES
  ('pt-checkin', 'PT client check-ins', 'Evening · online clients (max 3 now, up to 5 after Dec 16)', ARRAY[0, 3], 1),
  ('pt-programming', 'PT programming', 'Write/adjust client programs', ARRAY[6], 2)
) AS v("key", "label", "hint", "days", "n")
ON CONFLICT ("userId", "mode", "key") DO NOTHING;

-- Reminder to revisit nutrition after Show 2 (Nov 1).
INSERT INTO "ExtraTask" ("id", "userId", "date", "scope", "label")
SELECT md5(random()::text || clock_timestamp()::text || u."id"), u."id", '2026-11-02', 'day',
       'Update nutrition targets after the shows (currently 1750 kcal prep)'
FROM "User" u;
