"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Shown instead of a blank crash when a page in the app fails to load --
// most often the database being out of date with the code (a migration
// that hasn't been applied yet) or the database being unreachable.
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-start gap-4 px-5 py-10">
      <h1 className="text-xl font-bold">This page couldn&apos;t load</h1>
      <p className="text-sm text-foreground/60">
        Your data is safe. This usually means the app couldn&apos;t reach its database, or the
        database hasn&apos;t been updated for the latest version yet. Try again in a moment.
      </p>
      {error.digest && (
        <p className="text-xs text-foreground/40">
          Error reference: <span className="select-all font-mono">{error.digest}</span>
        </p>
      )}
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-11 rounded-xl bg-accent px-4 text-sm font-bold text-[#0A0A0A]"
      >
        Try again
      </button>
    </main>
  );
}
