import { Header } from "@/components/layout/Header";
import { NotificationSetup } from "@/components/pwa/NotificationSetup";

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" />
      <main className="flex flex-col gap-5 px-5 pb-4">
        <p className="text-sm text-foreground/50">
          Reminders: one push at 20:30 if anything on today&apos;s list is still open.
        </p>
        <NotificationSetup />
      </main>
    </>
  );
}
