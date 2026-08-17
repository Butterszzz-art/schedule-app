export function CompletionCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-card-border bg-[#0E0E0E] p-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 20%, #4ADE8014, transparent 70%)",
        }}
      />
      <p className="relative text-2xl font-bold text-accent">All done today 🎯</p>
      <p className="relative mt-1 text-sm text-foreground/50">
        Clean slate. Recover well tonight.
      </p>
    </div>
  );
}
