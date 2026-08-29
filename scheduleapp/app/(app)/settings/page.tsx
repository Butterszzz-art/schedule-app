import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { CalendarSync } from "@/components/settings/CalendarSync";

function baseUrl(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  // Every seeded user already has a UserSettings row (see prisma/seed.ts),
  // but upsert here too so this page never 500s on a missing row.
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return (
    <>
      <Header title="Settings" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <CalendarSync
          initialToken={settings.calendarToken}
          baseUrl={baseUrl()}
        />
      </main>
    </>
  );
}
