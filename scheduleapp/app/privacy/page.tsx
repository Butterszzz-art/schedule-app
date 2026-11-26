export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="flex flex-col gap-4 px-5 py-8 text-sm leading-relaxed text-foreground/80">
      <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-xs text-foreground/50">
        Last updated: [DATE] -- TODO: fill in before publishing. This is a starting draft, not
        legal advice; have it reviewed before you rely on it, especially for users in the EU/UK
        (GDPR) or California (CCPA).
      </p>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-foreground">What we collect</h2>
        <p>
          An account (email address and a securely hashed password) and the data you enter into
          the app: your checklist areas and routine items, daily progress, one-off tasks, and
          custom goals. If you turn on reminders, we also store a push notification subscription
          (a token identifying your device or browser, not readable by us on its own).
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-foreground">What we don&apos;t do</h2>
        <p>
          We don&apos;t run analytics or tracking, and we don&apos;t sell or share your data with
          advertisers. Your checklist data is yours and isn&apos;t visible to other users.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-foreground">Where it&apos;s stored</h2>
        <p>
          Your data is stored in a managed database (Neon) and the app runs on Vercel. Push
          notifications are delivered through your browser/OS push service or Apple&apos;s
          notification service, as applicable.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-foreground">Your choices</h2>
        <p>
          You can edit or delete any checklist item, goal, or task you&apos;ve added at any time.
          To delete your account entirely, contact us at the address below.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-foreground">Contact</h2>
        <p>[TODO: support email / contact address]</p>
      </section>
    </main>
  );
}
