import Link from "next/link";

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex h-8 w-8 items-center justify-center text-foreground/40 transition-colors hover:text-foreground/70"
      >
        ⚙
      </Link>
    </header>
  );
}
