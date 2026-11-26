import { Header } from "@/components/layout/Header";
import { NotificationSetup } from "@/components/pwa/NotificationSetup";
import { ReminderTimeSetting } from "@/components/settings/ReminderTimeSetting";
import { auth } from "@/lib/auth";
import { getReminderTime } from "@/lib/settings";

export default async function SettingsPage() {
  const session = await auth();
  const reminderTime = await getReminderTime(session!.user.id);

  return (
    <>
      <Header title="Settings" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <ReminderTimeSetting initialTime={reminderTime} />
        <NotificationSetup />
      </main>
    </>
  );
}
